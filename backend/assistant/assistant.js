import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        this.tools = new Map();
        this.systemMessage = {
            role: 'system',
            content: "You are Apollo, a smart and capable assistant. You aim to provide helpful, accurate, and thoughtful responses while maintaining a friendly and professional demeanor. The responses you provide will be fully spoken, so do not use formatting or data as text. Explain these yourself."
        };
        this.initializeTools();
    }

    async initializeTools() {
        try {
            const pluginsDir = path.join(__dirname, 'plugins');
            const plugins = await this.loadPlugins(pluginsDir);
            
            for (const plugin of plugins) {
                this.tools.set(plugin.name, plugin);
            }
        } catch (error) {
            console.error('Error loading tools:', error);
        }
    }

    async loadPlugins(dir) {
        const plugins = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const pluginDir = path.join(dir, entry.name);
                    const manifest = await this.loadManifest(pluginDir);
                    
                    if (manifest) {
                        const implementation = await this.loadImplementation(pluginDir);
                        if (implementation) {
                            plugins.push({
                                name: manifest.name,
                                description: manifest.description,
                                parameters: manifest.parameters,
                                execute: implementation.execute
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error reading plugins directory:', error);
        }
        return plugins;
    }

    async loadManifest(pluginDir) {
        try {
            const manifestPath = path.join(pluginDir, 'manifest.json');
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            return JSON.parse(manifestContent);
        } catch (error) {
            console.error(`Error loading manifest from ${pluginDir}:`, error);
            return null;
        }
    }

    async loadImplementation(pluginDir) {
        try {
            const implementationPath = path.join(pluginDir, 'index.js');
            const fileUrl = new URL(`file://${implementationPath}`);
            const implementation = await import(fileUrl);
            return implementation.default;
        } catch (error) {
            console.error(`Error loading implementation from ${pluginDir}:`, error);
            return null;
        }
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
            let messages = this.conversations.get(conversationId) || [this.systemMessage];
            messages.push({ role: 'user', content: message });
    
            const tools = Array.from(this.tools.values()).map(tool => ({
                type: 'function',
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                }
            }));
    
            const completion = await this.openai.chat.completions.create({
                messages: messages,
                model: options.model || 'gpt-4o-mini',
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 9999,
                presence_penalty: options.presencePenalty || 0,
                frequency_penalty: options.frequencyPenalty || 0,
                stream: options.stream || false,
                tools: tools.length > 0 ? tools : undefined,
                tool_choice: options.tool_choice || 'auto'
            });
    
            const assistantMessage = completion.choices[0].message;
    
            messages.push(assistantMessage);

            if (assistantMessage.tool_calls) {
                const toolResults = [];
                
                for (const toolCall of assistantMessage.tool_calls) {
                    if (toolCall.type === 'function') {
                        const toolName = toolCall.function.name;
                        const toolArgs = JSON.parse(toolCall.function.arguments);
                        
                        const toolToCall = this.tools.get(toolName);
                        if (toolToCall) {
                            try {
                                const toolResult = await toolToCall.execute(toolArgs);
                                toolResults.push({
                                    toolCall,
                                    result: toolResult
                                });
                            } catch (error) {
                                console.error(`Error executing tool ${toolName}:`, error);
                                toolResults.push({
                                    toolCall,
                                    error: error.message
                                });
                            }
                        }
                    }
                }

                messages.push({ role: 'tool', content: JSON.stringify(toolResults), tool_call_id: assistantMessage.tool_calls[0].id });

                const completion2 = await this.openai.chat.completions.create({
                    messages: messages,
                    model: options.model || 'gpt-4o-mini',
                    temperature: options.temperature || 0.7,
                    max_tokens: options.maxTokens || 9999,
                    presence_penalty: options.presencePenalty || 0,
                    frequency_penalty: options.frequencyPenalty || 0,
                    stream: options.stream || false,
                    tools: tools.length > 0 ? tools : undefined,
                    tool_choice: options.tool_choice || 'auto'
                });

                const assistantMessage2 = completion2.choices[0].message;

                messages.push({ role: 'assistant', content: completion2.choices[0].message.content });

                return {
                    message: assistantMessage2.content,
                    conversationId,
                    usage: completion2.usage,
                    finishReason: completion2.choices[0].finish_reason,
                    toolCalls: assistantMessage2.tool_calls
                };
            }
    
            messages.push({ role: 'assistant', content: completion.choices[0].message.content });

            if (conversationId) {
                this.conversations.set(conversationId, messages);
            }

            return {
                message: assistantMessage.content,
                conversationId,
                usage: completion.usage,
                finishReason: completion.choices[0].finish_reason,
                toolCalls: assistantMessage.tool_calls
            };
        } catch (error) {
            console.error('Assistant Error:', error);
            throw error;
        }
    }

    async streamMessage(message, onChunk, conversationId = null, options = {}) {
        try {
            let messages = this.conversations.get(conversationId) || [this.systemMessage];
            messages.push({ role: 'user', content: message });

            const tools = Array.from(this.tools.values()).map(tool => ({
                type: 'function',
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                }
            }));
            
            const streamParams = {
                messages: messages,
                model: options.model || 'gpt-4o-mini',
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 9999,
                presence_penalty: options.presencePenalty || 0,
                frequency_penalty: options.frequencyPenalty || 0,
                stream: true,
                tools: tools.length > 0 ? tools : undefined,
                tool_choice: options.tool_choice || 'auto'
            };

            const stream = await this.openai.chat.completions.create(streamParams);

            let fullResponse = '';
            let toolCalls = [];
            let currentToolCall = null;

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                const toolCallDelta = chunk.choices[0]?.delta?.tool_calls?.[0];

                if (toolCallDelta) {
                    if (!currentToolCall && toolCallDelta.index === 0) {
                        currentToolCall = {
                            id: toolCallDelta.id || '',
                            type: toolCallDelta.type || '',
                            function: {
                                name: toolCallDelta.function?.name || '',
                                arguments: toolCallDelta.function?.arguments || ''
                            }
                        };
                    } else if (currentToolCall) {
                        if (toolCallDelta.function?.name) {
                            currentToolCall.function.name += toolCallDelta.function.name;
                        }
                        if (toolCallDelta.function?.arguments) {
                            currentToolCall.function.arguments += toolCallDelta.function.arguments;
                        }
                    }

                    if (chunk.choices[0].finish_reason === 'tool_calls') {
                        toolCalls.push(currentToolCall);
                        currentToolCall = null;
                    }
                }

                if (content) {
                    fullResponse += content;
                    onChunk({ type: 'content', content });
                }
            }

            const assistantMessage = { 
                role: 'assistant', 
                content: fullResponse,
                tool_calls: toolCalls
            };
            
            messages.push(assistantMessage);

            if (toolCalls.length > 0) {
                const toolResults = [];
                
                for (const toolCall of toolCalls) {
                    if (toolCall.type === 'function') {
                        const toolName = toolCall.function.name;
                        try {
                            const toolArgs = JSON.parse(toolCall.function.arguments);
                            const toolToCall = this.tools.get(toolName);
                            
                            if (toolToCall) {
                                const toolResult = await toolToCall.execute(toolArgs);
                                toolResults.push({
                                    toolCall,
                                    result: toolResult
                                });
                                onChunk({ 
                                    type: 'tool_result', 
                                    toolName,
                                    result: toolResult 
                                });
                            }
                        } catch (error) {
                            console.error(`Error executing tool ${toolName}:`, error);
                            toolResults.push({
                                toolCall,
                                error: error.message
                            });
                            onChunk({ 
                                type: 'tool_error', 
                                toolName,
                                error: error.message 
                            });
                        }
                    }
                }

                messages.push({ 
                    role: 'tool', 
                    content: JSON.stringify(toolResults), 
                    tool_call_id: toolCalls[0].id 
                });

                const finalStream = await this.openai.chat.completions.create({
                    messages: messages,
                    model: options.model || 'gpt-4o-mini',
                    temperature: options.temperature || 0.7,
                    max_tokens: options.maxTokens || 9999,
                    presence_penalty: options.presencePenalty || 0,
                    frequency_penalty: options.frequencyPenalty || 0,
                    stream: true
                });

                let finalResponse = '';
                for await (const chunk of finalStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        finalResponse += content;
                        onChunk({ type: 'content', content });
                    }
                }

                messages.push({ role: 'assistant', content: finalResponse });

                if (conversationId) {
                    this.conversations.set(conversationId, messages);
                }

                return {
                    message: finalResponse,
                    conversationId,
                    toolCalls
                };
            }

            if (conversationId) {
                this.conversations.set(conversationId, messages);
            }

            return {
                message: fullResponse,
                conversationId,
                toolCalls
            };
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

    getTools() {
        return Array.from(this.tools.values());
    }
}