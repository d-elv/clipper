from celery import shared_task
from .models import VideoFile, ClipFile
import json
import subprocess 
import os
from django.conf import settings


@shared_task
def create_proxy(video_id):
  try:
    video = VideoFile.objects.get(id=video_id)
    video.status = "processing"
    video.save()
    
    input_path = video.original_file.path
    
    try:
      cmd = [
      "ffprobe", 
      "-v", "quiet", 
      "-print_format", "json", 
      "-show_format", 
      "-show_streams", 
      input_path
    ]
      result = subprocess.run(cmd, capture_output=True, text=True, check=True)
      metadata = json.loads(result.stdout)
      
      video_stream = None
      
      for stream in metadata.get("streams", []):
        if stream.get("codec_type") == "video":
          video_stream = stream
          break
        
      if video_stream:
        video.width = video_stream.get("width")
        video.height = video_stream.get("height")
        video.duration = video_stream.get("duration")
        video.save()
    except Exception as error:
      raise Exception(f"Failed to extract metadata from {input_path}, {str(error)}")
  
    proxy_filename = f"{video.original_filename}_proxy.mp4"
    proxy_path = os.path.join(settings.MEDIA_ROOT, "proxies", proxy_filename)
    
    os.makedirs(os.path.dirname(proxy_path), exist_ok=True)
    
    success = None
    
    try:
      cmd = [
        "ffmpeg",
        "-i", input_path,
        "-vf", "scale=-2:640",
        "-c:v", "libx264",
        "-crf", "23",
        "-preset", "medium",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-y",
        proxy_path
      ]
      
      result = subprocess.run(cmd, capture_output=True, text=True, check=True)
      print("Result", result)
      success = True
    
    except subprocess.CalledProcessError as error:
      print(f"FFmpeg error: {error.stderr}")
      success = False
    except Exception as error:
      print(f"Error creating proxy: {str(error)}")
      success = False
    
    if success:
      video.proxy_file.name = f"proxies/{proxy_filename}"
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
    

@shared_task
def create_clip(video_id, clip_id):
  try:
    video = VideoFile.objects.get(id=video_id)
    clip = ClipFile.objects.get(id=clip_id)
    clip.status = "processing"
    clip.save()
    
    input_path = video.original_file.path
    
    original_filename, ext = os.path.splitext(video.original_filename)

    clip_filename = f"{original_filename}_{clip.clip_name}{ext}"
    clip_path = os.path.join(settings.MEDIA_ROOT, "clips", clip_filename)
    
    os.makedirs(os.path.dirname(clip_path), exist_ok=True)
    
    success = None
    
    try:
      duration = clip.out_point - clip.in_point
      cmd = [
        "ffmpeg",
        "-ss", str(clip.in_point),
        "-i", input_path,
        "-t", str(duration),
        "-map_metadata", "0",
        "-c", "copy",
        "-movflags", "+faststart",
        "-y",
        clip_path
      ]
      
      result = subprocess.run(cmd, capture_output=True, text=True, check=True)
      print("Result", result)
      success = True
    
    except subprocess.CalledProcessError as error:
      print(f"FFmpeg error: {error.stderr}")
      success = False
    except Exception as error:
      print(f"Error creating proxy: {str(error)}")
      success = False
    
    if success:
      clip.clip_file = f"clips/{clip_filename}"
      clip_path_full = os.path.join(settings.MEDIA_ROOT, "clips", clip_filename)
      if os.path.exists(clip_path_full):
        clip.file_size = os.path.getsize(clip_path_full)
      clip.status = "completed"
      clip.save()
    else:
      clip.status = "failed"
      clip.error_message = "Failed to create clip"
      clip.save()
    
  except VideoFile.DoesNotExist:
    print(f"Video with id {video_id} not found")
  except ClipFile.DoesNotExist:
    print(f"Clip with id {clip_id} not found")
    
  except Exception as error:
    try:
      clip = ClipFile.objects.get(id=clip_id)
      clip.status = "failed"
      clip.error_message = str(error)
      clip.save()
    except:
      pass
    print(f"Error processing clip {clip_id}: {str(error)}")