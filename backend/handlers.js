// Here we define a set of assistant handlers that will be used to communicate with our assistant implementation.

import { ipcMain } from 'electron';
import Assistant from './assistant/assistant.js';
import WeatherPlugin from './assistant/plugins/weather/index.js';
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

    ipcMain.handle('get-weather', async (event, params) => {
        try {
            const weatherData = await WeatherPlugin.execute(params);
            return { success: true, data: weatherData };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    });

    ipcMain.handle('get-weather-forecast', async (event, location, units = 'celsius', days = 5) => {
        try {
            const weatherData = await WeatherPlugin.execute({
                location,
                units,
                include_forecast: true,
                forecast_days: days
            });
            return { success: true, data: weatherData };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    });

    ipcMain.handle('get-weather-historical', async (event, location, units = 'celsius', days = 5) => {
        try {
            const weatherData = await WeatherPlugin.execute({
                location,
                units,
                include_historical: true,
                historical_days: days
            });
            return { success: true, data: weatherData };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    });

    ipcMain.handle('get-weather-complete', async (event, params) => {
        try {
            const weatherData = await WeatherPlugin.execute({
                ...params,
                include_forecast: true,
                include_historical: true
            });
            return { success: true, data: weatherData };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    });
}