// LLM配置管理器
class LLMConfigManager {
    constructor() {
        this.defaultConfig = {
            provider: 'gemini',
            apiKey: '',
            model: 'gemini-2.5-flash',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
        };
        this.config = { ...this.defaultConfig };
    }
    
    // 加载配置
    async loadConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['llmConfig'], (result) => {
                if (result.llmConfig) {
                    this.config = { ...this.defaultConfig, ...result.llmConfig };
                }
                resolve(this.config);
            });
        });
    }
    
    // 保存配置
    async saveConfig(configData) {
        this.config = { ...this.config, ...configData };
        
        return new Promise((resolve) => {
            chrome.storage.local.set({ llmConfig: this.config }, () => {
                resolve(this.config);
            });
        });
    }
    
    // 获取当前配置
    getConfig() {
        return { ...this.config };
    }
    
    // 检查配置是否有效
    isValid() {
        return this.config.apiKey && this.config.apiKey.trim().length > 0;
    }
    
    // 调用LLM API
    async callLLM(prompt, systemPrompt = '') {
        if (!this.isValid()) {
            throw new Error('LLM配置无效，请先在设置中配置API密钥');
        }
        
        try {
            const response = await fetch(`${this.config.endpoint}/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt ? `${systemPrompt}\n\n用户输入: ${prompt}` : prompt
                        }]
                    }]
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`LLM API错误: ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('LLM调用失败:', error);
            throw new Error(`LLM调用失败: ${error.message}`);
        }
    }
    
    // 支持OpenAI格式
    async callOpenAI(prompt, systemPrompt = '') {
        if (!this.isValid()) {
            throw new Error('LLM配置无效，请先在设置中配置API密钥');
        }
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 500
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API错误: ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI调用失败:', error);
            throw new Error(`OpenAI调用失败: ${error.message}`);
        }
    }
}

// 创建全局实例
const llmConfigManager = new LLMConfigManager();

// 导出函数
export async function getLLMConfig() {
    return await llmConfigManager.loadConfig();
}

export async function saveLLMConfig(config) {
    return await llmConfigManager.saveConfig(config);
}

export function isLLMConfigured() {
    return llmConfigManager.isValid();
}

export async function generateText(prompt, systemPrompt = '', provider = 'gemini') {
    await llmConfigManager.loadConfig();
    
    if (provider === 'openai') {
        return await llmConfigManager.callOpenAI(prompt, systemPrompt);
    }
    
    return await llmConfigManager.callLLM(prompt, systemPrompt);
}

export default llmConfigManager;
