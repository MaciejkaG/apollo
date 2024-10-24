import { app, BrowserWindow } from 'electron';
import 'dotenv/config';

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 800,
        height: 480,
        // If Node is running in production environment, launch the window in kiosk mode.
        kiosk: process.env.NODE_ENV === 'production',
    });

    win.setAspectRatio(5/3);

    win.loadFile('./static/index.html');
});