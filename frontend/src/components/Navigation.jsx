/**
 * Main Navigation Component
 * 메인 내비게이션 바
 */
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Fade,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CloudUpload,
  Analytics as AnalyticsIcon,
  Notifications,
  TrendingUp,
  ShowChart,
  Science
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function Navigation() {
  const [dataMenuAnchor, setDataMenuAnchor] = React.useState(null);
  const [analysisMenuAnchor, setAnalysisMenuAnchor] = React.useState(null);
  const [monitoringMenuAnchor, setMonitoringMenuAnchor] = React.useState(null);
  const [advancedMenuAnchor, setAdvancedMenuAnchor] = React.useState(null);
  const [collectionMenuAnchor, setCollectionMenuAnchor] = React.useState(null);
  const [ontologyMenuAnchor, setOntologyMenuAnchor] = React.useState(null);

  const handleDataMenuClose = () => setDataMenuAnchor(null);
  const handleAnalysisMenuClose = () => setAnalysisMenuAnchor(null);
  const handleMonitoringMenuClose = () => setMonitoringMenuAnchor(null);
  const handleAdvancedMenuClose = () => setAdvancedMenuAnchor(null);
  const handleCollectionMenuClose = () => setCollectionMenuAnchor(null);
  const handleOntologyMenuClose = () => setOntologyMenuAnchor(null);

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ minHeight: 80, px: 3 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ rotate: 360 }}
          style={{ marginRight: 16 }}
        >
          <TrendingUp sx={{ fontSize: 42, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
        </motion.div>

        <Typography
          variant="h5"
          component="div"
          sx={{
            flexGrow: 1,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 1,
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            background: 'linear-gradient(45deg, #ffffff, #f0f0f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Pattern Trading System
        </Typography>

        {/* Dashboard Button */}
        <Button
          color="inherit"
          component={Link}
          to="/"
          startIcon={<DashboardIcon />}
          sx={{
            mx: 0.5,
            fontSize: 15,
            fontWeight: 700,
            px: 2.5,
            py: 1,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            },
          }}
        >
          대시보드
        </Button>

        {/* 1. 데이터 관리 메뉴 */}
        <Button
          color="inherit"
          onClick={(e) => setDataMenuAnchor(e.currentTarget)}
          startIcon={<CloudUpload />}
          sx={{
            mx: 0.5,
            fontSize: 15,
            fontWeight: 700,
            px: 2.5,
            py: 1,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            },
          }}
        >
          1. 데이터 관리
        </Button>
        <Menu
          anchorEl={dataMenuAnchor}
          open={Boolean(dataMenuAnchor)}
          onClose={handleDataMenuClose}
          TransitionComponent={Fade}
        >
          <MenuItem component={Link} to="/symbols/search" onClick={handleDataMenuClose}>
            🔍 종목 찾기/검색
          </MenuItem>
          <MenuItem component={Link} to="/symbols/manage" onClick={handleDataMenuClose}>
            📋 종목 관리
          </MenuItem>
          <MenuItem component={Link} to="/data/import" onClick={handleDataMenuClose}>
            📥 데이터 Import
          </MenuItem>
          <MenuItem component={Link} to="/upload" onClick={handleDataMenuClose}>
            📁 파일 업로드
          </MenuItem>
          <MenuItem component={Link} to="/image-analysis" onClick={handleDataMenuClose}>
            🖼️ 이미지 분석
          </MenuItem>
        </Menu>

        {/* 2. 분석 및 백테스팅 메뉴 */}
        <Button
          color="inherit"
          onClick={(e) => setAnalysisMenuAnchor(e.currentTarget)}
          startIcon={<AnalyticsIcon />}
          sx={{
            mx: 0.5,
            fontSize: 15,
            fontWeight: 700,
            px: 2.5,
            py: 1,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            },
          }}
        >
          2. 분석 및 백테스팅
        </Button>
        <Menu
          anchorEl={analysisMenuAnchor}
          open={Boolean(analysisMenuAnchor)}
          onClose={handleAnalysisMenuClose}
          TransitionComponent={Fade}
        >
          <MenuItem component={Link} to="/pattern-analysis" onClick={handleAnalysisMenuClose}>
            📊 종목별 패턴 분석
          </MenuItem>
          <MenuItem component={Link} to="/pattern-search" onClick={handleAnalysisMenuClose}>
            🔍 패턴 기반 종목 찾기
          </MenuItem>
          <MenuItem component={Link} to="/batch-analysis" onClick={handleAnalysisMenuClose}>
            📊 전체 종목 일괄 분석
          </MenuItem>
          <MenuItem component={Link} to="/analysis/run" onClick={handleAnalysisMenuClose}>
            🚀 분석 실행
          </MenuItem>
          <MenuItem component={Link} to="/technical" onClick={handleAnalysisMenuClose}>
            📈 기술적 지표
          </MenuItem>
          <MenuItem component={Link} to="/technical-analysis" onClick={handleAnalysisMenuClose}>
            📊 기술적 분석 & ML
          </MenuItem>
          <MenuItem component={Link} to="/evaluations" onClick={handleAnalysisMenuClose}>
            📋 전체 결과
          </MenuItem>
          <MenuItem component={Link} to="/backtest/run" onClick={handleAnalysisMenuClose}>
            📊 백테스팅 실행
          </MenuItem>
          <MenuItem component={Link} to="/backtest/results" onClick={handleAnalysisMenuClose}>
            📈 백테스팅 결과
          </MenuItem>
        </Menu>

        {/* 3. 실시간 모니터링 메뉴 */}
        <Button
          color="inherit"
          onClick={(e) => setMonitoringMenuAnchor(e.currentTarget)}
          startIcon={<Notifications sx={{ fontSize: 20 }} />}
          sx={{
            mx: 0.5,
            fontSize: 15,
            fontWeight: 700,
            px: 2.5,
            py: 1,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            },
          }}
        >
          3. 실시간 모니터링
        </Button>
        <Menu
          anchorEl={monitoringMenuAnchor}
          open={Boolean(monitoringMenuAnchor)}
          onClose={handleMonitoringMenuClose}
          TransitionComponent={Fade}
        >
          <MenuItem component={Link} to="/realtime-monitor" onClick={handleMonitoringMenuClose}>
            📡 실시간 패턴 모니터링
          </MenuItem>
          <MenuItem component={Link} to="/stock-screening" onClick={handleMonitoringMenuClose}>
            🔍 검색식 (스크리닝)
          </MenuItem>
          <MenuItem component={Link} to="/alerts" onClick={handleMonitoringMenuClose}>
            📋 알림 내역
          </MenuItem>
          <MenuItem component={Link} to="/alerts/settings" onClick={handleMonitoringMenuClose}>
            ⚙️ 알림 설정
          </MenuItem>
          <MenuItem component={Link} to="/realtime" onClick={handleMonitoringMenuClose}>
            📡 실시간 시세 대시보드
          </MenuItem>
        </Menu>

        {/* 4. 고급 기능 메뉴 */}
        <Button
          color="inherit"
          onClick={(e) => setAdvancedMenuAnchor(e.currentTarget)}
          startIcon={<ShowChart />}
          sx={{
            mx: 0.5,
            fontSize: 15,
            fontWeight: 700,
            px: 2.5,
            py: 1,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            },
          }}
        >
          4. 고급 기능
        </Button>
        <Menu
          anchorEl={advancedMenuAnchor}
          open={Boolean(advancedMenuAnchor)}
          onClose={handleAdvancedMenuClose}
          TransitionComponent={Fade}
        >
          <MenuItem component={Link} to="/portfolio" onClick={handleAdvancedMenuClose}>
            💼 포트폴리오 관리
          </MenuItem>
          <MenuItem component={Link} to="/ml-predictions" onClick={handleAdvancedMenuClose}>
            🤖 AI/ML 예측
          </MenuItem>
          <MenuItem component={Link} to="/market" onClick={handleAdvancedMenuClose}>
            📊 시장 지수 대시보드
          </MenuItem>
          <MenuItem component={Link} to="/timeframe" onClick={handleAdvancedMenuClose}>
            ⏰ 시간대별 분석
          </MenuItem>
          <MenuItem component={Link} to="/report-download" onClick={handleAdvancedMenuClose}>
            📥 리포트 다운로드
          </MenuItem>
        </Menu>

        {/* 5. 데이터 수집 메뉴 */}
        <Button
          color="inherit"
          onClick={(e) => setCollectionMenuAnchor(e.currentTarget)}
          startIcon={<CloudUpload />}
          sx={{
            mx: 0.5,
            fontSize: 15,
            fontWeight: 700,
            px: 2.5,
            py: 1,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            },
          }}
        >
          5. 데이터 수집
        </Button>
        <Menu
          anchorEl={collectionMenuAnchor}
          open={Boolean(collectionMenuAnchor)}
          onClose={handleCollectionMenuClose}
          TransitionComponent={Fade}
        >
          <MenuItem component={Link} to="/data-collector" onClick={handleCollectionMenuClose}>
            📊 키움 데이터 수집
          </MenuItem>
          <MenuItem component={Link} to="/ohlcv-viewer" onClick={handleCollectionMenuClose}>
            📈 OHLCV 데이터 조회
          </MenuItem>
          <MenuItem component={Link} to="/realtime-data" onClick={handleCollectionMenuClose}>
            📡 실시간 데이터 수집
          </MenuItem>
          <MenuItem component={Link} to="/kiwoom-rest-api" onClick={handleCollectionMenuClose}>
            🌐 키움 REST API
          </MenuItem>
          <MenuItem component={Link} to="/kiwoom-api" onClick={handleCollectionMenuClose}>
            🔌 키움 OCX API
          </MenuItem>
          <MenuItem component={Link} to="/api-settings" onClick={handleCollectionMenuClose}>
            ⚙️ API 설정
          </MenuItem>
          <MenuItem component={Link} to="/nasdaq-api" onClick={handleCollectionMenuClose}>
            📈 NASDAQ API
          </MenuItem>
          <MenuItem component={Link} to="/koreainvestment-api" onClick={handleCollectionMenuClose}>
            🏦 한국투자 API
          </MenuItem>
        </Menu>

        {/* 6. 온톨로지 메뉴 */}
        <Button
          color="inherit"
          onClick={(e) => setOntologyMenuAnchor(e.currentTarget)}
          startIcon={<Science />}
          sx={{
            mx: 0.5,
            fontSize: 15,
            fontWeight: 700,
            px: 2.5,
            py: 1,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            },
          }}
        >
          6. 온톨로지
        </Button>
        <Menu
          anchorEl={ontologyMenuAnchor}
          open={Boolean(ontologyMenuAnchor)}
          onClose={handleOntologyMenuClose}
          TransitionComponent={Fade}
        >
          <MenuItem component={Link} to="/ontology/model" onClick={handleOntologyMenuClose}>
            🔬 온톨로지 모델
          </MenuItem>
          <MenuItem component={Link} to="/ontology/knowledge-graph" onClick={handleOntologyMenuClose}>
            🕸️ 지식 그래프
          </MenuItem>
          <MenuItem component={Link} to="/ontology/relationship-graph" onClick={handleOntologyMenuClose}>
            📊 관계 그래프
          </MenuItem>
          <MenuItem component={Link} to="/ontology/inference" onClick={handleOntologyMenuClose}>
            🧠 추론 엔진
          </MenuItem>
          <MenuItem component={Link} to="/ontology/sparql" onClick={handleOntologyMenuClose}>
            💻 SPARQL 쿼리
          </MenuItem>
          <MenuItem component={Link} to="/ontology/triples" onClick={handleOntologyMenuClose}>
            📦 시맨틱 트리플
          </MenuItem>
          <MenuItem component={Link} to="/ontology/pattern-analysis" onClick={handleOntologyMenuClose}>
            📈 주식 패턴 분석
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default React.memo(Navigation);
