// 课程匹配Agent - 基于TF-IDF算法的本地推荐引擎
// 输入：用户简历/技能，输出：匹配的课程列表

const courses = require('../courses.json');

// 简单的TF-IDF算法实现
function calculateTFIDF(userText, courseText) {
    const userWords = userText.toLowerCase().split(/\s+/);
    const courseWords = courseText.toLowerCase().split(/\s+/);
    
    let score = 0;
    const totalWords = courseWords.length;
    
    userWords.forEach(word => {
        if (word.length < 3) return; // 忽略短词
        
        const frequency = courseWords.filter(w => w.includes(word)).length;
        if (frequency > 0) {
            score += frequency / totalWords;
        }
    });
    
    return score;
}

// 匹配算法主函数
function matchCourses(userSkills, userCareerGoal, limit = 10) {
    if (!userSkills) return [];
    
    const searchText = userSkills + ' ' + (userCareerGoal || '');
    
    const scoredCourses = courses.map(course => {
        // 使用description和keywords进行匹配
        const courseText = course.description_clean + ' ' + course.keywords;
        const tfidfScore = calculateTFIDF(searchText, courseText);
        
        // 行业匹配加分
        let industryBonus = 0;
        if (userCareerGoal && course.industry) {
            const industryKeywords = {
                'software': ['computer', 'software', 'engineer', 'developer'],
                'data': ['data', 'analytics', 'machine learning', 'ai'],
                'design': ['design', 'ui', 'ux', 'user experience'],
                'business': ['business', 'management', 'finance', 'marketing']
            };
            
            for (const [key, words] of Object.entries(industryKeywords)) {
                if (words.some(w => userCareerGoal.toLowerCase().includes(w)) && 
                    course.industry.toLowerCase().includes(key)) {
                    industryBonus = 0.3;
                    break;
                }
            }
        }
        
        return {
            ...course,
            matchScore: tfidfScore + industryBonus,
            level: course.level || 'unknown'
        };
    });
    
    // 按匹配分数排序，过滤掉分数为0的课程
    return scoredCourses
        .filter(course => course.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
}

// 根据课程ID搜索特定课程
function searchCourseById(courseId) {
    return courses.find(course => course.course_id === courseId);
}

// 根据关键词搜索课程
function searchCoursesByKeyword(keyword) {
    const searchTerm = keyword.toLowerCase();
    return courses.filter(course => 
        course.course_name.toLowerCase().includes(searchTerm) ||
        course.description_clean.toLowerCase().includes(searchTerm) ||
        course.keywords.toLowerCase().includes(searchTerm)
    );
}

module.exports = {
    matchCourses,
    searchCourseById,
    searchCoursesByKeyword,
    getAllCourses: () => courses
};