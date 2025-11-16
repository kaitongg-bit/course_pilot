// Gemini API Service
import { getSettings } from './ollama-service.js';

// Send message to Gemini
export async function sendMessageToGemini(message, history = [], systemPrompt = null) {
    try {
        // Get settings
        const settings = await getSettings();
        
        // Check if Gemini settings are configured
        if (!settings.geminiApiKey) {
            throw new Error('Gemini API key is not configured');
        }
        
        // Prepare API URL
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel || 'gemini-2.5-flash'}:generateContent?key=${settings.geminiApiKey}`;
        console.debug('Using Gemini API URL:', apiUrl);
        
        // Prepare messages
        const messages = [];
        
        // Build conversation history
        if (history && history.length > 0) {
            history.forEach(msg => {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    messages.push({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    });
                }
            });
        }
        
        // Add current message
        messages.push({
            role: 'user',
            parts: [{ text: message }]
        });
        
        // Prepare request body
        const requestBody = {
            contents: messages,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };
        
        // Add system prompt if provided
        if (systemPrompt) {
            requestBody.systemInstruction = {
                parts: [{ text: systemPrompt }]
            };
        }
        
        console.debug('Sending request to Gemini...');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        // Check for errors
        if (!response.ok) {
            let errorMessage = `Gemini API error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMessage = `Gemini API error: ${errorData.error.message || errorData.error}`;
                }
            } catch (e) {
                console.error('Failed to parse error response:', e);
            }
            throw new Error(errorMessage);
        }
        
        console.debug('Received response from Gemini:', response.status);
        
        // Handle response
        const data = await response.json();
        console.debug('Gemini response data:', data);
        
        let content = '';
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            content = data.candidates[0].content.parts[0].text;
        } else {
            console.warn('Unexpected Gemini response format:', data);
            content = 'Received response in unexpected format. Please check console logs.';
        }
        
        return {
            streaming: false,
            fullResponse: content,
            model: settings.geminiModel || 'gemini-2.5-flash'
        };
    } catch (error) {
        console.error('Error sending message to Gemini:', error);
        throw error;
    }
}

// Test Gemini API connection
export async function testGeminiConnection(apiKey, model = 'gemini-2.5-flash') {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: 'Hello, how are you?' }]
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error?.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error testing Gemini connection:', error);
        throw error;
    }
}

// Get available Gemini models
export async function getGeminiModels(apiKey) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error?.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter for text generation models
        const textModels = data.models.filter(model => 
            model.name.includes('gemini') && 
            model.supportedGenerationMethods && 
            model.supportedGenerationMethods.includes('generateContent')
        );
        
        return textModels.map(model => ({
            id: model.name.split('/').pop(),
            name: model.displayName || model.name.split('/').pop()
        }));
    } catch (error) {
        console.error('Error fetching Gemini models:', error);
        throw error;
    }
}
