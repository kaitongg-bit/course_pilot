// 分页切换函数
function changeView(viewId) {
    document.querySelectorAll('.view-content').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById(viewId)?.classList.remove('hidden');
}

// 事件绑定函数
function bindEvents() {
    const generateBtn = document.getElementById('generateBtn');
    console.log('[Debug A] 生成按钮元素:', generateBtn); // 检查按钮是否存在
    generateBtn?.addEventListener('click', () => {
        console.log('[Debug B] 按钮点击事件已触发'); // 检查点击是否触发
        generateRecommendations();
    });

    // 其他事件绑定（如贡献按钮和导航栏按钮）
    document.getElementById('contributeButton')?.addEventListener('click', () => {
        changeView('contributionView');
    });

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetView = tab.getAttribute('onclick').match(/changeView\('(\w+)'\)/)[1];
            changeView(targetView);
        });
    });
}

// 计算匹配分数（增强版）
function calculateMatchScore(course, goal, skillsList) {
    let score = 0;
    const goalLower = goal.toLowerCase();
    const goalWords = goalLower.split(/\s+/).filter(word => word.length > 2);
    
    // 分别检查每个字段的匹配程度
    const fields = [
        { text: course.industry?.toLowerCase() || '', weight: 1.5, name: 'industry' },
        { text: course.keywords?.toString().toLowerCase() || '', weight: 1.2, name: 'keywords' },
        { text: course.description_clean?.toLowerCase() || '', weight: 1.0, name: 'description' },
        { text: course.course_name?.toLowerCase() || '', weight: 1.0, name: 'course_name' }
    ];

    // 为每个字段计算匹配分数
    fields.forEach(field => {
        if (!field.text) return;
        
        // 职业目标关键词匹配
        goalWords.forEach(word => {
            if (field.text.includes(word)) {
                score += 0.5 * field.weight; // 提高基础加分
            }
        });

        // 技能匹配加分
        skillsList.forEach(skill => {
            if (skill.length > 2 && field.text.includes(skill)) {
                score += 0.4 * field.weight; // 提高技能匹配加分
            }
        });

        // 字段级别完整匹配
        if (field.text.includes(goalLower)) {
            score += 1.0 * field.weight; // 完整匹配大幅加分
        }
    });

    // 特殊匹配情况加分
    // 行业完全匹配
    if (course.industry?.toLowerCase().includes(goalLower)) {
        score += 2.0;
    }
    
    // 课程名称包含目标职业
    if (course.course_name?.toLowerCase().includes(goalLower)) {
        score += 1.5;
    }
    
    // 技能数量匹配加分
    const matchedSkills = skillsList.filter(skill => 
        skill.length > 2 && 
        (course.description_clean?.toLowerCase().includes(skill) ||
         course.keywords?.toString().toLowerCase().includes(skill))
    ).length;
    
    if (matchedSkills > 0) {
        score += Math.min(matchedSkills * 0.8, 3.0); // 技能匹配数量加分
    }

    // 应用非线性增长，确保优秀匹配得到高分
    let finalScore = score;
    if (score > 3) {
        finalScore = 3 + (score - 3) * 0.5; // 高分区增长放缓
    }
    
    // 确保分数在 0-5 范围内，并保留一位小数
    return Math.min(Math.max(finalScore, 0), 5).toFixed(1);
}

// 根据匹配分数计算星级
function getStarRating(score) {
    const stars = Math.round(parseFloat(score));
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
}

// 课程详情弹窗函数（占位）
function showCourseDetails(courseId) {
    console.log('查看课程详情:', courseId);
    // TODO: 实现弹窗逻辑
    alert('课程详情功能开发中... 课程ID: ' + courseId);
}

// 添加事件委托处理按钮点击
function setupEventDelegation() {
    const courseList = document.getElementById('courseList');
    if (courseList) {
        courseList.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn')) {
                const courseId = e.target.dataset.courseId;
                showCourseDetails(courseId);
            }
        });
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    setupEventDelegation();
});

async function generateRecommendations() {
    console.log('[Debug] 函数开始执行');
    try {
        // 获取输入
        const careerGoal = document.getElementById('careerGoal').value;
        const resumeText = document.getElementById('resumeInput').value;

        // 加载数据
        const response = await fetch('../courses.json');
        const courses = await response.json();
        console.log('[Debug 5] 课程数据加载成功，总数:', courses.length);

        // 创建技能列表（在函数作用域内）
        const skillsList = resumeText.toLowerCase().split(',').map(s => s.trim());
        console.log('[Debug] 当前技能列表:', skillsList);

        // 筛选课程
        const filteredCourses = courses.filter(course => {
            const goal = careerGoal.toLowerCase();

            // 匹配逻辑
            const industryMatch = course.industry?.toLowerCase().includes(goal) || false;
            
            let keywordsMatch = false;
            if (Array.isArray(course.keywords)) {
                keywordsMatch = course.keywords.some(kw => 
                    kw.toLowerCase().includes(goal) ||
                    skillsList.some(skill => kw.toLowerCase().includes(skill))
                );
            } else if (typeof course.keywords === 'string') {
                keywordsMatch = 
                    course.keywords.toLowerCase().includes(goal) ||
                    skillsList.some(skill => course.keywords.toLowerCase().includes(skill));
            }

            const descriptionMatch = 
                course.description_clean?.toLowerCase().includes(goal) || 
                skillsList.some(skill => course.description_clean?.toLowerCase().includes(skill));

            return industryMatch || keywordsMatch || descriptionMatch;
        });

        // 更新UI - 按照MVP设计生成课程卡片
        const courseList = document.getElementById('courseList');
        if (filteredCourses.length > 0) {
            // 为每个课程计算真实匹配分数
            const scoredCourses = filteredCourses.map(course => {
                const matchScore = calculateMatchScore(course, careerGoal, skillsList);
                return { ...course, matchScore };
            });
            
            // 按匹配分数降序排序
            scoredCourses.sort((a, b) => b.matchScore - a.matchScore);
            
            courseList.innerHTML = scoredCourses.map(course => `
                <div class="course-card bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
                    <!-- 课程标题和编号 -->
                    <h3 class="font-bold text-lg text-blue-700 mb-2">${course.course_id}: ${course.course_name}</h3>
                    
                    <!-- 匹配分数和标签 -->
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            ${getStarRating(course.matchScore)} 匹配分数: ${course.matchScore}/5
                        </span>
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            📅 工作量: 15h/week
                        </span>
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            🏷️ ${course.industry}
                        </span>
                    </div>
                    
                    <!-- 风险提示和职业ROI -->
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            ⚠️ 风险提示: ${course.prerequisites ? '需先修课程' : '基础难度'}
                        </span>
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            📌 职业ROI: 高 (适合${careerGoal})
                        </span>
                    </div>
                    
                    <!-- 个性化摘要 -->
                    <div class="bg-gray-50 rounded p-3 mb-3">
                        <p class="text-sm text-gray-700">
                            <span class="font-medium">🔍 摘要:</span> 
                            ${course.description_clean.substring(0, 120)}...
                        </p>
                    </div>
                    
                    <!-- 交互按钮 -->
                    <div class="flex gap-2">
                        <button class="view-details-btn flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200"
                                data-course-id="${course.course_id}">
                            查看详情与评价
                        </button>
                    </div>
                </div>
            `).join('');
            document.getElementById('recommendationSection').classList.remove('hidden');
        } else {
            console.log('[Debug] 无匹配课程');
        }
    } catch (error) {
        console.error('[Debug 14] 发生错误:', error);
    }
}
