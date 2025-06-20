"use client";

import {
  formatSecondsToMinSec,
  formatSecondsToTimecode,
} from "@/util/formatters";
import { useEffect, useRef, useState } from "react";
import { EditSidebar } from "@/app/components/EditSidebar";

interface Clip {
  inPoint: number;
  outPoint: number;
  duration: number;
  name: string;
  originalFilename: string;
}

export default function EditPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [lastKeyStroke, setLastKeyStroke] = useState<string | null>(null);

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

  function createClipFromSelection() {
    if (!inPoint || !outPoint) return;

    const clipDuration = outPoint - inPoint;

    const newClip: Clip = {
      inPoint,
      outPoint,
      duration: clipDuration,
      name: `Clip ${String(clips.length + 1).padStart(3, "0")}`,
      originalFilename: "local-video-player_Demo.mp4",
    };
    setClips((prevClips) => [...prevClips, newClip]);
    setInPoint(null);
    setOutPoint(null);
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <h2 className="rounded-2xl px-8 py-4 text-center text-4xl font-bold text-white">
          Create Your Clips
        </h2>
        {/* VIDEO PLAYER */}
        <div className="relative h-auto md:max-w-8/12">
          <video
            className="h-auto max-w-full rounded-tl-sm rounded-tr-sm"
            ref={videoRef}
          >
            <source
              src="/testing_videos/local-video-player_Demo.mp4"
              type="video/mp4"
            ></source>
          </video>

          {/* VIDEO CONTROLS */}
          <div className="flex h-28 flex-col rounded-br-sm rounded-bl-sm bg-gray-200">
            <div
              className="flex h-full w-full items-center justify-around"
              id="progress-bar-container"
            >
              {isPlaying ? (
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="z-10 ml-1 size-6 hover:cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePlayPause();
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                  />
                </svg>
              ) : (
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="z-10 ml-1 size-6 hover:cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePlayPause();
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                  />
                </svg>
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
                  onClick={createClipFromSelection}
                >
                  Clip
                </button>
              </div>
              <div className="mr-2 ml-auto flex gap-2 text-center">
                <p className="m-0 rounded-md bg-gray-400 px-2 py-1 text-sm lg:px-4 lg:py-2 lg:text-base">
                  In:{" "}
                  {inPoint
                    ? formatSecondsToTimecode(inPoint, 60)
                    : "00:00:00:00"}
                </p>
                <p className="m-0 rounded-md bg-gray-400 px-2 py-1 text-sm lg:px-4 lg:py-2 lg:text-base">
                  Out:{" "}
                  {outPoint
                    ? formatSecondsToTimecode(outPoint, 60)
                    : "00:00:00:00"}
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
      </div>
      {/* CLIPS SECTION - TO BE A SIDEBAR */}
      <div className="m-4 grid grid-cols-5 gap-2">
        {clips.map((clip) => {
          return (
            <div key={clip.name} className="rounded-lg bg-amber-500 p-4">
              <h1 className="text-lg font-bold">{clip.name}</h1>
              <p className="text-sm">
                <span className="font-bold">Length:</span>{" "}
                {formatSecondsToMinSec(clip.duration)}
              </p>
              <p className="text-sm">
                <span className="font-bold">Original Name:</span>{" "}
                {clip.originalFilename}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
