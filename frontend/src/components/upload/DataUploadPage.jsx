/**
 * Data Upload Page Component (PR-13 Enhancement)
 * Provides UI for bulk data uploads via CSV/Excel files
 */
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

import OHLCVUpload from './OHLCVUpload';
import SymbolUpload from './SymbolUpload';
import BacktestUpload from './BacktestUpload';
import ConfigUpload from './ConfigUpload';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DataUploadPage = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            데이터 업로드
          </Typography>
          <Typography variant="body1" color="text.secondary">
            CSV/Excel 파일로 대량 데이터를 일괄 등록합니다
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="OHLCV 시세 데이터" />
          <Tab label="종목 마스터 데이터" />
          <Tab label="백테스트 결과" />
          <Tab label="YAML 설정 파일" />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={currentTab} index={0}>
          <OHLCVUpload />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <SymbolUpload />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <BacktestUpload />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <ConfigUpload />
        </TabPanel>

        {/* Info Section */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            💡 파일 업로드 가이드
          </Typography>
          <Typography variant="body2" component="div">
            <ul>
              <li>지원 파일 형식: CSV, Excel (.xlsx, .xls), YAML (.yaml)</li>
              <li>최대 파일 크기: 10MB</li>
              <li>데이터는 UTF-8 인코딩이어야 합니다</li>
              <li>필수 열은 대소문자를 구분하지 않습니다 (date, Date, DATE 모두 허용)</li>
              <li>중복 데이터 처리 방식을 선택할 수 있습니다</li>
            </ul>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DataUploadPage;
