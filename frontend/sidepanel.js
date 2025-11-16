// 分页切换逻辑
function changeView(viewId) {
    document.querySelectorAll('.view-content').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById(viewId)?.classList.remove('hidden');
}

// 绑定底部导航栏按钮事件
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetView = tab.getAttribute('onclick').match(/changeView\('(\w+)'\)/)[1];
        changeView(targetView);
    });
});