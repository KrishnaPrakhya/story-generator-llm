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
from scipy.spatial.distance import euclidean, cityblock, minkowski, chebyshev
from gensim.models.doc2vec import Doc2Vec, TaggedDocument
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk import pos_tag
from nltk.corpus import stopwords
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

def calculate_combined_similarity(story1, story2):
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
            '``', "''", 'CD', 'JJS'
        ]

        pos_vector_fixed = [pos_vector.get(tag, 0) for tag in pos_tag_list]

        pov = identify_pov(story)
        readability_scores = calculate_readability_score(story)
        normalized_mood = "Positive" if overall_compound_score > 0 else "Negative" if overall_compound_score < 0 else "Neutral"
        ttr = calculate_vocabulary_richness(story)
        avg_sentence_length, passive_count = extract_syntactic_patterns(story)

        pov_encoding = {"Inconclusive: No pronouns found": 0, "Inconclusive: Pronoun usage is mixed": 0, "1st person": 1, "3rd person": 2}
        normalized_mood_encoding = {"Negative": -1, "Neutral": 0, "Positive": 1}
        feature_vector = [
              overall_compound_score,
            #  pov_encoding.get(pov, 0),
              readability_scores["Flesch-Kincaid Grade Level"],
              readability_scores["ARI"],
             # normalized_mood_encoding[normalized_mood],
             # ttr,
              # avg_sentence_length,
             passive_count
        ] + pos_vector_fixed

        # Normalizing feature vector
        feature_vector = np.array(feature_vector)
        min_vals = np.min(feature_vector)
        max_vals = np.max(feature_vector)
        normalized_vector = (feature_vector - min_vals) / (max_vals - min_vals)

        return normalized_vector

    def jaccard_similarity_feature_vectors(vector1, vector2):
        set1 = set(np.nonzero(vector1)[0])
        set2 = set(np.nonzero(vector2)[0])
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        return len(intersection) / len(union)

    # def tfidf_cosine_similarity(text1, text2):
    #     vectorizer = TfidfVectorizer()
    #     tfidf_matrix = vectorizer.fit_transform([text1, text2])
    #     return cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    def doc2vec_similarity(text1, text2):
        tagged_data = [TaggedDocument(words=word_tokenize(text.lower()), tags=[str(i)]) for i, text in enumerate([text1, text2])]
        model = Doc2Vec(tagged_data, vector_size=20, window=2, min_count=1, workers=4, epochs=100)
        vector1 = model.infer_vector(word_tokenize(text1.lower()))
        vector2 = model.infer_vector(word_tokenize(text2.lower()))
        return cosine_similarity([vector1], [vector2])[0][0]

    def stylometric_similarity(vector1, vector2):
        dist = euclidean(vector1, vector2)
        return 1 / (1 + dist)

    # New distance-based similarity methods
    def euclidean_distance_similarity(vector1, vector2):
        return 1 / (1 + euclidean(vector1, vector2))

    def manhattan_distance_similarity(vector1, vector2):
        return 1 / (1 + cityblock(vector1, vector2))

    def minkowski_distance_similarity(vector1, vector2, p=3):
        return 1 / (1 + minkowski(vector1, vector2, p))

    def chebyshev_distance_similarity(vector1, vector2):
        return 1 / (1 + chebyshev(vector1, vector2))

    # Calculate features for both stories
    feature_vector_story1 = create_feature_vector(story1)
    feature_vector_story2 = create_feature_vector(story2)

    # Cosine similarity of feature vectors
    cosine_sim_feature_vectors = cosine_similarity([feature_vector_story1], [feature_vector_story2])[0][0]
    print("Cosine Similarity:", cosine_sim_feature_vectors)

    # Manhattan Distance Similarity
    manhattan_sim = manhattan_distance_similarity(feature_vector_story1, feature_vector_story2)
    print("Manhattan Distance Similarity:", manhattan_sim)

    # Stylometric similarity on feature vectors
    stylometric_sim = stylometric_similarity(feature_vector_story1, feature_vector_story2)
    print("Stylometric Similarity:", stylometric_sim)

    # Combine all similarity scores
    combined_similarity = np.mean([
        cosine_sim_feature_vectors, manhattan_sim, stylometric_sim
    ])

    combined = np.array([
        cosine_sim_feature_vectors, manhattan_sim, stylometric_sim
    ])
    combined.sort()

    print("Total Combined Similarity:", combined_similarity)
    return combined_similarity



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
        # stylefeatures1 = calculate_combined_similarity(input_story)
        prompt = raw_prompt.format(input=input_story, context=context, genre=genre)
        response = cached_llm.invoke(prompt)
        end_time = time.time()
        
        try:
            k = response.rindex('*')
            response_text = response[k+2:-1].replace('"','')
        except ValueError:
            response_text = response
        
        # stylefeatures2 = create_style_vector(extract_style_features(response_text))
        similarity_score = calculate_combined_similarity(input_story, response_text)
        response_answer = {"Answer": response_text, "Score": round(similarity_score, 2)}
        print(f"Story Generation Time: {end_time - start_time} seconds")
        print(f"Generated Story: {response_text}")
        print(f" similarity: {similarity_score}")
        return jsonify(response_answer)
    
    except Exception as e:
        error_msg = f"Error in /ask_story: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg,"status":500}), 500


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
        # styleFeatures1 = create_style_vector(extract_style_features(context))
        # print(f"Style vector: {styleFeatures1}")
        start_time = time.time()
        
        prompt = raw_prompt.format(input=input_story, context=context,genre=genre)
        response = cached_llm.invoke(prompt)
        end_time = time.time()
        
        try:
            k = response.rindex('*')
            response_text = response[k+2:-1].replace('"','')
        except ValueError:
            response_text = response
        
        # styleFeatures2 = create_style_vector(extract_style_features(response_text))
        similarity_score = calculate_combined_similarity(input_story, response_text)
        response_answer = {"Answer": response_text, "Score": round(similarity_score, 2)}
        print(f"Story Generation with PDF Context Time: {end_time - start_time} seconds")
        print(f"Generated Story: {response_text}")
        print(f" similarity: {similarity_score}")
        return jsonify(response_answer)
    
    except Exception as e:
        error_msg = f"Error in /ask_story_with_pdf: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
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
