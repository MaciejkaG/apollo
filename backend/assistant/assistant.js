import { OpenAI } from 'openai';

export default class Assistant {
    constructor(apiKey) {
        if (!apiKey || typeof apiKey !== 'string' || apiKey === '') {
            throw new Error('Invalid API key: API key must be a non-empty string');
        }

        try {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
            
            this.validateApiKey();
        } catch (error) {
            throw new Error(`Failed to initialize OpenAI client: ${error.message}`);
        }

        this.conversations = new Map();
    }

    async validateApiKey() {
        try {
            await this.openai.models.list({ limit: 1 });
        } catch (error) {
            if (error.status === 401) {
                throw new Error('Invalid API key: Authentication failed');
            }
            throw new Error(`API key validation failed: ${error.message}`);
        }
    }

    async sendMessage(message, conversationId = null, options = {}) {
        try {
            let messages = this.conversations.get(conversationId) || [];
            messages.push({ role: 'user', content: message });

            const completion = await this.openai.chat.completions.create({
                messages: messages,
                model: options.model || 'gpt-4o-mini',
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 9999,
                presence_penalty: options.presencePenalty || 0,
                frequency_penalty: options.frequencyPenalty || 0,
                stream: options.stream || false
            });

            const assistantMessage = completion.choices[0].message;
            messages.push(assistantMessage);

            if (conversationId) {
                this.conversations.set(conversationId, messages);
            }

            return {
                message: assistantMessage.content,
                conversationId,
                usage: completion.usage,
                finishReason: completion.choices[0].finish_reason
            };

        } catch (error) {
            console.error('Assistant Error:', error);
            throw error;
        }
    }

    async streamMessage(message, onChunk, conversationId = null, options = {}) {
        try {
            let messages = this.conversations.get(conversationId) || [];
            messages.push({ role: 'user', content: message });

            const stream = await this.openai.chat.completions.create({
                messages: messages,
                model: options.model || 'gpt-4o-mini',
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 9999,
                stream: true
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullResponse += content;
                    onChunk(content);
                }
            }

            messages.push({ role: 'assistant', content: fullResponse });
            if (conversationId) {
                this.conversations.set(conversationId, messages);
            }

            return fullResponse;

        } catch (error) {
            console.error('Assistant Stream Error:', error);
            throw error;
        }
    }

    clearConversation(conversationId) {
        this.conversations.delete(conversationId);
    }

    async listModels() {
        try {
            const models = await this.openai.models.list();
            return models.data;
        } catch (error) {
            console.error('Error fetching models:', error);
            throw error;
        }
    }
}