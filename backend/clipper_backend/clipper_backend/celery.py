import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clipper_backend.settings')

app = Celery('clipper_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()