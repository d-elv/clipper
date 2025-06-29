"use client";

import { useEffect, useState } from "react";
import { ClipSidebar } from "@/app/components/ClipSidebar";
import { useSearchParams } from "next/navigation";

import apiService from "@/app/services/apiServices";
import { Clip, VideoData } from "@/app/types";
import { VideoPlayer } from "@/app/components/VideoPlayer";

export default function EditPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function getVideoInfo() {
    const url = `/api/videos/status/video/`;
    const tempVideoData = await apiService.get(url, videoId);
    setVideoData(tempVideoData);
  }

  useEffect(() => {
    getVideoInfo();
  }, []);

  function createClipFromSelection() {
    if (!inPoint || !outPoint || !videoData) return;

    const clipDuration = outPoint - inPoint;

    const newClip: Clip = {
      inPoint,
      outPoint,
      duration: clipDuration,
      name: `Clip_${String(clips.length + 1).padStart(3, "0")}`,
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
    <div className="lg:grid lg:grid-cols-8">
      <div className="lg:col-span-5 lg:ml-20">
        <h2 className="rounded-2xl px-8 py-4 text-center text-4xl font-bold text-white">
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

        {/* CLIPS SECTION - TO BE A SIDEBAR */}
      </div>
      <div className="transition-all">
        <ClipSidebar
          isOpen={isSidebarOpen}
          clips={clips}
          deleteClip={deleteClip}
          videoId={videoId}
        />
      </div>
    </div>
  );
}
