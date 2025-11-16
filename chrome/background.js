// 背景服务工作者 - 处理浏览器动作和命令 (Manifest V3)

// 安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('CMU Course Assistant extension installed');
    
    // 设置默认存储值
    chrome.storage.local.get(['settings'], (result) => {
        if (!result.settings) {
            const defaultSettings = {
                theme: 'light',
                language: 'en',
                autoTranslation: true,
                coursePreferences: {
                    difficulty: 'all',
                    department: 'all',
                    showMatchScores: true
                }
            };
            chrome.storage.local.set({ settings: defaultSettings });
        }
    });
    
    // 设置默认用户资料
    chrome.storage.local.get(['userProfile'], (result) => {
        if (!result.userProfile) {
            const defaultProfile = {
                name: 'CMU Student',
                goal: 'Learn new skills and advance my career',
                skills: ['Programming', 'Mathematics', 'Data Analysis'],
                interests: ['AI', 'Machine Learning', 'Software Development'],
                experienceLevel: 'intermediate'
            };
            chrome.storage.local.set({ userProfile: defaultProfile });
        }
    });
});

// 处理浏览器动作点击 - 打开侧边栏
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked - opening side panel');
    
    // 打开侧边栏
    chrome.sidePanel.open({ windowId: tab.windowId })
        .then(() => {
            console.log('Side panel opened successfully');
        })
        .catch((error) => {
            console.error('Failed to open side panel:', error);
            // 如果侧边栏打开失败，显示一个通知
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon-128.svg',
                title: 'CMU Course Assistant',
                message: 'Click the extension icon to open the course browser'
            });
        });
});

// 处理来自内容脚本和弹出窗口的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request.type);
    
    switch (request.type) {
        case 'GET_USER_PROFILE':
            // 获取用户资料
            chrome.storage.local.get(['userProfile'], (result) => {
                sendResponse(result.userProfile || {});
            });
            return true;
            
        case 'UPDATE_USER_PROFILE':
            // 更新用户资料
            chrome.storage.local.set({ userProfile: request.profile }, () => {
                sendResponse({ success: true });
            });
            return true;
            
        case 'OPEN_SIDEPANEL':
            // 打开侧边栏
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.sidePanel.open({ windowId: tabs[0].windowId })
                        .then(() => {
                            sendResponse({ success: true });
                        })
                        .catch((error) => {
                            sendResponse({ success: false, error: error.message });
                        });
                } else {
                    sendResponse({ success: false, error: 'No active tab found' });
                }
            });
            return true;
            
        case 'VIEW_PROFILE':
            // 查看资料（可以在这里添加导航逻辑）
            sendResponse({ success: true });
            return true;
            
        case 'REFRESH_COURSES':
            // 刷新课程（这里可以添加实际的刷新逻辑）
            console.log('Refreshing courses...');
            sendResponse({ success: true });
            return true;
            
        default:
            console.log('Unknown message type:', request.type);
            sendResponse({ success: false, error: 'Unknown message type' });
    }
});

// 简单的健康检查
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension starting up');
});

// 处理错误（防止服务工作者崩溃）
self.addEventListener('error', (event) => {
    console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});