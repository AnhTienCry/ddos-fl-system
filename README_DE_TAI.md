# 📚 GIẢI THÍCH CHI TIẾT ĐỀ TÀI

## 🎯 ĐỀ TÀI: Phát Hiện Tấn Công DDoS Dựa Vào Federated Learning Tại Hệ Thống Phân Tán

---

## 1. KHÁI NIỆM CƠ BẢN

### 1.1. Tấn Công DDoS Là Gì?

**DDoS (Distributed Denial of Service)** là một loại tấn công mạng:
- **Mục đích**: Làm cho một website hoặc server không thể hoạt động bình thường
- **Cách thức**: Gửi một lượng lớn lưu lượng mạng giả mạo đến server, làm server quá tải
- **Ví dụ thực tế**: 
  - Giống như 1000 người cùng lúc gọi vào một số điện thoại → số điện thoại đó sẽ bận, không ai gọi được vào
  - Hoặc như một cửa hàng bị 1000 người giả vờ vào xem nhưng không mua gì → cửa hàng không phục vụ được khách thật

### 1.2. Federated Learning (FL) Là Gì?

**Federated Learning** là một kỹ thuật học máy phân tán:
- **Ý tưởng**: Thay vì tập trung tất cả dữ liệu về một chỗ để train, ta để dữ liệu ở các máy riêng biệt
- **Cách hoạt động**: 
  - Mỗi máy train mô hình trên dữ liệu của chính nó
  - Chỉ gửi "trọng số mô hình" (weights) về server, KHÔNG gửi dữ liệu gốc
  - Server tổng hợp các weights này để tạo mô hình chung tốt hơn

**Ví dụ đơn giản**:
- Giống như nhiều học sinh học bài ở nhà riêng
- Mỗi học sinh học xong, chỉ gửi "tóm tắt kiến thức" cho giáo viên
- Giáo viên tổng hợp tất cả "tóm tắt" để tạo ra giáo trình tốt nhất
- KHÔNG ai phải gửi toàn bộ sách vở của mình cho giáo viên

### 1.3. Privacy-Preserving (Bảo Mật Dữ Liệu) Là Gì?

**Privacy-Preserving** nghĩa là bảo vệ quyền riêng tư của dữ liệu:
- **Vấn đề**: Các ISP (nhà cung cấp internet) không muốn chia sẻ dữ liệu khách hàng vì:
  - Vi phạm quyền riêng tư
  - Vi phạm luật bảo vệ dữ liệu (GDPR, Luật An Ninh Mạng)
  - Lo ngại đối thủ cạnh tranh biết được thông tin khách hàng

- **Giải pháp**: Federated Learning cho phép:
  - Dữ liệu KHÔNG BAO GIỜ rời khỏi máy của ISP
  - Chỉ gửi "trọng số mô hình" (không phải dữ liệu gốc)
  - Vẫn có thể hợp tác để tạo mô hình tốt hơn

---

## 2. MỤC TIÊU ĐỀ TÀI

### 2.1. Mục Tiêu Chính

> **"Học mô hình chung giữa nhiều ISP hoặc nhiều chi nhánh mà không chia sẻ dữ liệu gốc"**

**Giải thích**:
- **ISP** = Internet Service Provider (Nhà cung cấp internet như VNPT, FPT, Viettel)
- **Chi nhánh** = Các văn phòng/phòng ban khác nhau trong cùng một tổ chức
- **Mô hình chung** = Một mô hình AI có thể phát hiện DDoS tốt hơn vì học từ nhiều nguồn dữ liệu
- **Không chia sẻ dữ liệu gốc** = Dữ liệu NetFlow của khách hàng vẫn ở lại máy của ISP, không gửi đi đâu

### 2.2. Tại Sao Cần Đề Tài Này?

**Vấn đề thực tế**:
1. **Mỗi ISP chỉ có dữ liệu của mình**: 
   - ISP A chỉ thấy lưu lượng của khách hàng A
   - ISP B chỉ thấy lưu lượng của khách hàng B
   - → Mô hình của từng ISP yếu vì thiếu dữ liệu

2. **Không thể chia sẻ dữ liệu**:
   - Luật pháp cấm chia sẻ dữ liệu khách hàng
   - Lo ngại về bảo mật và cạnh tranh

3. **Cần mô hình tốt hơn**:
   - DDoS attacks ngày càng phức tạp
   - Cần phát hiện nhanh và chính xác

**Giải pháp**: Federated Learning cho phép nhiều ISP hợp tác mà không chia sẻ dữ liệu!

---

## 3. CÁCH EM ĐÃ LÀM

### 3.1. Kiến Trúc Hệ Thống

Hệ thống gồm **3 thành phần chính**:

```
┌─────────────────────────────────────────────────┐
│           FRONTEND DASHBOARD                     │
│     (Hiển thị kết quả, biểu đồ, metrics)        │
└─────────────────────────────────────────────────┘
                    ↕ HTTP
┌─────────────────────────────────────────────────┐
│           BACKEND API                           │
│     (Nhận dữ liệu từ FL Servers)                │
└─────────────────────────────────────────────────┘
                    ↕ HTTP
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ FL SERVER 1  │  │ FL SERVER 2  │  │ FL SERVER 3  │
│   (FedAvg)   │  │  (FedProx)   │  │  (FedOpt)    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │  gRPC          │  gRPC          │  gRPC
       │                 │                 │
┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐
│ CLIENT 1,2,3 │  │ CLIENT 1,2,3 │  │ CLIENT 1,2,3 │
│  (ISP-1,2,3) │  │  (ISP-1,2,3) │  │  (ISP-1,2,3) │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Giải thích**:
- **Frontend**: Giao diện web để xem kết quả (React)
- **Backend**: Nhận metrics từ FL Servers và gửi lên Frontend (Node.js)
- **FL Servers**: 3 servers, mỗi server dùng một chiến lược khác nhau (FedAvg, FedProx, FedOpt)
- **Clients**: 9 clients (3 clients × 3 strategies), mỗi client đại diện cho một ISP/chi nhánh

### 3.2. Quy Trình Hoạt Động (Chi Tiết)

#### **Bước 1: Khởi Tạo**
- Mỗi client có dữ liệu NetFlow riêng (mô phỏng ISP khác nhau)
- Server khởi tạo mô hình ban đầu (random weights)

#### **Bước 2: Training Round (Lặp lại 5 lần)**

**Ở Client (ISP)**:
```
1. Nhận weights từ Server (mô hình đã được cải thiện)
2. Train mô hình trên dữ liệu cục bộ (dữ liệu KHÔNG rời khỏi máy)
3. Tính toán metrics: Accuracy, Loss, Precision, Recall, F1-Score
4. Gửi weights mới + metrics về Server
```

**Ở Server**:
```
1. Nhận weights từ tất cả clients (3 clients)
2. Tổng hợp weights theo chiến lược:
   - FedAvg: Tính trung bình weights
   - FedProx: Tính trung bình + thêm proximal term
   - FedOpt: Dùng adaptive optimizer (SGD với momentum)
3. Tạo mô hình mới tốt hơn
4. Gửi metrics lên Backend để hiển thị trên Dashboard
5. Phân phối mô hình mới cho clients (Round tiếp theo)
```

#### **Bước 3: Hiển Thị Kết Quả**
- Backend nhận metrics từ 3 servers
- Frontend hiển thị:
  - Biểu đồ so sánh 3 chiến lược
  - Metrics chi tiết từng strategy
  - Bảng so sánh từng Round

### 3.3. Ví Dụ Cụ Thể

**Ví dụ Round 1 của FedAvg**:

1. **Server gửi mô hình ban đầu** cho 3 clients:
   ```
   Client 1 nhận: weights = [0.1, 0.2, 0.3, ...]
   Client 2 nhận: weights = [0.1, 0.2, 0.3, ...]
   Client 3 nhận: weights = [0.1, 0.2, 0.3, ...]
   ```

2. **Mỗi client train trên dữ liệu riêng**:
   ```
   Client 1 (ISP-1): Train trên 2000 samples NetFlow của ISP-1
   → Sau training: weights = [0.15, 0.25, 0.35, ...]
   → Accuracy: 68.5%
   
   Client 2 (ISP-2): Train trên 2000 samples NetFlow của ISP-2
   → Sau training: weights = [0.12, 0.22, 0.32, ...]
   → Accuracy: 69.2%
   
   Client 3 (ISP-3): Train trên 2000 samples NetFlow của ISP-3
   → Sau training: weights = [0.13, 0.23, 0.33, ...]
   → Accuracy: 70.1%
   ```

3. **Server tổng hợp (FedAvg)**:
   ```
   New weights = (weights_client1 + weights_client2 + weights_client3) / 3
   New weights = [0.133, 0.233, 0.333, ...]
   
   Average Accuracy = (68.5% + 69.2% + 70.1%) / 3 = 69.27%
   ```

4. **Server gửi mô hình mới** cho clients (Round 2):
   ```
   Tất cả clients nhận: weights = [0.133, 0.233, 0.333, ...]
   → Mô hình tốt hơn vì đã học từ 3 nguồn dữ liệu!
   ```

**Điểm quan trọng**: 
- ❌ **KHÔNG** gửi dữ liệu NetFlow (2000 samples)
- ✅ **CHỈ** gửi weights (một mảng số nhỏ)
- ✅ Dữ liệu vẫn ở lại máy của từng ISP

---

## 4. AI ĐƯỢC DÙNG Ở ĐÂU?

### 4.1. Mô Hình AI: Neural Network (MLP)

**File**: `ai-core/model.py`

**Kiến trúc**:
```python
Input Layer (15 features NetFlow)
    ↓
Hidden Layer 1 (64 neurons) + BatchNormalization + Dropout
    ↓
Hidden Layer 2 (32 neurons) + BatchNormalization
    ↓
Hidden Layer 3 (16 neurons)
    ↓
Output Layer (1 neuron) → Sigmoid → Xác suất DDoS (0-1)
```

**Giải thích**:
- **Input**: 15 features NetFlow (Flow Duration, Packet Counts, Byte Rates, ...)
- **Hidden Layers**: Các lớp ẩn để học patterns phức tạp
- **Output**: 1 số từ 0-1:
  - `0.0 - 0.5` = Normal traffic (không phải DDoS)
  - `0.5 - 1.0` = DDoS attack

**Tại sao dùng Neural Network?**
- Có thể học patterns phức tạp từ dữ liệu NetFlow
- Tự động phát hiện các đặc điểm của DDoS attacks
- Có thể cải thiện qua training

### 4.2. AI Trong Training Process

**Ở Client** (`ai-core/client.py`):
```python
# 1. Nhận weights từ Server
model.set_weights(parameters)

# 2. Train trên dữ liệu cục bộ
history = model.fit(X_train, y_train, epochs=3, batch_size=32)

# 3. Tính toán metrics
accuracy = history.history['accuracy'][-1]
loss = history.history['loss'][-1]
f1_score = f1_score(y_train, y_pred)

# 4. Gửi weights mới về Server
return model.get_weights(), len(X_train), metrics
```

**AI làm gì ở đây?**
- **Backpropagation**: Tính toán gradient để cập nhật weights
- **Optimization**: Dùng Adam optimizer để tìm weights tốt nhất
- **Learning**: Học từ dữ liệu NetFlow để phân biệt DDoS và Normal traffic

### 4.3. AI Trong Aggregation (Server)

**FedAvg** (`ai-core/server_fedavg.py`):
```python
# Tổng hợp weights từ 3 clients
avg_weights = (weights_client1 + weights_client2 + weights_client3) / 3
```

**FedProx** (`ai-core/server_fedprox.py`):
```python
# Tổng hợp + thêm proximal term để xử lý non-IID data
strategy = fl.server.strategy.FedProx(
    proximal_mu=0.01  # Regularization parameter
)
```

**FedOpt** (`ai-core/server_fedopt.py`):
```python
# Dùng adaptive optimizer (SGD với momentum)
strategy = fl.server.strategy.FedAvg(
    # Có thể dùng adaptive learning rate
)
```

**AI làm gì ở đây?**
- **Aggregation**: Tổng hợp kiến thức từ nhiều clients
- **Optimization**: Tìm cách tổng hợp tốt nhất để mô hình tốt hơn
- **Adaptation**: Thích ứng với dữ liệu non-IID (khác nhau giữa các ISP)

---

## 5. TẠI SAO LÀM NHƯ VẬY?

### 5.1. Tại Sao Dùng Federated Learning?

**Vấn đề với cách truyền thống**:
- ❌ Phải tập trung tất cả dữ liệu về một chỗ
- ❌ Vi phạm quyền riêng tư
- ❌ Không thể hợp tác giữa các ISP

**Giải pháp Federated Learning**:
- ✅ Dữ liệu không rời khỏi máy của ISP
- ✅ Vẫn có thể hợp tác để tạo mô hình tốt hơn
- ✅ Tuân thủ luật bảo vệ dữ liệu

### 5.2. Tại Sao Có 3 Chiến Lược?

**Mỗi chiến lược có ưu điểm riêng**:
- **FedAvg**: Đơn giản, nhanh, phù hợp dữ liệu IID
- **FedProx**: Xử lý tốt dữ liệu non-IID (khác nhau giữa các ISP)
- **FedOpt**: Hội tụ nhanh hơn với adaptive optimizer

**So sánh để tìm chiến lược tốt nhất** cho bài toán DDoS detection!

### 5.3. Tại Sao Dùng Neural Network?

**Các phương pháp khác**:
- **Rule-based**: Phải viết rules thủ công → không linh hoạt
- **Traditional ML** (SVM, Random Forest): Khó học patterns phức tạp

**Neural Network**:
- ✅ Tự động học patterns từ dữ liệu
- ✅ Có thể cải thiện qua training
- ✅ Phù hợp với dữ liệu lớn và phức tạp

### 5.4. Tại Sao Có 9 Clients?

**3 clients × 3 strategies = 9 clients**

**Lý do**:
- Mỗi strategy cần ít nhất 3 clients để aggregation ổn định
- So sánh công bằng giữa các strategies (cùng số clients)
- Mô phỏng thực tế: nhiều ISP/chi nhánh hợp tác

---

## 6. ĐÓNG GÓP CỦA ĐỀ TÀI

### 6.1. Bảo Mật Dữ Liệu Tổ Chức

- ✅ Dữ liệu NetFlow không rời khỏi máy của ISP
- ✅ Tuân thủ GDPR và Luật An Ninh Mạng
- ✅ Cho phép các tổ chức hợp tác mà không lo ngại về bảo mật

### 6.2. Mô Hình Thích Ứng Liên Tục

- ✅ Mô hình được cải thiện qua các rounds
- ✅ Không cần retrain từ đầu khi có dữ liệu mới
- ✅ Thích ứng với các loại DDoS attacks mới

### 6.3. So Sánh Chiến Lược

- ✅ So sánh 3 chiến lược FL trên cùng một bài toán
- ✅ Tìm chiến lược tốt nhất cho DDoS detection
- ✅ Dashboard trực quan để theo dõi và phân tích

---

## 7. CÁCH TRẢ LỜI KHI THẦY HỎI

### Câu hỏi thường gặp:

**Q: "Em giải thích Federated Learning là gì?"**
A: "Federated Learning là kỹ thuật cho phép nhiều máy tính hợp tác train một mô hình AI mà không cần chia sẻ dữ liệu gốc. Mỗi máy train trên dữ liệu của mình, chỉ gửi trọng số mô hình về server. Server tổng hợp các trọng số này để tạo mô hình chung tốt hơn."

**Q: "Tại sao cần Federated Learning?"**
A: "Vì các ISP không thể chia sẻ dữ liệu khách hàng do luật pháp và lo ngại về bảo mật. Federated Learning cho phép họ hợp tác để tạo mô hình tốt hơn mà vẫn giữ dữ liệu ở máy của mình."

**Q: "AI được dùng ở đâu trong hệ thống?"**
A: "AI được dùng ở 3 chỗ chính: (1) Neural Network để phân loại DDoS, (2) Training process ở client để học từ dữ liệu, (3) Aggregation ở server để tổng hợp kiến thức từ nhiều clients."

**Q: "Tại sao có 3 chiến lược?"**
A: "Để so sánh và tìm chiến lược tốt nhất. FedAvg đơn giản, FedProx xử lý tốt dữ liệu non-IID, FedOpt hội tụ nhanh hơn. Em muốn xem chiến lược nào phù hợp nhất với bài toán DDoS detection."

**Q: "Dữ liệu có thực sự không rời khỏi máy client không?"**
A: "Đúng vậy. Trong code của em, chỉ có `model.get_weights()` được gửi về server, không có `X_train` hay `y_train`. Dữ liệu NetFlow chỉ được đọc và train cục bộ, không bao giờ được gửi đi."

---

## 8. TÓM TẮT

**Đề tài**: Phát hiện DDoS bằng Federated Learning

**Cách làm**: 
- 3 FL Servers (FedAvg, FedProx, FedOpt)
- 9 Clients (mỗi client = một ISP/chi nhánh)
- Mỗi client train mô hình trên dữ liệu riêng
- Chỉ gửi weights về server, không gửi dữ liệu

**AI**: Neural Network (MLP) để phân loại DDoS

**Kết quả**: Mô hình tốt hơn, bảo mật dữ liệu, thích ứng liên tục

**Đóng góp**: Privacy-preserving, so sánh chiến lược, mô hình thích ứng

