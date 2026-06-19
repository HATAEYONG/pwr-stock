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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Speed,
  Public,
  Search,
  TrendingUp
} from '@mui/icons-material';
import axios from 'axios';

function NasdaqApiIntegration() {
  const [connectionStatus, setConnectionStatus] = useState({
    configured: false,
    loading: false,
    error: null
  });

  const [tickerSearch, setTickerSearch] = useState({
    ticker: 'AAPL',
    loading: false,
    result: null,
    error: null
  });

  const [dataSync, setDataSync] = useState({
    tickers: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META'],
    running: false,
    results: [],
    error: null
  });

  const [ohlcvFetch, setOhlcvFetch] = useState({
    ticker: 'AAPL',
    timespan: 'day',
    days: 30,
    loading: false,
    result: null,
    error: null
  });

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await axios.get('http://localhost:8000/api/market/nasdaq/status/');
      setConnectionStatus({
        configured: response.data.configured,
        loading: false,
        error: null
      });
    } catch (err) {
      setConnectionStatus({
        configured: false,
        loading: false,
        error: '연결 상태 확인 실패'
      });
    }
  };

  const searchTicker = async () => {
    if (!tickerSearch.ticker) return;

    setTickerSearch(prev => ({ ...prev, loading: true, result: null, error: null }));
    try {
      const response = await axios.get(
        `http://localhost:8000/api/market/nasdaq/details/${tickerSearch.ticker}/`
      );

      setTickerSearch({
        ...tickerSearch,
        loading: false,
        result: response.data.data,
        error: null
      });
    } catch (err) {
      setTickerSearch({
        ...tickerSearch,
        loading: false,
        result: null,
        error: err.response?.data?.error || '조회 실패'
      });
    }
  };

  const syncTickers = async () => {
    setDataSync(prev => ({ ...prev, running: true, results: [], error: null }));
    try {
      const results = [];

      for (const ticker of dataSync.tickers) {
        try {
          const response = await axios.post(
            `http://localhost:8000/api/market/nasdaq/sync/${ticker}/`
          );
          results.push({
            ticker,
            success: true,
            data: response.data
          });
        } catch (err) {
          results.push({
            ticker,
            success: false,
            error: err.response?.data?.error || '동기화 실패'
          });
        }
      }

      setDataSync({
        ...dataSync,
        running: false,
        results
      });
    } catch (err) {
      setDataSync({
        ...dataSync,
        running: false,
        error: '일괄 동기화 실패'
      });
    }
  };

  const fetchOhlcv = async () => {
    if (!ohlcvFetch.ticker) return;

    setOhlcvFetch(prev => ({ ...prev, loading: true, result: null, error: null }));
    try {
      const response = await axios.post(
        `http://localhost:8000/api/market/nasdaq/fetch/${ohlcvFetch.ticker}/`,
        null,
        {
          params: {
            timespan: ohlcvFetch.timespan,
            days: ohlcvFetch.days
          }
        }
      );

      setOhlcvFetch({
        ...ohlcvFetch,
        loading: false,
        result: response.data,
        error: null
      });
    } catch (err) {
      setOhlcvFetch({
        ...ohlcvFetch,
        loading: false,
        result: null,
        error: err.response?.data?.error || '수집 실패'
      });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          나스닥/미국 주식 API 연동
        </Typography>
        <Typography variant="body2" color="text.secondary">
          NASDAQ/US Stocks API Integration with Polygon.io
        </Typography>
      </Box>

      {/* 연결 상태 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  연결 상태
                </Typography>
                {connectionStatus.configured ? (
                  <Chip
                    icon={<CheckCircle />}
                    label="설정됨"
                    color="success"
                  />
                ) : (
                  <Chip
                    icon={<Error />}
                    label="설정 안됨"
                    color="error"
                  />
                )}
              </Box>

              {connectionStatus.loading && <LinearProgress sx={{ mb: 2 }} />}

              {connectionStatus.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {connectionStatus.error}
                </Alert>
              )}

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  API 제공자: Polygon.io<br />
                  무료 요금제: 5 requests/minute<br />
                  API 키 발급: <a href="https://polygon.io/" target="_blank" rel="noopener">https://polygon.io/</a>
                </Typography>
              </Alert>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={connectionStatus.loading ? <CircularProgress size={20} /> : <Sync />}
                onClick={checkConnectionStatus}
                disabled={connectionStatus.loading}
              >
                상태 새로고침
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 티커 검색 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                티커 상세정보 조회
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="티커 심볼"
                  placeholder="AAPL"
                  value={tickerSearch.ticker}
                  onChange={(e) => setTickerSearch({ ...tickerSearch, ticker: e.target.value.toUpperCase() })}
                  disabled={tickerSearch.loading}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  startIcon={tickerSearch.loading ? <CircularProgress size={20} /> : <Search />}
                  onClick={searchTicker}
                  disabled={tickerSearch.loading || !tickerSearch.ticker}
                >
                  조회
                </Button>
              </Box>

              {tickerSearch.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {tickerSearch.error}
                </Alert>
              )}

              {tickerSearch.result && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    조회 결과
                  </Typography>
                  <TableContainer size="small">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>티커</TableCell>
                          <TableCell>{tickerSearch.result.ticker}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>종목명</TableCell>
                          <TableCell>{tickerSearch.result.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>거래소</TableCell>
                          <TableCell>{tickerSearch.result.market}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>통화</TableCell>
                          <TableCell>{tickerSearch.result.currency}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>종류</TableCell>
                          <TableCell>{tickerSearch.result.type}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 메타데이터 동기화 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            종목 메타데이터 동기화
          </Typography>

          <Box sx={{ mb: 2 }}>
            <TextField
              label="티커 심볼 (콤마 구분)"
              placeholder="AAPL,MSFT,GOOGL,TSLA,AMZN,NVDA,META"
              value={dataSync.tickers.join(',')}
              onChange={(e) => setDataSync({
                ...dataSync,
                tickers: e.target.value.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
              })}
              fullWidth
              disabled={dataSync.running}
              sx={{ mb: 2 }}
            />
          </Box>

          <Button
            variant="contained"
            startIcon={dataSync.running ? <CircularProgress size={20} /> : <CloudDownload />}
            onClick={syncTickers}
            disabled={dataSync.running || dataSync.tickers.length === 0}
            fullWidth
          >
            {dataSync.running ? '동기화 중...' : '일괄 동기화 시작'}
          </Button>

          {dataSync.results.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                동기화 결과 ({dataSync.results.length}개)
              </Typography>
              <TableContainer size="small">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>티커</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>종목명</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dataSync.results.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{result.ticker}</TableCell>
                        <TableCell>
                          {result.success ? (
                            <Chip label="성공" color="success" size="small" />
                          ) : (
                            <Chip label="실패" color="error" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {result.success ? result.data.data.name : result.error}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* OHLCV 데이터 수집 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            OHLCV 데이터 수집
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="티커 심볼"
                placeholder="AAPL"
                value={ohlcvFetch.ticker}
                onChange={(e) => setOhlcvFetch({ ...ohlcvFetch, ticker: e.target.value.toUpperCase() })}
                disabled={ohlcvFetch.loading}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="시간 단위"
                select
                value={ohlcvFetch.timespan}
                onChange={(e) => setOhlcvFetch({ ...ohlcvFetch, timespan: e.target.value })}
                disabled={ohlcvFetch.loading}
                fullWidth
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="day">일별</option>
                <option value="week">주별</option>
                <option value="month">월별</option>
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="기간 (일)"
                type="number"
                value={ohlcvFetch.days}
                onChange={(e) => setOhlcvFetch({ ...ohlcvFetch, days: parseInt(e.target.value) || 30 })}
                disabled={ohlcvFetch.loading}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            startIcon={ohlcvFetch.loading ? <CircularProgress size={20} /> : <TrendingUp />}
            onClick={fetchOhlcv}
            disabled={ohlcvFetch.loading || !ohlcvFetch.ticker}
            fullWidth
          >
            {ohlcvFetch.loading ? '수집 중...' : 'OHLCV 데이터 수집'}
          </Button>

          {ohlcvFetch.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {ohlcvFetch.error}
            </Alert>
          )}

          {ohlcvFetch.result && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                수집 완료: {ohlcvFetch.result.ticker}<br />
                기간: {ohlcvFetch.result.from_date} ~ {ohlcvFetch.result.to_date}<br />
                수집: {ohlcvFetch.result.fetched}건, 저장: {ohlcvFetch.result.saved}건
              </Typography>
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
                <Public color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  글로벌 시장 접근
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                나스닥, 뉴욕증권거래소 등 미국 주식 시장 데이터
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timeline color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  히스토리컬 데이터
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                일별/주간/월별 OHLCV 데이터 제공
              </Typography>
            </CardContent>
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
                유료 요금제부터 실시간 시세 제공
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 주의사항 */}
      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>사용 전 확인:</strong><br />
          • Polygon.io API 키가 .env 파일에 설정되어 있어야 합니다.<br />
          • 무료 요금제: 분당 5건 요청 제한<br />
          • 무료 요금제: 지연된 데이터 (15분 지연)<br />
          • 유료 요금제부터 실시간 데이터 가능
        </Typography>
      </Alert>
    </Container>
  );
}

export default NasdaqApiIntegration;
