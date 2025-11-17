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
    generateBtn?.addEventListener('click', generateRecommendations);

    document.getElementById('contributeButton')?.addEventListener('click', () => {
        changeView('contributionView');
    });

    // 支持底部和顶部导航栏按钮
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // 如果有 onclick，自动匹配目标视图
            const targetView = tab.getAttribute('id')?.replace('tab-', '') + 'View';
            if (targetView) changeView(targetView);
        });
    });
}

// 根据匹配分数计算星级
function getStarRatingFromMatchPct(matching_percentage) {
    const stars = Math.max(1, Math.round(matching_percentage / 20));
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
}

// 切换推荐语显示/隐藏，传完整课程对象
async function toggleSummary(courseObj, button) {
    console.log('传给后端的 course 对象：', courseObj);
    const summaryDiv = document.getElementById(`summary-${courseObj.course_id}`);
    if (!summaryDiv) {
        console.error(`错误: 未找到推荐语容器 #summary-${courseObj.course_id}`);
        return;
    }
    const userProfile = {
        career_goals: document.getElementById('careerGoal').value,
        skills: document.getElementById('skillsInput').value.split(/[，,、\s]+/).filter(t => t)
    };
    if (summaryDiv.innerHTML === '') {
        button.textContent = '生成中...';
        button.disabled = true;

        try {
            const response = await fetch('http://localhost:3002/api/courses/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: courseObj,
                    user_profile: userProfile
                })
            });
            const { summary } = await response.json();
            summaryDiv.innerHTML = `<p class="text-gray-700">${summary}</p>`;
            button.textContent = '收起推荐语';
        } catch (error) {
            summaryDiv.innerHTML = `<p class="text-red-500">生成失败: ${error.message}</p>`;
            button.textContent = '重试';
        } finally {
            button.disabled = false;
        }
    }
    summaryDiv.classList.toggle('hidden');
    button.textContent = summaryDiv.classList.contains('hidden')
        ? '展开推荐语'
        : '收起推荐语';
}

// 生成推荐课程卡片并渲染，能保证所有字段都传递
async function generateRecommendations() {
    try {
        const careerGoal = document.getElementById('careerGoal').value;
        const skillsText = document.getElementById('skillsInput').value;
        const resumeText = document.getElementById('resumeInput').value;

        if (!careerGoal.trim()) {
            alert('请输入职业目标');
            return;
        }

        const courseList = document.getElementById('courseList');
        courseList.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p class="mt-2 text-gray-600">AI正在分析您的职业目标并推荐课程...</p>
            </div>
        `;

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

        const courses = result.results;
        courseList.innerHTML = `
            <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 class="font-bold text-lg text-blue-800 mb-2">🤖 AI分析报告</h3>
                <p class="text-gray-700">${result.analysis || '暂无分析报告'}</p>
            </div>
            ${courses.map((course, idx) => `
                <div class="course-card bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-blue-500">
                    <h3 class="font-bold text-lg text-blue-700 mb-2">${course.course_id}: ${course.course_name}</h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            ${getStarRatingFromMatchPct(course.matching_percentage || 0)}
                            匹配度 ${course.matching_percentage || '--'}%
                        </span>
                    </div>
                    <div id="summary-${course.course_id}" class="hidden mt-3 p-3 bg-gray-50 rounded"></div>
                    <div class="flex gap-2 mt-3">
                        <button 
                            class="toggle-summary-btn flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"
                            data-course-index="${idx}"
                        >
                            展开推荐语
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
        document.getElementById('recommendationSection').classList.remove('hidden');
        // 绑定推荐语按钮，用下标精准传对象
        document.querySelectorAll('.toggle-summary-btn').forEach((btn, idx) => {
            btn.addEventListener('click', function () {
                toggleSummary(courses[idx], btn);
            });
        });
    } catch (error) {
        const courseList = document.getElementById('courseList');
        courseList.innerHTML = `
            <div class="text-center py-8 text-red-600">
                <p>❌ 请求失败: ${error.message}</p>
                <button class="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded" 
                        id="retryBtn">
                    重试
                </button>
            </div>
        `;
        document.getElementById('retryBtn')?.addEventListener('click', generateRecommendations);
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
});
