import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/**
 * 把 GIF 轉成網頁用的影片。
 *
 * 後台只讓使用者上傳一個 GIF —— 要他們自備 WebM、MP4 與封面圖三個檔案
 * 太容易出錯（少傳 MP4 時 Safari 會安靜地播不出來）。但 GIF 本身不適合
 * 直接放上網站：本站五組素材原檔共 30MB，轉成影片後只剩 1.5MB，
 * 而且 GIF 得關掉 next/image 的最佳化才不會被壓成靜態圖。
 *
 * 於是折衷：使用者丟 GIF，伺服器在這裡轉檔。
 */

/** 與現有素材一致的輸出寬度；高度依原始比例計算 */
const TARGET_WIDTH = 610;

/** scale 的 -2 表示高度依比例自動計算並取偶數 —— H.264 的 yuv420p
    要求長寬皆為偶數，奇數會讓 ffmpeg 直接失敗 */
const SCALE = `scale=${TARGET_WIDTH}:-2`;

export type ConvertedVideo = {
  webm: Buffer;
  mp4: Buffer;
  poster: Buffer;
  width: number;
  height: number;
};

/** ffmpeg 不存在時給出可行動的訊息，而不是讓 ENOENT 往上冒 */
export async function assertFfmpeg(): Promise<void> {
  try {
    await run("ffmpeg", ["-version"]);
  } catch {
    throw new Error(
      "伺服器未安裝 ffmpeg，無法轉換 GIF。正式環境請確認 Dockerfile 的 runner 階段有安裝。",
    );
  }
}

export async function convertGif(gif: Buffer): Promise<ConvertedVideo> {
  await assertFfmpeg();

  // ffmpeg 讀寫檔案而非串流，故需要暫存目錄；用完即刪
  const dir = await mkdtemp(path.join(tmpdir(), "timelab-gif-"));
  const src = path.join(dir, "in.gif");
  const webmPath = path.join(dir, "out.webm");
  const mp4Path = path.join(dir, "out.mp4");
  const posterPath = path.join(dir, "poster.jpg");

  try {
    await writeFile(src, gif);

    // 三個輸出各跑一次。合併成單一命令雖可少讀幾次檔，但任一編碼失敗時
    // 錯誤訊息會混在一起，難以判斷是哪個格式出問題
    await run("ffmpeg", [
      "-y", "-v", "error",
      "-i", src,
      "-vf", SCALE,
      // crf 40 搭配 b:v 0 是 VP9 的固定品質模式，實測 5MB 的 GIF 約壓到 70KB
      "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40",
      "-an",
      webmPath,
    ]);

    await run("ffmpeg", [
      "-y", "-v", "error",
      "-i", src,
      "-vf", SCALE,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "30",
      // faststart 把索引移到檔頭，讓影片邊下載就能邊播
      "-movflags", "+faststart",
      "-an",
      mp4Path,
    ]);

    // 第一幀作為 poster：自動播放被系統擋下時顯示它，不會留下空白
    await run("ffmpeg", [
      "-y", "-v", "error",
      "-i", src,
      "-vf", SCALE,
      "-frames:v", "1", "-q:v", "4",
      posterPath,
    ]);

    const { stdout } = await run("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "csv=p=0",
      webmPath,
    ]);
    const [width, height] = stdout.trim().split(",").map(Number);
    if (!width || !height) throw new Error("轉檔後讀不出影片尺寸");

    const [webm, mp4, poster] = await Promise.all([
      readFile(webmPath),
      readFile(mp4Path),
      readFile(posterPath),
    ]);

    return { webm, mp4, poster, width, height };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
