/**
 * Backend API Server
 * Nhận metrics từ FL Server và cung cấp API cho Frontend Dashboard
 */
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Biến lưu trữ lịch sử log theo từng strategy
let logsByStrategy = {
    "FedAvg": [],
    "FedProx": [],
    "FedOpt": []
};

// 1. API nhận dữ liệu từ AI (Server Python gửi sang)
app.post('/api/log', (req, res) => {
    const data = req.body;
    const strategy = data.strategy || "FedAvg";
    const roundNum = data.round || 1;
    
    console.log(`[BACKEND] [${strategy}] Round ${roundNum} -> Accuracy: ${data.accuracy}`);
    
    // Lấy logs của strategy này
    const logs = logsByStrategy[strategy] || [];
    
    // Thêm thời gian hiện tại vào log
    const logEntry = {
        round: roundNum,
        accuracy: data.accuracy || 0,
        loss: data.loss || 0,
        strategy: strategy,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        date: new Date().toISOString()
    };
    
    // Kiểm tra xem round đã tồn tại chưa (update nếu có)
    const existingIndex = logs.findIndex(log => log.round === roundNum && log.strategy === strategy);
    if (existingIndex >= 0) {
        logs[existingIndex] = logEntry;
    } else {
        logs.push(logEntry);
    }
    
    // Sắp xếp theo round và chỉ giữ lại 20 log gần nhất
    logs.sort((a, b) => a.round - b.round);
    if (logs.length > 20) logs.shift();
    
    // Cập nhật lại
    logsByStrategy[strategy] = logs;

    res.json({ status: "success", round: roundNum, strategy: strategy });
});

// 2. API trả dữ liệu cho Frontend (React gọi cái này)
app.get('/api/data', (req, res) => {
    const strategy = req.query.strategy || "FedAvg";
    const logs = logsByStrategy[strategy] || [];
    res.json(logs);
});

// 3. API trả tất cả strategies để so sánh
app.get('/api/strategies', (req, res) => {
    res.json({
        FedAvg: logsByStrategy["FedAvg"] || [],
        FedProx: logsByStrategy["FedProx"] || [],
        FedOpt: logsByStrategy["FedOpt"] || []
    });
});

app.get('/', (req, res) => {
    res.send("Backend API đang chạy!");
});

app.listen(PORT, () => {
    console.log(`Backend API đang chạy tại cổng ${PORT}`);
});