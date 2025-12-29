# 📖 GIẢI THÍCH THUẬT NGỮ CHUYÊN NGÀNH

## MỤC LỤC
1. [Federated Learning (FL)](#1-federated-learning-fl)
2. [FedAvg, FedProx, FedOpt](#2-fedavg-fedprox-fedopt)
3. [Privacy-Preserving](#3-privacy-preserving)
4. [NetFlow](#4-netflow)
5. [Non-IID Data](#5-non-iid-data)
6. [Neural Network & MLP](#6-neural-network--mlp)
7. [Weights & Aggregation](#7-weights--aggregation)
8. [Training Round](#8-training-round)
9. [Metrics](#9-metrics)

---

## 1. FEDERATED LEARNING (FL)

### Khái Niệm
**Federated Learning** = Học máy phân tán, không tập trung dữ liệu

### Cách Hoạt Động
```
TRADITIONAL ML (Cách cũ):
Dữ liệu ISP-1 ──┐
Dữ liệu ISP-2 ──┤──> Server ──> Train Model ──> Mô hình
Dữ liệu ISP-3 ──┘
❌ Vấn đề: Phải chia sẻ dữ liệu

FEDERATED LEARNING (Cách mới):
ISP-1: Train cục bộ ──> Gửi weights ──┐
ISP-2: Train cục bộ ──> Gửi weights ──┤──> Server ──> Aggregate ──> Mô hình
ISP-3: Train cục bộ ──> Gửi weights ──┘
✅ Giải pháp: Chỉ gửi weights, không gửi dữ liệu
```

### Tại Sao Cần FL?
- **Bảo mật**: Dữ liệu không rời khỏi máy của chủ sở hữu
- **Tuân thủ luật**: GDPR, Luật An Ninh Mạng
- **Hợp tác**: Nhiều tổ chức có thể hợp tác mà không lo ngại về bảo mật

### Ví Dụ Thực Tế
- **Google Keyboard**: FL để cải thiện gợi ý từ mà không gửi nội dung tin nhắn lên server
- **Apple**: FL để cải thiện Siri mà không gửi giọng nói của người dùng
- **Đề tài này**: FL để phát hiện DDoS mà không chia sẻ dữ liệu NetFlow giữa các ISP

---

## 2. FEDAVG, FEDPROX, FEDOPT

### 2.1. FedAvg (Federated Averaging)

**Khái niệm**: Chiến lược cơ bản nhất, tính trung bình weights từ các clients

**Công thức**:
```
New_Weights = (Weights_Client1 + Weights_Client2 + ... + Weights_ClientN) / N
```

**Cách hoạt động**:
1. Server gửi mô hình ban đầu cho tất cả clients
2. Mỗi client train trên dữ liệu riêng → tạo weights mới
3. Server nhận weights từ tất cả clients
4. Server tính trung bình các weights → tạo mô hình mới
5. Lặp lại từ bước 1

**Ưu điểm**:
- ✅ Đơn giản, dễ hiểu
- ✅ Nhanh (chỉ tính trung bình)
- ✅ Phù hợp khi dữ liệu IID (giống nhau giữa các clients)

**Nhược điểm**:
- ❌ Không tốt với dữ liệu non-IID (khác nhau nhiều)
- ❌ Có thể hội tụ chậm hoặc không hội tụ nếu dữ liệu quá khác nhau

**Khi nào dùng**: Khi các ISP có dữ liệu tương tự nhau

**Ví dụ trong code**:
```python
# ai-core/server_fedavg.py
strategy = fl.server.strategy.FedAvg(
    min_fit_clients=3,  # Cần ít nhất 3 clients
    fit_metrics_aggregation_fn=fit_metrics_aggregation_fn
)
```

---

### 2.2. FedProx (Federated Proximal)

**Khái niệm**: FedAvg + thêm "proximal term" để xử lý dữ liệu non-IID

**Công thức**:
```
Loss = Local_Loss + μ × ||weights - global_weights||²
```
- `μ` (mu) = proximal parameter (thường = 0.01)
- `||weights - global_weights||²` = khoảng cách giữa weights cục bộ và weights toàn cục

**Cách hoạt động**:
1. Giống FedAvg, nhưng khi train ở client:
   - Thêm một "hình phạt" nếu weights cục bộ quá khác với weights toàn cục
   - Điều này giúp các clients không đi quá xa nhau

**Ưu điểm**:
- ✅ Xử lý tốt dữ liệu non-IID (khác nhau giữa các ISP)
- ✅ Hội tụ ổn định hơn FedAvg
- ✅ Phù hợp khi các ISP có dữ liệu khác nhau

**Nhược điểm**:
- ❌ Phức tạp hơn FedAvg
- ❌ Cần điều chỉnh parameter `μ`

**Khi nào dùng**: Khi các ISP có dữ liệu khác nhau (ví dụ: ISP thành phố vs ISP nông thôn)

**Ví dụ trong code**:
```python
# ai-core/server_fedprox.py
strategy = fl.server.strategy.FedProx(
    min_fit_clients=3,
    proximal_mu=0.01,  # Regularization parameter
    fit_metrics_aggregation_fn=fit_metrics_aggregation_fn
)
```

**Giải thích proximal term**:
- Giống như một "sợi dây" kéo các clients lại gần nhau
- Nếu một client train quá nhiều và weights của nó khác xa với weights chung → bị "hình phạt"
- Giúp mô hình không bị "phân tán" quá nhiều

---

### 2.3. FedOpt (Federated Optimization)

**Khái niệm**: FedAvg + dùng adaptive optimizer (như SGD với momentum)

**Cách hoạt động**:
1. Giống FedAvg, nhưng khi aggregate:
   - Không chỉ tính trung bình đơn giản
   - Dùng optimizer thông minh hơn (như Adam, SGD với momentum)
   - Tự động điều chỉnh learning rate

**Ưu điểm**:
- ✅ Hội tụ nhanh hơn FedAvg
- ✅ Tự động điều chỉnh learning rate
- ✅ Phù hợp với dữ liệu lớn và phức tạp

**Nhược điểm**:
- ❌ Phức tạp hơn FedAvg
- ❌ Cần điều chỉnh hyperparameters

**Khi nào dùng**: Khi muốn mô hình hội tụ nhanh và chính xác

**Ví dụ trong code**:
```python
# ai-core/server_fedopt.py
# (Trong code này, em dùng FedAvg làm base, có thể nâng cấp thành FedOpt thật)
strategy = fl.server.strategy.FedAvg(
    min_fit_clients=3,
    fit_metrics_aggregation_fn=fit_metrics_aggregation_fn
)
```

**Giải thích adaptive optimizer**:
- **Learning rate**: Tốc độ học của mô hình
- **Adaptive**: Tự động điều chỉnh
- **Momentum**: Giống như quán tính, giúp mô hình không bị "dao động" quá nhiều

---

### 2.4. So Sánh 3 Chiến Lược

| Tiêu chí | FedAvg | FedProx | FedOpt |
|----------|--------|---------|--------|
| **Độ phức tạp** | Đơn giản | Trung bình | Phức tạp |
| **Tốc độ hội tụ** | Chậm | Trung bình | Nhanh |
| **Dữ liệu IID** | ✅ Tốt | ✅ Tốt | ✅ Tốt |
| **Dữ liệu non-IID** | ❌ Kém | ✅ Tốt | ✅ Tốt |
| **Ổn định** | Trung bình | ✅ Cao | Trung bình |

**Kết luận**:
- **FedAvg**: Dùng khi dữ liệu giống nhau, cần đơn giản
- **FedProx**: Dùng khi dữ liệu khác nhau (non-IID)
- **FedOpt**: Dùng khi muốn hội tụ nhanh

**Trong đề tài này**: So sánh cả 3 để tìm chiến lược tốt nhất cho DDoS detection!

---

## 3. PRIVACY-PRESERVING

### Khái Niệm
**Privacy-Preserving** = Bảo vệ quyền riêng tư của dữ liệu

### Vấn Đề
- Các ISP không muốn chia sẻ dữ liệu khách hàng
- Vi phạm luật pháp (GDPR, Luật An Ninh Mạng)
- Lo ngại về bảo mật và cạnh tranh

### Giải Pháp: Federated Learning

**Dữ liệu KHÔNG rời khỏi máy của ISP**:
```
❌ CÁCH CŨ:
ISP-1 ──> Gửi 10,000 records NetFlow ──> Server
ISP-2 ──> Gửi 10,000 records NetFlow ──> Server
→ Vi phạm privacy!

✅ CÁCH MỚI (FL):
ISP-1 ──> Train cục bộ ──> Gửi weights (chỉ vài KB) ──> Server
ISP-2 ──> Train cục bộ ──> Gửi weights (chỉ vài KB) ──> Server
→ Dữ liệu vẫn ở máy ISP, chỉ gửi weights!
```

**Ví dụ trong code**:
```python
# ai-core/client.py
def fit(self, parameters, config):
    # Train trên dữ liệu cục bộ
    history = model.fit(X_train, y_train, ...)  # Dữ liệu không rời khỏi đây!
    
    # CHỈ gửi weights, KHÔNG gửi X_train, y_train
    return model.get_weights(), len(X_train), metrics
    # ❌ KHÔNG return X_train, y_train
```

### Tại Sao An Toàn?
- **Weights không chứa thông tin cá nhân**: Chỉ là các số học được từ dữ liệu
- **Không thể reverse engineering**: Không thể tái tạo dữ liệu gốc từ weights
- **Tuân thủ luật**: Dữ liệu không rời khỏi máy của chủ sở hữu

---

## 4. NETFLOW

### Khái Niệm
**NetFlow** = Giao thức để thu thập thông tin về lưu lượng mạng

### NetFlow Features (15 features trong đề tài)

1. **Flow Duration**: Thời gian của một flow (kết nối)
2. **Total Fwd Packets**: Tổng số gói tin gửi đi
3. **Total Backward Packets**: Tổng số gói tin nhận về
4. **Total Length of Fwd Packets**: Tổng kích thước gói tin gửi đi
5. **Total Length of Bwd Packets**: Tổng kích thước gói tin nhận về
6. **Flow Bytes/s**: Tốc độ bytes/giây
7. **Flow Packets/s**: Tốc độ packets/giây
8. **Fwd Packet Length Mean**: Kích thước trung bình gói tin gửi đi
9. **Bwd Packet Length Mean**: Kích thước trung bình gói tin nhận về
10. **Flow IAT Mean**: Thời gian giữa các gói tin (Inter-Arrival Time)
11. **Fwd IAT Total**: Tổng thời gian IAT gửi đi
12. **Bwd IAT Total**: Tổng thời gian IAT nhận về
13. **Fwd Header Length**: Độ dài header gửi đi
14. **Bwd Header Length**: Độ dài header nhận về
15. **Protocol**: Giao thức (TCP=0, UDP=1, ICMP=2)

### Tại Sao Dùng NetFlow?
- ✅ Chuẩn công nghiệp: Được dùng rộng rãi trong network monitoring
- ✅ Phù hợp phát hiện DDoS: Các đặc điểm của DDoS thể hiện rõ trong NetFlow
- ✅ Dễ thu thập: Router/switch có thể export NetFlow data

### Ví Dụ DDoS Attack trong NetFlow
- **Flow Duration**: Rất ngắn (vài giây)
- **Flow Packets/s**: Rất cao (hàng nghìn packets/giây)
- **Flow Bytes/s**: Rất cao
- **Protocol**: Thường là UDP hoặc ICMP (dễ spoof)

---

## 5. NON-IID DATA

### Khái Niệm
**IID** = Independent and Identically Distributed (Độc lập và phân phối giống nhau)
**Non-IID** = Không độc lập hoặc phân phối khác nhau

### Ví Dụ

**IID Data** (Giống nhau):
```
ISP-1: 70% Normal, 30% DDoS
ISP-2: 70% Normal, 30% DDoS
ISP-3: 70% Normal, 30% DDoS
→ Giống nhau → FedAvg hoạt động tốt
```

**Non-IID Data** (Khác nhau):
```
ISP-1 (Thành phố): 30% Normal, 70% DDoS (nhiều attacks)
ISP-2 (Nông thôn): 70% Normal, 30% DDoS (ít attacks)
ISP-3 (Doanh nghiệp): 50% Normal, 50% DDoS (cân bằng)
→ Khác nhau → FedAvg có thể không tốt, cần FedProx
```

### Tại Sao Non-IID Là Vấn Đề?
- **FedAvg giả định dữ liệu IID**: Nếu dữ liệu khác nhau, aggregation có thể không tốt
- **Mô hình có thể bias**: Nếu một ISP có nhiều dữ liệu hơn, mô hình có thể nghiêng về ISP đó

### Giải Pháp: FedProx
- Thêm proximal term để "kéo" các clients lại gần nhau
- Giúp mô hình không bị bias về một client cụ thể

### Trong Đề Tài
```python
# ai-core/data_generator.py
if id_may_tram == 1:
    df['Label'] = np.random.choice([0, 1], p=[0.3, 0.7])  # 70% DDoS
elif id_may_tram == 2:
    df['Label'] = np.random.choice([0, 1], p=[0.7, 0.3])  # 30% DDoS
else:
    df['Label'] = np.random.choice([0, 1], p=[0.5, 0.5])  # 50% DDoS
```
→ Mô phỏng non-IID data để test FedProx!

---

## 6. NEURAL NETWORK & MLP

### Khái Niệm
**Neural Network** = Mạng nơ-ron nhân tạo, mô phỏng cách não người hoạt động
**MLP** = Multi-Layer Perceptron (Mạng nơ-ron nhiều lớp)

### Cấu Trúc

```
Input Layer (15 neurons) ──> Nhận NetFlow features
    ↓
Hidden Layer 1 (64 neurons) ──> Học patterns phức tạp
    ↓
Hidden Layer 2 (32 neurons) ──> Học patterns cao cấp hơn
    ↓
Hidden Layer 3 (16 neurons) ──> Tổng hợp thông tin
    ↓
Output Layer (1 neuron) ──> Dự đoán: DDoS hay không?
```

### Cách Hoạt Động

1. **Forward Pass**: Dữ liệu đi từ input → output
   ```
   Input (15 features) → Layer 1 → Layer 2 → Layer 3 → Output (0-1)
   ```

2. **Backward Pass**: Tính toán lỗi và cập nhật weights
   ```
   Output (dự đoán sai) → Tính lỗi → Cập nhật weights ngược lại
   ```

3. **Training**: Lặp lại nhiều lần để học

### Tại Sao Dùng MLP?
- ✅ Tự động học patterns từ dữ liệu
- ✅ Phù hợp với dữ liệu phức tạp như NetFlow
- ✅ Có thể cải thiện qua training

### Trong Code
```python
# ai-core/model.py
model = Sequential([
    Dense(64, activation='relu', input_shape=(15,)),  # Input: 15 features
    BatchNormalization(),
    Dropout(0.2),
    Dense(32, activation='relu'),
    BatchNormalization(),
    Dense(16, activation='relu'),
    Dense(1, activation='sigmoid')  # Output: 0-1 (xác suất DDoS)
])
```

---

## 7. WEIGHTS & AGGREGATION

### Weights Là Gì?
**Weights** = Trọng số của mô hình, các số học được từ dữ liệu

**Ví dụ**:
```
Neuron 1: weight = 0.5
Neuron 2: weight = -0.3
Neuron 3: weight = 0.8
...
→ Tổng cộng có hàng nghìn weights trong một mô hình
```

### Aggregation Là Gì?
**Aggregation** = Tổng hợp weights từ nhiều clients để tạo mô hình chung

**FedAvg Aggregation**:
```python
# Server nhận weights từ 3 clients
weights_client1 = [0.5, -0.3, 0.8, ...]
weights_client2 = [0.6, -0.2, 0.7, ...]
weights_client3 = [0.4, -0.4, 0.9, ...]

# Tính trung bình
weights_global = (weights_client1 + weights_client2 + weights_client3) / 3
weights_global = [0.5, -0.3, 0.8, ...]  # Mô hình mới tốt hơn!
```

### Tại Sao Aggregation Hoạt Động?
- **Mỗi client học từ dữ liệu riêng**: Có kiến thức riêng
- **Aggregation tổng hợp kiến thức**: Mô hình chung học được từ tất cả clients
- **Mô hình tốt hơn**: Vì đã học từ nhiều nguồn dữ liệu

---

## 8. TRAINING ROUND

### Khái Niệm
**Training Round** = Một vòng huấn luyện hoàn chỉnh

### Quy Trình Một Round

```
Round 1:
1. Server gửi mô hình ban đầu → Clients
2. Clients train trên dữ liệu riêng → Tạo weights mới
3. Clients gửi weights về Server
4. Server aggregate weights → Tạo mô hình mới
5. Server gửi mô hình mới → Clients (Round 2)

Round 2:
1. Clients nhận mô hình mới (đã tốt hơn)
2. Clients train tiếp → Tạo weights tốt hơn
3. ...
```

### Tại Sao Cần Nhiều Rounds?
- **Round 1**: Mô hình ban đầu yếu
- **Round 2**: Mô hình tốt hơn một chút
- **Round 3**: Mô hình tốt hơn nữa
- ...
- **Round 5**: Mô hình đã tốt!

**Giống như học bài**:
- Lần 1: Chưa hiểu
- Lần 2: Hiểu một chút
- Lần 3: Hiểu nhiều hơn
- ...
- Lần 5: Đã hiểu rõ!

### Trong Đề Tài
- **5 rounds**: Đủ để mô hình hội tụ tốt
- **Mỗi round**: Cải thiện accuracy một chút
- **Kết quả**: Accuracy tăng từ ~68% → ~72%

---

## 9. METRICS

### Accuracy (Độ Chính Xác)
**Công thức**: `Accuracy = (Số dự đoán đúng) / (Tổng số dự đoán)`

**Ví dụ**:
- 1000 samples
- 900 dự đoán đúng
- Accuracy = 900/1000 = 90%

**Trong đề tài**: Accuracy tăng từ ~68% → ~72% qua 5 rounds

### Loss (Lỗi)
**Khái niệm**: Độ sai lệch giữa dự đoán và thực tế

**Ví dụ**:
- Dự đoán: 0.8 (80% là DDoS)
- Thực tế: 1.0 (100% là DDoS)
- Loss = |0.8 - 1.0| = 0.2

**Trong đề tài**: Loss giảm từ ~0.61 → ~0.57 (càng thấp càng tốt)

### Precision (Độ Chính Xác Dương)
**Công thức**: `Precision = TP / (TP + FP)`

**Ví dụ**:
- Dự đoán DDoS: 100 lần
- Thực sự DDoS: 80 lần
- Precision = 80/100 = 80%

**Ý nghĩa**: Trong số các dự đoán DDoS, bao nhiêu % thực sự là DDoS?

### Recall (Độ Nhạy)
**Công thức**: `Recall = TP / (TP + FN)`

**Ví dụ**:
- Thực sự DDoS: 100 lần
- Dự đoán đúng DDoS: 80 lần
- Recall = 80/100 = 80%

**Ý nghĩa**: Trong số các DDoS thực sự, bao nhiêu % được phát hiện?

### F1-Score
**Công thức**: `F1 = 2 × (Precision × Recall) / (Precision + Recall)`

**Ý nghĩa**: Cân bằng giữa Precision và Recall

**Ví dụ**:
- Precision = 80%
- Recall = 80%
- F1 = 2 × (0.8 × 0.8) / (0.8 + 0.8) = 0.8 = 80%

**Trong đề tài**: F1-Score tăng qua các rounds, cho thấy mô hình tốt hơn

---

## TÓM TẮT

| Thuật ngữ | Ý nghĩa | Ví dụ |
|-----------|---------|-------|
| **Federated Learning** | Học máy phân tán, không tập trung dữ liệu | Nhiều ISP hợp tác mà không chia sẻ dữ liệu |
| **FedAvg** | Tính trung bình weights | Đơn giản, phù hợp IID |
| **FedProx** | FedAvg + proximal term | Xử lý non-IID tốt |
| **FedOpt** | FedAvg + adaptive optimizer | Hội tụ nhanh |
| **Privacy-Preserving** | Bảo vệ quyền riêng tư | Dữ liệu không rời khỏi máy ISP |
| **NetFlow** | Giao thức thu thập lưu lượng mạng | 15 features về packets, bytes, duration |
| **Non-IID** | Dữ liệu khác nhau giữa clients | ISP thành phố vs ISP nông thôn |
| **Weights** | Trọng số của mô hình | Các số học được từ dữ liệu |
| **Aggregation** | Tổng hợp weights | Tính trung bình weights từ nhiều clients |
| **Training Round** | Một vòng huấn luyện | 5 rounds để mô hình hội tụ |

---

## CÁCH TRẢ LỜI KHI THẦY HỎI

**Q: "Em giải thích FedAvg, FedProx, FedOpt khác nhau như thế nào?"**
A: "FedAvg tính trung bình weights, đơn giản nhưng không tốt với dữ liệu non-IID. FedProx thêm proximal term để xử lý non-IID tốt hơn. FedOpt dùng adaptive optimizer để hội tụ nhanh hơn."

**Q: "Tại sao cần 3 chiến lược?"**
A: "Để so sánh và tìm chiến lược tốt nhất cho bài toán DDoS detection. Mỗi chiến lược có ưu nhược điểm riêng, em muốn xem chiến lược nào phù hợp nhất."

**Q: "Non-IID là gì? Tại sao là vấn đề?"**
A: "Non-IID nghĩa là dữ liệu khác nhau giữa các clients. Ví dụ ISP thành phố có nhiều DDoS hơn ISP nông thôn. FedAvg giả định dữ liệu giống nhau, nên không tốt với non-IID. FedProx giải quyết vấn đề này bằng proximal term."

**Q: "Privacy-preserving được đảm bảo như thế nào?"**
A: "Dữ liệu NetFlow không bao giờ rời khỏi máy của ISP. Chỉ có weights được gửi về server. Weights không chứa thông tin cá nhân và không thể reverse engineering để tái tạo dữ liệu gốc."

