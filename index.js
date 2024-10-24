const { app, BrowserWindow } = require('electron');
const path = require('path');
const { initialize } = require('./backend/handlers.js');
require('dotenv').config()


app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 800,
        height: 480,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),

          },
        kiosk: process.env.NODE_ENV === 'production',
    });

    initialize();


    win.setAspectRatio(5/3);

    win.loadFile('./static/index.html');
});