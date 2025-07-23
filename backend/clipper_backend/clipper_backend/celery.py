import os
from celery import Celery
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clipper_backend.settings')

app = Celery('clipper_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
  "cleanup-old-files": {
    "task": "videos.tasks.cleanup_old_files",
    "schedule": 600.0, # Runs every 10 minutes
    "args": (1,), # Deletes files older than 1 hour
  },
}

app.conf.timezone = "UTC"

@app.task(bind=True)
def debug_task(self):
  print(f"Request: {self.request!r}")