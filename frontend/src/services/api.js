import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Symbols API
export const getSymbols = (params) => api.get('/symbols/', { params });
export const getSymbol = (id) => api.get(`/symbols/${id}/`);

// Evaluations API
export const getEvaluations = (params) => api.get('/evaluations/', { params });
export const getEvaluation = (id) => api.get(`/evaluations/${id}/`);
export const getHighScoreEvaluations = () => api.get('/evaluations/high_score/');
export const getPattern1Evaluations = () => api.get('/evaluations/pattern1/');
export const getPattern2Evaluations = () => api.get('/evaluations/pattern2/');
export const getPattern3Evaluations = () => api.get('/evaluations/pattern3/');
export const getSignalEvaluations = (signalType) => 
  api.get('/evaluations/signals/', { params: { type: signalType } });

// OHLCV API
export const getOHLCV = (params) => api.get('/ohlcv/', { params });

// Indicators API
export const getIndicators = (params) => api.get('/indicators/', { params });

// Kiwoom API (코스닥/코스피)
export const fetchKiwoomStocks = (market, useMock = true, update = false) => 
  api.post('/kiwoom/fetch-stocks/', { market, use_mock: useMock, update });

// Nasdaq API (나스닥/NYSE)
export const fetchNasdaqStocks = (market, useMock = true, limit = null, update = false) => 
  api.post('/kiwoom/fetch-nasdaq/', { market, use_mock: useMock, limit, update });

// Kiwoom 상태 확인
export const getKiwoomStatus = () => api.get('/kiwoom/status/');

export default api;
