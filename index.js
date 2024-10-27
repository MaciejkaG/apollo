import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setup } from './backend/handlers.js';
import { app, BrowserWindow } from 'electron';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 800,
        height: 480,
        // If Node is running in production environment, launch the window in kiosk mode.
        kiosk: process.env.NODE_ENV === 'production',

        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    setup(win);

    win.setAspectRatio(5/3);

    win.loadFile('./static/index.html');
});