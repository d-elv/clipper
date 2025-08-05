from rest_framework import serializers
import os
from django.conf import settings

from .models import VideoFile, ClipFile

class VideoFileSerializer(serializers.ModelSerializer):
  proxy_url = serializers.SerializerMethodField()
  class Meta:
    model = VideoFile
    fields = (
      "id",
      "status",
      "original_filename",
      "width",
      "height",
      "framerate",
      "duration",
      "proxy_url",
      "error_message",
    )
    
  def get_proxy_url(self, obj):
    if obj.proxy_file:
      return obj.proxy_url()
    return None


class ClipFileSerializer(serializers.ModelSerializer):
  clip_url = serializers.SerializerMethodField()
  clip_filename = serializers.SerializerMethodField()
  download_url = serializers.SerializerMethodField()
  class Meta:
    model = ClipFile
    fields = (
      "id",
      "status",
      "clip_name",
      "clip_url",
      "clip_filename",
      "download_url",
      "duration",
      "file_size",
      "error_message",
    )
    
  def get_clip_url(self, obj):
    if obj.clip_file:
      return obj.clip_url()
    return None
  
  def get_clip_filename(self, obj):
    if obj.clip_file:
      return os.path.basename(obj.clip_file.name)
    return None
  
  def get_download_url(self, obj):
    if obj.clip_file and obj.status == "completed":
      return f"{settings.WEBSITE_URL}/api/clips/download/{obj.id}"
    return None