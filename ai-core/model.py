"""
Kiến trúc Neural Network cho phát hiện DDoS
Sử dụng Multi-Layer Perceptron (MLP) với binary classification
"""
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization

def khoi_tao_mo_hinh(input_shape):
    """
    Tạo mô hình Neural Network để phát hiện DDoS
    
    Args:
        input_shape: Số lượng NetFlow features (15 features)
    
    Returns:
        Compiled model với binary classification (0=Normal, 1=DDoS)
    """
    model = Sequential([
        # Input layer: Nhận NetFlow features
        Dense(64, activation='relu', input_shape=(input_shape,)),
        BatchNormalization(),  # Chuẩn hóa để training ổn định
        Dropout(0.2),  # Tránh overfitting
        
        # Hidden layer 1
        Dense(32, activation='relu'),
        BatchNormalization(),
        
        # Hidden layer 2
        Dense(16, activation='relu'),
        
        # Output layer: Binary classification (DDoS hay không)
        Dense(1, activation='sigmoid')  # Output: xác suất DDoS (0-1)
    ])
    
    # Compile với optimizer Adam và binary crossentropy loss
    model.compile(
        optimizer='adam', 
        loss='binary_crossentropy', 
        metrics=['accuracy']
    )
    
    return model