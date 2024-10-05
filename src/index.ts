import express, { Request, Response, RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Video streaming route
const videoHandler: RequestHandler = (req: Request, res: Response) => {
    const videoPath = path.join(__dirname, 'public', 'sample.mp4');
    
    if (!fs.existsSync(videoPath)) {
        res.status(404).send('Video file not found');
        return;  // Ensure that the function exits after sending a response
    }

    const videoStat = fs.statSync(videoPath);
    const fileSize = videoStat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
};

app.get('/video', videoHandler);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});