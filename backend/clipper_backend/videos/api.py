from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import VideoFile
from .tasks import create_proxy

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
    height=request.data.get("height", 0),
    width=request.data.get("width", 0),
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
    return Response({
      "video_id": str(video.id),
      "status": video.status,
      "filename": video.original_filename,
      "width": video.width,
      "height": video.height,
      "duration": video.duration,
      "proxy_url": video.proxy_file.url if video.proxy_file else None,
      "error": video.error_message,
    })
  except VideoFile.DoesNotExist:
    return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)