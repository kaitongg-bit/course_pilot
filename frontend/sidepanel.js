function changeView(viewId) {
    document.querySelectorAll('.view-content').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById(viewId)?.classList.remove('hidden');
}

function bindEvents() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn?.addEventListener('click', generateRecommendations);
    document.getElementById('contributeButton')?.addEventListener('click', () => {
        changeView('contributionView');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const idBase = tab.getAttribute('id')?.replace('tab-', '');
            const targetView = idBase ? (idBase + 'View') : '';
            if (targetView) changeView(targetView);
        });
    });
}

function getStarRatingFromMatchPct(matching_percentage) {
    const stars = Math.max(1, Math.round(matching_percentage / 20));
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
}

async function toggleSummary(courseObj, button) {
    const summaryDiv = document.getElementById(`summary-${courseObj.course_id}`);
    if (!summaryDiv) return;
    const userProfile = {
        career_goals: document.getElementById('careerGoal').value,
        skills: document.getElementById('skillsInput').value.split(/[，,、\s]+/).filter(t => t)
    };
    if (summaryDiv.innerHTML === '') {
        button.textContent = 'Generating...';
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
            button.textContent = 'View less';
        } catch (error) {
            summaryDiv.innerHTML = `<p class="text-red-500">生成失败: ${error.message}</p>`;
            button.textContent = '重试';
        } finally {
            button.disabled = false;
        }
    }
    summaryDiv.classList.toggle('hidden');
    button.textContent = summaryDiv.classList.contains('hidden') ? 'View more' : 'View less';
}

function showRealReviews(courseObj) {
    const modal = document.getElementById('reviewModal');
    const modalTitle = document.getElementById('modalCourseTitle');
    const reviewContent = document.getElementById('reviewContent');
    const sampleReviews = [
        "The instructor is highly professional, with numerous real-world case studies, delivering far more than expected!",
        "Suitable for beginners and intermediate learners, with assignments of moderate difficulty and prompt feedback from teaching assistants.",
        "Course content is closely aligned with industry needs, enabling immediate application to real-world projects upon completion."
    ];
    modalTitle.textContent = `Course reviews - ${courseObj.course_name}`;
    reviewContent.innerHTML = sampleReviews.map(r =>
        `<div class="p-3 bg-gray-100 rounded text-gray-800">${r}</div>`
    ).join('');
    modal.style.display = 'flex';
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
}

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
            <div class="grid gap-4">
                ${courses.map((course, idx) => `
                    <div class="course-card bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                        <h3 class="font-bold text-lg text-blue-700 mb-2">${course.course_id}: ${course.course_name}</h3>
                        <div class="flex flex-wrap gap-2 mb-3">
                            <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                ${getStarRatingFromMatchPct(course.matching_percentage || 0)}
                                matching_percentage ${course.matching_percentage || '--'}%
                            </span>
                        </div>
                        <div id="summary-${course.course_id}" class="hidden mt-3 p-3 bg-gray-50 rounded"></div>
                        <div class="flex gap-2 mt-3">
                            <button
                                class="toggle-summary-btn flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"
                                data-course-index="${idx}">
                                View more
                            </button>
                            <button
                                class="view-reviews-btn flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-3 rounded text-sm"
                                data-course-index="${idx}">
                                Real Reviews
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        document.getElementById('recommendationSection').classList.remove('hidden');
        // 推荐语按钮
        document.querySelectorAll('.toggle-summary-btn').forEach((btn, idx) => {
            btn.addEventListener('click', function () {
                toggleSummary(courses[idx], btn);
            });
        });
        // 查看评价按钮
        document.querySelectorAll('.view-reviews-btn').forEach((btn, idx) => {
            btn.addEventListener('click', function () {
                showRealReviews(courses[idx]);
            });
        });
        // 关闭评价弹窗
        const closeBtn = document.getElementById('closeReviewBtn');
        if (closeBtn) {
            closeBtn.onclick = closeReviewModal;
        }
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

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
});
