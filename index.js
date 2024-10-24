import { app, BrowserWindow } from 'electron';

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 800,
        height: 480
    });

    win.setAspectRatio(5/3);

    win.loadFile('./static/index.html');
});