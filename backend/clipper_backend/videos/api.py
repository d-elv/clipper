from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import VideoFileSerializer, ClipFileSerializer
from .models import VideoFile, ClipFile
from .tasks import create_proxy, create_clip

@api_view(["POST"])
@permission_classes([AllowAny])
def upload_video(request):
  if "video" not in request.FILES:
    return Response({"error": "No video file provided"}, status=status.HTTP_400_BAD_REQUEST)
  
  video_file = request.FILES["video"]
  
  video = VideoFile.objects.create(
    original_filename=video_file.name,
    original_file=video_file,
    file_size=video_file.size,
    height=0,
    width=0,
    status="uploading",
  )
  
  create_proxy.delay(str(video.id))
  
  return Response({
    "video_id": str(video.id),
    "status": "uploaded",
    "message": "Video uploaded successfully, creating proxy...",
  })
  
@api_view(["GET"])
@permission_classes([AllowAny])
def video_status(request, video_id):
  try:
    video = VideoFile.objects.get(id=video_id)
    serializer = VideoFileSerializer(video)
    return JsonResponse(serializer.data)
  
  except VideoFile.DoesNotExist:
    return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
  
@api_view(["POST"])
@permission_classes([AllowAny])
def create_clips(request):
  video_id = request.data.get("video_id")
  clips = request.data.get("clips")
  
  if not video_id or not clips:
    return JsonResponse({"error": "Missing video id or clips data"}, status=status.HTTP_400_BAD_REQUEST)  
  
  try:
    video = VideoFile.objects.get(id=video_id)
  except VideoFile.DoesNotExist:
    return JsonResponse({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
  
  clip_ids = []
  for clip in clips:
    clip_file = ClipFile.objects.create(
      clip_name=clip.get("name"),
      in_point=clip.get("inPoint"),
      out_point=clip.get("outPoint"),
      duration=clip.get("duration"),
      videofile=video,
      status="processing",
    )
    clip_ids.append(str(clip_file.id))
    
    create_clip.delay(str(video_id), str(clip_file.id))
    print(f"Creating clip: {clip.get('name')}...")

  print("Clip IDs", clip_ids)
  return JsonResponse({
    "clip_ids": f"{str((", ".join(clip_ids)))}",
    "status": "processing",
    "message": f"Clip data received, creating {str(len(clips))} clips...",
  })
  
  
  
@api_view(["GET"])
@permission_classes([AllowAny])
def clip_status(request, clip_id):
  try:
    clip = ClipFile.objects.get(id=clip_id)
    serializer = ClipFileSerializer(clip)
    return JsonResponse(serializer.data)
  
  except ClipFile.DoesNotExist:
    return Response({"error": "Clip not found"}, status=status.HTTP_404_NOT_FOUND)