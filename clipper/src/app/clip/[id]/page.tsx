"use client";

import { useEffect, useRef, useState } from "react";
import { ClipSidebar } from "@/app/components/ClipSidebar";
import { useSearchParams } from "next/navigation";

import apiService from "@/app/services/apiServices";
import { Clip, VideoData } from "@/app/types";
import { VideoPlayer } from "@/app/components/VideoPlayer";
import { createThumbnail } from "@/util/createThumbnail";
import { ChevronsLeftRight } from "lucide-react";
import Link from "next/link";

export default function EditPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(250);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);

  function startSidebarResizing(event: React.MouseEvent) {
    if (!sidebarRef.current) return;
    setStartX(event.pageX);
    setSidebarWidth(sidebarRef.current.offsetWidth);
    setIsResizing(true);
  }

  function stopSidebarResizing() {
    setIsResizing(false);
    setStartX(null);
  }

  function handleSidebarResizing(event: React.MouseEvent) {
    if (!isResizing || !sidebarRef.current || !startX) return;

    sidebarRef.current.style.width =
      sidebarWidth + (startX - event.pageX) + "px";
  }

  async function getVideoInfo() {
    const url = `/api/videos/status/video/`;
    const tempVideoData = await apiService.get(url, videoId);
    setVideoData(tempVideoData);
  }

  useEffect(() => {
    getVideoInfo();
  }, []);

  async function createClipFromSelection() {
    if (!inPoint || !outPoint || !videoData) return;

    const response = await fetch(videoData.proxy_url);
    const blob = await response.blob();

    const file = new File([blob], videoData.original_filename);
    const thumbnail = await createThumbnail(file, inPoint);

    const clipDuration = outPoint - inPoint;

    const newClip: Clip = {
      inPoint,
      outPoint,
      duration: clipDuration,
      name: `Clip_${String(clips.length + 1).padStart(3, "0")}`,
      thumbnail: thumbnail,
    };
    setClips((prevClips) => [...prevClips, newClip]);
    setInPoint(null);
    setOutPoint(null);
  }

  useEffect(() => {
    if (clips.length > 0) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, [clips]);

  function deleteClip(name: string) {
    const filteredClips = clips.filter((clip: Clip) => {
      return clip.name !== name;
    });
    setClips(filteredClips);
  }

  return (
    <div
      className={`flex flex-col ${clips.length > 0 ? "md:justify-between" : "md:justify-center"} gap-8 md:flex-row`}
    >
      <Link
        href="/"
        className="absolute top-4 left-4 rounded-lg bg-gray-300 px-4 py-2 transition-colors duration-200 hover:cursor-pointer hover:bg-gray-200"
      >
        Home
      </Link>
      <div className="mx-4">
        <h2 className="truncate rounded-2xl px-8 py-4 text-center text-3xl font-bold text-white">
          {videoData?.original_filename
            ? String(videoData.original_filename).slice(
                0,
                videoData.original_filename.length - 4,
              )
            : "Create Your Clips"}
        </h2>
        {videoData && (
          <VideoPlayer
            videoData={videoData}
            inPoint={inPoint}
            outPoint={outPoint}
            setInPoint={setInPoint}
            setOutPoint={setOutPoint}
            onClip={createClipFromSelection}
          />
        )}
      </div>

      {clips.length > 0 && (
        <div className="flex bg-gray-500 md:h-screen">
          <div
            onMouseMove={handleSidebarResizing}
            onMouseDown={startSidebarResizing}
            onMouseUp={stopSidebarResizing}
            onMouseLeave={stopSidebarResizing}
            className="relative flex h-full w-1 cursor-col-resize flex-col items-center justify-center border bg-gray-300"
          >
            <div className="rounded-full bg-gray-300 p-1.5">
              <ChevronsLeftRight />
            </div>
          </div>
          <ClipSidebar
            ref={sidebarRef}
            isOpen={isSidebarOpen}
            clips={clips}
            deleteClip={deleteClip}
            videoId={videoId}
            isResizing={isResizing}
          />
        </div>
      )}
    </div>
  );
}
