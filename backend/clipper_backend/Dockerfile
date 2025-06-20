FROM python:3.12.2-slim-bullseye

WORKDIR /usr/src/clipper_backend

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y netcat \
    netcat \
    ffmpeg \
    libmediainfo0v5 \
    mediainfo \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./entrypoint.sh .
RUN sed -i "s/\r$//g" /usr/src/clipper_backend/entrypoint.sh
RUN chmod +x /usr/src/clipper_backend/entrypoint.sh

COPY . .

ENTRYPOINT [ "/usr/src/clipper_backend/entrypoint.sh" ]
