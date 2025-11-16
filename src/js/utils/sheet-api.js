// Google Sheets API集成
class SheetAPI {
    constructor() {
        // 从ARCHITECTURE.md中获取的真实Apps Script端点
        this.baseUrl = 'https://script.google.com/macros/s/AKfycbzSK-r_07kUIi26xWSBUOf2c3JwdPLXVJK5RajPkM_uj2jZCzjQqp5F-xh8iQ28gNsD7Q/exec';
        
        // 生成匿名用户ID
        this.userId = this.generateUserId();
    }
    
    // 生成匿名用户ID
    generateUserId() {
        let userId = localStorage.getItem('cmu_user_id');
        if (!userId) {
            userId = 'cmu_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
            localStorage.setItem('cmu_user_id', userId);
        }
        return userId;
    }
    
    // 提交评价到Google Sheets
  async submitReview(reviewData) {
    try {
        // 验证必填字段
        if (!reviewData.course_id || !reviewData.workload || !reviewData.Comment) {
            throw new Error("缺少必填字段: course_id, workload, Comment");
        }

        // 构造 payload，完全使用用户传入的数据
        const payload = {
            UserID: this.userId,  // 系统生成的匿名ID
            course_id: reviewData.course_id,
            workload: reviewData.workload,
            InterestRating: reviewData.InterestRating || 3,  // 提供默认评分
            UtilityRating: reviewData.UtilityRating || 3,
            OverallRating: reviewData.OverallRating || 3,
            Comment: reviewData.Comment,
            EmailHash: reviewData.EmailHash || "",  // 允许为空
            RowID: reviewData.RowID || Math.random().toString(36).substr(2, 9),
            Timestamp: new Date().toISOString()
        };

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`提交失败: ${response.status}`);
        }

        return { success: true, data: await response.json() };
    } catch (error) {
        console.error('提交评价失败:', error);
        return { success: false, error: error.message };
    }
}

    
    // 获取所有评价（公开数据）
    async getReviews(courseId = null) {
        try {
            const params = new URLSearchParams();
            params.append('action', 'query');
            if (courseId) {
                params.append('course_id', courseId);
            }
            
            const response = await fetch(`${this.baseUrl}?${params}`, {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error(`获取评价失败: ${response.status}`);
            }
            
            const reviews = await response.json();
            return { success: true, data: reviews };
        } catch (error) {
            console.error('获取评价失败:', error);
            return { success: true, data: [] };
        }
    }
    
    // 删除用户自己的评价（通过哈希验证）
    async deleteReview(reviewData) {
        try {
            const payload = {
                action: 'delete',
                user_id: this.userId,
                review_hash: reviewData.review_hash
            };
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`删除失败: ${response.status}`);
            }
            
            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error('删除评价失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取用户自己的评价
    async getUserReviews() {
        try {
            const params = new URLSearchParams();
            params.append('action', 'query_user');
            params.append('user_id', this.userId);
            
            const response = await fetch(`${this.baseUrl}?${params}`, {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error(`获取用户评价失败: ${response.status}`);
            }
            
            const reviews = await response.json();
            return { success: true, data: reviews };
        } catch (error) {
            console.error('获取用户评价失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 创建全局实例
const sheetAPI = new SheetAPI();

export default sheetAPI;

export async function submitCourseReview(reviewData) {
    return await sheetAPI.submitReview(reviewData);
}

export async function getCourseReviews(courseId) {
    return await sheetAPI.getReviews(courseId);
}

export async function deleteUserReview(reviewData) {
    return await sheetAPI.deleteReview(reviewData);
}

export async function getUserReviews() {
    return await sheetAPI.getUserReviews();
}

export function getUserId() {
    return sheetAPI.userId;
}
