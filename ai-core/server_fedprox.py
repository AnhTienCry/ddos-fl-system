import flwr as fl
import requests 
import sys

STRATEGY_NAME = sys.argv[1] if len(sys.argv) > 1 else "FedProx"

print("===============================================")
print(f"   SERVER FL: {STRATEGY_NAME} (3 CLIENTS)    ")
print("===============================================")

# Biến đếm round
current_round = 0

def fit_metrics_aggregation_fn(metrics):
    """Mô hình thích ứng liên tục - FedProx với proximal term"""
    global current_round
    current_round += 1
    
    accuracies = [m.get("accuracy", 0) for _, m in metrics]
    losses = [m.get("loss", 0) for _, m in metrics]
    f1_scores = [m.get("f1_score", 0) for _, m in metrics]
    
    if not accuracies:
        return {"accuracy": 0}
    
    avg_accuracy = sum(accuracies) / len(accuracies)
    avg_loss = sum(losses) / len(losses) if losses else 0
    avg_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0
    
    print(f"\n[{STRATEGY_NAME} - ROUND {current_round}] "
          f"Acc: {avg_accuracy:.4f} | Loss: {avg_loss:.4f} | F1: {avg_f1:.4f}")
    
    try:
        requests.post("http://backend:3000/api/log", json={
            "round": current_round, 
            "accuracy": float(avg_accuracy),
            "loss": float(avg_loss),
            "f1_score": float(avg_f1),
            "strategy": STRATEGY_NAME
        })
    except Exception as e:
        print(f"[ERROR] Không gọi được Backend API: {e}")

    return {"accuracy": avg_accuracy}

# Chiến lược FedProx với mu (regularization parameter)
# FedProx thêm proximal term để xử lý non-IID data
strategy = fl.server.strategy.FedProx(
    fraction_fit=1.0,
    min_fit_clients=3,
    min_available_clients=3,
    proximal_mu=0.01,  # Regularization parameter (mu)
    fit_metrics_aggregation_fn=fit_metrics_aggregation_fn 
)

fl.server.start_server(
    server_address="0.0.0.0:8080",
    config=fl.server.ServerConfig(num_rounds=5),
    strategy=strategy
)

