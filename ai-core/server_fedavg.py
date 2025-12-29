import flwr as fl
import requests 
import sys

# Lấy strategy name từ argument hoặc mặc định
STRATEGY_NAME = sys.argv[1] if len(sys.argv) > 1 else "FedAvg"

print("===============================================")
print(f"   SERVER FL: {STRATEGY_NAME} (3 CLIENTS)    ")
print("===============================================")

# Biến đếm round
current_round = 0

def fit_metrics_aggregation_fn(metrics):
    """
    MÔ HÌNH THÍCH ỨNG LIÊN TỤC: 
    Sau mỗi round, tổng hợp metrics từ các clients và cập nhật mô hình
    Mô hình được cải thiện liên tục qua các rounds mà không cần retrain từ đầu
    """
    global current_round
    current_round += 1
    
    # Tổng hợp metrics từ tất cả clients
    accuracies = [m.get("accuracy", 0) for _, m in metrics]
    losses = [m.get("loss", 0) for _, m in metrics]
    precisions = [m.get("precision", 0) for _, m in metrics]
    recalls = [m.get("recall", 0) for _, m in metrics]
    f1_scores = [m.get("f1_score", 0) for _, m in metrics]
    
    if not accuracies:
        return {"accuracy": 0}
    
    # Tính trung bình (FedAvg aggregation)
    avg_accuracy = sum(accuracies) / len(accuracies)
    avg_loss = sum(losses) / len(losses) if losses else 0
    avg_precision = sum(precisions) / len(precisions) if precisions else 0
    avg_recall = sum(recalls) / len(recalls) if recalls else 0
    avg_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0
    
    print(f"\n[{STRATEGY_NAME} - ROUND {current_round}] "
          f"Acc: {avg_accuracy:.4f} | Loss: {avg_loss:.4f} | F1: {avg_f1:.4f}")
    
    # Gửi metrics lên Backend để hiển thị trên Dashboard
    try:
        requests.post("http://backend:3000/api/log", json={
            "round": current_round, 
            "accuracy": float(avg_accuracy),
            "loss": float(avg_loss),
            "precision": float(avg_precision),
            "recall": float(avg_recall),
            "f1_score": float(avg_f1),
            "strategy": STRATEGY_NAME
        })
    except Exception as e:
        print(f"[ERROR] Không gọi được Backend API: {e}")

    return {"accuracy": avg_accuracy}

# Chiến lược FedAvg
strategy = fl.server.strategy.FedAvg(
    fraction_fit=1.0,
    min_fit_clients=3,
    min_available_clients=3,
    fit_metrics_aggregation_fn=fit_metrics_aggregation_fn 
)

fl.server.start_server(
    server_address="0.0.0.0:8080",
    config=fl.server.ServerConfig(num_rounds=5),
    strategy=strategy
)

