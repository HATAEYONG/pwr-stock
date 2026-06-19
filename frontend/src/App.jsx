import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Box, Alert, Collapse } from '@mui/material';
import { motion } from 'framer-motion';

// Components
import Navigation from './components/Navigation';

// Pages
import Dashboard from './pages/Dashboard';
import SymbolSearch from './pages/SymbolSearch';
import SymbolManagement from './pages/SymbolManagement';
import DataImport from './pages/DataImport';
import ImageAnalysis from './pages/ImageAnalysis';
import AnalysisRunner from './pages/AnalysisRunner';
import EvaluationsList from './pages/EvaluationsList';
import EvaluationDetail from './pages/EvaluationDetail';
import PatternView from './pages/PatternView';
import Alerts from './pages/Alerts';
import PatternSearch from './pages/PatternSearch';
import BacktestRun from './pages/BacktestRun';
import BacktestResults from './pages/BacktestResults';
import AlertSettings from './pages/AlertSettings';
import TechnicalDashboard from './pages/TechnicalDashboard';
import BacktestRunner from './pages/BacktestRunner';
import BacktestList from './pages/BacktestList';
import BatchPatternAnalysis from './pages/BatchPatternAnalysis';
import BacktestResult from './pages/BacktestResult';
import PortfolioDashboard from './pages/PortfolioDashboard';
import MLPredictions from './pages/MLPredictions';
import MarketDashboard from './pages/MarketDashboard';
import TimeframeAnalysis from './pages/TimeframeAnalysis';
import RealtimeDashboard from './pages/RealtimeDashboard';
import BacktestReportDownload from './pages/BacktestReportDownload';
import KiwoomApiIntegration from './pages/KiwoomApiIntegration';
import NasdaqApiIntegration from './pages/NasdaqApiIntegration';
import KoreanInvestmentAPI from './pages/KoreanInvestmentAPI';
import DataUploadPage from './components/upload/DataUploadPage';
import OntologyModel from './pages/OntologyModel';
import KnowledgeGraph from './pages/KnowledgeGraph';
import RelationshipGraph from './pages/RelationshipGraph';
import InferenceEngine from './pages/InferenceEngine';
import SparqlQuery from './pages/SparqlQuery';
import SemanticTriples from './pages/SemanticTriples';
import PatternAnalysis from './pages/PatternAnalysis';
import RealtimeData from './pages/RealtimeData';
import KiwoomRestApi from './pages/KiwoomRestApi';
import KiwoomApiSettings from './pages/KiwoomApiSettings';
import OHLCVViewer from './pages/OHLCVViewer';
import DataCollector from './pages/DataCollector';
import RealtimePatternMonitor from './pages/RealtimePatternMonitor';
import StockScreening from './pages/StockScreening';
import ApiSettings from './pages/ApiSettings';
import TechnicalAnalysis from './pages/TechnicalAnalysis';

function BackendBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    fetch(`${url}/market/symbols/?limit=1`, { signal: AbortSignal.timeout(4000) })
      .catch(() => setShow(true));
  }, []);
  return (
    <Collapse in={show}>
      <Alert severity="warning" onClose={() => setShow(false)} sx={{ borderRadius: 0 }}>
        백엔드 서버에 연결할 수 없습니다. UI는 정상 동작하지만 데이터 조회는 백엔드 배포 후 가능합니다.
        {' '}(<code>VITE_API_URL</code> 환경변수를 설정하세요)
      </Alert>
    </Collapse>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Box sx={{ flexGrow: 1 }}>
        <BackendBanner />
        <Navigation />

        <Container
          maxWidth="xl"
          sx={{
            mt: 4,
            mb: 4,
            minHeight: '80vh',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* 종목 관리 */}
            <Route path="/symbols/search" element={<SymbolSearch />} />
            <Route path="/symbols/manage" element={<SymbolManagement />} />
            
            {/* 데이터 관리 */}
            <Route path="/data/import" element={<DataImport />} />
            <Route path="/upload" element={<DataUploadPage />} />
            <Route path="/image-analysis" element={<ImageAnalysis />} />

            {/* 패턴 분석 */}
            <Route path="/pattern-search" element={<PatternSearch />} />
            <Route path="/batch-analysis" element={<BatchPatternAnalysis />} />
            <Route path="/ohlcv-viewer" element={<OHLCVViewer />} />
            <Route path="/analysis/run" element={<AnalysisRunner />} />
            <Route path="/evaluations" element={<EvaluationsList />} />
            <Route path="/evaluations/:id" element={<EvaluationDetail />} />
            <Route path="/patterns/:patternType" element={<PatternView />} />
            <Route path="/technical" element={<TechnicalDashboard />} />
            <Route path="/technical-analysis" element={<TechnicalAnalysis />} />

            {/* 백테스팅 */}
            <Route path="/backtest/run" element={<BacktestRun />} />
            <Route path="/backtest/results" element={<BacktestResults />} />
            
            {/* 트리거 알림 */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/alerts/settings" element={<AlertSettings />} />

            {/* 고도화 기능 */}
            <Route path="/portfolio" element={<PortfolioDashboard />} />
            <Route path="/ml-predictions" element={<MLPredictions />} />
            <Route path="/market" element={<MarketDashboard />} />
            <Route path="/timeframe" element={<TimeframeAnalysis />} />
            <Route path="/realtime" element={<RealtimeDashboard />} />
            <Route path="/report-download" element={<BacktestReportDownload />} />

            {/* 키움 OpenAPI */}
            <Route path="/kiwoom-api" element={<KiwoomApiIntegration />} />
            <Route path="/kiwoom-rest-api" element={<KiwoomRestApi />} />
            <Route path="/kiwoom-api-settings" element={<KiwoomApiSettings />} />
            <Route path="/realtime-data" element={<RealtimeData />} />

            {/* 한국투자증권 API */}
            <Route path="/koreainvestment-api" element={<KoreanInvestmentAPI />} />

            {/* 나스닥 API */}
            <Route path="/nasdaq-api" element={<NasdaqApiIntegration />} />

            {/* 온톨로지 */}
            <Route path="/ontology/model" element={<OntologyModel />} />
            <Route path="/ontology/knowledge-graph" element={<KnowledgeGraph />} />
            <Route path="/ontology/relationship-graph" element={<RelationshipGraph />} />
            <Route path="/ontology/inference" element={<InferenceEngine />} />
            <Route path="/ontology/sparql" element={<SparqlQuery />} />
            <Route path="/ontology/triples" element={<SemanticTriples />} />
            <Route path="/ontology/pattern-analysis" element={<PatternAnalysis />} />

            {/* 종목별 패턴 분석 (새 메뉴) */}
            <Route path="/pattern-analysis" element={<PatternAnalysis />} />

            {/* Phase 3: 키움 데이터 수집 및 실시간 모니터링 */}
            <Route path="/data-collector" element={<DataCollector />} />
            <Route path="/realtime-monitor" element={<RealtimePatternMonitor />} />
            <Route path="/stock-screening" element={<StockScreening />} />

            {/* API 설정 관리 */}
            <Route path="/api-settings" element={<ApiSettings />} />
          </Routes>
          </motion.div>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
