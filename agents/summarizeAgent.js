// 个性化课程摘要Agent - 生成个性化推荐语
// 输入：用户目标、课程信息，输出：个性化摘要（Gemini API或本地模板）

// 本地模板摘要生成器
function generateLocalSummary(userGoal, course) {
    const templates = [
        `Hey！${course.course_name}绝对能帮你实现${userGoal}，这门课讲的就是${course.description_clean.slice(0, 100)}...`, 
        `发现了一门超适合你的课！${course.course_name}能直接提升你的${userGoal}实战能力！`, 
        `${userGoal}达人看过来！${course.course_name}就是为你量身定制的进阶课程！`,
        `这门${course.course_name}跟你的${userGoal}目标完美契合，快来了解一下！`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

// 本地基于关键词的摘要生成
function generateKeywordSummary(userGoal, course) {
    const userKeywords = userGoal.toLowerCase().split(/\s+/);
    const courseKeywords = course.keywords.toLowerCase().replace(/[\[\]']/g, '').split(', ');
    
    // 找到匹配的关键词
    const matchedKeywords = userKeywords.filter(keyword => 
        courseKeywords.some(courseKeyword => courseKeyword.includes(keyword))
    );
    
    if (matchedKeywords.length > 0) {
        return `发现你的${matchedKeywords.join('、')}技能正好跟${course.course_name}完美匹配！`;
    }
    
    return generateLocalSummary(userGoal, course);
}

// 主摘要生成函数
async function generateSummary(userGoal, course) {
    // 检查是否配置了Gemini API
    if (window.geminiAPI && window.geminiAPI.isConfigured) {
        try {
            const prompt = `
你是一个课程推荐助手，请根据以下信息生成一句简短、个性化的课程推荐语：
- 用户目标：${userGoal}
- 课程名称：${course.course_name}
- 课程描述：${course.description_clean}
- 课程关键词：${course.keywords}

要求：
1. 语气亲切，像对朋友说话，不超过2句话
2. 突出课程与用户目标的关联
3. 可以适当使用表情符号增强亲和力
            `;
            
            const response = await window.geminiAPI.generate(prompt);
            return response || generateKeywordSummary(userGoal, course);
        } catch (error) {
            console.warn('Gemini API调用失败，使用本地模板：', error);
            return generateKeywordSummary(userGoal, course);
        }
    }
    
    // 使用本地模板
    return generateKeywordSummary(userGoal, course);
}

// 生成课程详情页的详细摘要
async function generateDetailedSummary(course, userGoal = '') {
    let summary = `<strong>${course.course_name}</strong><br>`;
    
    // 添加课程基本信息
    summary += `<small class="text-gray-600">课程ID: ${course.course_id}</small><br>`;
    
    if (course.prerequisites && course.prerequisites !== 'None') {
        summary += `<small class="text-orange-600">先修要求: ${course.prerequisites}</small><br>`;
    }
    
    if (course.level) {
        summary += `<small class="text-blue-600">难度级别: ${course.level}</small><br>`;
    }
    
    if (course.industry) {
        summary += `<small class="text-green-600">适用行业: ${course.industry}</small><br>`;
    }
    
    // 个性化推荐语
    if (userGoal) {
        const personalized = await generateSummary(userGoal, course);
        summary += `<div class="mt-2 p-2 bg-blue-50 rounded text-sm">${personalized}</div>`;
    }
    
    return summary;
}

module.exports = {
    generateSummary,
    generateDetailedSummary,
    generateLocalSummary
};