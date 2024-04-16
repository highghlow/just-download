FROM python:3.11-alpine AS builder

WORKDIR /app
COPY requirements.txt .

RUN python3 -m pip install -r requirements.txt

COPY app.py .

EXPOSE 5000
CMD ["python3", "-m", "flask", "run", "--host", "0.0.0.0"]
