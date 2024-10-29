import { ipcMain } from 'electron';
import Assistant from './assistant/assistant.js';
import WeatherPlugin from './assistant/plugins/weather/index.js';
import { SpotifyClient } from './spotify/index.js';
import 'dotenv/config';

let AssistantService = null;
let SpotifyService = null;

export function setup(mainWindow) {

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

    const forwardEvent = (event, data) => {
        if (mainWindow?.webContents) {
            mainWindow.webContents.send('spotify-event', { event, data });
        }
    };

    ipcMain.handle('initialize-spotify', async (event, config) => {
        try {
            if (SpotifyService) {
                SpotifyService.destroy();
            }

            SpotifyService = new SpotifyClient(config);
            
            SpotifyService.on('authInitialized', (data) => {
                forwardEvent('authInitialized', data);
            });
            
            SpotifyService.on('authUrlVisited', () => {
                forwardEvent('authUrlVisited');
            });

            SpotifyService.on('authenticated', (data) => {
                forwardEvent('authenticated', data);
            });

            SpotifyService.on('tokenRefreshed', (data) => {
                forwardEvent('tokenRefreshed', data);
            });

            SpotifyService.on('ready', (data) => {
                forwardEvent('ready', data);
            });

            SpotifyService.on('error', (error) => {
                forwardEvent('error', error.message);
            });
            
            const result = await SpotifyService.initialize();
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-destroy', () => {
        if (SpotifyService) {
            SpotifyService.destroy();
            SpotifyService = null;
        }
        return { success: true };
    });


    ipcMain.handle('spotify-play', async (event, options) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.play(options);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-pause', async () => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.pause();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-next', async () => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.next();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-previous', async () => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.previous();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-seek', async (event, positionMs) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.seek(positionMs);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-set-volume', async (event, volumePercent) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.setVolume(volumePercent);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-set-repeat', async (event, state) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.setRepeatMode(state);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-set-shuffle', async (event, state) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.setShuffle(state);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-current-state', async () => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            const state = await SpotifyService.getCurrentState();
            return { success: true, state };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-current-track', async () => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            const track = await SpotifyService.getCurrentTrack();
            return { success: true, track };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-queue', async () => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            const queue = await SpotifyService.getQueue();
            return { success: true, queue };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-search', async (event, query, types, options) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            const results = await SpotifyService.search(query, types, options);
            return { success: true, results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-playlists', async (event, limit, offset) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            const playlists = await SpotifyService.getUserPlaylists(limit, offset);
            return { success: true, playlists };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-create-playlist', async (event, userId, name, options) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            const playlist = await SpotifyService.createPlaylist(userId, name, options);
            return { success: true, playlist };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-add-to-playlist', async (event, playlistId, uris, options) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            const result = await SpotifyService.addTracksToPlaylist(playlistId, uris, options);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-get-devices', async () => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            const devices = await SpotifyService.getDevices();
            return { success: true, devices };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-set-device', async (event, deviceId) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.setDevice(deviceId);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('spotify-add-to-queue', async (event, uri) => {
        try {
            if (!SpotifyService?.isAuthenticated) {
                throw new Error('Spotify client not authenticated');
            }
            await SpotifyService.addToQueue(uri);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}