from django.db import models
from django.conf import settings
import uuid
import os

class VideoFile(models.Model):
  STATUS_CHOICES = (
    ("uploading", "Uploading"),
    ("processing", "Processing"),
    ("completed", "Completed"),
    ("failed", "Failed"),
  )
  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  original_filename = models.CharField(max_length=255)
  original_file = models.FileField(upload_to="uploads/")
  proxy_file = models.FileField(upload_to="proxies/", null=True, blank=True)
  status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="uploading")
  file_size = models.BigIntegerField()
  height = models.PositiveIntegerField()
  width = models.PositiveIntegerField()
  framerate = models.FloatField(null=True, blank=True)
  duration = models.FloatField(null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  error_message = models.TextField(null=True, blank=True)
  
  def proxy_url(self):
    if self.proxy_file:
      return f"{settings.NGINX_MEDIA_URL}proxies/{os.path.basename(self.proxy_file.name)}"
    return None
  
class ClipFile(models.Model):
  STATUS_CHOICES = (
    ("processing", "Processing"),
    ("completed", "Completed"),
    ("failed", "Failed"),
  )
  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  videofile = models.ForeignKey(VideoFile, related_name="videos", on_delete=models.CASCADE)
  clip_file = models.FileField(upload_to="clips/", null=True, blank=True)
  clip_name = models.CharField(max_length=255)
  in_point = models.FloatField(null=True, blank=True)
  out_point = models.FloatField(null=True, blank=True)
  status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="processing")
  file_size = models.BigIntegerField(null=True, blank=True)
  duration = models.FloatField(null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  error_message = models.TextField(null=True, blank=True)
  
  def clip_url(self):
    if self.clip_file:
      return f"{settings.NGINX_MEDIA_URL}clips/{os.path.basename(self.clip_file.name)}"
    return None