# 📋 BÁO CÁO TÓM TẮT ĐỀ TÀI

## ĐỀ TÀI
**Phát Hiện Tấn Công DDoS Dựa Vào Federated Learning Tại Hệ Thống Phân Tán**

---

## MỤC TIÊU
Học mô hình chung giữa nhiều ISP hoặc nhiều chi nhánh mà **không chia sẻ dữ liệu gốc**, đảm bảo privacy-preserving và tạo mô hình thích ứng liên tục.

---

## KỸ THUẬT SỬ DỤNG

### 1. Federated Learning (FL)
- **FedAvg**: Federated Averaging - tính trung bình weights
- **FedProx**: Thêm proximal term để xử lý non-IID data
- **FedOpt**: Dùng adaptive optimizer để hội tụ nhanh

### 2. Privacy-Preserving
- Dữ liệu NetFlow không rời khỏi máy của ISP
- Chỉ gửi weights (trọng số mô hình) về server
- Tuân thủ GDPR và Luật An Ninh Mạng

### 3. Neural Network (MLP)
- Multi-Layer Perceptron với 15 NetFlow features
- Binary classification: DDoS (1) hoặc Normal (0)
- Architecture: 15 → 64 → 32 → 16 → 1 neurons

---

## KIẾN TRÚC HỆ THỐNG

```
Frontend Dashboard (React)
    ↕ HTTP
Backend API (Node.js)
    ↕ HTTP
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ FL Server 1 │  │ FL Server 2 │  │ FL Server 3 │
│   FedAvg    │  │   FedProx   │  │   FedOpt    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       │  gRPC          │  gRPC          │  gRPC
       │                │                │
┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐
│ Client 1,2,3│  │ Client 1,2,3│  │ Client 1,2,3│
│  (ISP-1,2,3)│  │  (ISP-1,2,3)│  │  (ISP-1,2,3)│
└─────────────┘  └─────────────┘  └─────────────┘
```

**Tổng cộng**: 3 FL Servers + 9 Clients (3 clients × 3 strategies)

---

## QUY TRÌNH HOẠT ĐỘNG

### 1. Khởi Tạo
- Mỗi client có dữ liệu NetFlow riêng (2000 samples)
- Server khởi tạo mô hình ban đầu (random weights)

### 2. Training Round (5 rounds)
**Ở Client**:
- Nhận weights từ Server
- Train mô hình trên dữ liệu cục bộ
- Tính metrics: Accuracy, Loss, Precision, Recall, F1-Score
- Gửi weights mới + metrics về Server

**Ở Server**:
- Nhận weights từ 3 clients
- Aggregate weights theo chiến lược (FedAvg/FedProx/FedOpt)
- Tạo mô hình mới tốt hơn
- Gửi metrics lên Backend
- Phân phối mô hình mới cho clients

### 3. Hiển Thị Kết Quả
- Dashboard hiển thị biểu đồ so sánh 3 chiến lược
- Metrics chi tiết từng strategy
- Bảng so sánh từng Round

---

## DỮ LIỆU

### NetFlow Features (15 features)
- Flow Duration, Packet Counts, Byte Rates
- Packet Length Statistics, Inter-Arrival Time
- Header Length, Protocol (TCP/UDP/ICMP)

### Non-IID Distribution
- **ISP-1**: 70% DDoS, 30% Normal (nhiều attacks)
- **ISP-2**: 30% DDoS, 70% Normal (ít attacks)
- **ISP-3**: 50% DDoS, 50% Normal (cân bằng)

---

## KẾT QUẢ

### Metrics Cải Thiện Qua 5 Rounds
- **Accuracy**: Tăng từ ~68% → ~72%
- **Loss**: Giảm từ ~0.61 → ~0.57
- **F1-Score**: Tăng dần qua các rounds

### So Sánh 3 Chiến Lược
- **FedAvg**: Đơn giản, phù hợp IID data
- **FedProx**: Xử lý tốt non-IID data
- **FedOpt**: Hội tụ nhanh với adaptive optimizer

---

## ĐÓNG GÓP

### 1. Bảo Mật Dữ Liệu Tổ Chức
- ✅ Dữ liệu NetFlow không rời khỏi máy của ISP
- ✅ Tuân thủ GDPR và Luật An Ninh Mạng
- ✅ Cho phép các tổ chức hợp tác mà không lo ngại về bảo mật

### 2. Mô Hình Thích Ứng Liên Tục
- ✅ Mô hình được cải thiện qua các rounds
- ✅ Không cần retrain từ đầu khi có dữ liệu mới
- ✅ Thích ứng với các loại DDoS attacks mới

### 3. So Sánh Chiến Lược
- ✅ So sánh 3 chiến lược FL trên cùng một bài toán
- ✅ Tìm chiến lược tốt nhất cho DDoS detection
- ✅ Dashboard trực quan để theo dõi và phân tích

---

## CÔNG NGHỆ SỬ DỤNG

- **Frontend**: React, Chart.js
- **Backend**: Node.js, Express, Socket.IO
- **FL Framework**: Flower (flwr)
- **AI**: TensorFlow/Keras (Neural Network)
- **Data Processing**: Pandas, NumPy, Scikit-learn
- **Containerization**: Docker, Docker Compose

---

## KẾT LUẬN

Đề tài đã thành công trong việc:
1. ✅ Xây dựng hệ thống phát hiện DDoS bằng Federated Learning
2. ✅ Đảm bảo privacy-preserving (dữ liệu không rời khỏi máy ISP)
3. ✅ So sánh 3 chiến lược FL (FedAvg, FedProx, FedOpt)
4. ✅ Tạo mô hình thích ứng liên tục qua các rounds
5. ✅ Xây dựng dashboard trực quan để theo dõi và phân tích

**Hướng phát triển**:
- Mở rộng số lượng clients và servers
- Thêm các chiến lược FL khác (FedNova, SCAFFOLD)
- Tích hợp với hệ thống thực tế của các ISP
- Cải thiện mô hình AI (CNN, LSTM cho time-series)

---

## TÀI LIỆU THAM KHẢO

1. McMahan, B., et al. (2017). "Communication-Efficient Learning of Deep Networks from Decentralized Data"
2. Li, T., et al. (2020). "Federated Optimization in Heterogeneous Networks"
3. Reddi, S., et al. (2021). "Adaptive Federated Optimization"
4. Flower Framework Documentation: https://flower.dev/

