import { Clip } from "../types";

const apiService = {
  get: async function (url: string, data: any): Promise<any> {
    console.log("Get", url);

    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}${data}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((json) => {
          console.log(json);
          resolve(json);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  post_clips: async function (
    url: string,
    clips: Clip[],
    videoId: string,
  ): Promise<any> {
    console.log("Post", url);

    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, {
        method: "POST",
        body: JSON.stringify({
          video_id: videoId,
          clips: clips,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((json) => {
          console.log(json);
          resolve(json);
        })
        .catch((error) => {
          console.log("post_clips error:", error);
          reject(error);
        });
    });
  },
};

export default apiService;
