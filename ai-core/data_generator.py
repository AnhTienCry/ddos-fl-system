"""
Tạo dữ liệu NetFlow mô phỏng cho các ISP/chi nhánh
Mỗi ISP có phân phối dữ liệu khác nhau (non-IID) để mô phỏng thực tế
"""
import pandas as pd
import numpy as np
import os

def tao_du_lieu_gia(id_may_tram):
    """
    Tạo dữ liệu NetFlow mô phỏng cho ISP/chi nhánh
    
    Args:
        id_may_tram: ID của ISP (1, 2, 3)
    
    Returns:
        DataFrame chứa NetFlow features và Label (0=Normal, 1=DDoS)
    """
    print(f"[DATA] Đang sinh dữ liệu NetFlow cho ISP-{id_may_tram}...")
    n = 2000
    
    # Tạo các features NetFlow chuẩn
    df = pd.DataFrame({
        # Basic Flow Features
        'Flow Duration': np.random.randint(100, 10000, n),
        'Total Fwd Packets': np.random.randint(1, 100, n),
        'Total Backward Packets': np.random.randint(1, 100, n),
        'Total Length of Fwd Packets': np.random.randint(64, 1500, n),
        'Total Length of Bwd Packets': np.random.randint(64, 1500, n),
        
        # Rate Features
        'Flow Bytes/s': np.random.random(n) * 1000,
        'Flow Packets/s': np.random.random(n) * 100,
        
        # Packet Length Statistics
        'Fwd Packet Length Mean': np.random.random(n) * 1000,
        'Bwd Packet Length Mean': np.random.random(n) * 1000,
        
        # Inter-Arrival Time
        'Flow IAT Mean': np.random.random(n) * 1000,
        'Fwd IAT Total': np.random.random(n) * 5000,
        'Bwd IAT Total': np.random.random(n) * 5000,
        
        # Header Length
        'Fwd Header Length': np.random.randint(20, 60, n),
        'Bwd Header Length': np.random.randint(20, 60, n),
        
        # Protocol (0=TCP, 1=UDP, 2=ICMP)
        'Protocol': np.random.choice([0, 1, 2], size=n, p=[0.7, 0.2, 0.1])
    })
    
    # Label: 0=Normal traffic, 1=DDoS attack
    # Mỗi ISP có phân phối khác nhau (non-IID) - mô phỏng thực tế
    if id_may_tram == 1:
        # ISP-1: Nhiều DDoS attacks (70% DDoS)
        df['Label'] = np.random.choice([0, 1], size=n, p=[0.3, 0.7])
    elif id_may_tram == 2:
        # ISP-2: Ít DDoS attacks (30% DDoS)
        df['Label'] = np.random.choice([0, 1], size=n, p=[0.7, 0.3])
    else:
        # ISP-3: Cân bằng (50% DDoS)
        df['Label'] = np.random.choice([0, 1], size=n, p=[0.5, 0.5])
        
    if not os.path.exists('./dataset'):
        os.makedirs('./dataset')
        
    path = f'./dataset/may_tram_{id_may_tram}.csv'
    df.to_csv(path, index=False)
    print(f"[DATA] ✓ Đã lưu: {path} ({len(df)} samples)")
    return df

if __name__ == "__main__":
    for i in range(1, 4): # <--- SỬA THÀNH (1, 4) TỨC LÀ CHẠY 1, 2, 3
        tao_du_lieu_gia(i)