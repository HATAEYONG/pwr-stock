import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationsIcon,
  TrendingUp,
  FindInPage,
  Science as BacktestIcon
} from '@mui/icons-material';

// Pages
import Dashboard from './pages/Dashboard';
import SymbolSearch from './pages/SymbolSearch';
import SymbolManagement from './pages/SymbolManagement';
import DataImport from './pages/DataImport';
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
import BacktestResult from './pages/BacktestResult';

function App() {
  const [symbolMenuAnchor, setSymbolMenuAnchor] = React.useState(null);
  const [patternMenuAnchor, setPatternMenuAnchor] = React.useState(null);
  const [backtestMenuAnchor, setBacktestMenuAnchor] = React.useState(null);

  const handleSymbolMenuOpen = (event) => {
    setSymbolMenuAnchor(event.currentTarget);
  };

  const handleSymbolMenuClose = () => {
    setSymbolMenuAnchor(null);
  };

  const handlePatternMenuOpen = (event) => {
    setPatternMenuAnchor(event.currentTarget);
  };

  const handlePatternMenuClose = () => {
    setPatternMenuAnchor(null);
  };

  const handleBacktestMenuOpen = (event) => {
    setBacktestMenuAnchor(event.currentTarget);
  };

  const handleBacktestMenuClose = () => {
    setBacktestMenuAnchor(null);
  };

  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <TrendingUp sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Pattern Trading System
            </Typography>
            
            <Button 
              color="inherit" 
              component={Link} 
              to="/"
              startIcon={<DashboardIcon />}
            >
              대시보드
            </Button>

            <Button 
              color="inherit"
              onClick={handleSymbolMenuOpen}
              startIcon={<SearchIcon />}
            >
              1. 종목 관리
            </Button>
            <Menu
              anchorEl={symbolMenuAnchor}
              open={Boolean(symbolMenuAnchor)}
              onClose={handleSymbolMenuClose}
            >
              <MenuItem 
                component={Link} 
                to="/symbols/search" 
                onClick={handleSymbolMenuClose}
              >
                종목 찾기/검색
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/symbols/manage" 
                onClick={handleSymbolMenuClose}
              >
                종목 관리
              </MenuItem>
            </Menu>

            <Button 
              color="inherit" 
              component={Link} 
              to="/data/import"
              startIcon={<UploadIcon />}
            >
              2. 데이터 Import
            </Button>

            <Button 
              color="inherit"
              onClick={handlePatternMenuOpen}
              startIcon={<AnalyticsIcon />}
            >
              3. 패턴 분석
            </Button>
            <Menu
              anchorEl={patternMenuAnchor}
              open={Boolean(patternMenuAnchor)}
              onClose={handlePatternMenuClose}
            >
              <MenuItem 
                component={Link} 
                to="/pattern-search" 
                onClick={handlePatternMenuClose}
              >
                🔍 패턴 기반 종목 찾기
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/analysis/run" 
                onClick={handlePatternMenuClose}
              >
                🚀 분석 실행
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/backtest/run" 
                onClick={handlePatternMenuClose}
              >
                📊 백테스팅 실행
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/backtest/results" 
                onClick={handlePatternMenuClose}
              >
                📈 백테스팅 결과
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/technical" 
                onClick={handlePatternMenuClose}
              >
                📈 기술적 지표
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/evaluations" 
                onClick={handlePatternMenuClose}
              >
                전체 결과
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/patterns/P1" 
                onClick={handlePatternMenuClose}
              >
                Pattern 1 (매집형)
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/patterns/P2" 
                onClick={handlePatternMenuClose}
              >
                Pattern 2 (추세전환)
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/patterns/P3" 
                onClick={handlePatternMenuClose}
              >
                Pattern 3 (IPO반등)
              </MenuItem>
            </Menu>

            <Button 
              color="inherit"
              onClick={handleBacktestMenuOpen}
              startIcon={<NotificationsIcon />}
            >
              4. 트리거 알림
            </Button>
            <Menu
              anchorEl={backtestMenuAnchor}
              open={Boolean(backtestMenuAnchor)}
              onClose={handleBacktestMenuClose}
            >
              <MenuItem 
                component={Link} 
                to="/alerts" 
                onClick={handleBacktestMenuClose}
              >
                📋 알림 내역
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/alerts/settings" 
                onClick={handleBacktestMenuClose}
              >
                ⚙️ 알림 설정
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* 종목 관리 */}
            <Route path="/symbols/search" element={<SymbolSearch />} />
            <Route path="/symbols/manage" element={<SymbolManagement />} />
            
            {/* 데이터 관리 */}
            <Route path="/data/import" element={<DataImport />} />
            
            {/* 패턴 분석 */}
            <Route path="/pattern-search" element={<PatternSearch />} />
            <Route path="/analysis/run" element={<AnalysisRunner />} />
            <Route path="/evaluations" element={<EvaluationsList />} />
            <Route path="/evaluations/:id" element={<EvaluationDetail />} />
            <Route path="/patterns/:patternType" element={<PatternView />} />
            <Route path="/technical" element={<TechnicalDashboard />} />
            
            {/* 백테스팅 */}
            <Route path="/backtest/run" element={<BacktestRun />} />
            <Route path="/backtest/results" element={<BacktestResults />} />
            
            {/* 트리거 알림 */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/alerts/settings" element={<AlertSettings />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
