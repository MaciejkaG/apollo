const { contextBridge, ipcRenderer } = require('electron');

const AssistantService = {
    initialize: () =>
        ipcRenderer.invoke('initialize-assistant'),

    sendMessage: (message, conversationId, options) =>
        ipcRenderer.invoke('send-message', message, conversationId, options),

    clearConversation: (conversationId) =>
        ipcRenderer.invoke('clear-conversation', conversationId),

    listModels: () =>
        ipcRenderer.invoke('list-models'),

    streamMessage: (message, conversationId, options) => {
        return new Promise((resolve, reject) => {
            ipcRenderer.send('stream-message', message, conversationId, options);

            const handleChunk = (_, chunk) => {
                window.dispatchEvent(new CustomEvent('assistant-chunk', {
                    detail: chunk
                }));
            };

            const handleEnd = () => {
                cleanup();
                resolve();
            };

            const handleError = (_, error) => {
                cleanup();
                reject(new Error(error));
            };

            ipcRenderer.on('stream-chunk', handleChunk);
            ipcRenderer.once('stream-end', handleEnd);
            ipcRenderer.once('stream-error', handleError);

            const cleanup = () => {
                ipcRenderer.removeListener('stream-chunk', handleChunk);
                ipcRenderer.removeListener('stream-end', handleEnd);
                ipcRenderer.removeListener('stream-error', handleError);
            };
        });
    }
};

const WeatherService = {

    getCurrentWeather: (params) =>
        ipcRenderer.invoke('get-weather', params),

    getForecast: (location, units = 'celsius', days = 5) =>
        ipcRenderer.invoke('get-weather-forecast', location, units, days),

    getHistorical: (location, units = 'celsius', days = 5) =>
        ipcRenderer.invoke('get-weather-historical', location, units, days),

    getComplete: (params) =>
        ipcRenderer.invoke('get-weather-complete', params)
};

contextBridge.exposeInMainWorld('backend', {
    assistant: AssistantService,
    weather: WeatherService
});