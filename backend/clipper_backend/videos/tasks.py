from celery import shared_task
from .models import VideoFile
import subprocess 
import os
import json

def get_metadata(video_path):
  cmd = [
    "ffprobe", "-v",
    "quiet", "-print_format",
    "json", "-show_format",
    "-show_streams", video_path
  ]
  try:
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(result.stdout)
    
    video_stream = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    if not video_stream:
      raise ValueError("No video stream found")
    
    return {
      "width": int(video_stream["width"]),
      "height": int(video_stream["height"]),
      "duration": float(data["format"]["duration"])
    }
    
  except Exception as error:
    raise Exception(f"Failed to extract metadata from {video_path}, {str(error)}")


@shared_task
def create_proxy(video_id):
  try:
    video = VideoFile.objects.get(id=video_id)
    video.status = "processing"
    video.save()
    
    input_path = video.original_file.path
    
    try:
      video_info = get_metadata(input_path)
      video.width = video_info.width
      video.height = video_info.height
      video.duration = video_info.duration
      video.save()
    except Exception as error:
      video.status = "failed"
      video.error_message = f"Failed to read metadata {str(error)}"
      video.save()
      return

    output_filename = f"{video.id}_proxy.mp4"
    output_path = os.path.join("media/proxy/", output_filename)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    proxy_width = video.width // 2
    proxy_height = video.height // 2
    if proxy_width % 2 != 0:
      proxy_width += 1
    if proxy_height % 2 != 0:
      proxy_height += 1
    
    
    cmd = [
      "ffmpeg",
      "-i", input_path,
      "-vf", f"scale={proxy_width}:{proxy_height}",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "28",
      "-c:a", "aac",
      "-movflags", "faststart",
      "-y", output_path
    ]
    
    subprocess.run(cmd, check=True, capture_output=True)
    
    video.proxy_file.name = f"proxies/{output_filename}"
    video.status = "completed"
    video.save()
    
    return {
      "status": "success",
      "video_id": str(video.id),
    }
    
    
  except Exception as error:
    video.status = "failed"
    video.error_message = str(error)
    video.save()
    return {"status": "error", "message": str(error)}