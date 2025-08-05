import { useEffect, useRef, useState } from "react";
import { VideoData } from "../types";
import { PauseIcon, PlayIcon } from "lucide-react";
import {
  formatSecondsToMinSec,
  formatSecondsToTimecode,
} from "@/util/formatters";

interface VideoPlayerProps {
  videoData: VideoData;
  inPoint: number | null;
  outPoint: number | null;
  setInPoint: (value: number | null) => void;
  setOutPoint: (value: number | null) => void;
  onClip: () => void;
}

function calculatePercent(currentTime: number, duration: number): number {
  return (currentTime / duration) * 100;
}

export function VideoPlayer({
  videoData,
  inPoint,
  outPoint,
  setInPoint,
  setOutPoint,
  onClip,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lastKeyStroke, setLastKeyStroke] = useState<string | null>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Updates the progress bar as the video plays - also requests animation frames for smooth updating
  useEffect(() => {
    function updateProgress() {
      const video = videoRef.current;
      if (video && video.duration) {
        setProgressPercent(calculatePercent(video.currentTime, video.duration));
        if (!video.paused && !video.ended) {
          rafRef.current = requestAnimationFrame(updateProgress);
        }
      }
    }

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  // Handles the progress bar click and drag functionality
  function progressWidthHandler(event: React.MouseEvent<HTMLDivElement>) {
    if (!progressContainerRef.current || !videoRef.current) return;
    const container = progressContainerRef.current;
    const rect = container.getBoundingClientRect();

    function updateProgress(clientX: number) {
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const percentage = (x / rect.width) * 100;
      setProgressPercent(calculatePercent(x, rect.width));

      // Updates video's currentTime based on click
      if (videoRef.current && videoRef.current.duration) {
        console.log(
          "ClientX:",
          clientX,
          "rect.left:",
          rect.left,
          "rect.width:",
          rect.width,
          "x:",
          x,
          "video duration:",
          videoRef.current.duration,
          "new current time calculation:",
          (percentage / 100) * videoRef.current.duration,
        );
        videoRef.current.currentTime =
          (percentage / 100) * videoRef.current.duration;
      }
    }

    updateProgress(event.clientX);

    function onMouseMove(mouseMoveEvent: MouseEvent) {
      updateProgress(mouseMoveEvent.clientX);
    }
    function onMouseUp(mouseMoveEvent: MouseEvent) {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp, { once: true });
  }

  function handlePlayPause() {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }

  function handleSetInPoint() {
    if (videoRef.current) {
      setInPoint(videoRef.current.currentTime);
    }
  }

  function handleSetOutPoint() {
    if (videoRef.current) {
      setOutPoint(videoRef.current.currentTime + 1 / videoData.framerate);
    }
  }

  // Updates the progress bar when the currentTime updates (such as when arrow keys are pressed)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgressPercent((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    video.addEventListener("loadedmetadata", () => {
      if (video.duration) {
        console.log("Video metadata has loaded", video.duration);
        setProgressPercent(0);
      }
    });
    return () => {
      return video.removeEventListener("loadedmetadata", () => {});
    };
  }, [videoData]);

  function setCurrentTimeToThis() {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 103.596;
    console.log(
      "time set to 103.596",
      videoRef.current.currentTime,
      videoRef.current.duration,
    );
  }

  // Handles keyboard inputs: ArrowLeft, ArrowRight, KeyI, KeyO
  useEffect(() => {
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (videoRef.current) {
        if (event.code === "Space") {
          event.preventDefault();
          handlePlayPause();
        }
        if (event.code === "ArrowLeft") {
          videoRef.current.currentTime =
            videoRef.current.currentTime - 1 / videoData.framerate;
        }
        if (event.code === "ArrowRight") {
          videoRef.current.currentTime =
            videoRef.current.currentTime + 1 / videoData.framerate;
        }
        if (event.code === "KeyI") {
          handleSetInPoint();
          setLastKeyStroke("I");
        }
        if (event.code === "KeyO") {
          handleSetOutPoint();
          setLastKeyStroke("O");
        }
        if (event.code === "KeyC") {
          // create clip from selection
          setLastKeyStroke("C");
        }
      }
    };

    document.addEventListener("keydown", handleArrowKeys);

    return () => {
      document.removeEventListener("keydown", handleArrowKeys);
    };
  }, []);

  // Ensures in and out points are valid
  useEffect(() => {
    if (outPoint !== null && inPoint !== null && lastKeyStroke === "I") {
      if (inPoint > outPoint) {
        setOutPoint(null);
        setLastKeyStroke(null);
      }
    } else if (outPoint !== null && inPoint !== null && lastKeyStroke === "O") {
      if (outPoint < inPoint) {
        setInPoint(null);
        setLastKeyStroke(null);
      }
    }
  }, [inPoint, outPoint]);

  return (
    <div className="relative w-full">
      {/* VIDEO PLAYER */}
      {videoData ? (
        <video
          className="h-auto max-w-full rounded-tl-sm rounded-tr-sm"
          ref={videoRef}
        >
          <source src={videoData.proxy_url} type="video/mp4"></source>
        </video>
      ) : (
        <p>Loading...</p>
      )}

      {/* VIDEO CONTROLS */}
      <div className="flex h-28 flex-col rounded-br-sm rounded-bl-sm bg-gray-200">
        <div
          className="flex h-full w-full items-center justify-around"
          id="progress-bar-container"
        >
          {isPlaying ? (
            <PauseIcon
              onClick={(event) => {
                event.stopPropagation();
                handlePlayPause();
              }}
            />
          ) : (
            <PlayIcon
              onClick={(event) => {
                event.stopPropagation();
                handlePlayPause();
              }}
            />
          )}

          {/* PROGRESS BAR */}
          <div
            onMouseDown={progressWidthHandler}
            ref={progressContainerRef}
            className="relative h-12 rounded-md bg-gray-400"
            style={{ width: "calc(100% - 6rem)" }}
            id="progress-bar-background"
          >
            {/* IN MARKER */}
            {inPoint !== null &&
            videoRef.current &&
            videoRef.current.duration ? (
              <div
                className="absolute h-12 w-0.5"
                style={{
                  left: `${(inPoint / videoRef.current.duration) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="flex w-4">
                  <div className="h-12 w-0.5 bg-red-600"></div>
                  <div className="h-2 w-2 rounded-br-full bg-red-600"></div>
                </div>
              </div>
            ) : null}
            {/* OUT MARKER */}
            {outPoint !== null &&
            videoRef.current &&
            videoRef.current.duration ? (
              <div
                className="absolute h-12 w-0.5"
                style={{
                  left: `${(outPoint / videoRef.current.duration) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="-ml-2 flex w-4">
                  <div className="h-2 w-2 rounded-bl-full bg-red-600"></div>
                  <div className="h-12 w-0.5 bg-red-600"></div>
                </div>
              </div>
            ) : null}
            {/* SELECTED AREA MARK */}
            {inPoint && outPoint && videoRef.current ? (
              <div
                className="bg-ffmpeg-green-200 absolute top-1 h-[80%] rounded-md opacity-70"
                style={{
                  left: `${(inPoint / videoRef.current.duration) * 100}%`,
                  width: `${((outPoint - inPoint) / videoRef.current.duration) * 100}%`,
                }}
              ></div>
            ) : null}
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-12 rounded-md bg-gray-700 hover:cursor-pointer`}
              id="progress-bar-actual"
            ></div>
          </div>
          <p className="mr-1 text-xs text-gray-700">
            {videoRef.current
              ? formatSecondsToMinSec(videoRef.current.currentTime)
              : "00:00"}
          </p>
        </div>
        {/* LOWER CONTROL BAR */}
        <div className="mb-2 flex items-center justify-center gap-2 md:gap-4">
          <div className="invisible mr-auto"></div>
          <div className="ml-auto flex gap-2">
            <button
              className="m-0 rounded-md border bg-gray-400 px-1 py-1 text-sm transition-colors hover:cursor-pointer hover:bg-gray-500 md:px-3 md:py-2 md:text-lg"
              onClick={setCurrentTimeToThis}
            >
              Fix Time
            </button>
            <button
              className="m-0 rounded-md border bg-gray-400 px-1 py-1 text-sm transition-colors hover:cursor-pointer hover:bg-gray-500 md:px-3 md:py-2 md:text-lg"
              onClick={handleSetInPoint}
            >
              I
            </button>
            <button
              className="m-0 rounded-md border bg-gray-400 px-1 py-1 text-sm transition-colors hover:cursor-pointer hover:bg-gray-500 md:px-2 md:py-2 md:text-lg"
              onClick={handleSetOutPoint}
            >
              O
            </button>
            <button
              className="m-0 rounded-md border bg-gray-400 px-1 py-1 text-sm transition-colors hover:cursor-pointer hover:bg-gray-500 md:px-3 md:py-2 md:text-lg"
              onClick={onClip}
            >
              Clip
            </button>
          </div>
          <div className="mr-2 ml-auto flex gap-2 text-center">
            <p className="m-0 rounded-md bg-gray-400 px-2 py-1 text-sm lg:px-4 lg:py-2 lg:text-base">
              In:{" "}
              {inPoint
                ? formatSecondsToTimecode(inPoint, videoData.framerate)
                : "00:00:00:00"}
            </p>
            <p className="m-0 rounded-md bg-gray-400 px-2 py-1 text-sm lg:px-4 lg:py-2 lg:text-base">
              Out:{" "}
              {outPoint
                ? formatSecondsToTimecode(outPoint, videoData.framerate)
                : "00:00:00:00"}
            </p>
            <p className="m-0 rounded-md bg-gray-400 px-2 py-1 text-sm lg:px-4 lg:py-2 lg:text-base">
              Selection:{" "}
              {/* TODO: This calculation becomes incorrect with larger selections */}
              {inPoint && outPoint
                ? formatSecondsToTimecode(
                    outPoint - inPoint + 1 / videoData.framerate,
                    videoData.framerate,
                  )
                : "HH:MM:SS:FF"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
