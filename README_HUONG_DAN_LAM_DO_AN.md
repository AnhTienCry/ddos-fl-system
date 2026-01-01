# 🔧 HƯỚNG DẪN LÀM ĐỒ ÁN - TỪNG FILE CODE

## 📋 MỤC LỤC
1. [Cấu Trúc Project](#1-cấu-trúc-project)
2. [Quy Trình Phát Triển](#2-quy-trình-phát-triển)
3. [Chi Tiết Từng File](#3-chi-tiết-từng-file)
4. [Luồng Hoạt Động](#4-luồng-hoạt-động)
5. [Cách Chạy Project](#5-cách-chạy-project)

---

## 1. CẤU TRÚC PROJECT

```
ddos-fl-system/
├── ai-core/                    # Phần AI và Federated Learning
│   ├── client.py              # Client FL (train cục bộ)
│   ├── server_fedavg.py       # Server FedAvg strategy
│   ├── server_fedprox.py      # Server FedProx strategy
│   ├── server_fedopt.py       # Server FedOpt strategy
│   ├── model.py               # Neural Network model
│   ├── data_generator.py      # Tạo dữ liệu NetFlow giả
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile             # Build image cho AI services
│
├── backend-api/               # Backend API (Node.js)
│   ├── server.js              # Express server nhận metrics từ FL servers
│   ├── package.json           # Node.js dependencies
│   └── Dockerfile             # Build image cho Backend
│
├── frontend-dashboard/         # Frontend Dashboard (React)
│   ├── src/
│   │   ├── App.js             # Component chính, hiển thị charts
│   │   ├── index.js           # Entry point
│   │   └── index.css          # Styles
│   ├── package.json           # React dependencies
│   └── Dockerfile             # Build image cho Frontend
│
├── docker-compose.yml         # Orchestration tất cả services
└── Detai.md                   # Mô tả đề tài
```

---

## 2. QUY TRÌNH PHÁT TRIỂN

### Bước 1: Thiết Kế Kiến Trúc
**Mục tiêu**: Xác định các thành phần cần thiết

**Quyết định**:
- ✅ 3 FL Servers (FedAvg, FedProx, FedOpt)
- ✅ 9 Clients (3 clients × 3 strategies)
- ✅ 1 Backend API để nhận metrics
- ✅ 1 Frontend Dashboard để hiển thị

**File tạo**: `docker-compose.yml` (sơ đồ kiến trúc)

---

### Bước 2: Xây Dựng AI Core (Phần Quan Trọng Nhất)

#### 2.1. Tạo Mô Hình AI
**File**: `ai-core/model.py`

**Mục đích**: Định nghĩa Neural Network để phát hiện DDoS

**Cách làm**:
```python
def khoi_tao_mo_hinh(input_shape):
    model = Sequential([
        Dense(64, activation='relu', input_shape=(input_shape,)),
        BatchNormalization(),
        Dropout(0.2),
        Dense(32, activation='relu'),
        BatchNormalization(),
        Dense(16, activation='relu'),
        Dense(1, activation='sigmoid')  # Binary classification
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model
```

**Lý do**:
- Input: 15 NetFlow features
- Hidden layers: Học patterns phức tạp
- Output: 1 neuron với sigmoid → xác suất DDoS (0-1)

---

#### 2.2. Tạo Data Generator
**File**: `ai-core/data_generator.py`

**Mục đích**: Sinh dữ liệu NetFlow giả để mô phỏng các ISP khác nhau

**Cách làm**:
```python
def tao_du_lieu_gia(id_may_tram):
    # Tạo 15 NetFlow features
    df = pd.DataFrame({
        'Flow Duration': np.random.randint(100, 10000, n),
        'Total Fwd Packets': np.random.randint(1, 100, n),
        # ... 13 features khác
    })
    
    # Label khác nhau cho mỗi ISP (non-IID)
    if id_may_tram == 1:
        df['Label'] = np.random.choice([0, 1], p=[0.3, 0.7])  # 70% DDoS
    elif id_may_tram == 2:
        df['Label'] = np.random.choice([0, 1], p=[0.7, 0.3])  # 30% DDoS
    else:
        df['Label'] = np.random.choice([0, 1], p=[0.5, 0.5])  # 50% DDoS
    
    df.to_csv(f'./dataset/may_tram_{id_may_tram}.csv')
```

**Lý do**:
- Mô phỏng dữ liệu thực tế từ các ISP
- Non-IID distribution để test FedProx
- Mỗi client có dữ liệu riêng

---

#### 2.3. Tạo FL Client
**File**: `ai-core/client.py`

**Mục đích**: Client train mô hình trên dữ liệu cục bộ và gửi weights về server

**Cách làm**:
```python
class DDoSClient(fl.client.NumPyClient):
    def fit(self, parameters, config):
        # 1. Nhận weights từ server
        model.set_weights(parameters)
        
        # 2. Train trên dữ liệu cục bộ (PRIVACY-PRESERVING)
        history = model.fit(X_train, y_train, epochs=3, batch_size=32, verbose=0)
        
        # 3. Tính metrics
        accuracy = history.history['accuracy'][-1]
        loss = history.history['loss'][-1]
        f1 = f1_score(y_train, y_pred)
        
        # 4. CHỈ gửi weights, KHÔNG gửi dữ liệu
        return model.get_weights(), len(X_train), {
            "accuracy": accuracy,
            "loss": loss,
            "f1_score": f1
        }
```

**Điểm quan trọng**:
- ✅ Dữ liệu (`X_train`, `y_train`) KHÔNG BAO GIỜ rời khỏi client
- ✅ Chỉ gửi `model.get_weights()` về server
- ✅ Tính metrics để đánh giá chất lượng training

---

#### 2.4. Tạo FL Servers (3 Files)

**File 1**: `ai-core/server_fedavg.py`
**Mục đích**: Server dùng chiến lược FedAvg

**Cách làm**:
```python
def fit_metrics_aggregation_fn(metrics):
    # Tổng hợp metrics từ tất cả clients
    accuracies = [m.get("accuracy", 0) for _, m in metrics]
    avg_accuracy = sum(accuracies) / len(accuracies)
    
    # Gửi metrics lên Backend
    requests.post("http://backend:3000/api/log", json={
        "round": current_round,
        "accuracy": avg_accuracy,
        "strategy": "FedAvg"
    })
    
    return {"accuracy": avg_accuracy}

strategy = fl.server.strategy.FedAvg(
    min_fit_clients=3,
    min_available_clients=3,
    fit_metrics_aggregation_fn=fit_metrics_aggregation_fn
)
```

**File 2**: `ai-core/server_fedprox.py`
**Mục đích**: Server dùng chiến lược FedProx

**Khác biệt**:
```python
strategy = fl.server.strategy.FedProx(
    min_fit_clients=3,
    min_available_clients=3,
    proximal_mu=0.01,  # Thêm proximal term
    fit_metrics_aggregation_fn=fit_metrics_aggregation_fn
)
```

**File 3**: `ai-core/server_fedopt.py`
**Mục đích**: Server dùng chiến lược FedOpt

**Khác biệt**: Dùng adaptive optimizer (trong code này dùng FedAvg làm base, có thể nâng cấp)

**Lý do tạo 3 files riêng**:
- Mỗi strategy cần cấu hình khác nhau
- Dễ quản lý và debug
- Có thể chạy độc lập trên port khác nhau

---

### Bước 3: Xây Dựng Backend API

**File**: `backend-api/server.js`

**Mục đích**: Nhận metrics từ FL Servers và cung cấp API cho Frontend

**Cách làm**:
```javascript
const express = require('express');
const app = express();

// Lưu trữ logs từ các strategies
const logs = {
    FedAvg: [],
    FedProx: [],
    FedOpt: []
};

// Endpoint nhận metrics từ FL Servers
app.post('/api/log', (req, res) => {
    const { strategy, round, accuracy, loss, f1_score } = req.body;
    
    logs[strategy].push({
        round,
        accuracy,
        loss,
        f1_score,
        timestamp: new Date()
    });
    
    console.log(`[BACKEND] [${strategy}] Round ${round} -> Accuracy: ${accuracy}`);
    res.json({ success: true });
});

// Endpoint Frontend gọi để lấy dữ liệu
app.get('/api/strategies', (req, res) => {
    res.json(logs);
});

app.listen(3000);
```

**Lý do**:
- FL Servers không thể gửi trực tiếp lên Frontend
- Backend làm trung gian, lưu trữ và cung cấp API
- Có thể mở rộng thêm Socket.IO để real-time updates

---

### Bước 4: Xây Dựng Frontend Dashboard

**File**: `frontend-dashboard/src/App.js`

**Mục đích**: Hiển thị biểu đồ và metrics từ 3 strategies

**Cách làm**:
```javascript
function App() {
    const [allStrategies, setAllStrategies] = useState({
        FedAvg: [],
        FedProx: [],
        FedOpt: []
    });
    
    // Gọi API mỗi 2 giây để cập nhật dữ liệu
    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get('http://localhost:3000/api/strategies');
            setAllStrategies(response.data);
        };
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);
    
    // Hiển thị biểu đồ so sánh 3 strategies
    return (
        <Line 
            data={{
                datasets: [
                    { label: 'FedAvg', data: allStrategies.FedAvg.map(log => log.accuracy) },
                    { label: 'FedProx', data: allStrategies.FedProx.map(log => log.accuracy) },
                    { label: 'FedOpt', data: allStrategies.FedOpt.map(log => log.accuracy) }
                ]
            }}
        />
    );
}
```

**File**: `frontend-dashboard/src/index.css`

**Mục đích**: Styling cho dashboard (dark theme, modern UI)

**Lý do**:
- Dashboard trực quan để demo
- So sánh 3 strategies dễ dàng
- Real-time updates để theo dõi training

---

### Bước 5: Containerization với Docker

**File**: `ai-core/Dockerfile`

**Mục đích**: Build image cho AI services (servers và clients)

**Cách làm**:
```dockerfile
FROM python:3.9-slim  # Không dùng alpine vì TensorFlow không hỗ trợ tốt

WORKDIR /app

# Cài dependencies hệ thống cho TensorFlow
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# Cài Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY client.py model.py data_generator.py server_*.py ./

CMD ["python", "server_fedavg.py", "FedAvg"]
```

**File**: `frontend-dashboard/Dockerfile`

**Cách làm**:
```dockerfile
FROM node:18-alpine  # Alpine nhẹ hơn

WORKDIR /app

COPY package.json .
RUN npm install --no-audit --no-fund

COPY . .

CMD ["npm", "start"]
```

**File**: `backend-api/Dockerfile`

**Cách làm**: Tương tự frontend, nhưng chỉ cài production dependencies

**Lý do dùng Docker**:
- ✅ Đảm bảo môi trường nhất quán
- ✅ Dễ deploy và scale
- ✅ Tách biệt các services

---

### Bước 6: Orchestration với Docker Compose

**File**: `docker-compose.yml`

**Mục đích**: Định nghĩa và chạy tất cả services cùng lúc

**Cách làm**:
```yaml
services:
  # Frontend
  frontend:
    build: ./frontend-dashboard
    ports:
      - "3001:3000"
    depends_on:
      - backend
  
  # Backend
  backend:
    build: ./backend-api
    ports:
      - "3000:3000"
  
  # FL Server FedAvg
  server-fedavg:
    build: ./ai-core
    command: python server_fedavg.py FedAvg
    ports:
      - "8080:8080"
  
  # Clients cho FedAvg (3 clients)
  client-fedavg-1:
    build: ./ai-core
    command: python client.py 1
    environment:
      - SERVER_ADDRESS=server-fedavg:8080
  
  client-fedavg-2:
    build: ./ai-core
    command: python client.py 2
    environment:
      - SERVER_ADDRESS=server-fedavg:8080
  
  client-fedavg-3:
    build: ./ai-core
    command: python client.py 3
    environment:
      - SERVER_ADDRESS=server-fedavg:8080
  
  # Tương tự cho FedProx và FedOpt...
```

**Tổng cộng**: 1 Frontend + 1 Backend + 3 Servers + 9 Clients = 14 containers

**Lý do**:
- ✅ Chạy tất cả cùng lúc với 1 lệnh: `docker-compose up`
- ✅ Tự động kết nối các services
- ✅ Dễ quản lý và scale

---

## 3. CHI TIẾT TỪNG FILE

### 3.1. AI-CORE

#### `ai-core/model.py`
- **Chức năng**: Định nghĩa Neural Network (MLP)
- **Input**: 15 NetFlow features
- **Output**: Xác suất DDoS (0-1)
- **Lý do**: Cần mô hình AI để phân loại DDoS

#### `ai-core/data_generator.py`
- **Chức năng**: Sinh dữ liệu NetFlow giả
- **Input**: ID máy trạm (1, 2, 3)
- **Output**: File CSV với 2000 samples
- **Lý do**: Cần dữ liệu để train, mô phỏng các ISP khác nhau

#### `ai-core/client.py`
- **Chức năng**: FL Client - train cục bộ và gửi weights
- **Input**: ID client, SERVER_ADDRESS từ environment
- **Output**: Weights + metrics gửi về server
- **Lý do**: Cần client để train trên dữ liệu cục bộ (privacy-preserving)

#### `ai-core/server_fedavg.py`
- **Chức năng**: FL Server với chiến lược FedAvg
- **Input**: Weights từ 3 clients
- **Output**: Aggregated weights + metrics gửi lên Backend
- **Lý do**: Cần server để tổng hợp weights và quản lý training rounds

#### `ai-core/server_fedprox.py`
- **Chức năng**: FL Server với chiến lược FedProx
- **Khác biệt**: Thêm `proximal_mu=0.01` để xử lý non-IID
- **Lý do**: So sánh với FedAvg, xem chiến lược nào tốt hơn

#### `ai-core/server_fedopt.py`
- **Chức năng**: FL Server với chiến lược FedOpt
- **Khác biệt**: Dùng adaptive optimizer
- **Lý do**: So sánh với FedAvg và FedProx

#### `ai-core/requirements.txt`
- **Chức năng**: Liệt kê Python dependencies
- **Các packages**: `flwr`, `tensorflow`, `pandas`, `numpy`, `scikit-learn`, `requests`
- **Lý do**: Cần các thư viện này để chạy FL và AI

#### `ai-core/Dockerfile`
- **Chức năng**: Build Docker image cho AI services
- **Base image**: `python:3.9-slim` (không dùng alpine vì TensorFlow)
- **Lý do**: Cần containerize để dễ deploy và quản lý

---

### 3.2. BACKEND-API

#### `backend-api/server.js`
- **Chức năng**: Express server nhận metrics từ FL Servers
- **Endpoints**:
  - `POST /api/log`: Nhận metrics từ FL Servers
  - `GET /api/strategies`: Frontend gọi để lấy dữ liệu
- **Lý do**: Cần trung gian giữa FL Servers và Frontend

#### `backend-api/package.json`
- **Chức năng**: Node.js dependencies
- **Packages**: `express`, `cors`, `socket.io` (nếu cần real-time)
- **Lý do**: Cần Express để tạo API server

#### `backend-api/Dockerfile`
- **Chức năng**: Build Docker image cho Backend
- **Base image**: `node:18-alpine`
- **Lý do**: Containerize Backend

---

### 3.3. FRONTEND-DASHBOARD

#### `frontend-dashboard/src/App.js`
- **Chức năng**: Component chính, hiển thị dashboard
- **Features**:
  - Fetch data từ Backend mỗi 2 giây
  - Hiển thị 3 strategy cards
  - Biểu đồ so sánh 3 strategies
  - Bảng so sánh từng Round
- **Lý do**: Cần UI để demo và theo dõi training

#### `frontend-dashboard/src/index.css`
- **Chức năng**: Styling cho dashboard
- **Theme**: Dark theme, modern UI
- **Lý do**: Dashboard đẹp để demo cho thầy

#### `frontend-dashboard/src/index.js`
- **Chức năng**: Entry point của React app
- **Lý do**: Cần entry point để render App component

#### `frontend-dashboard/package.json`
- **Chức năng**: React dependencies
- **Packages**: `react`, `react-dom`, `chart.js`, `react-chartjs-2`, `axios`
- **Lý do**: Cần các thư viện này để build React app và charts

#### `frontend-dashboard/Dockerfile`
- **Chức năng**: Build Docker image cho Frontend
- **Base image**: `node:18-alpine`
- **Lý do**: Containerize Frontend

---

### 3.4. ROOT

#### `docker-compose.yml`
- **Chức năng**: Orchestration tất cả services
- **Services**: Frontend, Backend, 3 FL Servers, 9 Clients
- **Networks**: Tạo network `mang-ddos` để các services giao tiếp
- **Lý do**: Cần một file để chạy tất cả cùng lúc

#### `Detai.md`
- **Chức năng**: Mô tả đề tài
- **Lý do**: Tài liệu tham khảo khi làm đồ án

---

## 4. LUỒNG HOẠT ĐỘNG

### 4.1. Luồng Dữ Liệu

```
1. Client khởi động
   ├── Đọc dữ liệu từ dataset/may_tram_{ID}.csv
   ├── Nếu chưa có → gọi data_generator.py để sinh
   └── Load model từ model.py

2. Server khởi động
   ├── Khởi tạo mô hình ban đầu (random weights)
   └── Chờ clients kết nối

3. Training Round (lặp lại 5 lần)
   ├── Server gửi weights → Clients
   ├── Clients train cục bộ → Tạo weights mới
   ├── Clients gửi weights + metrics → Server
   ├── Server aggregate weights → Tạo mô hình mới
   ├── Server gửi metrics → Backend API
   └── Backend lưu metrics vào memory

4. Frontend
   ├── Gọi GET /api/strategies mỗi 2 giây
   ├── Nhận metrics từ Backend
   └── Hiển thị biểu đồ và bảng so sánh
```

### 4.2. Luồng Code

**Khởi động**:
```
docker-compose up
    ↓
1. Build images (nếu chưa có)
    ├── ai-core/Dockerfile → Build AI image
    ├── backend-api/Dockerfile → Build Backend image
    └── frontend-dashboard/Dockerfile → Build Frontend image

2. Start containers
    ├── backend-api (port 3000)
    ├── server-fedavg (port 8080)
    ├── server-fedprox (port 8081)
    ├── server-fedopt (port 8082)
    ├── 9 clients (client-fedavg-1,2,3, client-fedprox-1,2,3, client-fedopt-1,2,3)
    └── frontend-dashboard (port 3001)

3. Clients kết nối với Servers
    ├── client-fedavg-1,2,3 → server-fedavg:8080
    ├── client-fedprox-1,2,3 → server-fedprox:8080
    └── client-fedopt-1,2,3 → server-fedopt:8080

4. Training bắt đầu
    └── 5 rounds cho mỗi strategy
```

**Training Process**:
```
Round 1:
    Server → Clients: Gửi initial weights
    Clients → Server: Train cục bộ → Gửi weights mới
    Server → Backend: Aggregate → Gửi metrics
    Backend → Frontend: API response với metrics

Round 2-5: Tương tự, nhưng weights đã tốt hơn
```

---

## 5. CÁCH CHẠY PROJECT

### 5.1. Yêu Cầu
- Docker và Docker Compose đã cài đặt
- Ít nhất 4GB RAM (khuyến nghị 8GB)
- Ít nhất 10GB dung lượng trống

### 5.2. Các Bước

**Bước 1**: Clone/Mở project
```bash
cd ddos-fl-system
```

**Bước 2**: Build và chạy tất cả services
```bash
docker-compose up --build
```

**Bước 3**: Đợi build xong (lần đầu mất ~5-10 phút)

**Bước 4**: Mở browser
```
http://localhost:3001
```

**Bước 5**: Đợi training hoàn thành (~2-3 phút)
- Xem logs trong terminal để theo dõi training
- Dashboard sẽ tự động cập nhật khi có dữ liệu

### 5.3. Dừng Project
```bash
docker-compose down
```

### 5.4. Xem Logs
```bash
# Xem logs tất cả
docker-compose logs

# Xem logs một service cụ thể
docker-compose logs server-fedavg
docker-compose logs client-fedavg-1
```

---

## 6. CÁC VẤN ĐỀ ĐÃ GẶP VÀ CÁCH GIẢI QUYẾT

### 6.1. TensorFlow Không Chạy Trên Alpine
**Vấn đề**: `python:3.9-alpine` không cài được TensorFlow
**Giải pháp**: Dùng `python:3.9-slim` (Debian-based)

### 6.2. Nhiều Clients Cùng Ghi Vào Một File CSV
**Vấn đề**: Race condition khi nhiều clients cùng ghi vào `dataset/may_tram_2.csv`
**Giải pháp**: Xóa volume mapping, mỗi container có dataset riêng

### 6.3. Frontend Không Kết Nối Được Backend
**Vấn đề**: Frontend trong Docker không thể gọi `http://localhost:3000`
**Giải pháp**: Dùng `REACT_APP_BACKEND_URL=http://localhost:3000` trong docker-compose

### 6.4. Build Time Quá Lâu
**Vấn đề**: Build 14 containers mất rất nhiều thời gian
**Giải pháp**: 
- Dùng cache khi có thể
- Giảm số clients từ 3 xuống 2 (sau đó tăng lên 3)
- Tối ưu Dockerfile (multi-stage build)

---

## 7. TÓM TẮT QUY TRÌNH

1. **Thiết kế**: Xác định kiến trúc (3 servers, 9 clients)
2. **AI Core**: Tạo model, data generator, client, servers
3. **Backend**: Tạo API server để nhận metrics
4. **Frontend**: Tạo dashboard để hiển thị
5. **Docker**: Containerize tất cả services
6. **Docker Compose**: Orchestration để chạy cùng lúc
7. **Test**: Chạy và kiểm tra
8. **Fix bugs**: Giải quyết các vấn đề phát sinh
9. **Optimize**: Tối ưu performance và dung lượng
10. **Document**: Viết README và tài liệu

---

## 8. CÁC FILE QUAN TRỌNG NHẤT

### Top 5 Files Quan Trọng Nhất:

1. **`ai-core/client.py`**: Core logic của FL Client
2. **`ai-core/server_fedavg.py`**: Core logic của FL Server
3. **`docker-compose.yml`**: Orchestration toàn bộ hệ thống
4. **`frontend-dashboard/src/App.js`**: UI để demo
5. **`ai-core/model.py`**: Mô hình AI

---

## 9. CÁCH MỞ RỘNG

### Thêm Chiến Lược Mới:
1. Tạo `server_fednova.py` (ví dụ)
2. Copy từ `server_fedavg.py`
3. Thay đổi strategy thành `FedNova`
4. Thêm vào `docker-compose.yml`

### Thêm Client Mới:
1. Thêm `client-fedavg-4` vào `docker-compose.yml`
2. Đổi `command: python client.py 4`
3. Chạy lại `docker-compose up`

### Thêm Metrics Mới:
1. Sửa `client.py` để tính thêm metric
2. Gửi metric trong `return` statement
3. Sửa `server_*.py` để aggregate metric mới
4. Sửa Frontend để hiển thị metric mới

---

## 10. KẾT LUẬN

Đồ án được xây dựng theo quy trình:
1. **Phân tích yêu cầu** → Xác định cần gì
2. **Thiết kế kiến trúc** → Vẽ sơ đồ hệ thống
3. **Implement từng phần** → Code từng file một
4. **Tích hợp** → Kết nối các phần lại với nhau
5. **Test và fix** → Chạy thử và sửa lỗi
6. **Optimize** → Tối ưu performance
7. **Document** → Viết tài liệu

**Điểm quan trọng**:
- ✅ Bắt đầu từ phần đơn giản nhất (model.py)
- ✅ Test từng phần trước khi tích hợp
- ✅ Dùng Docker để đảm bảo môi trường nhất quán
- ✅ Viết code rõ ràng, có comment
- ✅ Tài liệu hóa để dễ maintain sau này

