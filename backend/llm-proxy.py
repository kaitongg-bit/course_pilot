#!/usr/bin/env python3
"""
本地LLM代理服务器 - 基于llama.cpp和Qwen模型
模仿HW5_AGENT.ipynb的功能，提供课程推荐和摘要服务
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from llama_cpp import Llama

def _init_llm(self):
    llm = Llama(
        model_path="models/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf",
        n_ctx=2048,
        n_threads=8,
        verbose=False
    )
    return llm


# 确保nltk数据已下载
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    import ssl
    try:
        _create_unverified_https_context = ssl._create_unverified_context
    except AttributeError:
        pass
    else:
        ssl._create_default_https_context = _create_unverified_https_context
    nltk.download('stopwords', quiet=True)

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

app = Flask(__name__)
CORS(app)
PORT = 3002

# 加载课程数据
COURSES_FILE = 'courses.json'

class CourseRecommender:
    def __init__(self):
        self.courses = self.load_courses()
        self.vectorizer = TfidfVectorizer()
        self.tfidf_matrix = None
        self._prepare_tfidf()
        
        # 初始化LLM（实际使用时取消注释）
        self.llm = self._init_llm()
    
    def load_courses(self):
        """加载课程数据"""
        try:
            with open(COURSES_FILE, 'r', encoding='utf-8') as f:
                courses = json.load(f)
            print(f"成功加载 {len(courses)} 门课程")
            return courses
        except Exception as e:
            print(f"加载课程数据失败: {e}")
            return []
    
    def _prepare_tfidf(self):
        """准备TF-IDF矩阵"""
        if not self.courses:
            return
        
        # 预处理课程文本
        course_texts = []
        for course in self.courses:
            text = f"{course.get('course_name', '')} {course.get('description', '')} {course.get('prerequisites', '')}"
            course_texts.append(self.preprocess_text(text))
        
        # 创建TF-IDF矩阵
        self.tfidf_matrix = self.vectorizer.fit_transform(course_texts)
    
    def preprocess_text(self, text):
        """文本预处理"""
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        tokens = text.split()
        stop_words = set(stopwords.words('english'))
        tokens = [word for word in tokens if word not in stop_words]
        return " ".join(tokens)
    
    def course_match(self, user_profile):
        """课程匹配功能"""
        if not self.courses or self.tfidf_matrix is None:
            return []
        
        # 准备用户文本
        user_text = self.preprocess_text(
            user_profile.get('resume', '') + 
            " ".join(user_profile.get('skills', [])) + 
            user_profile.get('career_goals', '')
        )
        
        if not user_text:
            return []
        
        # 计算相似度
        user_vector = self.vectorizer.transform([user_text])
        cosine_sim = cosine_similarity(user_vector, self.tfidf_matrix).flatten()
        
        # 生成匹配结果
        matched_courses = []
        for i, course in enumerate(self.courses):
            matching_percentage = cosine_sim[i] * 100
            matched_courses.append({
                'course_id': course.get('course_id'),
                'course_name': course.get('course_name'),
                'description': course.get('description'),
                'prerequisites': course.get('prerequisites'),
                'matching_percentage': round(matching_percentage, 2)
            })
        
        # 按匹配度排序
        matched_courses.sort(key=lambda x: x['matching_percentage'], reverse=True)
        return matched_courses
         

# 初始化推荐器
recommender = CourseRecommender()

# 职业关键词映射
job_keywords_map = {
    "AI product manager": [
        "product management", "python", "machine learning", "deep learning",
        "data analysis", "artificial intelligence", "user experience", "business analysis",
        "prompt engineering", "algorithms", "app development"
    ],
    "data scientist": [
        "python", "machine learning", "statistics", "data mining", "data visualization",
        "deep learning", "SQL", "big data"
    ]
}

def normalize_job(s):
    """标准化职业名称"""
    return re.sub(r'[^a-z0-9 ]', '', s.lower()).strip()

def expand_profile(user_profile):
    """扩展用户资料"""
    goal = normalize_job(user_profile.get('career_goals', ''))
    extra_skills = set()
    
    for k, kws in job_keywords_map.items():
        k_norm = normalize_job(k)
        if k_norm in goal or all(word in goal for word in k_norm.split()):
            extra_skills.update(kws)
    
    skills = set([s.lower() for s in user_profile.get('skills', [])])
    total_skills = list(skills | extra_skills)
    
    new_profile = dict(user_profile)
    new_profile['skills'] = total_skills
    return new_profile

@app.route('/api/llm/generate', methods=['POST'])
def generate_text():
    """LLM文本生成端点"""
    try:
        data = request.json
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        # 模拟LLM响应（实际使用时替换为真实LLM调用）
        response_text = f"这是一个模拟的LLM响应。用户输入: {prompt[:100]}..."
        
        return jsonify({
            'text': response_text,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': 'LLM processing failed',
            'details': str(e)
        }), 500

@app.route('/api/courses/match', methods=['POST'])
def match_courses():
    """课程匹配端点"""
    try:
        data = request.json
        
        # 解析用户资料
        resume = data.get('resume', '')
        skills_str = data.get('skills', '')
        career_goals = data.get('career_goals', '')
        
        # 处理技能列表
        skills = [s.strip() for s in re.split('[,，；;、 ]', skills_str) if s.strip()]
        
        user_profile = {
            'resume': resume,
            'skills': skills,
            'career_goals': career_goals
        }
        
        # 扩展用户资料
        expanded_profile = expand_profile(user_profile)
        
        # 获取匹配的课程
        matched_courses = recommender.course_match(expanded_profile)
        
        # 为每个课程生成摘要
        results = []
        for course in matched_courses[:15]:  # 只返回前15个结果
            summary = recommender.course_summarize(course['description'], user_profile)
            results.append({
                **course,
                'summary': summary
            })
        
        return jsonify({
            'status': 'success',
            'results': results,
            'total_matches': len(matched_courses)
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Course matching failed',
            'details': str(e)
        }), 500

@app.route('/api/courses/summarize', methods=['POST'])
def course_summarize(self, description, user_profile):
    """调用本地LLM生成个性化课程摘要"""
    if not hasattr(self, 'llm'):
        self.llm = self._init_llm()  # 确保LLM已初始化

    try:
        # 构造LLM提示词
        prompt = f"""
        你是一个职业规划助手，请根据用户的职业目标和课程信息生成个性化推荐语。
        用户职业目标: {user_profile.get('career_goals', '未知')}
        用户技能: {', '.join(user_profile.get('skills', []))}
        课程名称: {description.get('course_name', '未知课程')}
        课程描述: {description.get('description', '无描述')}
        请生成一段50-100字的推荐语，说明这门课程如何帮助用户实现职业目标。
        """
        
        # 调用LLM（实际使用时取消注释）
        response = self.llm(prompt, max_tokens=200)
        summary = response['choices'][0]['text'].strip()
        
        # 模拟响应（测试用）
        summary = f"这门课程《{course_description.get('course_name', '未知课程')}》适合追求{user_profile.get('career_goals', '职业发展')}的用户，因为它涵盖了{', '.join(user_profile.get('skills', []))}等关键技能。"
        return summary

    except Exception as e:
        print(f"LLM摘要生成失败: {e}")
        return "无法生成个性化推荐语，请稍后重试。"

@app.route('/api/review/audit', methods=['POST'])
    def audit_review(self, review_text):
    """审核用户评价内容"""
    if not hasattr(self, 'llm'):
        self.llm = self._init_llm()  # 确保LLM已初始化
    try:
        review_data = request.json
        # 调用LLM审核评价（示例）
        prompt = f"""
    Please perform an automatic AI audit of the given course review content based on the following rules:
    1. If it contains rude, vulgar, or foul language (e.g., "idiot", "go to hell"), it fails the audit.
    2. If the number of characters is less than 15, it fails the audit with the reason "Content is too brief".
    3. Otherwise, it passes the audit, regardless of whether it expresses criticism or praise.
    Return only: {{"Audit Status": "Pass"/"Fail", "Reason": "..."}}. Review text: {review_text}
    """
        response = llm.generate([{"role":"user","content": prompt}])
        # Parse response.content as a dict
        import json
        try:
            result = json.loads(response.content)
        except Exception:
             result = {"Audit Status": "Fail", "Reason": "AI failed to correctly determine"}
        return result
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'OK',
        'message': 'Local LLM Proxy Server is running',
        'courses_loaded': len(recommender.courses)
    })

@app.route('/')
def index():
    """主页"""
    return jsonify({
        'service': 'Local LLM Proxy Server',
        'version': '1.0',
        'endpoints': [
            '/api/llm/generate - POST - 文本生成',
            '/api/courses/match - POST - 课程匹配',
            '/api/courses/summarize - POST - 课程摘要',
            '/api/health - GET - 健康检查'
        ]
    })

if __name__ == '__main__':
    print(f"本地LLM代理服务器启动在端口 {PORT}")
    print(f"已加载 {len(recommender.courses)} 门课程")
    app.run(host='0.0.0.0', port=PORT, debug=True)