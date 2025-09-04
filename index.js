const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config({ quiet: true });

// Set the path to your ffmpeg installation if needed
// ffmpeg.setFfmpegPath('/path/to/your/ffmpeg');

async function readStdin(timeout = 200) {
    return new Promise((resolve) => {
        const stdin = process.stdin;
        let data = '';
        let resolved = false;

        // If there's no piped data, the 'readable' event may never fire.
        stdin.setEncoding('utf8');
        stdin.on('data', chunk => {
            data += chunk;
        });
        stdin.on('end', () => {
            if (!resolved) {
                resolved = true;
                resolve(data.trim());
            }
        });

        // If nothing is piped, resolve after a short timeout
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve(data.trim());
            }
        }, timeout);
    });
}

async function main() {
    // Prefer URL from stdin (allows piping) then fallback to env variable
    const stdinUrl = await readStdin();
    const videoUrl = stdinUrl || process.env.YOUTUBE_URL; // Replace with your URL
    if (!videoUrl) {
        console.error('Please provide a YouTube URL via stdin or set YOUTUBE_URL in your environment (e.g. in a .env file)');
        process.exit(1);
    }

    try {
        // Ensure outputs directory exists so ffmpeg can write the final file
        const path = require('path');
        const outputsDir = path.join(__dirname, 'outputs');
        if (!fs.existsSync(outputsDir)) {
            fs.mkdirSync(outputsDir, { recursive: true });
        }
        const info = await ytdl.getInfo(videoUrl);
        // Sanitize title for file name and ensure toLowerCase() is called
        const videoTitle = info.videoDetails.title
            .toLowerCase()
            .replace(/[\/\\?%*:|"<>]/g, '-')
            .replace(/ /g, '-'); // Replace spaces with dashes

        const outputFilePath = path.join(outputsDir, `${videoTitle}.mp4`);
        const tempVideoPath = 'temp_video.mp4';
        const tempAudioPath = 'temp_audio.mp4'; // Use .mp4 as FFmpeg can handle it

        // 1. Download video and audio streams to temporary files
        const videoStream = ytdl(videoUrl, { quality: '137' });
        const audioStream = ytdl(videoUrl, { quality: '140' });

        console.log('Starting download of separate video and audio streams...');

        videoStream.pipe(fs.createWriteStream(tempVideoPath));
        audioStream.pipe(fs.createWriteStream(tempAudioPath));

        await Promise.all([
            new Promise(resolve => videoStream.on('end', resolve)),
            new Promise(resolve => audioStream.on('end', resolve))
        ]);

        console.log('Separate downloads finished. Starting merge...');

        // 2. Merge the temporary files using fluent-ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(tempVideoPath)
                .input(tempAudioPath)
                .outputOptions([
                    '-c copy', // Copy the video codec
                    '-map 0:v:0', // Use video stream from first input
                    '-map 1:a:0' // Use audio stream from second input
                ])
                .save(outputFilePath)
                .on('end', () => {
                    console.log('Merge finished successfully!');
                    console.log(`Output file: ${outputFilePath}`);
                    // Clean up temporary files
                    try {
                        fs.unlinkSync(tempVideoPath);
                        fs.unlinkSync(tempAudioPath);
                        console.log('Temporary files cleaned up.');
                    } catch (e) {
                        // ignore cleanup errors
                    }
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error during merge:', err.message);
                    reject(err);
                });
        });
    } catch (err) {
        console.error('Error during download/processing:', err.message || err);
    }
}

main();
