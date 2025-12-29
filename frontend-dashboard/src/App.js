import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function App() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [allStrategies, setAllStrategies] = useState({
    FedAvg: [],
    FedProx: [],
    FedOpt: []
  });
  
  // Tính toán metrics cho từng strategy
  const getMetrics = (strategyLogs) => {
    if (!strategyLogs || strategyLogs.length === 0) {
      return { 
        currentRound: 0, 
        avgAccuracy: 0, 
        latestAccuracy: 0, 
        maxAccuracy: 0,
        avgLoss: 0,
        latestLoss: 0,
        avgF1: 0,
        latestF1: 0
      };
    }
    const currentRound = Math.max(...strategyLogs.map(log => log.round || 0));
    const avgAccuracy = strategyLogs.reduce((sum, log) => sum + (log.accuracy || 0), 0) / strategyLogs.length;
    const latestAccuracy = strategyLogs[strategyLogs.length - 1]?.accuracy || 0;
    const maxAccuracy = Math.max(...strategyLogs.map(log => log.accuracy || 0));
    const avgLoss = strategyLogs.reduce((sum, log) => sum + (log.loss || 0), 0) / strategyLogs.length;
    const latestLoss = strategyLogs[strategyLogs.length - 1]?.loss || 0;
    const avgF1 = strategyLogs.reduce((sum, log) => sum + (log.f1_score || 0), 0) / strategyLogs.length;
    const latestF1 = strategyLogs[strategyLogs.length - 1]?.f1_score || 0;
    return { 
      currentRound, 
      avgAccuracy, 
      latestAccuracy, 
      maxAccuracy,
      avgLoss,
      latestLoss,
      avgF1,
      latestF1
    };
  };

  const fedAvgMetrics = getMetrics(allStrategies.FedAvg);
  const fedProxMetrics = getMetrics(allStrategies.FedProx);
  const fedOptMetrics = getMetrics(allStrategies.FedOpt);

  // Cấu hình biểu đồ - Cải thiện để dễ nhìn hơn
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: { 
          color: '#f8fafc',
          font: { size: 14, weight: '700', family: "'Inter', sans-serif" },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          pointRadius: 6
        } 
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
        padding: 14,
        cornerRadius: 10,
        displayColors: true,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${(context.parsed.y * 100).toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      y: { 
        min: 0.6, 
        max: 1.0,
        grid: { 
          color: 'rgba(255, 255, 255, 0.15)',
          drawBorder: true,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          lineWidth: 1
        }, 
        ticks: { 
          color: '#cbd5e1',
          font: { size: 12, weight: '600' },
          stepSize: 0.05,
          callback: function(value) {
            return (value * 100).toFixed(0) + '%';
          }
        },
        title: {
          display: true,
          text: 'Accuracy (%)',
          color: '#f8fafc',
          font: { size: 13, weight: '700' }
        }
      },
      x: { 
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: true,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          lineWidth: 1
        }, 
        ticks: { 
          color: '#cbd5e1',
          font: { size: 12, weight: '600' }
        },
        title: {
          display: true,
          text: 'Training Round',
          color: '#f8fafc',
          font: { size: 13, weight: '700' }
        }
      }
    }
  };

  // Hàm gọi API
  const fetchData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
      const strategiesResponse = await axios.get(`${backendUrl}/api/strategies`);
      if (strategiesResponse.data) {
        setAllStrategies(strategiesResponse.data);
        setBackendConnected(true);
      }
    } catch (error) {
      setBackendConnected(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const hasData = allStrategies.FedAvg.length > 0 || allStrategies.FedProx.length > 0 || allStrategies.FedOpt.length > 0;

  return (
    <div className="app-container">
      {/* Header Section */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="main-title">Hệ Thống Phát Hiện Tấn Công DDoS</h1>
            <p className="subtitle">Sử dụng Federated Learning - Bảo mật dữ liệu phân tán</p>
          </div>
          <div className="header-badges">
            <span className="badge badge-primary">3 Chiến Lược</span>
            <span className="badge badge-success">9 Client Nodes</span>
            <span className="badge badge-info">Privacy-Preserving</span>
          </div>
        </div>
      </header>

      {/* System Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className={`status-indicator ${backendConnected ? 'online' : 'offline'}`}></span>
          <span className="status-text">Backend API</span>
        </div>
        <div className="status-item">
          <span className="status-indicator online"></span>
          <span className="status-text">3 FL Servers</span>
        </div>
        <div className="status-item">
          <span className="status-indicator online"></span>
          <span className="status-text">9 Client Nodes</span>
        </div>
        <div className="status-item">
          <span className={`status-indicator ${hasData ? 'online' : 'offline'}`}></span>
          <span className="status-text">{hasData ? 'Training Active' : 'Waiting Data'}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Overview Cards - 3 Strategies */}
        <section className="overview-section">
          <h2 className="section-title">Tổng Quan Các Chiến Lược</h2>
          <div className="strategies-grid">
            {/* FedAvg Card */}
            <div className="strategy-card fedavg-card">
              <div className="card-header">
                <div className="strategy-icon fedavg-icon">FA</div>
                <div className="strategy-info">
                  <h3 className="strategy-name">FedAvg</h3>
                  <p className="strategy-desc">Federated Averaging</p>
                </div>
              </div>
              <div className="card-metrics">
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">Accuracy</span>
                    <span className="metric-value">{(fedAvgMetrics.latestAccuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Loss</span>
                    <span className="metric-value">{fedAvgMetrics.latestLoss.toFixed(4)}</span>
                  </div>
                </div>
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">F1-Score</span>
                    <span className="metric-value">{(fedAvgMetrics.latestF1 * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Round</span>
                    <span className="metric-value">{fedAvgMetrics.currentRound}/5</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <span className="progress-label">Tiến độ huấn luyện</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${(fedAvgMetrics.currentRound / 5) * 100}%`}}></div>
                </div>
              </div>
            </div>

            {/* FedProx Card */}
            <div className="strategy-card fedprox-card">
              <div className="card-header">
                <div className="strategy-icon fedprox-icon">FP</div>
                <div className="strategy-info">
                  <h3 className="strategy-name">FedProx</h3>
                  <p className="strategy-desc">Proximal Term</p>
                </div>
              </div>
              <div className="card-metrics">
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">Accuracy</span>
                    <span className="metric-value">{(fedProxMetrics.latestAccuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Loss</span>
                    <span className="metric-value">{fedProxMetrics.latestLoss.toFixed(4)}</span>
                  </div>
                </div>
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">F1-Score</span>
                    <span className="metric-value">{(fedProxMetrics.latestF1 * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Round</span>
                    <span className="metric-value">{fedProxMetrics.currentRound}/5</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <span className="progress-label">Tiến độ huấn luyện</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${(fedProxMetrics.currentRound / 5) * 100}%`}}></div>
                </div>
              </div>
            </div>

            {/* FedOpt Card */}
            <div className="strategy-card fedopt-card">
              <div className="card-header">
                <div className="strategy-icon fedopt-icon">FO</div>
                <div className="strategy-info">
                  <h3 className="strategy-name">FedOpt</h3>
                  <p className="strategy-desc">Adaptive Optimizer</p>
                </div>
              </div>
              <div className="card-metrics">
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">Accuracy</span>
                    <span className="metric-value">{(fedOptMetrics.latestAccuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Loss</span>
                    <span className="metric-value">{fedOptMetrics.latestLoss.toFixed(4)}</span>
                  </div>
                </div>
                <div className="metric-row">
                  <div className="metric-item">
                    <span className="metric-label">F1-Score</span>
                    <span className="metric-value">{(fedOptMetrics.latestF1 * 100).toFixed(2)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Round</span>
                    <span className="metric-value">{fedOptMetrics.currentRound}/5</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <span className="progress-label">Tiến độ huấn luyện</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${(fedOptMetrics.currentRound / 5) * 100}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Chart */}
        <section className="chart-section">
          <div className="chart-card">
            <div className="chart-header">
              <h2 className="chart-title">So Sánh Độ Chính Xác Của 3 Chiến Lược</h2>
              <p className="chart-subtitle">Biểu đồ theo dõi Accuracy qua các Round huấn luyện</p>
            </div>
            
            {/* Comparison Table - Thêm bảng để dễ so sánh */}
            {hasData && (
              <div className="comparison-table-wrapper">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th className="fedavg-col">FedAvg</th>
                      <th className="fedprox-col">FedProx</th>
                      <th className="fedopt-col">FedOpt</th>
                      <th>Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({length: 5}, (_, i) => {
                      const round = i + 1;
                      const fedavg = allStrategies.FedAvg[i]?.accuracy || 0;
                      const fedprox = allStrategies.FedProx[i]?.accuracy || 0;
                      const fedopt = allStrategies.FedOpt[i]?.accuracy || 0;
                      const values = [fedavg, fedprox, fedopt];
                      const maxVal = Math.max(...values);
                      const bestIndex = values.indexOf(maxVal);
                      const bestNames = ['FedAvg', 'FedProx', 'FedOpt'];
                      
                      return (
                        <tr key={round}>
                          <td className="round-cell"><strong>Round {round}</strong></td>
                          <td className={`fedavg-col ${bestIndex === 0 ? 'best-value' : ''}`}>
                            {(fedavg * 100).toFixed(2)}%
                          </td>
                          <td className={`fedprox-col ${bestIndex === 1 ? 'best-value' : ''}`}>
                            {(fedprox * 100).toFixed(2)}%
                          </td>
                          <td className={`fedopt-col ${bestIndex === 2 ? 'best-value' : ''}`}>
                            {(fedopt * 100).toFixed(2)}%
                          </td>
                          <td className="best-cell">
                            <span className="best-badge">{bestNames[bestIndex]}</span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="summary-row">
                      <td><strong>Trung bình</strong></td>
                      <td className="fedavg-col">{(fedAvgMetrics.avgAccuracy * 100).toFixed(2)}%</td>
                      <td className="fedprox-col">{(fedProxMetrics.avgAccuracy * 100).toFixed(2)}%</td>
                      <td className="fedopt-col">{(fedOptMetrics.avgAccuracy * 100).toFixed(2)}%</td>
                      <td>-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {hasData ? (
              <div className="chart-wrapper">
                <Line 
                  options={chartOptions} 
                  data={{
                    labels: Array.from({length: 5}, (_, i) => `Round ${i + 1}`),
                    datasets: [
                      {
                        label: 'FedAvg',
                        data: allStrategies.FedAvg.map(log => log.accuracy || 0),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.25)',
                        tension: 0.3,
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        borderWidth: 3,
                        fill: true,
                        fillOpacity: 0.3
                      },
                      {
                        label: 'FedProx',
                        data: allStrategies.FedProx.map(log => log.accuracy || 0),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.25)',
                        tension: 0.3,
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        borderWidth: 3,
                        fill: true,
                        fillOpacity: 0.3
                      },
                      {
                        label: 'FedOpt',
                        data: allStrategies.FedOpt.map(log => log.accuracy || 0),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.25)',
                        tension: 0.3,
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        borderWidth: 3,
                        fill: true,
                        fillOpacity: 0.3
                      }
                    ]
                  }} 
                />
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>Đang chờ dữ liệu từ các Servers</h3>
                <p>Hệ thống đang khởi động cả 3 strategies (FedAvg, FedProx, FedOpt)...</p>
                <p className="empty-note">Đợi ~2-3 phút để training hoàn thành</p>
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Individual Strategy Charts */}
        <section className="individual-charts-section">
          <h2 className="section-title">Biểu Đồ Chi Tiết Từng Chiến Lược</h2>
          <div className="charts-grid">
            {/* FedAvg Chart */}
            <div className="mini-chart-card">
              <div className="mini-chart-header">
                <h3 className="mini-chart-title fedavg-title">FedAvg</h3>
                <span className="mini-chart-badge">Federated Averaging</span>
              </div>
              {allStrategies.FedAvg.length > 0 ? (
                <div className="mini-chart-wrapper">
                  <Line 
                    options={{...chartOptions, plugins: {title: {display: false}, legend: {display: false}}}} 
                    data={{
                      labels: allStrategies.FedAvg.map(log => `R${log.round || '?'}`),
                      datasets: [{
                        label: 'Accuracy',
                        data: allStrategies.FedAvg.map(log => log.accuracy || 0),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        pointRadius: 4,
                        fill: true
                      }]
                    }} 
                  />
                </div>
              ) : (
                <div className="mini-empty">Đang chờ dữ liệu...</div>
              )}
            </div>

            {/* FedProx Chart */}
            <div className="mini-chart-card">
              <div className="mini-chart-header">
                <h3 className="mini-chart-title fedprox-title">FedProx</h3>
                <span className="mini-chart-badge">Proximal Term</span>
              </div>
              {allStrategies.FedProx.length > 0 ? (
                <div className="mini-chart-wrapper">
                  <Line 
                    options={{...chartOptions, plugins: {title: {display: false}, legend: {display: false}}}} 
                    data={{
                      labels: allStrategies.FedProx.map(log => `R${log.round || '?'}`),
                      datasets: [{
                        label: 'Accuracy',
                        data: allStrategies.FedProx.map(log => log.accuracy || 0),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        pointRadius: 4,
                        fill: true
                      }]
                    }} 
                  />
                </div>
              ) : (
                <div className="mini-empty">Đang chờ dữ liệu...</div>
              )}
            </div>

            {/* FedOpt Chart */}
            <div className="mini-chart-card">
              <div className="mini-chart-header">
                <h3 className="mini-chart-title fedopt-title">FedOpt</h3>
                <span className="mini-chart-badge">Adaptive Optimizer</span>
              </div>
              {allStrategies.FedOpt.length > 0 ? (
                <div className="mini-chart-wrapper">
                  <Line 
                    options={{...chartOptions, plugins: {title: {display: false}, legend: {display: false}}}} 
                    data={{
                      labels: allStrategies.FedOpt.map(log => `R${log.round || '?'}`),
                      datasets: [{
                        label: 'Accuracy',
                        data: allStrategies.FedOpt.map(log => log.accuracy || 0),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        pointRadius: 4,
                        fill: true
                      }]
                    }} 
                  />
                </div>
              ) : (
                <div className="mini-empty">Đang chờ dữ liệu...</div>
              )}
            </div>
          </div>
        </section>

        {/* Information Section */}
        <section className="info-section">
          <h2 className="section-title">Thông Tin Hệ Thống</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🔒</div>
              <h3 className="info-title">Bảo Mật Dữ Liệu</h3>
              <p className="info-text">
                Dữ liệu NetFlow không được chia sẻ giữa các nodes. Chỉ trọng số mô hình được gửi về server, đảm bảo privacy-preserving.
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">🤖</div>
              <h3 className="info-title">Mô Hình AI</h3>
              <p className="info-text">
                Sử dụng Neural Network (MLP) với 15 features NetFlow để phát hiện tấn công DDoS. Mỗi client train cục bộ trên dữ liệu riêng.
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">🌐</div>
              <h3 className="info-title">Kiến Trúc Phân Tán</h3>
              <p className="info-text">
                Hệ thống gồm 3 FL Servers và 9 Client Nodes (3 clients × 3 strategies). Mỗi strategy chạy độc lập trên port riêng.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
