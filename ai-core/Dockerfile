## LƯU Ý:
## TensorFlow KHÔNG hỗ trợ tốt trên alpine, nên dùng python:3.9-slim (Debian based)
## để cài được tensorflow==2.15.0. Image sẽ nặng hơn một chút nhưng vẫn ổn.
FROM python:3.9-slim

WORKDIR /app

# Cài đặt dependencies hệ thống tối thiểu cho TensorFlow & build
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        python3-dev \
        libssl-dev \
        libffi-dev \
        libstdc++6 \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Copy và cài đặt Python dependencies (bao gồm tensorflow, flwr, sklearn, ...)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    rm -rf /root/.cache/pip /tmp/*

# Copy code (chỉ copy file cần thiết)
COPY client.py model.py data_generator.py server_fedavg.py server_fedprox.py server_fedopt.py ./

# Default command (có thể override trong docker-compose)
CMD ["python", "server_fedavg.py", "FedAvg"]