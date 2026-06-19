import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  TextField,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudDownload,
  CloudUpload,
  Settings,
  Sync,
  CheckCircle,
  Error,
  Warning,
  ExpandMore,
  Api,
  Storage,
  Timeline,
  AccountBalance,
  Speed,
  Login,
  Logout
} from '@mui/icons-material';
import axios from 'axios';

function KiwoomApiIntegration() {
  const [systemStatus, setSystemStatus] = useState({
    is_windows: false,
    pyqt5_available: false,
    kiwoom_available: false,
    nasdaq_api_available: false,
    loading: true
  });

  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    loading: false,
    accountInfo: null,
    error: null
  });

  const [marketStatus, setMarketStatus] = useState({
    loading: false,
    status: null,
    error: null
  });

  const [dataCollection, setDataCollection] = useState({
    running: false,
    symbols: ['005930', '000660', '035420', '051910'],
    duration: 60,
    results: []
  });

  const [settings, setSettings] = useState({
    mockMode: false,
    autoConnect: false,
    autoSubscribe: false
  });

  useEffect(() => {
    checkSystemStatus();
    checkConnectionStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/kiwoom/status/');
      setSystemStatus({
        ...response.data,
        loading: false
      });
    } catch (err) {
      setSystemStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const checkConnectionStatus = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true }));
    try {
      // 먼저 시스템 상태 확인
      const statusResponse = await axios.get('http://localhost:8000/api/kiwoom/status/');
      const sysStatus = statusResponse.data;

      // 시스템 상태 저장
      setSystemStatus({
        ...sysStatus,
        loading: false
      });

      // 시스템 요구사항 확인
      if (!sysStatus.is_windows) {
        setConnectionStatus({
          connected: false,
          loading: false,
          accountInfo: null,
          error: '키움증권 OpenAPI는 Windows 환경에서만 사용 가능합니다.'
        });
        return;
      }

      if (!sysStatus.pyqt5_available) {
        setConnectionStatus({
          connected: false,
          loading: false,
          accountInfo: null,
          error: 'PyQt5가 설치되지 않았습니다. pip install PyQt5 PyQt5-Qt5AxContainer 명령어로 설치하세요.'
        });
        return;
      }

      if (!sysStatus.kiwoom_available) {
        setConnectionStatus({
          connected: false,
          loading: false,
          accountInfo: null,
          error: '키움증권 OpenAPI OCX가 설치되지 않았습니다. 키움증권 사이트에서 KOA Studio를 설치하세요.'
        });
        return;
      }

      // 연결 상태 확인
      const connResponse = await axios.get('http://localhost:8000/api/kiwoom/');
      setConnectionStatus({
        connected: connResponse.data.connected || false,
        loading: false,
        accountInfo: connResponse.data.account_info || null,
        error: null
      });
    } catch (err) {
      setConnectionStatus({
        connected: false,
        loading: false,
        accountInfo: null,
        error: '연결 상태 확인 실패: ' + (err.response?.data?.error || err.message)
      });
    }
  };

  const connectToKiwoom = async (useMockMode = false) => {
    setConnectionStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axios.post('http://localhost:8000/api/kiwoom/connect/', {
        mock_mode: useMockMode
      });

      if (response.data.success) {
        setConnectionStatus({
          connected: true,
          loading: false,
          accountInfo: response.data.account_info,
          error: null
        });
      } else {
        setConnectionStatus({
          connected: false,
          loading: false,
          accountInfo: null,
          error: response.data.error || '연결 실패'
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || '알 수 없는 오류';

      // 더 자세한 에러 메시지
      let fullError = '연결 요청 실패: ';
      if (errorMsg.includes('PyQt5')) {
        fullError += 'PyQt5 라이브러리가 필요합니다.';
      } else if (errorMsg.includes('QAxWidget') || errorMsg.includes('OCX')) {
        fullError += '키움증권 KOA Studio가 설치되지 않았습니다. https://www.kiwoom.com/hwst/cont/open/OpenApi.aspx 에서 다운로드하세요.';
      } else if (errorMsg.includes('already connected') || errorMsg.includes('이미')) {
        fullError += '이미 연결되어 있습니다.';
      } else {
        fullError += errorMsg;
      }

      setConnectionStatus({
        connected: false,
        loading: false,
        accountInfo: null,
        error: fullError
      });
    }
  };

  const disconnectFromKiwoom = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true }));
    try {
      await axios.post('http://localhost:8000/api/kiwoom/disconnect/');
      setConnectionStatus({
        connected: false,
        loading: false,
        accountInfo: null,
        error: null
      });
    } catch (err) {
      setConnectionStatus({
        ...connectionStatus,
        loading: false,
        error: '연결 해제 실패'
      });
    }
  };

  const fetchMarketStatus = async () => {
    setMarketStatus({ loading: true, status: null, error: null });
    try {
      const response = await axios.get('http://localhost:8000/api/kiwoom/market_status/');
      setMarketStatus({
        loading: false,
        status: response.data,
        error: null
      });
    } catch (err) {
      setMarketStatus({
        loading: false,
        status: null,
        error: '장 상태 조회 실패'
      });
    }
  };

  const startRealtimeCollection = async () => {
    setDataCollection(prev => ({ ...prev, running: true }));
    try {
      const response = await axios.post('http://localhost:8000/api/kiwoom/realtime/subscribe/', {
        tickers: dataCollection.symbols
      });

      setDataCollection(prev => ({
        ...prev,
        running: false,
        results: response.data.results || []
      }));
    } catch (err) {
      setDataCollection(prev => ({ ...prev, running: false }));
    }
  };

  const fetchStockCodes = async (market = 'kospi') => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/kiwoom/stocks/?market=${market}`
      );
      return response.data.codes || [];
    } catch (err) {
      return [];
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          키움증권 OpenAPI 연동
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Kiwoom Securities API Integration
        </Typography>
      </Box>

      {/* 시스템 요구사항 체크 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  시스템 요구사항 확인
                </Typography>
              </Box>

              {systemStatus.loading ? (
                <LinearProgress sx={{ mb: 2 }} />
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: systemStatus.is_windows ? 'success.light' : 'error.light',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      {systemStatus.is_windows ? <CheckCircle color="success" /> : <Error color="error" />}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Windows 환경
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {systemStatus.platform || 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: systemStatus.pyqt5_available ? 'success.light' : 'error.light',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      {systemStatus.pyqt5_available ? <CheckCircle color="success" /> : <Error color="error" />}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          PyQt5
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {systemStatus.pyqt5_available ? '설치됨' : '미설치'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: systemStatus.kiwoom_available ? 'success.light' : 'error.light',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      {systemStatus.kiwoom_available ? <CheckCircle color="success" /> : <Error color="error" />}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          키움 OCX
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {systemStatus.kiwoom_available ? '사용 가능' : '미설치'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: systemStatus.nasdaq_api_available ? 'success.light' : 'warning.light',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      {systemStatus.nasdaq_api_available ? <CheckCircle color="success" /> : <Warning color="warning" />}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          NASDAQ API
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {systemStatus.nasdaq_api_available ? '사용 가능' : '미설치'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {(!systemStatus.loading && (!systemStatus.is_windows || !systemStatus.pyqt5_available || !systemStatus.kiwoom_available)) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>키움증권 연결을 위해 다음 요구사항을 충족하세요:</strong><br />
                    {!systemStatus.is_windows && "• Windows 환경에서만 사용 가능합니다.<br />"}
                    {!systemStatus.pyqt5_available && "• PyQt5 설치: <code>pip install PyQt5 PyQt5-Qt5AxContainer</code><br />"}
                    {!systemStatus.kiwoom_available && "• 키움증권 KOA Studio 설치: <a href='https://www.kiwoom.com/hwst/cont/open/OpenApi.aspx' target='_blank'>다운로드 링크</a><br />"}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 연결 상태 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  연결 상태
                </Typography>
                {connectionStatus.connected ? (
                  <Chip
                    icon={<CheckCircle />}
                    label="연결됨"
                    color="success"
                  />
                ) : (
                  <Chip
                    icon={<Error />}
                    label="연결 안됨"
                    color="error"
                  />
                )}
              </Box>

              {connectionStatus.loading && (
                <LinearProgress sx={{ mb: 2 }} />
              )}

              {connectionStatus.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {connectionStatus.error}
                </Alert>
              )}

              {connectionStatus.accountInfo && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    사용자 정보
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="이름"
                        secondary={connectionStatus.accountInfo.user_name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="ID"
                        secondary={connectionStatus.accountInfo.user_id}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="계좌 수"
                        secondary={connectionStatus.accountInfo.accounts?.length || 0}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
              {!connectionStatus.connected ? (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={connectionStatus.loading ? <CircularProgress size={20} /> : <Api />}
                    onClick={() => connectToKiwoom(true)}
                    disabled={connectionStatus.loading}
                    sx={{ mb: 1 }}
                  >
                    모의투자 로그인
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={connectionStatus.loading ? <CircularProgress size={20} /> : <Login />}
                    onClick={() => connectToKiwoom(false)}
                    disabled={connectionStatus.loading}
                  >
                    실전투자 로그인
                  </Button>
                </>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<Logout />}
                  onClick={disconnectFromKiwoom}
                  disabled={connectionStatus.loading}
                >
                  연결 해제
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* 장 운영 상태 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                장 운영 상태
              </Typography>

              {marketStatus.loading && <LinearProgress sx={{ mb: 2 }} />}

              {marketStatus.status && (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={marketStatus.status.is_market_time ? '장 운영 중' : '장 종료'}
                      color={marketStatus.status.is_market_time ? 'success' : 'default'}
                      sx={{ mb: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      현재 시간: {marketStatus.status.current_time}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="요일"
                        secondary={marketStatus.status.weekday_name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="장 운영 시간"
                        secondary="09:00 - 15:30"
                      />
                    </ListItem>
                  </List>
                </Box>
              )}

              {marketStatus.error && (
                <Alert severity="warning">
                  {marketStatus.error}
                </Alert>
              )}
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={marketStatus.loading ? <CircularProgress size={20} /> : <Sync />}
                onClick={fetchMarketStatus}
                disabled={marketStatus.loading || !connectionStatus.connected}
              >
                상태 새로고침
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* 데이터 수집 */}
      <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        실시간 데이터 수집
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="종목 코드 (콤마 구분)"
          placeholder="005930,000660,035420"
          value={dataCollection.symbols.join(',')}
          onChange={(e) => setDataCollection(prev => ({
            ...prev,
            symbols: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          }))}
          fullWidth
          disabled={dataCollection.running}
          sx={{ mb: 2 }}
        />

        <TextField
          label="수집 시간 (초)"
          type="number"
          value={dataCollection.duration}
          onChange={(e) => setDataCollection(prev => ({
            ...prev,
            duration: parseInt(e.target.value) || 60
          }))}
          disabled={dataCollection.running}
          fullWidth
        />
      </Box>

      <Button
        variant="contained"
        startIcon={dataCollection.running ? <CircularProgress size={20} /> : <CloudDownload />}
        onClick={startRealtimeCollection}
        disabled={dataCollection.running || !connectionStatus.connected}
        fullWidth
      >
        {dataCollection.running ? '수집 중...' : '실시간 데이터 수집 시작'}
      </Button>

      {dataCollection.results.length > 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {dataCollection.results.length}개 종목 구독 완료
        </Alert>
      )}
    </CardContent>
  </Card>

      {/* 기능 가이드 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  종목 데이터 수집
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                전체 종목 코드 조회 및 마스터 데이터 수집
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => fetchStockCodes('kospi')}>
                KOSPI 종목
              </Button>
              <Button size="small" onClick={() => fetchStockCodes('kosdaq')}>
                KOSDAQ 종목
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timeline color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  과거 데이터 수집
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                일별/주간/월별 OHLCV 데이터 수집
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled>
                일별 데이터
              </Button>
              <Button size="small" disabled>
                분간 데이터
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  실시간 데이터
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                체결/호가 실시간 데이터 수신
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled={!connectionStatus.connected}>
                실시간 시세
              </Button>
              <Button size="small" disabled={!connectionStatus.connected}>
                실시간 호가
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* 설정 */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" fontWeight="bold">
            고급 설정
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                <Api />
              </ListItemIcon>
              <ListItemText
                primary="모의투자 모드"
                secondary="실제 연동 없이 테스트 데이터 사용"
              />
              <Switch
                checked={settings.mockMode}
                onChange={(e) => setSettings({ ...settings, mockMode: e.target.checked })}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Sync />
              </ListItemIcon>
              <ListItemText
                primary="자동 연결"
                secondary="시작 시 자동으로 키움증권 연결"
              />
              <Switch
                checked={settings.autoConnect}
                onChange={(e) => setSettings({ ...settings, autoConnect: e.target.checked })}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CloudUpload />
              </ListItemIcon>
              <ListItemText
                primary="자동 구독"
                secondary="종목 추가 시 자동으로 실시간 구독"
              />
              <Switch
                checked={settings.autoSubscribe}
                onChange={(e) => setSettings({ ...settings, autoSubscribe: e.target.checked })}
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      {/* 주의사항 */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>사용 전 확인:</strong><br />
          • 키움증권 OpenAPI는 Windows 환경에서만 동작합니다.<br />
          • PyQt5와 키움증권 OCX가 설치되어 있어야 합니다.<br />
          • 모의투자 모드를 먼저 테스트해 보세요.<br />
          • 실시간 데이터는 장 운영 시간(09:00-15:30)에만 수집됩니다.
        </Typography>
      </Alert>
    </Container>
  );
}

export default KiwoomApiIntegration;
