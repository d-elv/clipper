export function formatSecondsToMinSec(seconds: number) {
  if (seconds < 3600) {
    return new Date(seconds * 1000).toISOString().substring(14, 19);
  } else {
    return new Date(seconds * 1000).toISOString().substring(11, 19);
  }
}

export function formatSecondsToTimecode(seconds: number, framerate: number) {
  const totalFrames = Math.floor(seconds * framerate);
  const totalSecs = Math.floor(totalFrames / framerate);

  const frames = Math.floor(totalFrames % framerate);
  const mins = Math.floor(totalSecs / 60);
  const hours = Math.floor(mins / 60);
  const secs = totalSecs % 60;

  return `HH:MM:SS:FF`
    .replace("HH", String(hours).padStart(2, "0"))
    .replace("MM", String(mins).padStart(2, "0"))
    .replace("SS", String(secs).padStart(2, "0"))
    .replace("FF", String(frames).padStart(2, "0"));
}
