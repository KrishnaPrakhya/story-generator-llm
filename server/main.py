import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_community.llms import Ollama
from langchain.document_loaders import PDFPlumberLoader
from langchain.prompts import PromptTemplate
# from unsloth import FastLanguageModel
import torch
import nltk
# import textstat
from collections import Counter
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from scipy.spatial.distance import euclidean
from gensim.models.doc2vec import Doc2Vec, TaggedDocument
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk import pos_tag
from nltk.corpus import stopwords
import re
from langchain_huggingface import HuggingFaceEndpoint
import os
import numpy as np
from scipy.spatial.distance import cosine, euclidean
from dotenv import load_dotenv
load_dotenv("./")

app = Flask(__name__)
CORS(app)

cached_llm = Ollama(model="gemma:2b-instruct")
print(cached_llm)

raw_prompt = PromptTemplate.from_template(
    """
<s>[INST] I can assist you with generating new story! Please provide a starting sentence or a brief description of the story you have in mind. I will then analyze the input and context to create a new, original story for you. The story will be written in the style of the given context, using similar parts of speech, vocabulary, and stylistic elements. The genre of the story is {genre} . The Language of the story should be {language}.The Story To be generated With the Style features IF PROVIDED ELSE DEFAULT: {style_features}. DONT GIVE ANY OTHER STATEMENTS OTHER THAN STORY. GENERATE A STORY OF ATLEAST 15 SENTENCES. </s>
[INST] INPUT: {input} 
STORY: {context}
--> </s>
[OUT] 
"""
)

feature_names = [
    "Overall Compound Score",
    "Flesch-Kincaid Grade Level",
    "ARI",
    "Passive Count",
    "Avg Sentence Length",
    "TTR",
    "POV",  
    "Normalized Mood",  
    "NN",
    "IN",
    "DT",
    ",",
    "VBD",
    "NNS",
    "JJ",
    ".",
    "NNP",
    "VBN",
    "CC",
    "RB",
    "PRP$",
    "PRP",
    "VBG",
    "TO",
    "VB",
    "WDT",
    "VBP",
    "EX",
    "RP",
    "`",
    "''",
    "CD",
    "JJS"
]

pdf_content_store = {}
fileName = ""
styleFeatures = {}

def analyze_story_mood(story):
    sid = SentimentIntensityAnalyzer()
    sentiment_scores = []
    compound_scores = []

    for sentence in sent_tokenize(story):
        scores = sid.polarity_scores(sentence)
        sentiment_scores.append(scores)
        compound_scores.append(scores['compound'])

    overall_compound_score = sum(compound_scores) / len(compound_scores)

    return sentiment_scores, overall_compound_score

def calculate_vocabulary_richness(text):
    tokens = word_tokenize(text.lower())
    stop_words = set(stopwords.words('english'))
    tokens = [word for word in tokens if word.isalnum() and word not in stop_words]
    ttr = len(set(tokens)) / len(tokens)
    return ttr

def extract_syntactic_patterns(text):
    sentences = sent_tokenize(text)
    sentence_lengths = [len(word_tokenize(sentence)) for sentence in sentences]
    avg_sentence_length = sum(sentence_lengths) / len(sentence_lengths)
    tagged_sentences = [pos_tag(word_tokenize(sentence)) for sentence in sentences]

    passive_count = 0
    for sent in tagged_sentences:
        for i in range(len(sent) - 1):
            if sent[i][1] == 'VBN' and (sent[i + 1][1] in ['VBD', 'VBP', 'VBZ'] or sent[i - 1][1] == 'VBD'):
                passive_count += 1
                break

    return avg_sentence_length, passive_count

def identify_pov(text):
    tokens = word_tokenize(text)
    pos_tags = pos_tag(tokens)

    first_person_pronouns = ["I", "me", "we", "us"]
    third_person_pronouns = ["he", "she", "it", "they", "him", "her", "them"]

    first_person_count = 0
    third_person_count = 0
    total_pronouns = 0

    for word, tag in pos_tags:
        if word in first_person_pronouns and tag == 'PRP': 
            first_person_count += 1
            total_pronouns += 1
        elif word in third_person_pronouns and tag == 'PRP':
            third_person_count += 1
            total_pronouns += 1

    if total_pronouns == 0:
        return "Inconclusive: No pronouns found"
    elif first_person_count > third_person_count and first_person_count / total_pronouns > 0.5:
        return "1st person"
    elif third_person_count > first_person_count and third_person_count / total_pronouns > 0.5:
        return "3rd person"
    else:
        return "Inconclusive: Pronoun usage is mixed"

def calculate_readability_score(text):
    tokens = word_tokenize(text)
    sentences = sent_tokenize(text)

    num_words = len(tokens)
    num_sentences = len(sentences)
    num_syllables = 0
    num_characters = 0

    for word in tokens:
        num_syllables += count_syllables(word)
        num_characters += len(word)

    flesch_kincaid_score = 0.39 * num_words / num_sentences + 11.8 * num_syllables / num_words - 15.59
    ari_score = 4.76 * num_characters / num_words + 0.5 * num_words / num_sentences - 21.43

    return {
        "Flesch-Kincaid Grade Level": 1/round(flesch_kincaid_score, 2),
        "ARI": 1/round(ari_score, 2)
    }

def count_syllables(word):
    vowels = 'aeiouAEIOU'
    num_vowels = 0
    prev_was_vowel = False
    for char in word:
        if char in vowels and not prev_was_vowel:
            num_vowels += 1
            prev_was_vowel = True
        else:
            prev_was_vowel = False
    if word.endswith("e") and word not in ['the', 'be']:
        num_vowels -= 1
    return 1/max(1, num_vowels)
def create_feature_vector(story):
    sentiment_scores, overall_compound_score = analyze_story_mood(story)
    pos_tags = pos_tag(word_tokenize(story))
    pos_counts = {}
    for tag in pos_tags:
        word, pos = tag
        pos_counts[pos] = pos_counts.get(pos, 0) + 1
    total_words = len(word_tokenize(story))
    pos_vector = {pos: count / total_words for pos, count in pos_counts.items()}

    pos_tag_list = [
        'NN', 'IN', 'DT', ',', 'VBD', 'NNS', 'JJ', '.', 'NNP', 'VBN', 'CC', 
        'RB', 'PRP$', 'PRP', 'VBG', 'TO', 'VB', 'WDT', 'VBP', 'EX', 'RP', 
        '`', "''", 'CD', 'JJS'
    ]

    pos_vector_fixed = [pos_vector.get(tag, 0) for tag in pos_tag_list]

    pov = identify_pov(story)
    readability_scores = calculate_readability_score(story)
    normalized_mood = "Positive" if overall_compound_score > 0 else "Negative" if overall_compound_score < 0 else "Neutral"
    ttr = calculate_vocabulary_richness(story)
    passive_count = extract_syntactic_patterns(story)[1]

    pov_encoding = {"Inconclusive: No pronouns found": 0, "Inconclusive: Pronoun usage is mixed": 0, "1st person": 1, "3rd person": 2}
    normalized_mood_encoding = {"Negative": -1, "Neutral": 0, "Positive": 1}
    
    feature_vector = np.array([
        overall_compound_score,
        readability_scores["Flesch-Kincaid Grade Level"],
        readability_scores["ARI"],
        passive_count,
        ttr,
        pov_encoding[pov],
        normalized_mood_encoding[normalized_mood]
    ] + pos_vector_fixed)
    
    feature_vector = feature_vector.astype(float)
    min_vals = feature_vector.min()
    max_vals = feature_vector.max()
    
    normalized_vector = (feature_vector - min_vals) / (max_vals - min_vals)
    
    feature_str = ", ".join([f"{name}: {value:.4f}" for name, value in zip(feature_names, normalized_vector)])
    
    return normalized_vector, feature_str
def calculate_combined_similarity(story1, story2,language="English"):
    # if not re.match(r"^[a-zA-Z]+$", story2):
    #     print("Similarity is right now supported only for English letters.")
    #     return 0
    if(language!="English"):
        return 0
    feature_vector_story1, _ = create_feature_vector(story1)
    feature_vector_story2, _ = create_feature_vector(story2)

    cosine_sim = 1 - cosine(feature_vector_story1, feature_vector_story2)
    
    euclidean_dist = euclidean(feature_vector_story1, feature_vector_story2)
    
    length_diff = abs(len(story1) - len(story2)) / max(len(story1), len(story2))
    # length_penalty = 1 - (length_diff * 1)  
    
    combined_similarity = (cosine_sim + (1 / (1 + euclidean_dist))) /2
    print(cosine_sim)
    print(1 / (1 + euclidean_dist))
    return combined_similarity

def stylometric_similarity(vector1, vector2):
    dist = euclidean(vector1, vector2)
    return 1 / (1 + dist)

@app.route("/fine_tuned", methods=["POST"])
def fine_tuned_ask():
    try:
        json_content = request.json
        input_story = json_content.get("query")
        genre = json_content.get("genre", "general")
        context = json_content.get("context", "")
        print(f"Story Input: {input_story}")
        print(f"Context: {context}")
        print(f"Genre: {genre}")
        token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        if not token:
            return jsonify({"error": "Hugging Face API token not found"}), 400
        max_seq_length = 2048
        dtype = None
        load_in_4bit = True

        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name = "krishna-prakhya27/lora_demo_story_gemma",
            max_seq_length = max_seq_length,
            dtype = dtype,
            load_in_4bit = load_in_4bit,

)
       
        FastLanguageModel.for_inference(model)
        inputs = tokenizer(
        [
        input_story
        ], return_tensors = "pt").to("cuda")

        start_time = time.time()
        outputs = model.generate(**inputs, max_new_tokens = 400, use_cache = True)
        result=tokenizer.batch_decode(outputs)
        end_time = time.time()
        print(result)
        response_time = end_time - start_time
        result = result[0]
        result = result.replace("<bos>", "").replace("<eos>", "").replace("<end_of_turn>", "")
        result = result.strip()
        return jsonify({"Answer": result, "response_time": response_time})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/story_features", methods=["POST"])
def story_features():
    print(request.json)
    try:
        story = request.json.get("story")
        print(story)
        if not story:
            return jsonify({"error": "No story provided"}), 400

        feature_vector,feature_str = create_feature_vector(story)
        return jsonify({"features": feature_str})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
@app.route("/ask_story", methods=["POST"])
def ask_story():
    try:
        json_content = request.json
        input_story = json_content.get("query")
        genre = json_content.get("genre", "general")
        # language=json_content.get("language","English")
        context = json_content.get("context", "")
        language=json_content.get("genLang","English")
        print(language)
        print(f"Story Input: {input_story}")
        print(f"Context: {context}")
        print(f"Genre: {genre}")
        start_time = time.time()
        if(len(input_story.split(" "))<20):
            similarity_score=0
            prompt = raw_prompt.format(input=input_story, context="", genre=genre,style_features="",language={language})
            response = cached_llm.invoke(prompt)
            try:
                k = response.rindex('*')
                response_text = response[k+2:-1].replace('"','')
            except ValueError:
                response_text = response
            response_text = re.sub(r"[^\w\s]", "", response_text)
        else:
            feature_vector, feature_str = create_feature_vector(input_story)
            prompt = raw_prompt.format(input=input_story, context="", genre=genre,style_features=feature_str,language={language})
            response = cached_llm.invoke(prompt)
            try:
                k = response.rindex('*')
                response_text = response[k+2:-1].replace('"','')
            except ValueError:
                response_text = response
            response_text = re.sub(r"[^\w\s]", "", response_text)
            similarity_score = calculate_combined_similarity(input_story, response_text,language)
        end_time = time.time()
        
        # stylefeatures2 = create_style_vector(extract_style_features(response_text))
        
        
        response_answer = {"Answer": response_text, "Score": round(similarity_score, 2)}
        print(f"Story Generation Time: {end_time - start_time} seconds")
        print(f"Generated Story: {response_text}")
        print(f"Cosine similarity: {similarity_score}")
        return jsonify(response_answer)
    
    except Exception as e:
        error_msg = f"Error in /ask_story: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg,"status":500}), 500


@app.route("/compare_features", methods=["POST"])
def compare_features():
    try:
        story1 = request.json.get("story1")
        story2 = request.json.get("story2")
        if not story1 or not story2:
            return jsonify({"error": "Both stories must be provided"}), 400

        similarity_score = calculate_combined_similarity(story1, story2)
        return jsonify({"similarity_score": similarity_score})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/pdf', methods=['POST'])
def handleFileUpload():
    global pdf_content_store
    file = request.files['file']
    print(file.filename)
    if file and file.filename.endswith('.pdf'):
        file.save(file.filename)
        loader = PDFPlumberLoader(file.filename)
        pdf_content = loader.load()
        pdf_content = " ".join([page.page_content for page in pdf_content])
        pdf_content_store[file.filename] = pdf_content
        print(pdf_content_store)
        response = {
            "status": "Successfully Uploaded and Processed",
            "fileName": file.filename,
            "content_length": len(pdf_content),
            "extracted_story":pdf_content
        }
        return jsonify(response)
    else:
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

@app.route("/ask_story_with_pdf", methods=["POST"])
def ask_story_with_pdf():
    # try:
    json_content = request.json
    input_story = json_content.get("query")
    fileName = json_content.get("nameFile")
    genre = json_content.get("genre", "general")
    language=json_content.get("genLang","English")
    print(language)
    if fileName not in pdf_content_store:
        return jsonify({"error": "PDF not found. Please upload the PDF first."}), 400
    
    context = pdf_content_store[fileName]
    
    start_time = time.time()
    feature_vector, feature_str = create_feature_vector(context)
    
    prompt = raw_prompt.format(input=input_story, context=context, genre=genre, style_features=feature_str,language={language})
    response = cached_llm.invoke(prompt)
    end_time = time.time()
    
    try:
        k = response.rindex('*')
        response_text = response[k+2:].replace('"', '')
    except ValueError:
        response_text = response
    
    response_text = re.sub(r"[^\w\s]", "", response_text)
    
    similarity_score = calculate_combined_similarity(context, response_text,language)
    response_answer = {"Answer": response_text, "Score": round(similarity_score, 2)}
    print(f"Story Generation with PDF Context Time: {end_time - start_time} seconds")
    print(f"Generated Story: {response_text}")
    print(f"Combined similarity: {similarity_score}")
    
    return jsonify(response_answer)
    
    # except Exception as e:
    #     error_msg = f"Error in /ask_story_with_pdf: {str(e)}"
    #     return jsonify({"error": error_msg}), 500
    
@app.route("/", methods=["GET"])
def home():
    return "Server is running!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080,debug=True)
