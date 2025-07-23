export async function createThumbnail(
  file: File,
  currentTime: number,
): Promise<string> {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      if (video.duration > 0) {
        video.currentTime = currentTime;
      } else {
        return;
      }
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;

      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      let thumbnail = canvas.toDataURL("image/png", 0.25);

      resolve(thumbnail);
    };
    video.addEventListener("error", function (event) {
      alert(
        `An error has occurred creating the thumbnail for ${file.name.substring(
          0,
          -4,
        )} - Please check the console for details`,
      );
      console.log(event.error);
    });
  });
}
