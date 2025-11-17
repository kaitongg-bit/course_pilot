// 评价审核Agent - 审核用户提交的评价内容（使用本地LLM）
// 输入：评价文本，输出：审核结果

// 调用本地LLM代理
async function callLocalLLM(prompt) {
    try {
        const response = await fetch('http://localhost:5001/api/llm/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 200,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }

        return result.text;
    } catch (error) {
        console.warn('本地LLM调用失败，使用本地审核：', error);
        return null;
    }
}

// 粗口过滤列表
const PROFANITY_WORDS = [
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'dick', 'pussy',
    'crap', 'hell', 'suck', 'stupid', 'idiot', 'moron', 'retard',
    '狗屁', '傻逼', '混蛋', '王八蛋', '他妈的', '操', '日'
];

// 鼓励语库
const ENCOURAGEMENT_PHRASES = [
    "感谢你的宝贵反馈！这会对其他同学很有帮助！",
    "你的见解很独到，期待更多同学受益！",
    "评价很中肯，会帮助大家做出更好的选择！",
    "谢谢分享你的真实体验，这对选课很重要！",
    "你的评价很详细，相信能帮助到很多人！",
    "很有价值的反馈，期待你继续分享经验！"
];

// 本地规则审核
function localReviewAudit(reviewText, courseId) {
    // 检查粗口
    const lowerText = reviewText.toLowerCase();
    const hasProfanity = PROFANITY_WORDS.some(word => lowerText.includes(word));
    
    if (hasProfanity) {
        return {
            valid: false,
            message: "评价包含不恰当内容，请修改后重新提交。"
        };
    }
    
    // 检查是否与课程相关（至少包含课程关键词或评价内容）
    const minLength = 10; // 最少10个字符
    if (reviewText.trim().length < minLength) {
        return {
            valid: false,
            message: "评价内容太短，请提供更详细的体验描述。"
        };
    }
    
    // 随机选择鼓励语
    const randomEncouragement = ENCOURAGEMENT_PHRASES[
        Math.floor(Math.random() * ENCOURAGEMENT_PHRASES.length)
    ];
    
    return {
        valid: true,
        message: randomEncouragement
    };
}

// 主审核函数（使用AI智能审核）
async function auditReview(reviewText, courseId) {
    try {
        const prompt = `
你是一个课程评价审核助手，请检查以下评价内容：
- 评价文本：${reviewText}
- 课程ID：${courseId}

审核规则：
1. 允许批评或表扬课程内容
2. 拒绝粗口、人身攻击或完全无关的内容
3. 通过时生成一句非固定的鼓励语

请返回JSON格式：{"valid": true/false, "message": "审核说明"}
只返回JSON格式，不要有其他内容。
        `;
        
        const aiResponse = await callLocalLLM(prompt);
        
        if (aiResponse) {
            // 尝试解析JSON响应
            try {
                const result = JSON.parse(aiResponse);
                if (result.valid === false && !result.message) {
                    result.message = "评价内容不符合规范，请修改后重新提交。";
                }
                return result;
            } catch (parseError) {
                console.warn('AI审核返回格式错误，使用本地审核：', parseError);
            }
        }
    } catch (error) {
        console.warn('AI审核调用失败，使用本地审核：', error);
    }
    
    // 使用本地审核
    return localReviewAudit(reviewText, courseId);
}

// 审核评价表单数据
async function auditReviewForm(formData) {
    const { reviewText, courseId, workload, interestRating, utilityRating, overallRating } = formData;
    
    // 检查必填字段
    if (!courseId) {
        return {
            valid: false,
            message: "请填写课程编号。"
        };
    }
    
    // 审核文本内容
    const textAudit = await auditReview(reviewText, courseId);
    
    if (!textAudit.valid) {
        return textAudit;
    }
    
    // 检查评分范围（1-5）
    const ratings = [interestRating, utilityRating, overallRating];
    const invalidRatings = ratings.filter(rating => {
        const num = parseInt(rating);
        return isNaN(num) || num < 1 || num > 5;
    });
    
    if (invalidRatings.length > 0) {
        return {
            valid: false,
            message: "评分范围应为1-5分，请检查你的评分。"
        };
    }
    
    return {
        valid: true,
        message: "评价审核通过！" + textAudit.message
    };
}

module.exports = {
    auditReview,
    auditReviewForm,
    localReviewAudit
};