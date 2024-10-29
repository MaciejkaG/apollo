import axios from 'axios';
import EventEmitter from 'events';
import QRCode from 'qrcode';
import 'dotenv/config';
import EventSource from 'eventsource';

export class SpotifyClient extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            authServerUrl: config.authServerUrl || 'https://spotify-callback.ibss.pl',
            autoRefresh: config.autoRefresh !== false,
            refreshThreshold: config.refreshThreshold || 300,
            tokenRefreshPadding: config.tokenRefreshPadding || 60
        };
        
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;
        this.deviceId = null;
        this.refreshTimeout = null;
        this.eventSource = null;
    }

    get isAuthenticated() {
        return !!this.accessToken && Date.now() < this.expiresAt;
    }

    async initialize() {
        try {
            const response = await axios.get(`${this.config.authServerUrl}/start-auth`);
            const { state, url } = response.data;

            const qrCode = await QRCode.toDataURL(url);
            this.emit('authInitialized', { authUrl: url, qrCode });

            this.eventSource = new EventSource(`${this.config.authServerUrl}/sse/${state}`);

            return new Promise((resolve, reject) => {
                this.eventSource.onmessage = async (event) => {
                    const data = JSON.parse(event.data);
                    
                    if (data.status === 'keep-alive') return;
                    
                    if (data.status === 'URL visited') {
                        this.emit('authUrlVisited');
                    }
                    
                    if (data.status === 'User logged in') {
                        this.eventSource.close();
                        await this._handleAuthenticationSuccess({
                            access_token: data.access_token,
                            refresh_token: data.refresh_token,
                            expires_in: data.expires_in
                        });
                        resolve({ success: true });
                    }
                };

                this.eventSource.onerror = (error) => {
                    this.eventSource.close();
                    reject(new Error('Authentication failed: SSE connection error'));
                };
            });
        } catch (error) {
            this.emit('error', new Error(`Auth initialization failed: ${error.message}`));
            throw error;
        }
    }

    async _handleAuthenticationSuccess(tokens) {
        this.accessToken = tokens.access_token;
        this.refreshToken = tokens.refresh_token;
        this.expiresAt = Date.now() + (tokens.expires_in * 1000);

        if (this.config.autoRefresh) {
            this._scheduleTokenRefresh();
        }

        await this._initializeSpotifyConnection();
        this.emit('authenticated', { expiresAt: this.expiresAt });
    }

    async _refreshAccessToken() {
        try {
            const response = await axios.post(
                `${this.config.authServerUrl}/refresh-token`,
                {
                    refresh_token: this.refreshToken
                }
            );

            this.accessToken = response.data.access_token;
            if (response.data.refresh_token) {
                this.refreshToken = response.data.refresh_token;
            }
            this.expiresAt = Date.now() + (response.data.expires_in * 1000);

            if (this.config.autoRefresh) {
                this._scheduleTokenRefresh();
            }

            this.emit('tokenRefreshed', { expiresAt: this.expiresAt });
        } catch (error) {
            this.emit('error', new Error('Token refresh failed'));
            throw error;
        }
    }

    _scheduleTokenRefresh() {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }

        const timeUntilRefresh = this.expiresAt - Date.now() - 
            (this.config.refreshThreshold * 1000) - 
            (this.config.tokenRefreshPadding * 1000);

        if (timeUntilRefresh > 0) {
            this.refreshTimeout = setTimeout(() => {
                this._refreshAccessToken().catch(error => {
                    this.emit('error', error);
                });
            }, timeUntilRefresh);
        } else {
            this._refreshAccessToken().catch(error => {
                this.emit('error', error);
            });
        }
    }

    async _apiRequest(method, endpoint, data = null) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await axios({
                method,
                url: `https://api.spotify.com/v1${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                ...(method === 'GET' ? { params: data } : { data })
            });

            return response.data;
        } catch (error) {
            if (error.response?.status === 401 && this.config.autoRefresh) {
                await this._refreshAccessToken();
                return this._apiRequest(method, endpoint, data);
            }
            throw this._formatApiError(error);
        }
    }

    _formatApiError(error) {
        if (error.response?.data?.error?.message) {
            return new Error(`Spotify API Error: ${error.response.data.error.message}`);
        }
        return error;
    }

    destroy() {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        if (this.eventSource) {
            this.eventSource.close();
        }
        this.removeAllListeners();
        this.accessToken = null;
        this.refreshToken = null;
        this.deviceId = null;
    }

    async play(options = {}) {
        const deviceOptions = this.deviceId ? { device_id: this.deviceId } : {};
        await this._apiRequest('PUT', '/me/player/play', {
            ...deviceOptions,
            ...options
        });
    }

    async resume() {
        await this.play();
    }

    async pause() {
        await this._apiRequest('PUT', '/me/player/pause');
    }

    async next() {
        await this._apiRequest('POST', '/me/player/next');
    }

    async previous() {
        await this._apiRequest('POST', '/me/player/previous');
    }

    async seek(positionMs) {
        await this._apiRequest('PUT', '/me/player/seek', { position_ms: positionMs });
    }

    async setVolume(volumePercent) {
        await this._apiRequest('PUT', '/me/player/volume', { volume_percent: volumePercent });
    }

    async setRepeatMode(state) {
        await this._apiRequest('PUT', '/me/player/repeat', { state });
    }

    async setShuffle(state) {
        await this._apiRequest('PUT', '/me/player/shuffle', { state });
    }

    async getCurrentState() {
        return await this._apiRequest('GET', '/me/player');
    }

    async getCurrentTrack() {
        return await this._apiRequest('GET', '/me/player/currently-playing');
    }

    async getQueue() {
        return await this._apiRequest('GET', '/me/player/queue');
    }

    async addToQueue(uri) {
        await this._apiRequest('POST', '/me/player/queue', { uri });
    }

    async search(query, types = ['track'], options = {}) {
        const params = {
            q: query,
            type: types.join(','),
            limit: options.limit || 20,
            offset: options.offset || 0,
            ...options
        };
        return await this._apiRequest('GET', '/search', params);
    }

    async getUserPlaylists(limit = 50, offset = 0) {
        return await this._apiRequest('GET', '/me/playlists', { limit, offset });
    }

    async createPlaylist(userId, name, options = {}) {
        return await this._apiRequest('POST', `/users/${userId}/playlists`, {
            name,
            ...options
        });
    }

    async addTracksToPlaylist(playlistId, uris, options = {}) {
        return await this._apiRequest('POST', `/playlists/${playlistId}/tracks`, {
            uris,
            ...options
        });
    }

    async getDevices() {
        const response = await this._apiRequest('GET', '/me/player/devices');
        return response.devices;
    }

    async setDevice(deviceId) {
        await this._apiRequest('PUT', '/me/player', {
            device_ids: [deviceId],
            play: false
        });
        this.deviceId = deviceId;
    }

    async _initializeSpotifyConnection() {
        try {
            const devices = await this.getDevices();
            if (devices.length > 0) {
                await this.setDevice(devices[0].id);
                this.emit('ready', { deviceId: this.deviceId });
            }
        } catch (error) {
            this.emit('error', new Error('Failed to initialize Spotify connection'));
            throw error;
        }
    }
}