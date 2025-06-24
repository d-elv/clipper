from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import VideoFileSerializer
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