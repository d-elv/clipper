from django.db import models
from django.conf import settings
import uuid

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
  duration = models.FloatField(null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  error_message = models.TextField(null=True, blank=True)
  
  def proxy_url(self):
    return f"{settings.WEBSITE_URL}{self.proxy_file.url}"
  