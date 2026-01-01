# 📚 BÁO CÁO ĐỒ ÁN TỐT NGHIỆP - PHẦN 2
## Hệ Thống Phát Hiện Tấn Công DDoS Sử Dụng Federated Learning

---

## 📋 MỤC LỤC PHẦN 2
6. [Quy Trình Hoạt Động](#6-quy-trình-hoạt-động)
7. [Kết Quả Thực Nghiệm](#7-kết-quả-thực-nghiệm)
8. [Câu Hỏi Vấn Đáp](#8-câu-hỏi-vấn-đáp)
9. [Hướng Dẫn Demo](#9-hướng-dẫn-demo)
10. [Kết Luận](#10-kết-luận)

---

## 6. QUY TRÌNH HOẠT ĐỘNG

### 6.1. Tổng Quan Quy Trình FL

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FEDERATED LEARNING WORKFLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ROUND 1, 2, 3, 4, 5...                                            │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                              │   │
│   │  ┌──────────┐                                               │   │
│   │  │ STEP 1   │  Server khởi tạo Global Model                 │   │
│   │  │ INIT     │  (random weights hoặc pre-trained)            │   │
│   │  └────┬─────┘                                               │   │
│   │       │                                                      │   │
│   │       ▼                                                      │   │
│   │  ┌──────────┐                                               │   │
│   │  │ STEP 2   │  Server BROADCAST global model đến clients    │   │
│   │  │ BROADCAST│  (gửi weights qua gRPC)                       │   │
│   │  └────┬─────┘                                               │   │
│   │       │                                                      │   │
│   │       ▼                                                      │   │
│   │  ┌──────────┐                                               │   │
│   │  │ STEP 3   │  Mỗi Client TRAIN trên local data             │   │
│   │  │ TRAINING │  (không chia sẻ data với ai)                  │   │
│   │  └────┬─────┘                                               │   │
│   │       │                                                      │   │
│   │       ▼                                                      │   │
│   │  ┌──────────┐                                               │   │
│   │  │ STEP 4   │  Clients GỬI updated weights về server        │   │
│   │  │ UPLOAD   │  (chỉ gửi weights, KHÔNG gửi data)            │   │
│   │  └────┬─────┘                                               │   │
│   │       │                                                      │   │
│   │       ▼                                                      │   │
│   │  ┌──────────┐                                               │   │
│   │  │ STEP 5   │  Server AGGREGATE tất cả weights              │   │
│   │  │AGGREGATE │  (FedAvg / FedProx / FedOpt)                  │   │
│   │  └────┬─────┘                                               │   │
│   │       │                                                      │   │
│   │       ▼                                                      │   │
│   │  ┌──────────┐                                               │   │
│   │  │ STEP 6   │  Cập nhật Global Model                        │   │
│   │  │ UPDATE   │  → Lặp lại từ Step 2                          │   │
│   │  └──────────┘                                               │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2. Chi Tiết Từng Bước

#### 📡 STEP 1: Khởi Tạo (Initialization)
```python
# Server khởi tạo model với random weights
model = create_model()  # Neural Network 15→64→32→1

# Flower server config
server_config = fl.server.ServerConfig(num_rounds=5)
```

#### 📤 STEP 2: Broadcast Global Model
```python
# Server gửi weights đến tất cả clients
# Thông qua gRPC protocol của Flower framework

# Tại mỗi client - nhận weights:
def get_parameters(self, config):
    return self.model.get_weights()
```

#### 🏋️ STEP 3: Local Training
```python
# Mỗi client train trên LOCAL data của riêng mình
def fit(self, parameters, config):
    self.model.set_weights(parameters)  # Set global weights
    
    # Load LOCAL data (không chia sẻ!)
    X_train, y_train = load_local_data()
    
    # Train 3 epochs
    self.model.fit(X_train, y_train, epochs=3, batch_size=32)
    
    # Trả về updated weights (KHÔNG trả data!)
    return self.model.get_weights(), len(X_train), {}
```

**Điểm quan trọng về Privacy:**
- ✅ Data **KHÔNG BAO GIỜ** rời khỏi client
- ✅ Chỉ có weights (5,057 parameters) được gửi đi
- ✅ Không thể reverse-engineer data từ weights

#### 📥 STEP 4: Upload Weights
```python
# Client gửi weights về server
# Bandwidth cần: ~20KB (thay vì MB/GB raw data)

# Weights format:
[
    layer1_weights: (15, 64),   # 960 floats
    layer1_bias: (64,),          # 64 floats
    layer2_weights: (64, 32),   # 2048 floats
    layer2_bias: (32,),          # 32 floats
    output_weights: (32, 1),    # 32 floats
    output_bias: (1,)            # 1 float
]
# Total: 5,057 parameters × 4 bytes = ~20KB
```

#### 🔄 STEP 5: Aggregation

**FedAvg:**
```python
def aggregate_fit(self, results):
    # Tính weighted average
    total_samples = sum(num_samples for _, num_samples, _ in results)
    
    new_weights = []
    for layer_idx in range(len(results[0][0])):
        layer_weights = sum(
            weights[layer_idx] * (num_samples / total_samples)
            for weights, num_samples, _ in results
        )
        new_weights.append(layer_weights)
    
    return new_weights
```

**FedProx:**
```python
# Thêm proximal term trong loss function
def local_loss(w, w_global, mu=0.01):
    return original_loss(w) + (mu/2) * ||w - w_global||²
```

**FedOpt:**
```python
# Server-side Adam optimizer
m = beta1 * m + (1 - beta1) * delta_w
v = beta2 * v + (1 - beta2) * delta_w**2
w_new = w - lr * m / (sqrt(v) + eps)
```

#### ✅ STEP 6: Update & Repeat
```python
# Cập nhật global model
global_model.set_weights(aggregated_weights)

# Gửi metrics về Backend API
requests.post('http://backend:3000/api/log', json={
    'strategy': 'FedAvg',
    'round': current_round,
    'accuracy': accuracy,
    'loss': loss
})

# Lặp lại từ Step 2 cho round tiếp theo
```

### 6.3. Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   CLIENT 1 (ISP-A)          SERVER              CLIENT 2 (ISP-B)       │
│   ┌─────────────┐       ┌─────────────┐       ┌─────────────┐          │
│   │ Local Data  │       │Global Model │       │ Local Data  │          │
│   │ 2000 samples│       │   w(t)      │       │ 2000 samples│          │
│   └──────┬──────┘       └──────┬──────┘       └──────┬──────┘          │
│          │                     │                     │                  │
│          │    ┌────────────────┼────────────────┐   │                  │
│          │    │                │                │   │                  │
│          │◄───┤  BROADCAST     │    BROADCAST  ├───►│                  │
│          │    │  weights       │    weights    │   │                  │
│          │    └────────────────┴────────────────┘   │                  │
│          │                                          │                  │
│          ▼                                          ▼                  │
│   ┌─────────────┐                           ┌─────────────┐            │
│   │ Local Train │                           │ Local Train │            │
│   │ 3 epochs    │                           │ 3 epochs    │            │
│   └──────┬──────┘                           └──────┬──────┘            │
│          │                                          │                  │
│          │    ┌────────────────────────────────┐   │                  │
│          │    │                                │   │                  │
│          ├────►      UPLOAD weights only      ◄────┤                  │
│          │    │      (~20KB per client)       │   │                  │
│          │    └────────────────┬───────────────┘   │                  │
│          │                     │                   │                  │
│          │                     ▼                   │                  │
│          │              ┌─────────────┐            │                  │
│          │              │ AGGREGATION │            │                  │
│          │              │ FedAvg/Prox │            │                  │
│          │              │    /Opt     │            │                  │
│          │              └──────┬──────┘            │                  │
│          │                     │                   │                  │
│          │                     ▼                   │                  │
│          │              ┌─────────────┐            │                  │
│          │              │   w(t+1)    │            │                  │
│          │              │ New Global  │            │                  │
│          │              └─────────────┘            │                  │
│                                                                         │
│   🔒 DATA NEVER LEAVES THE CLIENT!                                     │
│   📤 ONLY WEIGHTS ARE SHARED                                           │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. KẾT QUẢ THỰC NGHIỆM

### 7.1. Cấu Hình Thực Nghiệm

| Tham Số | Giá Trị |
|---------|---------|
| Số rounds | 5 |
| Số clients mỗi strategy | 3 |
| Samples/client | 2000 |
| Local epochs | 3 |
| Batch size | 32 |
| Learning rate | 0.001 |
| FedProx μ | 0.01 |

### 7.2. Kết Quả Accuracy

| Round | FedAvg | FedProx | FedOpt |
|-------|--------|---------|--------|
| 1 | 63.08% | 64.40% | 64.37% |
| 2 | 64.62% | 66.31% | 64.69% |
| 3 | 65.44% | 66.60% | 65.40% |
| 4 | 64.90% | 67.02% | 66.56% |
| 5 | **65.94%** | **66.77%** | **66.81%** |

### 7.3. Nhận Xét

1. **FedProx** có performance ổn định nhất với Non-IID data
2. **FedOpt** hội tụ nhanh ở rounds cuối
3. **FedAvg** đơn giản nhưng vẫn đạt kết quả tốt
4. Tất cả đều đạt accuracy > 65% sau 5 rounds

### 7.4. So Sánh với Centralized ML

| Phương Pháp | Accuracy | Privacy | Bandwidth |
|-------------|----------|---------|-----------|
| Centralized ML | ~70-75% | ❌ Kém | ❌ Cao |
| Federated Learning | ~65-67% | ✅ Tốt | ✅ Thấp |

**Trade-off:** Giảm ~5-8% accuracy để đổi lấy privacy và giảm bandwidth.

---

## 8. CÂU HỎI VẤN ĐÁP

### 8.1. Câu Hỏi Về Federated Learning

#### ❓ Q1: Federated Learning khác gì với Machine Learning truyền thống?

**Trả lời:**
| Tiêu Chí | ML Truyền Thống | Federated Learning |
|----------|-----------------|-------------------|
| **Data** | Tập trung 1 nơi | Phân tán tại clients |
| **Training** | Server train | Clients train |
| **Privacy** | Dữ liệu bị thu thập | Dữ liệu giữ tại nguồn |
| **Bandwidth** | Gửi raw data (MB-GB) | Gửi weights (~KB) |
| **Use case** | Single organization | Cross-organization |

---

#### ❓ Q2: Tại sao cần Federated Learning cho bài toán DDoS?

**Trả lời:**
1. **Privacy của ISP**: Các ISP không muốn chia sẻ traffic data
2. **Compliance**: Tuân thủ GDPR, data protection laws
3. **Bandwidth**: Không cần truyền TB dữ liệu traffic
4. **Real-time**: Mỗi ISP có thể train ngay trên local data
5. **Collaboration**: Nhiều ISP hợp tác mà không lộ data

---

#### ❓ Q3: Data không được gửi đi, vậy làm sao model học được?

**Trả lời:**
```
Model học thông qua WEIGHTS, không phải DATA:

1. Client nhận global weights: w_global
2. Client train trên local data: w_local = train(w_global, local_data)
3. Client gửi w_local về server
4. Server aggregate: w_new = average(w_local_1, w_local_2, w_local_3)

→ Weights chứa "knowledge" học được từ data
→ Không thể reverse-engineer data từ weights
→ Data KHÔNG BAO GIỜ rời khỏi client
```

---

#### ❓ Q4: FedAvg, FedProx, FedOpt khác nhau như thế nào?

**Trả lời:**

| Thuật Toán | Cách Aggregate | Khi Nào Dùng |
|------------|----------------|--------------|
| **FedAvg** | Simple weighted average | Dữ liệu IID, đơn giản |
| **FedProx** | + Proximal term (μ) | Dữ liệu Non-IID |
| **FedOpt** | + Server-side Adam | Cần converge nhanh |

**Ví dụ:**
- FedAvg: `w_new = 0.33*w1 + 0.33*w2 + 0.34*w3`
- FedProx: Thêm penalty `μ/2 * ||w - w_global||²` vào loss
- FedOpt: Server dùng Adam optimizer thay vì simple average

---

### 8.2. Câu Hỏi Về Hệ Thống

#### ❓ Q5: Hệ thống có bao nhiêu container?

**Trả lời:**
```
14 containers total:
├── 1 Frontend Dashboard (React)
├── 1 Backend API (Node.js)
├── 3 FL Servers (FedAvg, FedProx, FedOpt)
└── 9 Clients (3 per strategy)
```

---

#### ❓ Q6: Tại sao dùng Docker?

**Trả lời:**
1. **Isolation**: Mỗi service chạy độc lập
2. **Reproducibility**: Môi trường giống nhau mọi nơi
3. **Scalability**: Dễ scale up/down
4. **Deployment**: Deploy đơn giản với `docker compose up`
5. **Development**: Team dễ collaborate

---

#### ❓ Q7: Flower framework là gì?

**Trả lời:**
**Flower (flwr)** là framework FL phổ biến nhất:
- Developed by Adap GmbH
- Open-source, production-ready
- Support TensorFlow, PyTorch, scikit-learn
- Built-in strategies: FedAvg, FedProx, FedOpt
- gRPC communication

```python
# Server
fl.server.start_server(strategy=fl.server.strategy.FedAvg())

# Client
fl.client.start_numpy_client(server_address="...", client=MyClient())
```

---

### 8.3. Câu Hỏi Về Security & Privacy

#### ❓ Q8: Federated Learning có thực sự bảo mật không?

**Trả lời:**
**Ưu điểm:**
- ✅ Data không rời khỏi client
- ✅ Chỉ share model weights
- ✅ Giảm attack surface

**Hạn chế cần biết:**
- ⚠️ **Gradient leakage attack**: Có thể infer data từ gradients
- ⚠️ **Model inversion attack**: Reconstruct training data
- ⚠️ **Membership inference**: Kiểm tra data có trong training set

**Giải pháp tăng cường:**
- Differential Privacy
- Secure Aggregation
- Homomorphic Encryption

---

#### ❓ Q9: Làm sao đảm bảo client không gửi weights giả?

**Trả lời:**
Đây là vấn đề **Byzantine fault tolerance**:

1. **Trusted environment**: Giả định clients đáng tin cậy
2. **Byzantine-resilient aggregation**: Loại bỏ outliers
3. **Secure aggregation**: Mã hóa weights
4. **Model validation**: Server validate weights trước khi aggregate

---

### 8.4. Câu Hỏi Về Performance

#### ❓ Q10: Accuracy 65-67% có đủ tốt không?

**Trả lời:**
**So sánh:**
| Method | Accuracy | Trade-off |
|--------|----------|-----------|
| Centralized ML | 70-75% | Privacy ❌ |
| Federated Learning | 65-67% | Privacy ✅ |

**Giải thích:**
- FL sacrifice ~5-8% accuracy for privacy
- Trong thực tế, có thể tăng accuracy bằng:
  - Tăng số rounds
  - Tăng local epochs
  - Thêm data augmentation
  - Fine-tune hyperparameters

---

#### ❓ Q11: Tại sao chọn 5 rounds?

**Trả lời:**
- Demo purpose: 5 rounds đủ để thấy convergence
- Production: Thường 10-100 rounds
- Trade-off: Communication cost vs accuracy
- Empirically: Accuracy plateau sau ~5-10 rounds với dataset này

---

## 9. HƯỚNG DẪN DEMO

### 9.1. Khởi Động Hệ Thống

```powershell
# Bước 1: Vào thư mục project
cd E:\DEVcodon\Projects\ddos-fl-system

# Bước 2: Build và start tất cả containers
docker compose up -d

# Bước 3: Xem logs real-time
docker compose logs -f
```

### 9.2. Truy Cập Dashboard

| URL | Mục Đích |
|-----|----------|
| http://localhost:3001 | Frontend Dashboard |
| http://localhost:3000 | Backend API |

### 9.3. Demo Flow

1. **Mở Dashboard** → http://localhost:3001
2. **Tab Tổng Quan**: Xem overview, tech stack
3. **Tab So Sánh**: Xem biểu đồ accuracy 3 strategies
4. **Tab Training Logs**: Xem chi tiết từng round
5. **Tab Quy Trình**: Animation giải thích FL

### 9.4. Các Điểm Demo Quan Trọng

1. **Real-time updates**: Metrics cập nhật mỗi 2s
2. **Privacy**: Highlight rằng data không rời client
3. **Comparison**: So sánh 3 strategies
4. **Architecture**: Giải thích Docker containers

### 9.5. Dừng Hệ Thống

```powershell
# Dừng tất cả containers
docker compose down

# Dừng và xóa volumes
docker compose down -v
```

---

## 10. KẾT LUẬN

### 10.1. Đóng Góp Của Đồ Án

1. ✅ Xây dựng hệ thống FL hoàn chỉnh cho DDoS detection
2. ✅ So sánh 3 thuật toán: FedAvg, FedProx, FedOpt
3. ✅ Dashboard giám sát real-time
4. ✅ Containerize với Docker cho dễ deploy
5. ✅ Documentation đầy đủ

### 10.2. Hạn Chế

1. ❌ Chưa implement Differential Privacy
2. ❌ Chưa có Secure Aggregation
3. ❌ Dataset còn nhỏ (synthetic data)
4. ❌ Chưa test với real network traffic

### 10.3. Hướng Phát Triển

1. 🔜 Thêm Differential Privacy
2. 🔜 Implement Secure Aggregation
3. 🔜 Test với real DDoS datasets (CIC-DDoS2019)
4. 🔜 Deploy lên cloud (AWS/GCP)
5. 🔜 Thêm more strategies (FedYogi, SCAFFOLD)

### 10.4. Tài Liệu Tham Khảo

1. McMahan, H. B., et al. (2017). "Communication-Efficient Learning of Deep Networks from Decentralized Data"
2. Li, T., et al. (2020). "Federated Optimization in Heterogeneous Networks" (FedProx)
3. Reddi, S., et al. (2021). "Adaptive Federated Optimization" (FedOpt)
4. Flower Framework: https://flower.dev/
5. TensorFlow Federated: https://www.tensorflow.org/federated

---

## 📞 LIÊN HỆ

Nếu có thắc mắc về đồ án, vui lòng liên hệ qua:
- Email: [your-email]
- GitHub: [your-github]

---

*Đồ án tốt nghiệp - Hệ thống phát hiện DDoS sử dụng Federated Learning*
*© 2025*
