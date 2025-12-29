import flwr as fl
import pandas as pd
import numpy as np
import sys
import os
import time
from model import khoi_tao_mo_hinh
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import data_generator 

# Lấy ID máy trạm
try:
    ID = int(sys.argv[1])
except:
    ID = 1

print(f"\n[BOOT] KHỞI ĐỘNG CLIENT SỐ {ID}...")

# 1. Kiểm tra và tạo dữ liệu nếu chưa có
path_data = f'./dataset/may_tram_{ID}.csv'
if not os.path.exists(path_data):
    # Nếu chưa có file thì sinh mới
    data_generator.tao_du_lieu_gia(ID)

# 2. Đọc và xử lý dữ liệu (có xử lý lỗi file cũ bị sai định dạng)
max_retries = 3
for attempt in range(max_retries):
    try:
        df = pd.read_csv(path_data)
        # Kiểm tra số cột đúng (phải có 16 cột: 15 features + 1 Label)
        if df.shape[1] != 16:
            raise ValueError(f"File có {df.shape[1]} cột, cần 16 cột")
        break
    except Exception as e:
        if attempt < max_retries - 1:
            # Xóa file cũ và sinh lại
            if os.path.exists(path_data):
                os.remove(path_data)
            print(f"[DATA] File {path_data} bị lỗi ({str(e)}), đang sinh lại dữ liệu... (Lần thử {attempt+1}/{max_retries})")
            data_generator.tao_du_lieu_gia(ID)
        else:
            print(f"[DATA] Không thể đọc file sau {max_retries} lần thử. Dừng client.")
            raise
X = df.drop('Label', axis=1).values
y = df['Label'].values

scaler = StandardScaler()
X = scaler.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# 3. Tạo Model
model = khoi_tao_mo_hinh(X_train.shape[1])

# 4. Class Client
class DDoSClient(fl.client.NumPyClient):
    def get_parameters(self, config):
        return model.get_weights()

    def fit(self, parameters, config):
        """
        PRIVACY-PRESERVING: Train model trên dữ liệu cục bộ
        Dữ liệu NetFlow KHÔNG BAO GIỜ rời khỏi máy của ISP
        """
        # Nhận weights từ server (mô hình đã được cải thiện)
        model.set_weights(parameters)
        print(f"\n[CLIENT {ID}] >>> Đang train model trên dữ liệu cục bộ...")
        
        # Train cục bộ - DỮ LIỆU KHÔNG RỜI KHỎI MÁY ISP
        history = model.fit(X_train, y_train, epochs=3, batch_size=32, verbose=0)
        
        # Tính metrics đầy đủ
        y_pred = (model.predict(X_train, verbose=0) > 0.5).astype(int).flatten()
        
        try:
            from sklearn.metrics import precision_score, recall_score, f1_score
            precision = precision_score(y_train, y_pred, zero_division=0)
            recall = recall_score(y_train, y_pred, zero_division=0)
            f1 = f1_score(y_train, y_pred, zero_division=0)
        except:
            precision = recall = f1 = 0.0
        
        acc = history.history['accuracy'][-1]
        loss = history.history['loss'][-1]
        
        print(f"[CLIENT {ID}] >>> Train xong. Acc: {acc:.4f} | Loss: {loss:.4f} | F1: {f1:.4f}")
        
        # QUAN TRỌNG: CHỈ GỬI WEIGHTS, KHÔNG GỬI DỮ LIỆU X_train, y_train
        return model.get_weights(), len(X_train), {
            "accuracy": float(acc),
            "loss": float(loss),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1)
        }

    def evaluate(self, parameters, config):
        model.set_weights(parameters)
        loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
        return loss, len(X_test), {"accuracy": float(accuracy)}

# 5. Kết nối Server với retry logic
def connect_to_server(server_address="server:8080", max_retries=10):
    for i in range(max_retries):
        try:
            print(f"[CLIENT {ID}] Đang kết nối tới Server tại {server_address}... (Lần thử {i+1})")
            fl.client.start_numpy_client(server_address=server_address, client=DDoSClient())
            break
        except Exception as e:
            if i < max_retries - 1:
                print(f"[CLIENT {ID}] Kết nối thất bại, thử lại sau 5 giây...")
                time.sleep(5)
            else:
                print(f"[CLIENT {ID}] Không thể kết nối sau {max_retries} lần thử")
                raise

# Thử kết nối với server từ environment variable
server_address = os.environ.get('SERVER_ADDRESS', 'server:8080')
connect_to_server(server_address)