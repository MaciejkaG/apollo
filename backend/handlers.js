import { ipcMain } from 'electron';
import Assistant from './assistant/assistant.js';
import WeatherPlugin from './assistant/plugins/weather/index.js';
import { SpotifyClient } from './spotify/index.js';
import 'dotenv/config';

let AssistantService = null;
let SpotifyService = null;

export function setup(mainWindow) {
    // Assistant handlers
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

    // Weather handlers
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

    const forwardEvent = (event, data) => {
        if (mainWindow?.webContents) {
            mainWindow.webContents.send('spotify-event', { event, data });
        }
    };

    ipcMain.handle('initialize-spotify', async (event, config) => {
        try {
            SpotifyService = new SpotifyClient(config);
            
            
            SpotifyService.on('authInitialized', (data) => {
                forwardEvent('authInitialized', data);
            });
            
            SpotifyService.on('authenticated', (data) => { 
                forwardEvent('authenticated', data)
            });

            SpotifyService.on('tokenRefreshed', (data) => forwardEvent('tokenRefreshed', data));
            SpotifyService.on('ready', (data) => forwardEvent('ready', data));
            SpotifyService.on('error', (error) => forwardEvent('error', error.message));
            
            const authInfo = await SpotifyService.initialize();
            return { success: true, ...authInfo };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-destroy', () => {
        if (SpotifyService) {
            SpotifyService.removeAllListeners();
            SpotifyService.destroy();
            SpotifyService = null;
        }
        return { success: true };
    });

    ipcMain.handle('authenticate-spotify', async (event, timeout) => {
        try {
            await SpotifyService.authenticate(timeout);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-play', async (event, options) => {
        try {
            await SpotifyService.play(options);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-pause', async () => {
        try {
            await SpotifyService.pause();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-next', async () => {
        try {
            await SpotifyService.next();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-previous', async () => {
        try {
            await SpotifyService.previous();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-seek', async (event, positionMs) => {
        try {
            await SpotifyService.seek(positionMs);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-set-volume', async (event, volumePercent) => {
        try {
            await SpotifyService.setVolume(volumePercent);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-set-repeat', async (event, state) => {
        try {
            await SpotifyService.setRepeatMode(state);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-set-shuffle', async (event, state) => {
        try {
            await SpotifyService.setShuffle(state);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-current-state', async () => {
        try {
            const state = await SpotifyService.getCurrentState();
            return { success: true, state };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-current-track', async () => {
        try {
            const track = await SpotifyService.getCurrentTrack();
            return { success: true, track };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-queue', async () => {
        try {
            const queue = await SpotifyService.getQueue();
            return { success: true, queue };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-search', async (event, query, types, options) => {
        try {
            const results = await SpotifyService.search(query, types, options);
            return { success: true, results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-playlists', async (event, limit, offset) => {
        try {
            const playlists = await SpotifyService.getUserPlaylists(limit, offset);
            return { success: true, playlists };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-create-playlist', async (event, userId, name, options) => {
        try {
            const playlist = await SpotifyService.createPlaylist(userId, name, options);
            return { success: true, playlist };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-add-to-playlist', async (event, playlistId, uris, options) => {
        try {
            const result = await SpotifyService.addTracksToPlaylist(playlistId, uris, options);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-devices', async () => {
        try {
            const devices = await SpotifyService.getDevices();
            return { success: true, devices };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-set-device', async (event, deviceId) => {
        try {
            await SpotifyService.setDevice(deviceId);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-add-to-queue', async (event, uri) => {
        try {
            await SpotifyService.addToQueue(uri);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}