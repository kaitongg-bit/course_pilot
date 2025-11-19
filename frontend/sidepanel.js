const API_URL = "https://script.google.com/macros/s/AKfycbzNPXIkV94kFCUk7hAxsg0xlva3QgrvHdqjuLNwgu48ILWvJmt72wiv5YXSPb7QcUIPvw/exec";

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

    // 绑定提交课程评价
    const submitBtn = document.getElementById('submitReviewBtn');
    submitBtn?.addEventListener('click', submitCourseReview);

    // 绑定关闭弹窗
    const closeBtn = document.getElementById('closeReviewBtn');
    if (closeBtn) {
        closeBtn.onclick = closeReviewModal;
    }
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

// 自动查找课程名（根据course_id从Google Sheet查名字）
async function autofillCourseName(courseId) {
  if (!courseId) return "";
  try {
    const url = API_URL + `?action=search&course_id=${encodeURIComponent(courseId)}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const reviews = data.data || [];
    if (reviews.length > 0 && reviews[0].course_name) {
      return reviews[0].course_name;
    }
  } catch (e) {
    return "";
  }
  return "";
}

// 评价贡献（提交表单）
async function submitCourseReview() {
  const courseNum = document.getElementById('reviewCourseCode').value;
  // 你可以把下面这些采集字段根据你的表单input id自由改名
  const workload = document.getElementById('reviewWorkload')?.value || '';
  const workflow = document.getElementById('reviewWorkflow')?.value || '';
  const interest = document.getElementById('reviewInterest')?.value || '';
  const utility = document.getElementById('reviewUtility')?.value || '';
  const overall = document.getElementById('reviewOverall').value;
  const comment = document.getElementById('inputReviewText').value;
  const emailHash = localStorage.getItem('emailHash') || "";
  const userId = emailHash || "Anonymous";

  // 前端表单校验
  if (!courseNum || !overall || !comment) {
    alert("Course number, overall rating, and comment are required!");
    return;
  }

  // 自动查找课程名（数据库里的名字，不用用户手填）
  const courseName = await autofillCourseName(courseNum);

  // 组装所有要提交的字段
  const postData = {
      action: "create",
      UserID: userId,                // 用户唯一ID(邮箱hash)
      course_id: courseNum,
      course_name: courseName,       // 自动补全课程名
      Workload: workload,
      Workflow: workflow,
      InterestRating: interest,
      UtilityRating: utility,
      OverallRating: overall,
      Comment: comment,
      EmailHash: emailHash           // 用于点赞等功能的hash
      // 其它字段如有可以补充
  };

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(postData)
    });
    const result = await resp.json();
    if(result.success){
      alert("Review submitted!");
      changeView('homeView');
      // 如有清空表单等操作可以在这里补充
      // loadUserStatsAndReviews(userId); // 也可提交后刷新个人页面
    }else{
      alert("Submit failed: " + (result.error || "Unknown Error"));
    }
  } catch (e){
    alert("Network or API error: " + e.message);
  }
}


// 展示弹窗评论（仅显示comment，点击展开详情）
async function showRealReviews(courseObj) {
  const modal = document.getElementById('reviewModal');
  const modalTitle = document.getElementById('modalCourseTitle');
  const reviewContent = document.getElementById('reviewContent');
  modalTitle.textContent = `Course Reviews`;

  try {
    const searchUrl = API_URL + `?action=search&course_id=${encodeURIComponent(courseObj.course_id)}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    const reviews = data.data || [];
    if (reviews.length === 0) {
      reviewContent.innerHTML = "<div class='text-gray-500'>No reviews yet.</div>";
    } else {
      reviewContent.innerHTML = reviews.map((r, i) => `
        <div class="review-card bg-white rounded-lg shadow p-4 mb-2 border border-gray-200 transition hover:shadow-lg">
          <div class="text-gray-800 text-base leading-relaxed mb-2">${r.Comment || ""}</div>
          <div class="flex items-center gap-3 mt-2">
            <button
                class="like-btn py-1 px-2 rounded bg-gray-200 hover:bg-green-100 text-green-600 text-sm flex items-center"
                data-review-id="${r.RowID}">
                👍 <span class="ml-1 like-count">${r.LikeCount || 0}</span>
            </button>
            <button
                class="toggle-detail-btn text-xs text-blue-600 underline mb-1"
                data-idx="${i}">
                Show Details
            </button>
          </div>
          <div class="extra-detail hidden text-gray-600 text-sm mt-2">
            <div>Course: ${r.course_name || r.course_id || ''}</div>
            <div>Workload: ${r.Workload || ""}</div>
            <div>Workflow: ${r.Workflow || ""}</div>
            <div>Interest: ${r.InterestRating || ""} | Utility: ${r.UtilityRating || ""} | Overall: ${r.OverallRating || ""}</div>
          </div>
        </div>
      `).join('');
        
      // 绑定展开/收起事件（推荐addEventListener更安全）
      setTimeout(() => {
        document.querySelectorAll('.toggle-detail-btn').forEach(btn => {
          btn.addEventListener('click', function () {
            const thisCard = btn.closest('.review-card');
            const detailSection = thisCard.querySelector('.extra-detail');
            if (detailSection.classList.contains('hidden')) {
              detailSection.classList.remove('hidden');
              btn.textContent = 'Hide Details';
            } else {
              detailSection.classList.add('hidden');
              btn.textContent = 'Show Details';
            }
          });
        });
      }, 100); // 稍微加长一点确保DOM已插入
    }
  } catch (e) {
    reviewContent.innerHTML = `<div class="text-red-500">Error loading reviews: ${e.message}</div>`;
  }
  modal.style.display = 'flex';
}


async function handleLikeClick(event) {
    const btn = event.currentTarget;
    const rowId = btn.getAttribute('data-review-id');
    const emailHash = ""; // 如需每用户唯一点赞，生成emailHash
    if (!rowId) return;
    try{
        const postData = {
            action: "toggle_like",
            RowID: rowId,
            EmailHash: emailHash
        };
        const resp = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(postData)
        });
        const result = await resp.json();
        if(result.success){
            btn.querySelector('.like-count').textContent = result.new_count;
            btn.classList.toggle('text-green-700', result.is_liked);
        }else{
            alert("Like failed!");
        }
    }catch(e){
        alert("Network error: " + e.message);
    }
}

function bindLikeButtons() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.removeEventListener('click', handleLikeClick); // 保证不重复绑定
        btn.addEventListener('click', handleLikeClick);
    });
}

function closeReviewModal() {
  document.getElementById('reviewModal').style.display = 'none';
}

// 推荐课程相关逻辑不动
async function generateRecommendations() {
    try {
        const careerGoal = document.getElementById('careerGoal').value;
        const skillsText = document.getElementById('skillsInput').value;
        const resumeText = document.getElementById('resumeInput').value;
        if (!careerGoal.trim()) {
            alert('enter your target career goal');
            return;
        }
        const courseList = document.getElementById('courseList');
        courseList.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p class="mt-2 text-gray-600">AI is generating recommendations...</p>
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

document.getElementById('searchBtn').addEventListener('click', async function () {
  const courseInput = document.getElementById('courseSearch');
  const courseNum = courseInput.value.trim();
  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = ""; // 清空之前结果

  if (!courseNum) {
    resultsDiv.innerHTML = `<div class="bg-yellow-50 text-yellow-800 p-3 rounded">Please input a course number (e.g., 15-445)!</div>`;
    return;
  }

  try {
    const url = API_URL + `?action=search&course_id=${encodeURIComponent(courseNum)}`;
    const response = await fetch(url);
    const data = await response.json();
    const reviews = data.data || [];
    if (reviews.length === 0) {
      resultsDiv.innerHTML = `<div class="text-gray-500 py-4">No reviews found for <b>${courseNum}</b>.</div>`;
    } else {
      resultsDiv.innerHTML = reviews.map((r, i) => `
        <div class="review-card bg-white rounded-lg shadow p-4 mb-2 border border-gray-200 transition hover:shadow-lg">
          <div class="text-gray-800 text-base leading-relaxed mb-2">${r.Comment || ""}</div>
          <div class="flex items-center gap-3 mt-2">
            <button
              class="like-btn py-1 px-2 rounded bg-gray-200 hover:bg-green-100 text-green-600 text-sm flex items-center"
              data-review-id="${r.RowID}">
              👍 <span class="ml-1 like-count">${r.LikeCount || 0}</span>
            </button>
            <button
              class="toggle-detail-btn text-xs text-blue-600 underline"
              data-idx="${i}">
              Show Details
            </button>
          </div>
          <div class="extra-detail hidden text-gray-600 text-sm mt-2">
            <div>Course: ${r.course_name || r.course_id || ''}</div>
            <div>Workload: ${r.Workload || ""}</div>
            <div>Workflow: ${r.Workflow || ""}</div>
            <div>Interest: ${r.InterestRating || ""} | Utility: ${r.UtilityRating || ""} | Overall: ${r.OverallRating || ""}</div>
          </div>
        </div>
      `).join('');

      // 绑定展开/收起和点赞事件
      setTimeout(() => {
        document.querySelectorAll('#searchResults .toggle-detail-btn').forEach(btn => {
          btn.addEventListener('click', function () {
            const thisCard = btn.closest('.review-card');
            const detailSection = thisCard.querySelector('.extra-detail');
            if (detailSection.classList.contains('hidden')) {
              detailSection.classList.remove('hidden');
              btn.textContent = 'Hide Details';
            } else {
              detailSection.classList.add('hidden');
              btn.textContent = 'Show Details';
            }
          });
        });

        document.querySelectorAll('#searchResults .like-btn').forEach(btn => {
          btn.addEventListener('click', handleLikeClick);
        });
      }, 100);
    }
  } catch (e) {
    resultsDiv.innerHTML = `<div class="text-red-500 py-4">Error loading reviews: ${e.message}</div>`;
  }
});


// 简单Base64 hash
function hashEmail(email) {
  return btoa(email.trim().toLowerCase());
}

function showAvatar(email) {
  const avatarDiv = document.getElementById('profileAvatar');
  avatarDiv.textContent = email && email[0] ? email[0].toUpperCase() : "?";
}

function updateUserStatus() {
  const email = localStorage.getItem('email');
  const hash = localStorage.getItem('emailHash');
  document.getElementById('userIdDisplay').textContent = hash || "Not logged in";
  if (email && hash) {
    document.getElementById('userEmailSpan').textContent = email;
    document.getElementById('userIdSpan').textContent = hash;
    showAvatar(email);
    document.getElementById('loginBlock').style.display = 'none';
    document.getElementById('userInfoBlock').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    loadUserStatsAndReviews(hash);
  } else {
    document.getElementById('loginBlock').style.display = '';
    document.getElementById('userInfoBlock').style.display = 'none';
    document.getElementById('myReviewsSection').innerHTML = "";
    document.getElementById('totalReviews').textContent = "0";
    document.getElementById('totalLikes').textContent = "0";
    document.getElementById('profileBrief').innerHTML = `<div class="text-gray-500 text-sm mb-2">Sign in above to see your stats.</div>`;
  }
}

document.getElementById('saveEmailBtn').onclick = () => {
  const email = document.getElementById('userEmailInput').value.trim();
  if (email) {
    const hash = hashEmail(email);
    localStorage.setItem('email', email);
    localStorage.setItem('emailHash', hash);
    updateUserStatus();
    alert("Sign in successful!");
  }
};

document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem('email');
  localStorage.removeItem('emailHash');
  updateUserStatus();
};

async function loadUserStatsAndReviews(emailHash) {
  try {
    const url = API_URL + `?action=get_profile&email_hash=${encodeURIComponent(emailHash)}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const reviews = data.reviews || [];
    const totalReviews = reviews.length;
    const totalLikes = data.total_likes || 0;
    document.getElementById('totalReviews').textContent = totalReviews;
    document.getElementById('totalLikes').textContent = totalLikes;

    // 渲染个人评论卡片
    document.getElementById('myReviewsSection').innerHTML = reviews.map((r, i) => `
      <div class="review-card bg-white rounded-lg shadow p-4 mb-2 border border-gray-200 transition hover:shadow-lg">
        <div class="text-gray-800 text-base leading-relaxed mb-2">${r.Comment || ""}</div>
        <div class="flex items-center gap-3 mt-2">
          <span class="text-xs text-green-800 bg-green-50 rounded px-2 py-1">👍 ${r.LikeCount || 0} Likes</span>
          <button
            class="toggle-detail-btn text-xs text-blue-600 underline"
            data-idx="${i}">
            Show Details
          </button>
        </div>
        <div class="extra-detail hidden text-gray-600 text-sm mt-2">
          <div>Course: ${r.course_name || r.course_id || ''}</div>
          <div>Workload: ${r.Workload || ""}</div>
          <div>Workflow: ${r.Workflow || ""}</div>
          <div>Interest: ${r.InterestRating || ""} | Utility: ${r.UtilityRating || ""} | Overall: ${r.OverallRating || ""}</div>
        </div>
      </div>
    `).join('');

    // 展开/收起详情
    setTimeout(() => {
      document.querySelectorAll('#myReviewsSection .toggle-detail-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const thisCard = btn.closest('.review-card');
          const detailSection = thisCard.querySelector('.extra-detail');
          if (detailSection.classList.contains('hidden')) {
            detailSection.classList.remove('hidden');
            btn.textContent = 'Hide Details';
          } else {
            detailSection.classList.add('hidden');
            btn.textContent = 'Show Details';
          }
        });
      });
    }, 100);

    // 简要数据
    document.getElementById('profileBrief').innerHTML = `
      <div class="text-green-700 text-sm mb-1">Welcome, ${localStorage.getItem('email')}</div>
      <div class="text-gray-600 text-xs">Your hash: ${emailHash}</div>
    `;
  } catch (e) {
    document.getElementById('myReviewsSection').innerHTML = `<div class="text-red-500">Error loading profile: ${e.message}</div>`;
  }
}

// 页面初始化时自动刷新
document.addEventListener('DOMContentLoaded', updateUserStatus);


// 初始化所有绑定
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
});
