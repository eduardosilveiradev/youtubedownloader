# YouTube Downloader

Simple Node.js script to download and merge separate YouTube video and audio streams into a single MP4 using `@distube/ytdl-core` and `fluent-ffmpeg`.

## Prerequisites

- Node.js (16+ recommended)
- ffmpeg installed and available on PATH (verify with `ffmpeg -version`)

## Install

1. Clone the repo and change into the project directory:

```bash
git clone https://github.com/eduardosilveiradev/youtubedownloader
cd youtubedownloader
```

1. Install dependencies:

```bash
npm install
```

1. Create a `.env` file in the project root with your YouTube URL:

```env
YOUTUBE_URL=https://www.youtube.com/watch?v=xxxx
```

> Tip: don't commit `.env` to source control. Add it to `.gitignore`.

## Usage

Run the script:

```bash
node index.js
```

You can also pipe a URL via stdin (this takes precedence over `.env`):

```bash
echo "https://www.youtube.com/watch?v=xxxx" | node index.js
```

Or pass a URL from another command that outputs the URL on stdout.

The script will:

- Download the best video and audio streams (hard-coded itags by default).
- Merge them with `ffmpeg` into `./outputs/<sanitized-title>.mp4`.

Files created:

- `./outputs/` — final merged MP4(s)
- `temp_video.mp4`, `temp_audio.mp4` — temporary files removed after a successful merge

## Troubleshooting

- Error: "Please set YOUTUBE_URL in your environment" — ensure `.env` exists or pass URL via environment.
- Tip: piping a URL (stdin) is preferred and will override the `YOUTUBE_URL` in `.env`.
- ffmpeg errors like "No such file or directory" — ensure the `outputs` directory exists (the script creates it automatically) and `ffmpeg` is on PATH.
- If the output video has no audio, try different format itags or let me implement `chooseFormat` logic.

## Next improvements

- Accept URL as a CLI argument (flag) instead of only `.env`.
- Use `ytdl-core`'s `chooseFormat` to pick the best compatible formats instead of hard-coded itags.
- Add retry/fallback when formats are unavailable.
- Add a progress bar for downloads.

## License

MIT
