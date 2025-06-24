"use client";

import { formatSecondsToMinSec } from "@/util/formatters";
import { useEffect, useState } from "react";
import { ClipSidebar } from "@/app/components/ClipSidebar";
import { useSearchParams } from "next/navigation";

import apiService from "@/app/services/apiServices";
import { VideoData } from "@/app/types";
import { VideoPlayer } from "@/app/components/VideoPlayer";

interface Clip {
  inPoint: number;
  outPoint: number;
  duration: number;
  name: string;
  filename: string;
}

export default function EditPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id");

  const [videoData, setVideoData] = useState<VideoData | null>(null);

  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);

  async function getVideoInfo() {
    const url = `/api/videos/status/`;
    const tempVideoData = await apiService.get(url, videoId);
    console.log(tempVideoData);
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
      name: `Clip ${String(clips.length + 1).padStart(3, "0")}`,
      filename: videoData.original_filename,
    };
    setClips((prevClips) => [...prevClips, newClip]);
    setInPoint(null);
    setOutPoint(null);
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center">
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
                  {clip.filename}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
