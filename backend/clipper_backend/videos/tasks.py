from celery import shared_task
from .models import VideoFile
import json
import subprocess 
import os
from django.conf import settings
import tempfile


@shared_task
def create_proxy(video_id):
  try:
    video = VideoFile.objects.get(id=video_id)
    video.status = "processing"
    video.save()
    
    input_path = video.original_file.path
    
    
    metadata = get_metadata(input_path)
    if metadata:
      video.width = metadata.width
      video.height = metadata.height
      video.duration = metadata.duration
      video.save()

    proxy_filename = f"{video.id}_proxy.mp4"
    proxy_path = os.path.join(settings.MEDIA_ROOT, "proxies", proxy_filename)
    
    os.makedirs(os.path.dirname(proxy_path), exist_ok=True)
    
    success = create_proxy_video(input_path, proxy_path)
    
    if success:
      video.proxy_file = f"proxies/{proxy_filename}"
      video.status = "completed"
      video.save()
    else:
      video.status = "failed"
      video.error_message = "Failed to create proxy"
      video.save()
    
  
  except VideoFile.DoesNotExist:
    print(f"Video with id {video_id} not found")
  except Exception as error:
    try:
      video = VideoFile.objects.get(id=video_id)
      video.status = "failed"
      video.error_message = str(error)
      video.save()
    except:
      pass
    print(f"Error processing video {video_id}: {str(error)}")
  
  
def get_metadata(video_path):
  print("Calling get metadata")
  cmd = [
    "ffprobe", 
    "-v", "quiet", 
    "-print_format", "json", 
    "-show_format", 
    "-show_streams", 
    video_path
  ]
  try:
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    metadata = json.loads(result.stdout)
    
    video_stream = None
    
    for stream in metadata.get("streams", []):
      if stream.get("codec_type") == "video":
        video_stream = stream
        break
    print("Video stream found")
    if video_stream:
      return {
        "width": int(video_stream.get("width", 0)),
        "height": int(video_stream.get("height"), 0),
        "duration": float(metadata.get("format", {}).get("duration", 0.0))
      }
  except Exception as error:
    raise Exception(f"Failed to extract metadata from {video_path}, {str(error)}")
  



def create_proxy_video(input_path, output_path):
  try:
    cmd = [
      "ffmpeg",
      "-i", input_path,
      "-vf", "scale=-2:640",
      "-c:v", "libx264",
      "-crf", "23",
      "-preset", "medium",
      "-c:a", "-aac",
      "-b:a", "192k",
      "-movflags", "+faststart",
      "-y",
      output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return True
  
  except subprocess.CalledProcessError as error:
    print(f"FFmpeg error: {error.stderr}")
    return False
  except Exception as error:
    print(f"Error creating proxy: {str(error)}")
    return False