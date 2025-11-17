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


// 根据匹配分数计算星级
function getStarRatingFromMatchPct(matching_percentage) {
    // 100分对应5星且最低1星
    const stars = Math.max(1, Math.round(matching_percentage / 20));
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
    try {
        // 获取输入
        const careerGoal = document.getElementById('careerGoal').value;
        const skillsText = document.getElementById('skillsInput').value;
        const resumeText = document.getElementById('resumeInput').value;

        if (!careerGoal.trim()) {
            alert('请输入职业目标');
            return;
        }

        // 显示加载动画
        const courseList = document.getElementById('courseList');
        courseList.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p class="mt-2 text-gray-600">AI正在分析您的职业目标并推荐课程...</p>
            </div>
        `;

        // 调用后端
        const response = await fetch('http://localhost:3002/api/courses/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resume: resumeText,
                skills: skillsText,
                career_goals: careerGoal
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.error) throw new Error(result.error);

        // 解析AI生成的推荐结果（以 recommended_courses 为例）
        const { recommended_courses, analysis } = result;

        // 渲染报告及课程列表
        courseList.innerHTML = `
            <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 class="font-bold text-lg text-blue-800 mb-2">🤖 AI分析报告</h3>
                <p class="text-gray-700">${analysis ?? ''}</p>
            </div>
            ${recommended_courses.map(course => `
                <div class="course-card bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
                    <h3 class="font-bold text-lg text-blue-700 mb-2">${course.course_id}: ${course.course_name}</h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            ${getStarRatingFromMatchPct(course.matching_percentage || 0)}
                            匹配度 ${course.matching_percentage ?? '--'}%
                        </span>
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            🏷️ ${course.industry ?? ''}
                        </span>
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            📅 工作量: ${course.workload ?? ''}
                        </span>
                    </div>
                    <div class="bg-gray-50 rounded p-3 mb-3">
                        <p class="text-sm text-gray-700">
                            <span class="font-medium">🔍 AI推荐理由:</span> ${course.reasoning ?? ''}
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <button class="view-details-btn flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200"
                                data-course-id="${course.course_id}">
                            查看详情与评价
                        </button>
                    </div>
                </div>
            `).join('')}
        `;

        // 显示推荐区块
        document.getElementById('recommendationSection').classList.remove('hidden');

    } catch (error) {
        console.error('[Debug] 发生错误:', error);
        const courseList = document.getElementById('courseList');
        courseList.innerHTML = `
            <div class="text-center py-8 text-red-600">
                <p>❌ 请求失败: ${error.message}</p>
                <p class="text-sm mt-2">请确保本地LLM代理服务器正在运行 (端口3002)</p>
                <button class="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded" id="retryBtn">
                    重试
                </button>
            </div>
        `;
        // 绑定重试
        document.getElementById('retryBtn')?.addEventListener('click', generateRecommendations);
    }
}