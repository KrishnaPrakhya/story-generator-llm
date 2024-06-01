import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_community.llms import Ollama
from langchain.document_loaders import PDFPlumberLoader
from langchain.prompts import PromptTemplate
import nltk
import textstat
from collections import Counter
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

cached_llm = Ollama(model="gemma:2b-instruct")

raw_prompt = PromptTemplate.from_template(
    """
<s>[INST] I can assist you with generating new stories! Please provide a starting sentence or a brief description of the story you have in mind. I will then analyze the input and context to create a new, original story for you. The story will be written in the style of the given context, using similar parts of speech, vocabulary, and stylistic elements. The genre of the story is {genre}.</s>
[INST] Story: {input} 
Context: {context}
--> </s>
[OUT] Here is the generated story:
"""
)

pdf_content_store = {}
fileName=""
styleFeatures={}

def extract_style_features(text):
    tokens = nltk.word_tokenize(text)
    pos_tags = nltk.pos_tag(tokens)
    pos_counts = Counter(tag for _, tag in pos_tags)
    total_tokens = len(pos_tags)
    pos_distribution = {tag: count / total_tokens for tag, count in pos_counts.items()}
    flesch_kincaid = textstat.flesch_reading_ease(text)
    ari = textstat.automated_readability_index(text)
    type_token_ratio = len(set(tokens)) / len(tokens)
    average_sentence_length = len(tokens) / text.count('.')
    return {
        'pos_distribution': pos_distribution,
        'pov': 1,
        'flesch_kincaid': flesch_kincaid,
        'ari': ari,
        'mood': 'neutral',
        'type_token_ratio': type_token_ratio,
        'average_sentence_length': average_sentence_length,
        'passive_voice_count': 0,
    }

def create_style_vector(style_features):
    pos_tags = set(tag for _, tag in nltk.pos_tag(nltk.word_tokenize("This is a test sentence."))) 
    pos_vector = np.zeros(len(pos_tags))
    for i, tag in enumerate(pos_tags):
        if tag in style_features['pos_distribution']:
            pos_vector[i] = style_features['pos_distribution'][tag]
        else:
            pos_vector[i] = 0.0

    vector = np.array([
        style_features['pov'],
        style_features['flesch_kincaid'],
        style_features['ari'],
        style_features['type_token_ratio'],
        style_features['average_sentence_length'],
        style_features['passive_voice_count']
    ])

    combined_vector = np.concatenate((pos_vector, vector))
    return combined_vector

def calculate_cosine_similarity(vector1, vector2):
    vector1 = vector1.reshape(1, -1)
    vector2 = vector2.reshape(1, -1)
    similarity = cosine_similarity(vector1, vector2)[0][0]
    return similarity

@app.route("/ask_story", methods=["POST"])
def ask_story():
    try:
        json_content = request.json
        input_story = json_content.get("query")
        genre = json_content.get("genre", "general")
        context = json_content.get("context", "")
        print(f"Story Input: {input_story}")
        print(f"Context: {context}")
        print(f"Genre: {genre}")
        start_time = time.time()
        stylefeatures1 = create_style_vector(extract_style_features(input_story))
        prompt = raw_prompt.format(input=input_story, context=context, genre=genre)
        response = cached_llm.invoke(prompt)
        end_time = time.time()
        
        try:
            k = response.rindex('*')
            response_text = response[k+2:-1].replace('"','')
        except ValueError:
            response_text = response
        
        stylefeatures2 = create_style_vector(extract_style_features(response_text))
        similarity_score = calculate_cosine_similarity(stylefeatures1, stylefeatures2)
        response_answer = {"Answer": response_text, "Score": round(similarity_score, 2)}
        print(f"Story Generation Time: {end_time - start_time} seconds")
        print(f"Generated Story: {response_text}")
        print(f"Cosine similarity: {similarity_score}")
        return jsonify(response_answer)
    
    except Exception as e:
        error_msg = f"Error in /ask_story: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg,"status":500}), 500

@app.route("/pdf", methods=["POST"])
def pdf_post():
    try:
        file = request.files["file"]
        fileName = file.filename
        save_file = fileName
        file.save(save_file)
        
        print(f"Uploaded PDF: {fileName}")
        
        start_time = time.time()
        
        loader = PDFPlumberLoader(save_file)
        docs = loader.load()
        
        pdf_content = " ".join([page.page_content for page in docs])
        
        pdf_content_store[fileName] = pdf_content
        
        end_time = time.time()
        print(f"PDF Processing Time: {end_time - start_time} seconds")
        
        response = {
            "status": "Successfully Uploaded and Processed",
            "fileName": fileName,
            "content_length": len(pdf_content)
        }
        return jsonify(response)
    
    except Exception as e:
        error_msg = f"Error in /pdf: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500

@app.route("/ask_story_with_pdf", methods=["POST"])
def ask_story_with_pdf():
    try:
        json_content = request.json
        input_story = json_content.get("query")
        fileName = json_content.get("nameFile")
        genre = json_content.get("genre", "general")
        print(f"Story Input: {input_story}")
        print(f"Using PDF: {fileName}")
        print(f"genre:{genre}")
        if fileName not in pdf_content_store:
            return jsonify({"error": "PDF not found. Please upload the PDF first."}), 400
        
        context = pdf_content_store[fileName]
        styleFeatures1 = create_style_vector(extract_style_features(context))
        print(f"Style vector: {styleFeatures1}")
        start_time = time.time()
        
        prompt = raw_prompt.format(input=input_story, context=context,genre=genre)
        response = cached_llm.invoke(prompt)
        end_time = time.time()
        
        try:
            k = response.rindex('*')
            response_text = response[k+2:-1].replace('"','')
        except ValueError:
            response_text = response
        
        styleFeatures2 = create_style_vector(extract_style_features(response_text))
        similarity_score = calculate_cosine_similarity(styleFeatures1, styleFeatures2)
        response_answer = {"Answer": response_text, "Score": round(similarity_score, 2)}
        print(f"Story Generation with PDF Context Time: {end_time - start_time} seconds")
        print(f"Generated Story: {response_text}")
        print(f"Cosine similarity: {similarity_score}")
        return jsonify(response_answer)
    
    except Exception as e:
        error_msg = f"Error in /ask_story_with_pdf: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
