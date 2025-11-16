// Agent调度总线 - 统一管理所有Agent的调用
const matchAgent = require('./matchAgent');
const summarizeAgent = require('./summarizeAgent');
const reviewAuditAgent = require('./reviewAuditAgent');

// 主推荐流程：用户输入 → 匹配课程 → 生成摘要
async function recommendCourses(userSkills, userCareerGoal, limit = 8) {
    try {
        // 1. 匹配课程
        const matchedCourses = matchAgent.matchCourses(userSkills, userCareerGoal, limit);
        
        // 2. 为每门课程生成个性化摘要
        const coursesWithSummaries = await Promise.all(
            matchedCourses.map(async (course) => {
                const summary = await summarizeAgent.generateSummary(userCareerGoal, course);
                return {
                    ...course,
                    personalizedSummary: summary
                };
            })
        );
        
        return {
            success: true,
            courses: coursesWithSummaries,
            total: coursesWithSummaries.length
        };
    } catch (error) {
        console.error('推荐流程错误:', error);
        return {
            success: false,
            error: '推荐系统暂时不可用，请稍后重试。',
            courses: []
        };
    }
}

// 搜索课程（支持ID和关键词）
function searchCourses(searchTerm, searchType = 'keyword') {
    try {
        let results = [];
        
        if (searchType === 'id') {
            // 按课程ID搜索
            const course = matchAgent.searchCourseById(searchTerm);
            if (course) results = [course];
        } else {
            // 按关键词搜索
            results = matchAgent.searchCoursesByKeyword(searchTerm);
        }
        
        return {
            success: true,
            results: results,
            total: results.length
        };
    } catch (error) {
        console.error('搜索流程错误:', error);
        return {
            success: false,
            error: '搜索系统暂时不可用，请稍后重试。',
            results: []
        };
    }
}

// 提交评价流程
async function submitReview(reviewData) {
    try {
        // 1. 审核评价内容
        const auditResult = await reviewAuditAgent.auditReviewForm(reviewData);
        
        if (!auditResult.valid) {
            return {
                success: false,
                message: auditResult.message
            };
        }
        
        // 2. 如果审核通过，准备上传数据
        const submissionData = {
            ...reviewData,
            timestamp: new Date().toISOString(),
            auditStatus: 'approved',
            auditMessage: auditResult.message
        };
        
        return {
            success: true,
            message: auditResult.message,
            data: submissionData
        };
    } catch (error) {
        console.error('评价提交流程错误:', error);
        return {
            success: false,
            message: '评价提交失败，请稍后重试。'
        };
    }
}

// 获取课程详情（包含完整信息）
async function getCourseDetails(courseId, userGoal = '') {
    try {
        const course = matchAgent.searchCourseById(courseId);
        
        if (!course) {
            return {
                success: false,
                error: '未找到该课程信息。'
            };
        }
        
        // 生成详细摘要
        const detailedSummary = await summarizeAgent.generateDetailedSummary(course, userGoal);
        
        return {
            success: true,
            course: {
                ...course,
                detailedSummary: detailedSummary
            }
        };
    } catch (error) {
        console.error('获取课程详情错误:', error);
        return {
            success: false,
            error: '获取课程信息失败，请稍后重试。'
        };
    }
}

// 批量获取课程信息（用于弹窗显示评价）
function getCoursesByIds(courseIds) {
    try {
        const courses = courseIds.map(id => matchAgent.searchCourseById(id)).filter(Boolean);
        
        return {
            success: true,
            courses: courses
        };
    } catch (error) {
        console.error('批量获取课程信息错误:', error);
        return {
            success: false,
            error: '获取课程信息失败。',
            courses: []
        };
    }
}

// 导出所有Agent功能
module.exports = {
    // 核心功能
    recommendCourses,
    searchCourses,
    submitReview,
    
    // 课程信息
    getCourseDetails,
    getCoursesByIds,
    
    // 直接调用单个Agent
    matchAgent,
    summarizeAgent,
    reviewAuditAgent,
    
    // 工具函数
    getAllCourses: matchAgent.getAllCourses
};