"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useCallback, useState } from "react";

interface VideoStatus {
  video_id: string;
  status: string;
  filename: string;
  proxy_url: string | null;
  error: string | null;
}

export default function Home() {
  const [dataVideo, setDataVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function setVideo(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      const tempVideo = event.target.files[0];
      setDataVideo(tempVideo);
      setError(null);
    }
  }

  const pollVideoStatus = useCallback(
    async (videoId: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/videos/status/${videoId}/`,
        );

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data: VideoStatus = await response.json();
        setStatus(data.status);

        if (data.status === "completed" && data.proxy_url) {
          setProcessing(false);
          router.push(
            `/edit?videoId=${videoId}&proxyUrl=${encodeURIComponent(data.proxy_url)}&filename=${encodeURIComponent(data.filename)}`,
          );
        } else if (data.status === "failed") {
          setProcessing(false);
          setError(data.error || "Video processing failed");
        } else if (data.status === "processing") {
          const timeout = setTimeout(() => pollVideoStatus(videoId), 2000);
        }
      } catch (error) {
        console.log("Error polling video status", error);
        setError("Failed to get video status");
        setProcessing(false);
      }
    },
    [router],
  );

  async function handleUpload() {
    if (!dataVideo) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("video", dataVideo);

    try {
      const xmlHttpRequest = new XMLHttpRequest();
      xmlHttpRequest.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xmlHttpRequest.addEventListener("load", () => {
        if (xmlHttpRequest.status === 200) {
          const response = JSON.parse(xmlHttpRequest.responseText);
          setVideoId(response.video_id);
          setUploading(false);
          setProcessing(true);
          setStatus("processing");

          pollVideoStatus(response.video_id);
        } else {
          setError("Upload failed");
          setUploading(false);
        }
      });

      xmlHttpRequest.addEventListener("error", () => {
        setError("Upload failed");
        setUploading(false);
      });

      xmlHttpRequest.open(
        "POST",
        `${process.env.NEXT_PUBLIC_API_HOST}/api/videos/upload/`,
      );
      xmlHttpRequest.send(formData);
    } catch (error) {
      console.log("Upload error:", error);
      setError("Upload failed");
      setUploading(false);
    }
  }

  function getStatusMessage() {
    if (uploading) return "Uploading video...";
    if (status === "processing") return "Creating proxy video...";
    if (status === "completed")
      return "Processing complete! Redirecting to edit page...";
    if (status === "failed") return "Failed to create proxy...";
    return "";
  }

  return (
    <div className="grid min-h-screen items-center justify-items-center p-8 sm:p-20">
      <header>
        <h1 className="text-5xl text-white">Upload a video</h1>
      </header>
      <main className="w-full max-w-md">
        <div className="bg-ffmpeg-green-200 space-y-4 rounded-xl p-4 text-gray-700">
          <input
            type="file"
            accept="video/*"
            id="file-uploader"
            onChange={setVideo}
            disabled={uploading || processing}
            className="w-full"
          />

          {dataVideo && !uploading && !processing && (
            <div className="space-y-2">
              <p className="text-sm">Selected: {dataVideo.name}</p>
              <p className="text-sm text-gray-800">
                Size: {(dataVideo.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <button
                onClick={handleUpload}
                className="bg-ffmpeg-green-300 hover:bg-ffmpeg-green-500 w-full rounded-lg px-4 py-2 text-white transition-colors"
              >
                Upload Video
              </button>
            </div>
          )}

          {(uploading || processing) && (
            <div className="space-y-3">
              <div className="flex justify-around text-sm">
                <span>{getStatusMessage()}</span>
                {uploading && <span>{Math.round(uploadProgress)}%</span>}
              </div>

              <div className="h-2 w-full rounded-full bg-gray-300">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    processing
                      ? "bg-ffmpeg-green-300 animate-pulse"
                      : "bg-ffmpeg-green-300"
                  }`}
                  style={{
                    width: uploading
                      ? `${uploadProgress}%`
                      : processing
                        ? "100%"
                        : "0%",
                  }}
                ></div>
              </div>

              {processing && (
                <p className="text-center text-xs text-gray-600">
                  This may take a few minutes depending on video size and
                  internet connection...
                </p>
              )}

              {error && (
                <div className="rounded border border-red-600 bg-red-200 px-4 py-2 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
