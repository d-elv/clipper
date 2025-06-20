from django.urls import path
from . import api

urlpatterns = [
  path("upload/", api.upload_video, name="upload_video"),
  path("status/<uuid:video_id>/", api.video_status, name="video_status")
]