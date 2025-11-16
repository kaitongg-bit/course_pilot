// sheetApi.js - Google Sheets API 集成

// 配置常量
const SHEET_CONFIG = {
    scriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', // 需要替换为实际的Google Apps Script URL
    sheetId: 'YOUR_GOOGLE_SHEET_ID', // 需要替换为实际的Google Sheet ID
    sheetName: 'Reviews'
};

// 提交评价到Google Sheets
async function submitReviewToSheet(reviewData) {
    try {
        // 准备提交数据
        const submissionData = {
            action: 'submitReview',
            data: {
                timestamp: new Date().toISOString(),
                UserID: reviewData.userId || 'anonymous',
                course_id: reviewData.courseCode,
                workload: reviewData.workload,
                InterestRating: reviewData.interestRating,
                UtilityRating: reviewData.utilityRating,
                OverallRating: reviewData.overallRating,
                Comment: reviewData.reviewText,
                EmailHash: reviewData.emailHash || '',
                rowId: generateRowId()
            }
        };

        // 发送请求到Google Apps Script
        const response = await fetch(SHEET_CONFIG.scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('Review submitted successfully:', result.message);
            return {
                success: true,
                message: 'Review submitted successfully!',
                rowId: result.rowId
            };
        } else {
            throw new Error(result.message || 'Submission failed');
        }

    } catch (error) {
        console.error('Error submitting review to sheet:', error);
        return {
            success: false,
            message: 'Failed to submit review. Please try again later.'
        };
    }
}

// 从Google Sheets获取评价数据
async function getReviewsFromSheet(courseId = null, limit = 50) {
    try {
        const requestData = {
            action: 'getReviews',
            courseId: courseId,
            limit: limit
        };

        const response = await fetch(SHEET_CONFIG.scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                reviews: result.reviews || []
            };
        } else {
            throw new Error(result.message || 'Failed to fetch reviews');
        }

    } catch (error) {
        console.error('Error fetching reviews from sheet:', error);
        // 返回空数组作为降级方案
        return {
            success: false,
            reviews: [],
            message: 'Using fallback data'
        };
    }
}

// 获取课程统计信息
async function getCourseStats(courseId) {
    try {
        const requestData = {
            action: 'getCourseStats',
            courseId: courseId
        };

        const response = await fetch(SHEET_CONFIG.scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                stats: result.stats || {}
            };
        } else {
            throw new Error(result.message || 'Failed to fetch stats');
        }

    } catch (error) {
        console.error('Error fetching course stats:', error);
        return {
            success: false,
            stats: {}
        };
    }
}

// 删除用户评价（需要验证）
async function deleteReview(reviewId, emailHash) {
    try {
        const requestData = {
            action: 'deleteReview',
            reviewId: reviewId,
            emailHash: emailHash
        };

        const response = await fetch(SHEET_CONFIG.scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                message: 'Review deleted successfully'
            };
        } else {
            throw new Error(result.message || 'Failed to delete review');
        }

    } catch (error) {
        console.error('Error deleting review:', error);
        return {
            success: false,
            message: 'Failed to delete review'
        };
    }
}

// 获取用户贡献统计
async function getUserStats(userId) {
    try {
        const requestData = {
            action: 'getUserStats',
            userId: userId
        };

        const response = await fetch(SHEET_CONFIG.scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                stats: result.stats || {}
            };
        } else {
            throw new Error(result.message || 'Failed to fetch user stats');
        }

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return {
            success: false,
            stats: {}
        };
    }
}

// 生成唯一的行ID
function generateRowId() {
    return 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 生成邮箱哈希（用于匿名验证）
function generateEmailHash(email) {
    if (!email) return '';
    
    // 简单的哈希函数 - 在实际应用中应该使用更安全的方法
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
}

// 验证配置是否已设置
function isConfigured() {
    return SHEET_CONFIG.scriptUrl && SHEET_CONFIG.scriptUrl !== 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
}

// 导出函数
module.exports = {
    submitReviewToSheet,
    getReviewsFromSheet,
    getCourseStats,
    deleteReview,
    getUserStats,
    generateEmailHash,
    isConfigured
};

// 浏览器环境兼容性处理
if (typeof window !== 'undefined') {
    window.sheetApi = {
        submitReviewToSheet,
        getReviewsFromSheet,
        getCourseStats,
        deleteReview,
        getUserStats,
        generateEmailHash,
        isConfigured
    };
}