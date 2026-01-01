# 📚 BÁO CÁO ĐỒ ÁN TỐT NGHIỆP - PHẦN 1
## Hệ Thống Phát Hiện Tấn Công DDoS Sử Dụng Federated Learning

---

## 📋 MỤC LỤC PHẦN 1
1. [Giới Thiệu Đề Tài](#1-giới-thiệu-đề-tài)
2. [Thuật Ngữ & Từ Viết Tắt](#2-thuật-ngữ--từ-viết-tắt)
3. [Kiến Trúc Hệ Thống](#3-kiến-trúc-hệ-thống)
4. [Các Thuật Toán FL](#4-các-thuật-toán-fl)
5. [Công Nghệ Sử Dụng](#5-công-nghệ-sử-dụng)

---

## 1. GIỚI THIỆU ĐỀ TÀI

### 1.1. Vấn Đề Cần Giải Quyết

**Tấn công DDoS (Distributed Denial of Service)** là một trong những mối đe dọa nghiêm trọng nhất đối với hệ thống mạng hiện đại:
- Làm quá tải server, khiến dịch vụ không khả dụng
- Gây thiệt hại kinh tế lớn cho doanh nghiệp
- Khó phát hiện vì traffic phân tán từ nhiều nguồn

**Thách thức với phương pháp truyền thống:**
- Machine Learning tập trung cần thu thập dữ liệu về 1 nơi → **Vi phạm quyền riêng tư**
- Các ISP/tổ chức không muốn chia sẻ dữ liệu nhạy cảm
- Bandwidth lớn khi truyền raw data

### 1.2. Giải Pháp Đề Xuất

**Federated Learning (Học Liên Bang)** cho phép:
- ✅ Train model **phân tán** tại mỗi client
- ✅ **Không chia sẻ dữ liệu thô** - chỉ gửi model weights
- ✅ **Bảo vệ quyền riêng tư** người dùng
- ✅ Giảm bandwidth cần thiết

### 1.3. Mục Tiêu Đồ Án

| STT | Mục Tiêu | Kết Quả |
|-----|----------|---------|
| 1 | Xây dựng hệ thống FL hoàn chỉnh | ✅ 3 Servers, 9 Clients |
| 2 | So sánh 3 thuật toán FL | ✅ FedAvg, FedProx, FedOpt |
| 3 | Dashboard giám sát real-time | ✅ React + Chart.js |
| 4 | Containerize với Docker | ✅ Docker Compose |
| 5 | Đạt accuracy > 65% | ✅ ~66-67% |

---

## 2. THUẬT NGỮ & TỪ VIẾT TẮT

### 2.1. Thuật Ngữ Chính

| Thuật Ngữ | Tiếng Việt | Giải Thích |
|-----------|------------|------------|
| **DDoS** | Từ chối dịch vụ phân tán | Tấn công làm quá tải server bằng traffic từ nhiều nguồn |
| **Federated Learning (FL)** | Học Liên Bang | Phương pháp train ML model phân tán, không chia sẻ dữ liệu |
| **Client** | Máy khách | Thiết bị/server local thực hiện training |
| **Server (Aggregator)** | Máy chủ tổng hợp | Server trung tâm tổng hợp weights từ clients |
| **Round** | Vòng huấn luyện | Một chu kỳ: broadcast → train → aggregate |
| **Aggregation** | Tổng hợp | Quá trình kết hợp weights từ nhiều clients |
| **Global Model** | Model toàn cục | Model chung được cập nhật sau mỗi round |
| **Local Model** | Model cục bộ | Model tại mỗi client |
| **Weights/Parameters** | Trọng số | Các tham số của neural network |
| **NetFlow** | Luồng mạng | Dữ liệu thống kê traffic mạng |
| **Non-IID** | Không đồng nhất | Dữ liệu khác nhau giữa các clients |

### 2.2. Từ Viết Tắt

| Viết Tắt | Đầy Đủ | Nghĩa |
|----------|--------|-------|
| **FL** | Federated Learning | Học Liên Bang |
| **DDoS** | Distributed Denial of Service | Từ chối dịch vụ phân tán |
| **DoS** | Denial of Service | Từ chối dịch vụ |
| **ML** | Machine Learning | Học máy |
| **DL** | Deep Learning | Học sâu |
| **NN** | Neural Network | Mạng nơ-ron |
| **API** | Application Programming Interface | Giao diện lập trình |
| **ISP** | Internet Service Provider | Nhà cung cấp dịch vụ Internet |
| **IID** | Independent and Identically Distributed | Phân phối độc lập đồng nhất |
| **gRPC** | Google Remote Procedure Call | Giao thức gọi hàm từ xa |
| **REST** | Representational State Transfer | Kiến trúc API |
| **TCP** | Transmission Control Protocol | Giao thức TCP |
| **UDP** | User Datagram Protocol | Giao thức UDP |
| **IP** | Internet Protocol | Giao thức Internet |
| **Acc** | Accuracy | Độ chính xác |
| **F1** | F1-Score | Điểm F1 (harmonic mean của Precision và Recall) |

### 2.3. Metrics Đánh Giá

| Metric | Công Thức | Ý Nghĩa |
|--------|-----------|---------|
| **Accuracy** | (TP + TN) / Total | Tỷ lệ dự đoán đúng |
| **Precision** | TP / (TP + FP) | Độ chính xác khi dự đoán Positive |
| **Recall** | TP / (TP + FN) | Khả năng tìm ra tất cả Positive |
| **F1-Score** | 2 × (P × R) / (P + R) | Trung bình điều hòa của Precision và Recall |
| **Loss** | Cross-Entropy | Hàm mất mát cần tối thiểu hóa |

> **TP** = True Positive, **TN** = True Negative, **FP** = False Positive, **FN** = False Negative

---

## 3. KIẾN TRÚC HỆ THỐNG

### 3.1. Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FEDERATED LEARNING SYSTEM                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│   │  FedAvg     │    │  FedProx    │    │  FedOpt     │            │
│   │  Server     │    │  Server     │    │  Server     │            │
│   │  :8080      │    │  :8081      │    │  :8082      │            │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘            │
│          │                  │                  │                    │
│          ▼                  ▼                  ▼                    │
│   ┌────────────────────────────────────────────────────┐           │
│   │              FLOWER gRPC COMMUNICATION              │           │
│   └────────────────────────────────────────────────────┘           │
│          │                  │                  │                    │
│    ┌─────┴─────┐      ┌─────┴─────┐      ┌─────┴─────┐            │
│    ▼     ▼     ▼      ▼     ▼     ▼      ▼     ▼     ▼            │
│  ┌───┐ ┌───┐ ┌───┐  ┌───┐ ┌───┐ ┌───┐  ┌───┐ ┌───┐ ┌───┐        │
│  │C1 │ │C2 │ │C3 │  │C1 │ │C2 │ │C3 │  │C1 │ │C2 │ │C3 │        │
│  │ISP│ │ISP│ │ISP│  │ISP│ │ISP│ │ISP│  │ISP│ │ISP│ │ISP│        │
│  └───┘ └───┘ └───┘  └───┘ └───┘ └───┘  └───┘ └───┘ └───┘        │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    BACKEND API (:3000)                       │   │
│   │              Nhận metrics từ FL Servers                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                   FRONTEND DASHBOARD (:3001)                 │   │
│   │              React + Chart.js + Framer Motion               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2. Thành Phần Hệ Thống

| Thành Phần | Port | Công Nghệ | Chức Năng |
|------------|------|-----------|-----------|
| **FL Server FedAvg** | 8080 | Python + Flower | Tổng hợp weights bằng FedAvg |
| **FL Server FedProx** | 8081 | Python + Flower | Tổng hợp weights bằng FedProx |
| **FL Server FedOpt** | 8082 | Python + Flower | Tổng hợp weights bằng FedOpt |
| **Clients (9x)** | - | Python + TensorFlow | Train model local |
| **Backend API** | 3000 | Node.js + Express | Nhận/lưu metrics |
| **Frontend** | 3001 | React + Chart.js | Dashboard giám sát |

### 3.3. Neural Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DDoS Detection Model                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   INPUT LAYER (15 features)                                  │
│   ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│   │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │11 │12 │13 │14 │15 │
│   └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
│                          │                                    │
│                          ▼                                    │
│   ┌─────────────────────────────────────────────────────┐    │
│   │        HIDDEN LAYER 1 (64 neurons, ReLU)            │    │
│   └─────────────────────────────────────────────────────┘    │
│                          │                                    │
│                          ▼                                    │
│   ┌─────────────────────────────────────────────────────┐    │
│   │        HIDDEN LAYER 2 (32 neurons, ReLU)            │    │
│   └─────────────────────────────────────────────────────┘    │
│                          │                                    │
│                          ▼                                    │
│   ┌─────────────────────────────────────────────────────┐    │
│   │        OUTPUT LAYER (1 neuron, Sigmoid)             │    │
│   │              0 = Normal | 1 = DDoS                  │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                              │
│   Total Parameters: 5,057                                    │
│   - Layer 1: 15 × 64 + 64 = 1,024                           │
│   - Layer 2: 64 × 32 + 32 = 2,080                           │
│   - Output: 32 × 1 + 1 = 33                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.4. 15 NetFlow Features

| # | Feature | Mô Tả | Đơn Vị |
|---|---------|-------|--------|
| 1 | `duration` | Thời lượng kết nối | seconds |
| 2 | `protocol_type` | Loại giao thức (TCP/UDP/ICMP) | category |
| 3 | `src_bytes` | Bytes gửi từ source | bytes |
| 4 | `dst_bytes` | Bytes gửi từ destination | bytes |
| 5 | `count` | Số kết nối cùng host trong 2s | count |
| 6 | `srv_count` | Số kết nối cùng service trong 2s | count |
| 7 | `serror_rate` | Tỷ lệ lỗi SYN | ratio |
| 8 | `rerror_rate` | Tỷ lệ lỗi REJ | ratio |
| 9 | `same_srv_rate` | Tỷ lệ cùng service | ratio |
| 10 | `diff_srv_rate` | Tỷ lệ khác service | ratio |
| 11 | `dst_host_count` | Số kết nối cùng dest host | count |
| 12 | `dst_host_srv_count` | Số kết nối cùng dest service | count |
| 13 | `dst_host_same_srv_rate` | Tỷ lệ cùng service (dest) | ratio |
| 14 | `dst_host_diff_srv_rate` | Tỷ lệ khác service (dest) | ratio |
| 15 | `dst_host_serror_rate` | Tỷ lệ lỗi SYN (dest) | ratio |

---

## 4. CÁC THUẬT TOÁN FL

### 4.1. FedAvg (Federated Averaging)

**Đặc điểm:**
- Thuật toán FL cơ bản nhất, được Google giới thiệu năm 2017
- Tính trung bình có trọng số các model weights

**Công thức:**
```
w(t+1) = Σ (n_k / n) × w_k(t+1)

Trong đó:
- w(t+1): Global weights mới
- n_k: Số samples của client k
- n: Tổng số samples
- w_k: Weights của client k
```

**Ưu điểm:**
- ✅ Đơn giản, dễ implement
- ✅ Hiệu quả với dữ liệu IID
- ✅ Communication-efficient

**Nhược điểm:**
- ❌ Kém hiệu quả với Non-IID data
- ❌ Có thể diverge khi clients quá khác nhau

### 4.2. FedProx (Federated Proximal)

**Đặc điểm:**
- Cải tiến từ FedAvg cho Non-IID data
- Thêm proximal term để giữ local model gần global model

**Công thức Loss:**
```
L_k(w) = F_k(w) + (μ/2) × ||w - w(t)||²

Trong đó:
- F_k(w): Local loss function
- μ: Proximal coefficient (hyperparameter)
- w(t): Global model weights hiện tại
```

**Ưu điểm:**
- ✅ Ổn định hơn với Non-IID data
- ✅ Giảm variance giữa các clients
- ✅ Convergence tốt hơn

**Nhược điểm:**
- ❌ Cần tune hyperparameter μ
- ❌ Tốn thêm computation

### 4.3. FedOpt (Federated Optimization)

**Đặc điểm:**
- Sử dụng adaptive optimizer (Adam) ở server
- Kết hợp momentum và adaptive learning rate

**Công thức:**
```
Server-side Adam update:
m(t+1) = β₁ × m(t) + (1-β₁) × Δw
v(t+1) = β₂ × v(t) + (1-β₂) × Δw²
w(t+1) = w(t) - η × m(t+1) / (√v(t+1) + ε)

Trong đó:
- β₁, β₂: Momentum coefficients
- η: Server learning rate
- ε: Small constant for numerical stability
```

**Ưu điểm:**
- ✅ Hội tụ nhanh hơn
- ✅ Adaptive learning rate
- ✅ Xử lý tốt sparse gradients

**Nhược điểm:**
- ❌ Phức tạp hơn
- ❌ Nhiều hyperparameters

### 4.4. So Sánh 3 Thuật Toán

| Tiêu Chí | FedAvg | FedProx | FedOpt |
|----------|--------|---------|--------|
| **Độ phức tạp** | Thấp | Trung bình | Cao |
| **Non-IID handling** | Kém | Tốt | Trung bình |
| **Convergence speed** | Chậm | Trung bình | Nhanh |
| **Memory** | Ít | Nhiều hơn | Nhiều nhất |
| **Hyperparameters** | 1 (lr) | 2 (lr, μ) | 4+ (β₁, β₂, ε, lr) |
| **Use case** | IID data | Non-IID data | Large-scale |

---

## 5. CÔNG NGHỆ SỬ DỤNG

### 5.1. Backend - AI Core

| Công Nghệ | Version | Mục Đích |
|-----------|---------|----------|
| **Python** | 3.9 | Ngôn ngữ chính |
| **TensorFlow** | 2.14 | Deep Learning framework |
| **Flower (flwr)** | 1.5 | Federated Learning framework |
| **NumPy** | 1.24 | Xử lý mảng số |
| **Pandas** | 2.0 | Xử lý dữ liệu |
| **Requests** | 2.31 | HTTP client |

### 5.2. Backend - API Server

| Công Nghệ | Version | Mục Đích |
|-----------|---------|----------|
| **Node.js** | 18 | Runtime environment |
| **Express** | 4.18 | Web framework |
| **CORS** | 2.8 | Cross-Origin handling |

### 5.3. Frontend - Dashboard

| Công Nghệ | Version | Mục Đích |
|-----------|---------|----------|
| **React** | 18.2 | UI library |
| **Chart.js** | 4.4 | Biểu đồ |
| **react-chartjs-2** | 5.2 | React wrapper cho Chart.js |
| **Framer Motion** | 10.16 | Animations |
| **Lucide React** | 0.294 | Icons |
| **Axios** | 1.6 | HTTP client |

### 5.4. Infrastructure

| Công Nghệ | Version | Mục Đích |
|-----------|---------|----------|
| **Docker** | 24+ | Containerization |
| **Docker Compose** | 2.20+ | Multi-container orchestration |

---

## 📎 TIẾP TỤC PHẦN 2

Xem file `README_BAO_CAO_P2.md` để tiếp tục với:
- Quy trình hoạt động chi tiết
- Câu hỏi vấn đáp thường gặp
- Hướng dẫn demo
- Kết quả thực nghiệm

---

*Đồ án tốt nghiệp - Hệ thống phát hiện DDoS sử dụng Federated Learning*
*© 2025*
