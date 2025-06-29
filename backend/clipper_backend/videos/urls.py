from django.urls import path
from . import api

urlpatterns = [
  path("upload/", api.upload_video, name="upload_video"),
  path("status/video/<uuid:video_id>/", api.video_status, name="video_status"),
  path("clips/", api.create_clips, name="create_clips"),
  path("status/clip/<uuid:clip_id>/", api.clip_status, name="clip_status"),
]