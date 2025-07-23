"use client";

import { Separator } from "@/components/ui/separator";
import { Clip } from "../types";
import { formatSecondsToMinSec } from "@/util/formatters";
import { useEffect, useState } from "react";
import apiService from "../services/apiServices";
import Image from "next/image";

interface ClipStatus {
  id: string;
  clip_filename: string;
  clip_name: string;
  duration: number;
  clip_url: string;
  error_message: string | null;
  file_size: number;
  status: string;
}

interface DownloadData {
  download_url: string;
  name: string;
}

function ClipCard({
  deleteClip,
  clipData,
}: {
  deleteClip: (name: string) => void;
  clipData: Clip;
}) {
  return (
    <li className="relative rounded-lg bg-amber-500">
      <button
        className="absolute top-2 right-2 cursor-pointer rounded-full px-2 py-1 transition-colors duration-300 hover:bg-amber-600"
        onClick={() => deleteClip(clipData.name)}
      >
        X
      </button>
      <h1 className="text-lg font-bold">{clipData.name}</h1>
      <p className="text-sm">
        <span className="font-bold">Length:</span>{" "}
        {formatSecondsToMinSec(clipData.duration)}
      </p>
      <Image
        src={clipData.thumbnail}
        alt="Clip thumbnail"
        width={100}
        height={100}
      />
    </li>
  );
}

export function ClipSidebar({
  isOpen,
  clips,
  deleteClip,
  videoId,
}: {
  isOpen: boolean;
  clips: Clip[];
  deleteClip: (name: string) => void;
  videoId: string | null;
}) {
  const [processing, setProcessing] = useState(false);
  const [clipIds, setClipIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [downloadData, setDownloadData] = useState<DownloadData[]>([]);
  const [clipErrors, setClipErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>();

  async function handlePostClipsData() {
    if (clips.length === 0 || !videoId) return;

    const response = await apiService.post_clips(
      "/api/videos/clips/create/",
      clips,
      videoId,
    );

    if (response.status === "processing") {
      setErrorMessage(null);
      setProcessing(true);
      // ClipIDs are sent as a string, we split them into an array here for polling clip status later
      setClipIds(response.clip_ids.split(", "));
    } else {
      console.log("Error", response);
      setErrorMessage(response.error);
    }
  }

  useEffect(() => {
    if (!processing || clipIds.length === 0) return;
    let cancelled = false;

    async function pollAllClips() {
      const newStatuses: string[] = [];
      const newDownloadData: DownloadData[] = [];
      const newErrors: string[] = [];

      await Promise.all(
        clipIds.map(async (clipId) => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_HOST}/api/videos/clips/status/${clipId}`,
            );

            const data: ClipStatus = await response.json();
            newStatuses.push(data.status);
            if (data.status === "completed" && data.clip_url) {
              newDownloadData.push({
                download_url: data.clip_url,
                name: data.clip_filename,
              });
            }
            if (data.status === "failed") {
              newErrors.push(data.error_message || "Clip processing failed");
            }
          } catch (error) {
            newErrors.push("Failed to get clip status");
          }
        }),
      );

      if (!cancelled) {
        setStatuses(newStatuses);
        setDownloadData(newDownloadData);
        setClipErrors(newErrors);

        if (
          newStatuses.every(
            (status) =>
              status === "completed" ||
              status === "failed" ||
              newErrors.length > 0,
          )
        ) {
          setProcessing(false);
        } else {
          setTimeout(pollAllClips, 2000);
        }
      }
    }

    pollAllClips();
    return () => {
      cancelled = true;
    };
  }, [processing, clipIds]);

  async function downloadFile(downloadUrl: string, filename: string) {
    try {
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }
  useEffect(() => {
    if (!processing && downloadData.length > 0) {
      downloadData.forEach((data, index) => {
        setTimeout(() => {
          downloadFile(data.download_url, data.name);
        }, index * 300);
      });
      setDownloadData([]);
    }
  }, [processing, downloadData]);

  return (
    <>
      {isOpen ? (
        <div className="flex h-full bg-gray-500 lg:absolute lg:right-0 lg:w-[30%]">
          <Separator orientation="vertical" />
          <div className="mt-3">
            <div className="flex justify-around">
              <h2 className="text-2xl text-white lg:m-3">Clips</h2>
              <button
                onClick={handlePostClipsData}
                disabled={processing}
                className="cursor-pointer rounded-2xl bg-gray-800 px-4 py-2 text-lg text-white transition-colors duration-300 hover:bg-gray-700 disabled:cursor-auto disabled:bg-gray-600"
              >
                Download Clips
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2 overflow-y-auto lg:m-3">
              {clips.map((clipData, index) => (
                <ClipCard
                  clipData={clipData}
                  deleteClip={deleteClip}
                  key={`${clipData.name}-${index}`}
                />
              ))}
            </ul>
          </div>
          {errorMessage && (
            <p className="border border-red-600 bg-red-400 p-4 text-lg text-red-800">
              {errorMessage}
            </p>
          )}
        </div>
      ) : (
        ""
      )}
    </>
  );
}
