import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_community.llms import Ollama
from langchain.document_loaders import PDFPlumberLoader
from langchain.prompts import PromptTemplate
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.probability import FreqDist
from nltk.corpus import stopwords
from nltk.tag import pos_tag
import textstat
from collections import Counter
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from gensim.models import Word2Vec
from sklearn.feature_extraction.text import TfidfVectorizer
from gensim.models.doc2vec import Doc2Vec, TaggedDocument
from scipy.spatial.distance import euclidean
from nltk.sentiment.vader import SentimentIntensityAnalyzer
# from scipy.linalg import triu 
app = Flask(__name__)
CORS(app)

nltk.download('vader_lexicon')
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('stopwords')
cached_llm = Ollama(model="gemma:2b-instruct")

raw_prompt = PromptTemplate.from_template(
    """
<s>[INST] I can assist you with generating new stories! Please provide a starting sentence or a brief description of the story you have in mind. I will then analyze the input and context to create a new, original story for you. The story will be written in the style of the given context, using similar parts of speech, vocabulary, and stylistic elements.</s>
[INST] Story: {input} 
Context: {context}
--> </s>
[OUT] Here is the generated story:
"""
)
pdf_content_store = {}
fileName=""
styleFeatures={}
# def get_style_vector(text):
#     """
#     Extracts stylometric features from a text and creates a numerical style vector.
#     Prints individual values and parameters during extraction.
#     """

#     # POS
#     tokens = nltk.word_tokenize(text)
#     pos_tags = nltk.pos_tag(tokens)
#     pos_counts = Counter(tag for _, tag in pos_tags)
#     total_tokens = len(pos_tags)
#     pos_distribution = {tag: count / total_tokens for tag, count in pos_counts.items()}
#     sorted_dict = sorted(pos_distribution.items(), key=lambda item: item[1], reverse=True)
#     print('POS Distribution:\n',dict(sorted_dict))

#     # Point of view
#     first_person_pronouns = ["I", "me", "we", "us"]
#     third_person_pronouns = ["he", "she", "it", "they", "him", "her", "them"]
#     first_person_count = 0
#     third_person_count = 0
#     total_pronouns = 0
#     for word, tag in pos_tags:
#         if word in first_person_pronouns and tag == 'PRP':
#             first_person_count += 1
#             total_pronouns += 1
#         elif word in third_person_pronouns and tag == 'PRP':
#             third_person_count += 1
#             total_pronouns += 1
#     pov = 0
#     if total_pronouns == 0:
#         pov = 0
#     elif first_person_count > third_person_count and first_person_count / total_pronouns > 0.5:
#         pov = 1
#     elif third_person_count > first_person_count and third_person_count / total_pronouns > 0.5:
#         pov = 3
#     else:
#         pov = 4
#     print('Point of View:\n',pov)

#     # Readability Scores
#     def count_syllables(word):
#         vowels = 'aeiouAEIOU'
#         num_vowels = 0
#         prev_was_vowel = False
#         for char in word:
#             if char in vowels and not prev_was_vowel:
#                 num_vowels += 1
#                 prev_was_vowel = True
#             else:
#                 prev_was_vowel = False

#         if word.endswith("e") and word not in ['the', 'be']:
#             num_vowels -= 1
#         return num_vowels

#     def calculate_readability_score(text):
#         tokens = nltk.word_tokenize(text)
#         sentences = nltk.sent_tokenize(text)
#         num_words = len(tokens)
#         num_sentences = len(sentences)
#         num_syllables = 0
#         num_characters = 0
#         for word in tokens:
#             num_syllables += count_syllables(word)
#             num_characters += len(word)
#         flesch_kincaid_score = 0.39 * num_words / num_sentences + 11.8 * num_syllables / num_words - 15.59
#         ari_score = 4.76 * num_characters / num_words + 0.5 * num_words / num_sentences - 21.43
#         return {
#             "Flesch-Kincaid Grade Level": round(flesch_kincaid_score, 2),
#             "ARI": round(ari_score, 2)
#         }

#     readability_scores = calculate_readability_score(text)
#     print('Readability Scores:\n',readability_scores)

#     # TTR, PassiveCount, SentenceLength
#     def calculate_vocabulary_richness(text):
#         tokens = word_tokenize(text.lower())
#         stop_words = set(stopwords.words('english'))
#         tokens = [word for word in tokens if word.isalnum() and word not in stop_words]
#         ttr = len(set(tokens)) / len(tokens)
#         return ttr

#     def extract_syntactic_patterns(text):
#         sentences = sent_tokenize(text)
#         sentence_lengths = [len(word_tokenize(sentence)) for sentence in sentences]
#         avg_sentence_length = sum(sentence_lengths) / len(sentence_lengths)
#         tagged_sentences = [pos_tag(word_tokenize(sentence)) for sentence in sentences]
#         passive_count = sum(1 for sent in tagged_sentences for word, pos in sent if pos == 'VBN')
#         return avg_sentence_length, passive_count

#     ttr = calculate_vocabulary_richness(text)
#     print("Type-Token Ratio (TTR):", ttr)
#     avg_sentence_length, passive_count = extract_syntactic_patterns(text)
#     print("Average Sentence Length:", avg_sentence_length)
#     print("Passive Voice Count:", passive_count)

#     # Vectors
#     model = Word2Vec(sentences=[nltk.word_tokenize(sentence) for sentence in nltk.sent_tokenize(text)],
#                     vector_size=100,
#                     window=5,
#                     min_count=1)
#     pos_embeddings = np.zeros((len(pos_distribution), 100))
#     for i, tag in enumerate(pos_distribution):
#         if tag in model.wv.key_to_index:
#             pos_embeddings[i] = model.wv[tag]
#     pos_vector = np.mean(pos_embeddings, axis=0)
#     other_vector = np.array([
#         pov,
#         readability_scores["Flesch-Kincaid Grade Level"],
#         readability_scores['ARI'],
#         ttr,
#         avg_sentence_length,
#         passive_count
#     ])
#     combined_vector = np.concatenate((pos_vector, other_vector))
#     return pos_vector


# # def calculate_similarity_scores(vector1, vector2):

#     dot_product_score = np.dot(vector1, vector2)

#     vector1 = vector1.reshape(1, -1)
#     vector2 = vector2.reshape(1, -1)

#     cosine_similarity_score = cosine_similarity(vector1, vector2)[0][0]
    
#     return cosine_similarity_score, dot_product_score

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
            "Flesch-Kincaid Grade Level": round(flesch_kincaid_score, 2),
            "ARI": round(ari_score, 2)
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
        return max(1, num_vowels)

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
        pov_encoding.get(pov, 0),
        readability_scores["Flesch-Kincaid Grade Level"],
        readability_scores["ARI"],
        normalized_mood_encoding[normalized_mood],
        ttr,
        avg_sentence_length,
        passive_count
        ] + pos_vector_fixed

        min_vals = np.min(feature_vector)
        max_vals = np.max(feature_vector)
        normalized_vector = (feature_vector - min_vals) / (max_vals - min_vals)

        return normalized_vector

    def jaccard_similarity(text1, text2):
        tokens1 = set(word_tokenize(text1.lower()))
        tokens2 = set(word_tokenize(text2.lower()))
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        return len(intersection) / len(union)

    def tfidf_cosine_similarity(text1, text2):
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        return cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    def doc2vec_similarity(text1, text2):
        tagged_data = [TaggedDocument(words=word_tokenize(text.lower()), tags=[str(i)]) for i, text in enumerate([text1, text2])]
        model = Doc2Vec(tagged_data, vector_size=20, window=2, min_count=1, workers=4, epochs=100)
        vector1 = model.infer_vector(word_tokenize(text1.lower()))
        vector2 = model.infer_vector(word_tokenize(text2.lower()))
        return cosine_similarity([vector1], [vector2])[0][0]

    def stylometric_similarity(text1, text2):
        feature_vector1 = create_feature_vector(text1)
        feature_vector2 = create_feature_vector(text2)
        dist = euclidean(feature_vector1, feature_vector2)
        return 1 / (1 + dist)

    # Calculate features for both stories
    feature_vector_story1 = create_feature_vector(story1)
    feature_vector_story2 = create_feature_vector(story2)

    # Cosine similarity of feature vectors
    cosine_sim_feature_vectors = cosine_similarity([feature_vector_story1], [feature_vector_story2])[0][0]
    print("Cosine Similarity:",cosine_sim_feature_vectors)

    # Jaccard similarity
    jaccard_sim = jaccard_similarity(story1, story2)
    print("Jaccard Similarity:",jaccard_sim)

    # TF-IDF cosine similarity
    tfidf_cosine_sim = tfidf_cosine_similarity(story1, story2)
    print("TF IDF Cosine Similarity:",tfidf_cosine_sim)
    
    # Doc2Vec similarity
    doc2vec_sim = doc2vec_similarity(story1, story2)
    print("Doc2Vec Similarity:",doc2vec_sim)
    
    # Stylometric similarity
    stylometric_sim = stylometric_similarity(story1, story2)
    print("Stylometric Similairty:",stylometric_sim)
    
    # Combine all similarity scores
    combined_similarity = np.mean([cosine_sim_feature_vectors, jaccard_sim, tfidf_cosine_sim, doc2vec_sim, stylometric_sim])

    combined=np.array([cosine_sim_feature_vectors, jaccard_sim, tfidf_cosine_sim, doc2vec_sim, stylometric_sim])
    combined.sort()
    
    com=(combined[4]+combined[3]+combined[2])/3

    print("Total Combined Similarity:",combined_similarity)
    return com

@app.route("/ask_story", methods=["POST"])
def ask_story():
    try:
        json_content = request.json
        input_story = json_content.get("query")
        context = json_content.get("context", "")  
        print(f"Story Input: {input_story}")
        print(f"Context: {context}")
        start_time = time.time()
        # stylefeatures1 = calculate_combined_similarity(input_story)
        prompt = raw_prompt.format(input=input_story, context=context)
        response = cached_llm.invoke(prompt)
        end_time = time.time()
        k=response.rindex('*')
        response=response[k+2:-1].replace('"','')
        # stylefeatures2 = calculate_combined_similarity(response)
        print(f"Story Generation Time: {end_time - start_time} seconds")
        print(f"Generated Story: {response}")

        similarity_score = calculate_combined_similarity(input_story, response)
        print(f"similarity: {similarity_score}")
        response_answer = {"Answer": response,"Score":similarity_score}
        return jsonify(response_answer)
    
    except Exception as e:
        error_msg = f"Error in /ask_story: {str(e.with_traceback)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500

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
        fileName=json_content.get("nameFile")
        print(f"Story Input: {input_story}")
        print(f"Using PDF: {fileName}")
        
        if fileName not in pdf_content_store:
            return jsonify({"error": "PDF not found. Please upload the PDF first."}), 400
        
        context = pdf_content_store[fileName]
        text= pdf_content_store[fileName]
        start_time = time.time()
        
        prompt = raw_prompt.format(input=input_story, context=context)
        response = cached_llm.invoke(prompt)
        end_time = time.time()
        k=response.rindex('*')
        response=response[k+2:-1].replace('"','')
        print(f"Story Generation with PDF Context Time: {end_time - start_time} seconds")
        print(f"Generated Story: {response}")
        similarity_score = calculate_combined_similarity(context, response)
        print(f"similarity: {similarity_score}")
        response_answer = {"Answer": response,"Score":similarity_score}
        return jsonify(response_answer)
    
    except Exception as e:
        error_msg = f"Error in /ask_story_with_pdf: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)