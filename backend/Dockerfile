FROM python:3.11-slim

WORKDIR /app

# deps système (psycopg2, build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# code
COPY . /app

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# adapte "main:app" si ton entrypoint diffère
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
