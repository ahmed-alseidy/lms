import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export async function loadFFmpeg() {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ffmpeg;
}

export async function transcodeToHLS(
  file: File,
  onProgress: (progress: number) => void
): Promise<{ manifest: File; segments: File[] }> {
  const ffmpeg = await loadFFmpeg();

  // Generate unique names for files
  const inputFileName = `input-${Date.now()}.mp4`;
  const manifestName = `playlist-${Date.now()}.m3u8`;

  // Write the input file to FFmpeg's virtual filesystem
  await ffmpeg.writeFile(
    inputFileName,
    new Uint8Array(await file.arrayBuffer())
  );

  // Set up progress monitoring
  ffmpeg.on("progress", ({ progress }) => {
    onProgress(Math.round(progress * 100));
  });

  // Execute FFmpeg command to create HLS stream
  await ffmpeg.exec([
    "-i",
    inputFileName,
    "-codec:v",
    "copy",
    "-start_number",
    "0",
    "-hls_time",
    "10",
    "-hls_list_size",
    "0",
    "-f",
    "hls",
    "-hls_segment_filename",
    "segment_%03d.ts",
    manifestName,
  ]);

  // Read the manifest file
  const manifestData = await ffmpeg.readFile(manifestName);
  const manifestFile = new File([manifestData], "playlist.m3u8", {
    type: "application/vnd.apple.mpegurl",
  });

  // Read all segment files
  const segments: File[] = [];
  const files = await ffmpeg.listDir("/");
  for (const file of files) {
    if (!file.isDir && file.name.endsWith(".ts")) {
      const data = await ffmpeg.readFile(file.name);
      segments.push(new File([data], file.name, { type: "video/mp2t" }));
    }
  }

  return { manifest: manifestFile, segments };
}
