from rest_framework import serializers

from .models import VideoFile

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