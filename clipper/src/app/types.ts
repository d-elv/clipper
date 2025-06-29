export interface VideoData {
  id: string;
  status: string;
  original_filename: string;
  width: number;
  height: number;
  duration: number;
  proxy_url: string;
  error_message: boolean;
}

export interface Clip {
  inPoint: number;
  outPoint: number;
  duration: number;
  name: string;
}
