// Here we define a set of assistant handlers that will be used to communicate with our assistant implementation.

import { ipcMain } from 'electron';
import Assistant from './assistant/assistant.js';
import 'dotenv/config';


let AssistantService = null;

export function setup() {
    ipcMain.handle('initialize-assistant', async (event) => {
        try {
            AssistantService = new Assistant(process.env.OPENAI_API_KEY);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('send-message', async (event, message, conversationId, options) => {
        if (!AssistantService) {
            throw new Error('Assistant service not initialized');
        }
        return await AssistantService.sendMessage(message, conversationId, options);
    });

    ipcMain.on('stream-message', async (event, message, conversationId, options) => {
        if (!AssistantService) {
            event.reply('stream-error', 'Assistant service not initialized');
            return;
        }

        try {
            await AssistantService.streamMessage(
                (chunk) => event.reply('stream-chunk', chunk),
                message,
                conversationId,
                options
            );
            event.reply('stream-end');
        } catch (error) {
            event.reply('stream-error', error.message);
        }
    });

    ipcMain.handle('clear-conversation', (event, conversationId) => {
        if (!AssistantService) {
            throw new Error('Assistant service not initialized');
        }
        AssistantService.clearConversation(conversationId);
        return { success: true };
    });

    ipcMain.handle('list-models', async () => {
        if (!AssistantService) {
            throw new Error('Assistant service not initialized');
        }
        return await AssistantService.listModels();
    });
}