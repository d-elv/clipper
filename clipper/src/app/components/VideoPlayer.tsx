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
        const percent = (video.currentTime / video.duration) * 100;
        setProgressPercent(percent);
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

    function updateProgress(pageX: number) {
      const x = Math.min(Math.max(pageX - rect.left, 0), rect.width);
      const percentage = (x / rect.width) * 100;
      setProgressPercent(percentage);

      if (videoRef.current && videoRef.current.duration) {
        videoRef.current.currentTime =
          (percentage / 100) * videoRef.current.duration;
      }
    }

    updateProgress(event.pageX);

    function onMouseMove(mouseMoveEvent: MouseEvent) {
      updateProgress(mouseMoveEvent.pageX);
    }
    function onMouseUp(mouseMoveEvent: MouseEvent) {
      updateProgress(mouseMoveEvent.pageX);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("mouseup", onMouseUp, { once: true });
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
      setOutPoint(videoRef.current.currentTime + 1 / 60);
    }
  }

  // Updates the progress bar when the currentTime updates (such as when arrow keys are pressed)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgressPercent((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  // Handles keyboard inputs: ArrowLeft, ArrowRight, KeyI, KeyO
  useEffect(() => {
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (videoRef.current) {
        if (event.code === "Space") {
          event.preventDefault();
          handlePlayPause();
        }
        if (event.code === "ArrowLeft") {
          // TODO: Replace 60 with framerate dynamically
          videoRef.current.currentTime = videoRef.current.currentTime - 1 / 60;
        }
        if (event.code === "ArrowRight") {
          // TODO: Replace 60 with framerate dynamically
          videoRef.current.currentTime = videoRef.current.currentTime + 1 / 60;
        }
        if (event.code === "KeyI") {
          handleSetInPoint();
          setLastKeyStroke("I");
        }
        if (event.code === "KeyO") {
          handleSetOutPoint();
          setLastKeyStroke("O");
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
    <div className="relative h-auto md:max-w-8/12">
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
              {inPoint ? formatSecondsToTimecode(inPoint, 60) : "00:00:00:00"}
            </p>
            <p className="m-0 rounded-md bg-gray-400 px-2 py-1 text-sm lg:px-4 lg:py-2 lg:text-base">
              Out:{" "}
              {outPoint ? formatSecondsToTimecode(outPoint, 60) : "00:00:00:00"}
            </p>
            <p className="m-0 rounded-md bg-gray-400 px-2 py-1 text-sm lg:px-4 lg:py-2 lg:text-base">
              Selection:{" "}
              {/* TODO: This calculation becomes incorrect with larger selections */}
              {inPoint && outPoint
                ? formatSecondsToTimecode(outPoint - inPoint + 1 / 60, 60)
                : "HH:MM:SS:FF"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
