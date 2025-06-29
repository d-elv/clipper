from rest_framework import serializers

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
      "duration",
      "proxy_url",
      "error_message",
    )
    
  def get_proxy_url(self, obj):
    if obj.proxy_file:
      return obj.proxy_url()
    return None


class ClipFileSerializer(serializers.ModelSerializer):
  class Meta:
    model = ClipFile
    fields = (
      "id",
      "status",
      "clip_name",
      "clip_url",
      "duration",
      "file_size",
      "error_message",
    )
    
  def get_clip_url(self, obj):
    if obj.clip_file:
      return obj.clip_url()
    return None