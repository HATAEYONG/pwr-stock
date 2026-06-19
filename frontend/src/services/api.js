/**
 * PowerStock API Service Layer
 * Axios-based HTTP client for Django REST API
 */

import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('API');

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Market Data APIs
// ============================================================

export const getSymbols = (params) => api.get('/symbols/', { params });
export const getSymbol = (id) => api.get(`/symbols/${id}/`);
export const createSymbol = (data) => api.post('/symbols/', data);
export const updateSymbol = (id, data) => api.put(`/symbols/${id}/`, data);
export const deleteSymbol = (id) => api.delete(`/symbols/${id}/`);

// OHLCV API
export const getOHLCV = (params) => api.get('/ohlcv/', { params });
export const getOHLCVBySymbol = (symbolId, params = {}) =>
  api.get(`/ohlcv/?symbol=${symbolId}`, { params });

// ============================================================
// Pattern Analysis APIs
// ============================================================

export const getEvaluations = (params) => api.get('/evaluations/', { params });
export const getEvaluation = (id) => api.get(`/evaluations/${id}/`);
export const getHighScoreEvaluations = () => api.get('/evaluations/high_score/');
export const getPattern1Evaluations = () => api.get('/evaluations/pattern1/');
export const getPattern2Evaluations = () => api.get('/evaluations/pattern2/');
export const getPattern3Evaluations = () => api.get('/evaluations/pattern3/');
export const getSignalEvaluations = (signalType) =>
  api.get('/evaluations/signals/', { params: { type: signalType } });

// Run pattern analysis
export const analyzeSymbol = (symbolId) =>
  api.post(`/evaluations/${symbolId}/analyze/`);

// Search by pattern
export const searchByPattern = (patternType, params = {}) =>
  api.get('/patterns/search/', { params: { pattern_type: patternType, ...params } });

// Get pattern candidates
export const getCandidates = (patternType, params = {}) =>
  api.get('/patterns/candidates/', { params: { pattern: patternType, ...params } });

// ============================================================
// Portfolio APIs
// ============================================================

export const getPortfolios = () => api.get('/portfolio/portfolios/');
export const getPortfolio = (id) => api.get(`/portfolio/portfolios/${id}/`);
export const createPortfolio = (data) => api.post('/portfolio/portfolios/', data);
export const updatePortfolio = (id, data) => api.put(`/portfolio/portfolios/${id}/`, data);
export const deletePortfolio = (id) => api.delete(`/portfolio/portfolios/${id}/`);

export const getPortfolioSummary = (id) =>
  api.get(`/portfolio/portfolios/${id}/summary/`);

export const openPosition = (portfolioId, data) =>
  api.post(`/portfolio/portfolios/${portfolioId}/open_position/`, data);

export const closePosition = (portfolioId, positionId, data) =>
  api.post(`/portfolio/portfolios/${portfolioId}/close_position/`, {
    position_id: positionId,
    ...data
  });

export const getPerformance = (portfolioId, params = {}) =>
  api.get(`/portfolio/portfolios/${portfolioId}/performance/`, { params });

export const getRiskMetrics = (portfolioId) =>
  api.get(`/portfolio/portfolios/${portfolioId}/risk_metrics/`);

export const calculatePositionSize = (portfolioId, data) =>
  api.post(`/portfolio/portfolios/${portfolioId}/calculate_size/`, data);

// ============================================================
// ML/AI APIs
// ============================================================

export const getMLModels = () => api.get('/ml/models/');
export const getMLModel = (id) => api.get(`/ml/models/${id}/`);
export const trainModel = (data) => api.post('/ml/train/', data);
export const getPredictions = (params = {}) => api.get('/ml/predictions/', { params });
export const getSymbolPrediction = (symbolId) =>
  api.get(`/ml/predictions/?symbol=${symbolId}`);
export const predict = (data) => api.post('/ml/predict/', data);
export const getFeatureImportance = (modelId) =>
  api.get(`/ml/models/${modelId}/feature_importance/`);

// ============================================================
// Backtest APIs
// ============================================================

export const getBacktests = (params = {}) => api.get('/backtest/backtests/', { params });
export const getBacktest = (id) => api.get(`/backtest/backtests/${id}/`);
export const runBacktest = (data) => api.post('/backtest/run/', data);
export const getBacktestResults = (backtestId) =>
  api.get(`/backtest/backtests/${backtestId}/results/`);
export const downloadBacktestReport = (backtestId) =>
  api.get(`/backtest/backtests/${backtestId}/download_report/`, {
    responseType: 'blob'
  });

// ============================================================
// Market Index APIs
// ============================================================

export const getMarketIndices = () => api.get('/market/indices/');
export const getIndexOHLCV = (indexId, params = {}) =>
  api.get(`/market/index-ohlcv/?index=${indexId}`, { params });
export const getMarketRegime = (market) =>
  api.get(`/market/regime/?market=${market}`);
export const getSectorStrength = (params = {}) =>
  api.get('/market/sectors/strength/', { params });
export const getMarketBreadth = (market) =>
  api.get(`/market/breadth/?market=${market}`);

// ============================================================
// Realtime Data APIs
// ============================================================

export const getRealtimeQuote = (symbol) =>
  api.get(`/realtime/quotes/?symbol=${symbol}`);
export const getRealtimeQuotes = (symbols) =>
  api.get('/realtime/quotes/', { params: { symbols: symbols.join(',') } });
export const getWSConnections = () => api.get('/realtime/connections/');
export const createWSConnection = (data) =>
  api.post('/realtime/connections/', data);

// ============================================================
// Data Import APIs
// ============================================================

export const getImportJobs = () => api.get('/import/jobs/');
export const getImportJob = (id) => api.get(`/import/jobs/${id}/`);
export const createImportJob = (data) => api.post('/import/jobs/', data);
export const uploadImportFile = (file, type) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  return api.post('/import/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const getSampleCSV = (type) =>
  api.get(`/import/sample/${type}/`, { responseType: 'blob' });

// ============================================================
// Alert APIs
// ============================================================

export const getAlerts = (params = {}) => api.get('/alerts/alerts/', { params });
export const getAlert = (id) => api.get(`/alerts/alerts/${id}/`);
export const createAlert = (data) => api.post('/alerts/alerts/', data);
export const updateAlert = (id, data) => api.put(`/alerts/alerts/${id}/`, data);
export const deleteAlert = (id) => api.delete(`/alerts/alerts/${id}/`);
export const getAlertSettings = () => api.get('/alerts/settings/');
export const updateAlertSettings = (data) => api.post('/alerts/settings/', data);

// ============================================================
// Kiwoom APIs (코스닥/코스피)
// ============================================================

export const fetchKiwoomStocks = (market, useMock = true, update = false) =>
  api.post('/kiwoom/fetch-stocks/', { market, use_mock: useMock, update });
export const getKiwoomStatus = () => api.get('/kiwoom/status/');

// Kiwoom REST API
export const getKiwoomRestConfig = () => api.get('/kiwoom/rest/config/info/');
export const searchKiwoomStocks = (keyword) => api.get('/kiwoom/rest/search/', { params: { keyword } });

// ============================================================
// Batch Pattern Analysis APIs
// ============================================================

export const startBatchAnalysis = (params) =>
  api.post('/patterns/batch/start/', params);
export const getBatchAnalysisSummary = (date) =>
  api.get('/patterns/batch/summary/', { params: { date } });
export const getBatchAnalysisResults = (params) =>
  api.get('/patterns/batch/results/', { params });
export const getTopPatterns = (params) =>
  api.get('/patterns/batch/top/', { params });

// ============================================================
// Korea Investment APIs
// ============================================================

export const testKoreaInvestmentConnection = () =>
  api.get('/koreainvestment/test-connection/');
export const collectDomesticDaily = (params) =>
  api.post('/koreainvestment/collect-domestic-daily/', params);
export const collectUSDaily = (params) =>
  api.post('/koreainvestment/collect-us-daily/', params);
export const getDomesticPrice = (symbolCode) =>
  api.get(`/koreainvestment/domestic-price/${symbolCode}/`);
export const getUSPrice = (ticker) =>
  api.get(`/koreainvestment/us-price/${ticker}/`);

// ============================================================
// Utility Functions
// ============================================================

/**
 * Handle API error
 */
export const handleApiError = (error) => {
  if (error.response) {
    const message = error.response.data?.message || 'Server error occurred';
    logger.error('API Error:', message);
    return message;
  } else if (error.request) {
    logger.error('Network Error: No response from server');
    return 'Network error. Please check your connection.';
  } else {
    logger.error('Error:', error.message);
    return error.message;
  }
};

/**
 * Transform API response to data
 */
export const getResponseData = (response) => response.data;

/**
 * Check if API call was successful
 */
export const isSuccess = (response) =>
  response.status >= 200 && response.status < 300;

// ============================================================
// Indicators API
// ============================================================

export const getIndicators = (params) => api.get('/indicators/', { params });

// Nasdaq API (나스닥/NYSE) - Legacy support
export const fetchNasdaqStocks = (market, useMock = true, limit = null, update = false) =>
  api.post('/kiwoom/fetch-nasdaq/', { market, use_mock: useMock, limit, update });

export default api;
