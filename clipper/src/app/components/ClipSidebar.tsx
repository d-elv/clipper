"use client";

import { Separator } from "@/components/ui/separator";
import { Clip } from "../types";
import { formatSecondsToMinSec } from "@/util/formatters";
import { useEffect, useState } from "react";
import apiService from "../services/apiServices";
import { Database } from "lucide-react";

// function ClipCard({
//   children,
//   deleteClip,
// }: {
//   children: React.ReactNode;
//   deleteClip: () => void;
// }) {
//   return (
//     <div className="relative rounded-lg bg-amber-500 p-4">
//       <div className="absolute top-2 right-4" onClick={deleteClip}>
//         X
//       </div>
//       {children}
//     </div>
//   );
// }

interface ClipStatus {
  clip_id: string;
  status: string;
  filename: string;
  clip_url: string;
  error: string | null;
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
  const [clipUrls, setClipUrls] = useState<string[]>([]);
  const [clipErrors, setClipErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>();

  async function handleSendClipsData() {
    if (clips.length === 0 || !videoId) return;

    const response = await apiService.post_clips(
      "/api/videos/clips/",
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
      const newUrls: string[] = [];
      const newErrors: string[] = [];

      await Promise.all(
        clipIds.map(async (clipId) => {
          console.log("polling clipID", clipId);
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_HOST}/api/videos/status/clip/${clipId}`,
            );

            const data: ClipStatus = await response.json();
            newStatuses.push(data.status);
            if (data.status === "completed" && data.clip_url) {
              newUrls.push(data.clip_url);
            }
            if (data.status === "failed") {
              newErrors.push(data.error || "Clip processing failed");
            }
          } catch (error) {
            newErrors.push("Failed to get clip status");
          }
        }),
      );

      if (!cancelled) {
        setStatuses(newStatuses);
        setClipUrls(newUrls);
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

  return (
    <>
      {isOpen ? (
        <div className="flex h-full bg-gray-500 lg:absolute lg:right-0 lg:w-[30%]">
          <Separator orientation="vertical" />
          <div className="mt-3">
            <div className="flex justify-around">
              <h2 className="text-2xl text-white lg:m-3">Clips</h2>
              <button
                onClick={handleSendClipsData}
                disabled={processing}
                className="cursor-pointer rounded-2xl bg-gray-800 px-4 py-2 text-lg text-white transition-colors duration-300 hover:bg-gray-700 disabled:cursor-auto disabled:bg-gray-600"
              >
                Download Clips
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2 overflow-y-auto lg:m-3">
              {clips.map((clip) => {
                return (
                  <li
                    key={clip.name}
                    className="relative rounded-lg bg-amber-500 p-4"
                  >
                    <button
                      className="absolute top-2 right-2 cursor-pointer rounded-full px-2 py-1 transition-colors duration-300 hover:bg-amber-600"
                      onClick={() => deleteClip(clip.name)}
                    >
                      X
                    </button>
                    {/* <ClipCard deleteClip={deleteClip}> */}
                    <h1 className="text-lg font-bold">{clip.name}</h1>
                    <p className="text-sm">
                      <span className="font-bold">Length:</span>{" "}
                      {formatSecondsToMinSec(clip.duration)}
                    </p>
                    {/* </ClipCard> */}
                  </li>
                );
              })}
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
