// sidepanel.js - 主交互逻辑文件
import { recommend, summarize } from '../agents/index.js';
import { auditReview } from '../agents/reviewAuditAgent.js';

// 全局变量
let currentUser = {
    id: generateUserId(),
    careerGoal: '',
    resume: '',
    contributions: []
};

// 初始化函数
function initializeApp() {
    loadUserData();
    setupEventListeners();
    updateUserIdDisplay();
    console.log('AI Course Planner initialized');
}

// 生成用户ID
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// 加载用户数据
function loadUserData() {
    const saved = localStorage.getItem('coursePlannerUser');
    if (saved) {
        currentUser = { ...currentUser, ...JSON.parse(saved) };
    }
}

// 保存用户数据
function saveUserData() {
    localStorage.setItem('coursePlannerUser', JSON.stringify(currentUser));
}

// 设置事件监听器
function setupEventListeners() {
    // 输入框实时保存
    document.getElementById('careerGoal').addEventListener('input', function() {
        currentUser.careerGoal = this.value;
        saveUserData();
    });
    
    document.getElementById('resumeInput').addEventListener('input', function() {
        currentUser.resume = this.value;
        saveUserData();
    });
    
    // 搜索框回车事件
    document.getElementById('courseSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCourses();
        }
    });
    
    // 课程搜索框回车事件
    document.getElementById('reviewCourseCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitReview();
        }
    });
}

// 更新用户ID显示
function updateUserIdDisplay() {
    document.getElementById('userIdDisplay').textContent = currentUser.id;
}

// 视图切换
function changeView(viewName) {
    // 隐藏所有视图
    const views = ['homeView', 'searchView', 'profileView', 'contributionView'];
    views.forEach(view => {
        document.getElementById(view).classList.add('hidden');
    });
    
    // 显示目标视图
    document.getElementById(viewName).classList.remove('hidden');
    
    // 更新导航栏状态
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active-tab', 'text-blue-700', 'border-blue-700', 'border-b-2');
        tab.classList.add('text-gray-500');
    });
    
    // 高亮当前激活的标签
    const activeTab = document.querySelector(`[onclick="changeView('${viewName}')"]`);
    if (activeTab) {
        activeTab.classList.add('active-tab', 'text-blue-700', 'border-blue-700', 'border-b-2');
    }
    
    // 特殊处理贡献按钮
    if (viewName === 'contributionView') {
        document.getElementById('contributeButton').classList.add('hidden');
    } else {
        document.getElementById('contributeButton').classList.remove('hidden');
    }
}

// 生成推荐
async function generateRecommendations() {
    const careerGoal = document.getElementById('careerGoal').value;
    const resume = document.getElementById('resumeInput').value;
    
    if (!careerGoal && !resume) {
        showMessage('Please enter at least a career goal or resume text', 'warning');
        return;
    }
    
    showMessage('Generating personalized recommendations...', 'info');
    
    try {
        // 调用matchAgent进行推荐
        const recommendedCourses = await recommend(careerGoal + ' ' + resume);
        
        if (recommendedCourses.length === 0) {
            showMessage('No courses found matching your profile. Try adjusting your inputs.', 'warning');
            return;
        }
        
        // 显示推荐区域
        document.getElementById('recommendationSection').classList.remove('hidden');
        
        // 渲染推荐课程
        renderCourseCards(recommendedCourses);
        
        showMessage(`Found ${recommendedCourses.length} courses matching your profile!`, 'success');
        
    } catch (error) {
        console.error('Error generating recommendations:', error);
        showMessage('Error generating recommendations. Please try again.', 'error');
    }
}

// 渲染课程卡片
function renderCourseCards(courses) {
    const courseList = document.getElementById('courseList');
    courseList.innerHTML = '';
    
    courses.forEach(course => {
        const card = createCourseCard(course);
        courseList.appendChild(card);
    });
}

// 创建课程卡片
function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card bg-white rounded-xl shadow-lg border border-gray-200 p-4';
    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-bold text-gray-800">${course.course_name}</h3>
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${course.course_id}</span>
        </div>
        
        <p class="text-sm text-gray-600 mb-3 line-clamp-2">${course.description_clean || course.description || 'No description available'}</p>
        
        <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span>💼 ${course.industry || 'General'}</span>
            <span>📊 ${course.level || 'All Levels'}</span>
        </div>
        
        <div class="course-details hidden">
            <div class="border-t border-gray-200 pt-3 mt-3">
                <h4 class="font-semibold text-sm mb-2">Course Details:</h4>
                <p class="text-xs text-gray-600 mb-2"><strong>Prerequisites:</strong> ${course.prerequisites || 'None'}</p>
                <p class="text-xs text-gray-600 mb-2"><strong>Keywords:</strong> ${course.keywords || 'None'}</p>
                
                <button onclick="showReviews('${course.course_id}', '${course.course_name}')" 
                        class="w-full mt-3 p-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
                    📊 View Real Reviews
                </button>
            </div>
        </div>
        
        <button onclick="toggleCourseDetails(this)" 
                class="w-full mt-2 p-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition">
            ▼ Expand Details
        </button>
    `;
    
    return card;
}

// 切换课程详情
function toggleCourseDetails(button) {
    const card = button.closest('.course-card');
    const details = card.querySelector('.course-details');
    const isExpanded = !details.classList.contains('hidden');
    
    if (isExpanded) {
        details.classList.add('hidden');
        button.textContent = '▼ Expand Details';
        card.classList.remove('expanded');
    } else {
        details.classList.remove('hidden');
        button.textContent = '▲ Collapse Details';
        card.classList.add('expanded');
    }
}

// 显示评价弹窗
async function showReviews(courseId, courseName) {
    try {
        // 获取课程数据
        const response = await fetch('../courses.json');
        const coursesData = await response.json();
        const course = coursesData.find(c => c.course_id === courseId);
        
        if (!course) {
            showMessage('Course not found in database', 'error');
            return;
        }
        
        // 设置模态框标题
        document.getElementById('modalCourseTitle').textContent = `${courseName} (${courseId}) - Reviews`;
        
        // 渲染评价内容
        const reviewContent = document.getElementById('reviewContent');
        reviewContent.innerHTML = renderReviews(course);
        
        // 显示模态框
        document.getElementById('reviewModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        showMessage('Error loading reviews', 'error');
    }
}

// 渲染评价
function renderReviews(course) {
    // 这里可以扩展为从外部API获取真实评价数据
    // 目前使用示例数据
    const sampleReviews = [
        {
            rating: 4.5,
            workload: "15-20 hours/week",
            comment: "Excellent course with practical projects. Professor is very knowledgeable.",
            helpful: 12
        },
        {
            rating: 3.5,
            workload: "20+ hours/week",
            comment: "Challenging but rewarding. Good for career preparation.",
            helpful: 8
        }
    ];
    
    return sampleReviews.map(review => `
        <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center">
                    <span class="text-yellow-500 font-bold">${'★'.repeat(Math.floor(review.rating))}${review.rating % 1 ? '½' : ''}</span>
                    <span class="text-sm text-gray-600 ml-2">${review.rating}/5</span>
                </div>
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">${review.workload}</span>
            </div>
            <p class="text-sm text-gray-700 mb-2">${review.comment}</p>
            <div class="flex justify-between items-center text-xs text-gray-500">
                <span>👍 ${review.helpful} found helpful</span>
                <span>Anonymous</span>
            </div>
        </div>
    `).join('');
}

// 关闭评价弹窗
function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
}

// 搜索课程
async function searchCourses() {
    const searchTerm = document.getElementById('courseSearch').value.trim();
    
    if (!searchTerm) {
        showMessage('Please enter a course code to search', 'warning');
        return;
    }
    
    showMessage('Searching for course...', 'info');
    
    try {
        const response = await fetch('../courses.json');
        const coursesData = await response.json();
        
        const results = coursesData.filter(course => 
            course.course_id.includes(searchTerm) || 
            course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        renderSearchResults(results);
        
        if (results.length === 0) {
            showMessage('No courses found matching your search', 'warning');
        } else {
            showMessage(`Found ${results.length} courses matching "${searchTerm}"`, 'success');
        }
        
    } catch (error) {
        console.error('Error searching courses:', error);
        showMessage('Error searching courses', 'error');
    }
}

// 渲染搜索结果
function renderSearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="p-4 bg-white rounded-xl shadow-lg">
                <p class="text-gray-600 text-center">No courses found. Try a different search term.</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = results.map(course => `
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-bold text-gray-800">${course.course_name}</h3>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${course.course_id}</span>
            </div>
            
            <p class="text-sm text-gray-600 mb-3">${course.description_clean || course.description || 'No description available'}</p>
            
            <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>💼 ${course.industry || 'General'}</span>
                <span>📊 ${course.level || 'All Levels'}</span>
            </div>
            
            <button onclick="showReviews('${course.course_id}', '${course.course_name}')" 
                    class="w-full p-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition">
                📊 View All Reviews
            </button>
        </div>
    `).join('');
}

// 提交评价
async function submitReview() {
    const courseCode = document.getElementById('reviewCourseCode').value.trim();
    const workload = document.getElementById('workload').value;
    const interestRating = document.getElementById('interestRating').value;
    const utilityRating = document.getElementById('utilityRating').value;
    const overallRating = document.getElementById('overallRating').value;
    const reviewText = document.getElementById('inputReviewText').value.trim();
    
    if (!courseCode) {
        showMessage('Course code is required', 'warning');
        return;
    }
    
    if (!reviewText) {
        showMessage('Please provide some review text', 'warning');
        return;
    }
    
    try {
        // 审核评价
        const auditResult = await auditReview(reviewText, courseCode);
        
        if (!auditResult.valid) {
            showMessage(auditResult.message, 'error');
            return;
        }
        
        // 这里应该调用sheetAPI提交数据
        // await submitReviewToSheet({
        //     courseCode,
        //     workload,
        //     interestRating,
        //     utilityRating,
        //     overallRating,
        //     reviewText
        // });
        
        // 临时存储用户贡献
        currentUser.contributions.push({
            courseCode,
            timestamp: new Date().toISOString(),
            reviewText
        });
        saveUserData();
        
        // 清空表单
        document.getElementById('reviewCourseCode').value = '';
        document.getElementById('workload').value = '';
        document.getElementById('interestRating').value = '';
        document.getElementById('utilityRating').value = '';
        document.getElementById('overallRating').value = '';
        document.getElementById('inputReviewText').value = '';
        
        showMessage(auditResult.message, 'success');
        
        // 返回主页
        setTimeout(() => changeView('homeView'), 2000);
        
    } catch (error) {
        console.error('Error submitting review:', error);
        showMessage('Error submitting review. Please try again.', 'error');
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.className = `p-3 mt-4 rounded-lg text-sm text-center `;
    
    switch (type) {
        case 'success':
            messageBox.className += 'bg-green-100 border border-green-300 text-green-800';
            break;
        case 'warning':
            messageBox.className += 'bg-yellow-100 border border-yellow-300 text-yellow-800';
            break;
        case 'error':
            messageBox.className += 'bg-red-100 border border-red-300 text-red-800';
            break;
        default:
            messageBox.className += 'bg-blue-100 border border-blue-300 text-blue-800';
    }
    
    messageBox.textContent = message;
    messageBox.classList.remove('hidden');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeApp);

// 导出函数供HTML使用
window.changeView = changeView;
window.generateRecommendations = generateRecommendations;
window.toggleCourseDetails = toggleCourseDetails;
window.showReviews = showReviews;
window.closeReviewModal = closeReviewModal;
window.searchCourses = searchCourses;
window.submitReview = submitReview;