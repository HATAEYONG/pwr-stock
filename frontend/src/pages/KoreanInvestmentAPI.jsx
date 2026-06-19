import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  TextField,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function KoreanInvestmentAPI() {
  const [tabValue, setTabValue] = useState(0);

  // 현재가 조회
  const [domesticCode, setDomesticCode] = useState('');
  const [usTicker, setUsTicker] = useState('');
  const [domesticPrice, setDomesticPrice] = useState(null);
  const [usPrice, setUsPrice] = useState(null);
  const [loading, setLoading] = useState(false);

  // 일봉 수집
  const [collectTicker, setCollectTicker] = useState('');
  const [collectMarket, setCollectMarket] = useState('domestic');
  const [collectPeriod, setCollectPeriod] = useState(100);
  const [collectResult, setCollectResult] = useState(null);

  // API 테스트
  const [testResult, setTestResult] = useState(null);

  const handleGetDomesticPrice = async () => {
    if (!domesticCode) {
      alert('종목코드를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/koreainvestment/domestic-price/${domesticCode}/`);
      setDomesticPrice(response.data);
    } catch (err) {
      console.error('현재가 조회 오류:', err);
      alert('현재가 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetUSPrice = async () => {
    if (!usTicker) {
      alert('티커를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/koreainvestment/us-price/${usTicker}/`);
      setUsPrice(response.data);
    } catch (err) {
      console.error('현재가 조회 오류:', err);
      alert('현재가 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectDaily = async () => {
    if (!collectTicker) {
      alert('종목코드/티커를 입력해주세요');
      return;
    }

    setLoading(true);
    setCollectResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/koreainvestment/collect-${collectMarket === 'domestic' ? 'domestic' : 'us'}-daily/`, {
        ticker: collectTicker,
        period: collectPeriod
      });
      setCollectResult(response.data);
      alert('데이터 수집 완료!');
    } catch (err) {
      console.error('데이터 수집 오류:', err);
      alert('데이터 수집에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/koreainvestment/test-connection/`);
      setTestResult(response.data);
    } catch (err) {
      console.error('API 연결 테스트 오류:', err);
      setTestResult({ success: false, message: 'API 연결 실패' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          🇰🇷 한국투자증권 API
        </Typography>
        <Typography variant="body1" color="text.secondary">
          한국투자증권 Open API를 활용한 데이터 수집 및 조회
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="현재가 조회" />
          <Tab label="일봉 데이터 수집" />
          <Tab label="대량 수집" />
          <Tab label="API 연결 테스트" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 1: 현재가 조회 */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  국내주식 현재가
                </Typography>
                <TextField
                  fullWidth
                  label="종목코드 (6자리)"
                  placeholder="예: 005930"
                  value={domesticCode}
                  onChange={(e) => setDomesticCode(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleGetDomesticPrice}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  현재가 조회
                </Button>

                {domesticPrice && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {domesticPrice.name} ({domesticCode})
                    </Typography>
                    <Typography variant="h4" color="primary">
                      ₩{domesticPrice.price?.toLocaleString()}
                    </Typography>
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  미국주식 현재가
                </Typography>
                <TextField
                  fullWidth
                  label="티커"
                  placeholder="예: AAPL"
                  value={usTicker}
                  onChange={(e) => setUsTicker(e.target.value.toUpperCase())}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleGetUSPrice}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  현재가 조회
                </Button>

                {usPrice && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {usPrice.name} ({usTicker})
                    </Typography>
                    <Typography variant="h4" color="primary">
                      ${usPrice.price?.toLocaleString()}
                    </Typography>
                  </Alert>
                )}
              </Grid>
            </Grid>
          )}

          {/* Tab 2: 일봉 데이터 수집 */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                일봉 데이터 수집
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>시장 선택</InputLabel>
                    <Select
                      value={collectMarket}
                      label="시장 선택"
                      onChange={(e) => setCollectMarket(e.target.value)}
                    >
                      <MenuItem value="domestic">국내주식</MenuItem>
                      <MenuItem value="usa">미국주식</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={collectMarket === 'domestic' ? '종목코드 (6자리)' : '티커'}
                    placeholder={collectMarket === 'domestic' ? '예: 005930' : '예: AAPL'}
                    value={collectTicker}
                    onChange={(e) => setCollectTicker(e.target.value.toUpperCase())}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography gutterBottom>
                    수집 기간: {collectPeriod}일
                  </Typography>
                  <Slider
                    value={collectPeriod}
                    onChange={(e, newValue) => setCollectPeriod(newValue)}
                    min={1}
                    max={365}
                    valueLabelDisplay="auto"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCollectDaily}
                    disabled={loading || !collectTicker}
                    startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  >
                    수집 시작
                  </Button>
                </Grid>

                {collectResult && (
                  <Grid item xs={12}>
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <CheckCircleIcon sx={{ mr: 1 }} />
                      데이터 수집 완료!
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {collectTicker}의 {collectPeriod}일치 데이터가 수집되었습니다.
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Tab 3: 대량 수집 */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                대량 일봉 수집
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                여러 종목의 데이터를 한번에 수집합니다. 시간이 오래 걸릴 수 있습니다.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>시장 선택</InputLabel>
                    <Select
                      value={collectMarket}
                      label="시장 선택"
                      onChange={(e) => setCollectMarket(e.target.value)}
                    >
                      <MenuItem value="domestic">국내주식</MenuItem>
                      <MenuItem value="usa">미국주식</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="종목코드/티커 (콤마 또는 줄바꿈으로 구분)"
                    placeholder={collectMarket === 'domestic'
                      ? '예: 005930,000675,035420'
                      : '예: AAPL,TSLA,NVDA'
                    }
                    helperText="여러 종목을 동시에 수집할 수 있습니다."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    color="warning"
                    disabled={loading}
                    startIcon={<DownloadIcon />}
                  >
                    대량 수집 시작
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 4: API 연결 테스트 */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                API 연결 테스트
              </Typography>

              <Button
                variant="contained"
                onClick={handleTestConnection}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                sx={{ mb: 3 }}
              >
                연결 테스트
              </Button>

              {testResult && (
                <Alert
                  severity={testResult.success ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  {testResult.success ? (
                    <>
                      <CheckCircleIcon sx={{ mr: 1 }} />
                      API 연결 성공!
                    </>
                  ) : (
                    <>
                      <ErrorIcon sx={{ mr: 1 }} />
                      API 연결 실패: {testResult.message}
                    </>
                  )}
                </Alert>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  API 정보:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 도메인: https://openapi.koreainvestment.com:9443
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 국내주식: 현물, ELW 등
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 미국주식: NASDAQ, NYSE, AMEX 등
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* 최근 수집 내역 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          최근 수집 내역
        </Typography>
        <Typography variant="body2" color="text.secondary">
          최근 7일간의 데이터 수집 내역을 확인할 수 있습니다.
        </Typography>
      </Paper>
    </Container>
  );
}

export default KoreanInvestmentAPI;
