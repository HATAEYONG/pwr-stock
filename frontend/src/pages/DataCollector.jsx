/**
 * 과거 데이터 수집 화면
 *
 * Phase 3 전체 기능:
 * 1. opt10081 대용량 일봉 수집
 * 2. opt10080 분봉 데이터 수집
 * 3. 진행률 실시간 표시
 * 4. 에러 종목 재시도
 */
import React, { useState, useEffect } from 'react';
import { createLogger } from '../utils/logger';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudDownload,
  PlayArrow,
  Stop,
  Refresh,
  CheckCircle,
  Error,
  Schedule,
  ExpandMore,
  Storage
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/kiwoom/collection';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const logger = createLogger('DataCollector');

function DataCollector() {
  const [tabValue, setTabValue] = useState(0);

  // 일봉 수집 상태
  const [dailyCollection, setDailyCollection] = useState({
    tickers: '047770',  // 기본값: 코데즈컴바인
    days: 250,
    adjusted: true,
    jobId: null,
    status: 'idle',  // idle, running, completed, error
    progress: 0,
    total: 0,
    currentTicker: '',
    errors: [],
    results: {}
  });

  // 분봉 수집 상태
  const [minuteCollection, setMinuteCollection] = useState({
    ticker: '047770',  // 기본값: 코데즈컴바인
    range: '1',
    days: 1,
    jobId: null,
    status: 'idle',
    progress: 0,
    total: 0,
    currentTicker: '',
    errors: [],
    results: {}
  });

  // 주봉 수집 상태
  const [weeklyCollection, setWeeklyCollection] = useState({
    ticker: '047770',  // 기본값: 코데즈컴바인
    days: 250,  // 약 1년치 (52주 × 5일)
    jobId: null,
    status: 'idle',
    progress: 0,
    total: 0,
    currentTicker: '',
    errors: [],
    results: {}
  });

  // 폴링 인터벌
  const [pollingInterval, setPollingInterval] = useState(null);

  // 일봉 수집 시작
  const startDailyCollection = async () => {
    const tickers = dailyCollection.tickers.split(',').map(t => t.trim()).filter(Boolean);

    if (tickers.length === 0) {
      alert('종목 코드를 입력해주세요');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/historical/start/`, {
        tickers: tickers,
        days: dailyCollection.days,
        adjusted: dailyCollection.adjusted
      });

      const jobId = response.data.job_id;

      setDailyCollection(prev => ({
        ...prev,
        jobId: jobId,
        status: 'running',
        total: tickers.length,
        progress: 0,
        errors: [],
        results: {}
      }));

      // 폴링 시작
      startPolling('daily', jobId);

    } catch (error) {
      logger.error('일봉 수집 시작 오류:', error);
      alert('수집 시작 실패: ' + (error.response?.data?.error || error.message));
    }
  };

  // 분봉 수집 시작
  const startMinuteCollection = async () => {
    if (!minuteCollection.ticker) {
      alert('종목 코드를 입력해주세요');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/minute/start/`, {
        ticker: minuteCollection.ticker,
        range: minuteCollection.range,
        days: minuteCollection.days
      });

      const jobId = response.data.job_id;

      setMinuteCollection(prev => ({
        ...prev,
        jobId: jobId,
        status: 'running',
        total: minuteCollection.days,
        progress: 0,
        errors: [],
        results: {}
      }));

      // 폴링 시작
      startPolling('minute', jobId);

    } catch (error) {
      logger.error('분봉 수집 시작 오류:', error);
      alert('수집 시작 실패: ' + (error.response?.data?.error || error.message));
    }
  };

  // 주봉 수집 시작
  const startWeeklyCollection = async () => {
    if (!weeklyCollection.ticker) {
      alert('종목 코드를 입력해주세요');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/historical/start/`, {
        tickers: [weeklyCollection.ticker],
        days: weeklyCollection.days,
        adjusted: weeklyCollection.adjusted,
        timeframe: 'weekly'  // 주봉
      });

      const jobId = response.data.job_id;

      setWeeklyCollection(prev => ({
        ...prev,
        jobId: jobId,
        status: 'running',
        total: 1,
        progress: 0,
        errors: [],
        results: {}
      }));

      // 폴링 시작
      startPolling('weekly', jobId);

    } catch (error) {
      logger.error('주봉 수집 시작 오류:', error);
      alert('수집 시작 실패: ' + (error.response?.data?.error || error.message));
    }
  };

  // 폴링 시작
  const startPolling = (type, jobId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE}/historical/status/${jobId}/`);
        const data = response.data;

        if (type === 'daily') {
          setDailyCollection(prev => ({
            ...prev,
            status: data.status,
            progress: data.progress,
            currentTicker: data.current_ticker,
            errors: data.errors || [],
            results: data.results || {}
          }));

          // 완료 또는 에러 시 폴링 중지
          if (data.status === 'completed' || data.status === 'error') {
            clearInterval(interval);
            setPollingInterval(null);
          }
        } else if (type === 'minute') {
          setMinuteCollection(prev => ({
            ...prev,
            status: data.status,
            progress: data.progress,
            currentTicker: data.current_ticker,
            errors: data.errors || [],
            results: data.results || {}
          }));

          if (data.status === 'completed' || data.status === 'error') {
            clearInterval(interval);
            setPollingInterval(null);
          }
        } else if (type === 'weekly') {
          setWeeklyCollection(prev => ({
            ...prev,
            status: data.status,
            progress: data.progress,
            currentTicker: data.current_ticker,
            errors: data.errors || [],
            results: data.results || {}
          }));

          if (data.status === 'completed' || data.status === 'error') {
            clearInterval(interval);
            setPollingInterval(null);
          }
        }

      } catch (error) {
        logger.error('상태 조회 오류:', error);
        clearInterval(interval);
        setPollingInterval(null);
      }
    }, 2000);  // 2초마다 폴링

    setPollingInterval(interval);
  };

  // 진행률 계산
  const getProgressColor = (status) => {
    if (status === 'completed') return 'success';
    if (status === 'error') return 'error';
    if (status === 'running') return 'primary';
    return 'inherit';
  };

  // 결과 테이블 렌더링
  const renderResultsTable = (results, errors) => {
    const entries = Object.entries(results);

    if (entries.length === 0 && errors.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          아직 수집된 종목이 없습니다
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>종목코드</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="right">수집 건수</TableCell>
              <TableCell align="right">저장 건수</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map(([ticker, result]) => (
              <TableRow key={ticker}>
                <TableCell>{ticker}</TableCell>
                <TableCell>
                  {result.status === 'success' ? (
                    <Chip icon={<CheckCircle />} label="성공" color="success" size="small" />
                  ) : (
                    <Chip icon={<Error />} label="실패" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell align="right">{result.collected || 0}</TableCell>
                <TableCell align="right">{result.saved || 0}</TableCell>
              </TableRow>
            ))}
            {errors.map((error, idx) => (
              <TableRow key={`error-${idx}`}>
                <TableCell>-</TableCell>
                <TableCell colSpan={3}>
                  <Alert severity="error" sx={{ py: 0 }}>
                    {error}
                  </Alert>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📥 데이터 수집
        </Typography>
        <Typography variant="body2" color="text.secondary">
          키움증권 API를 활용한 과거 데이터 수집
        </Typography>
      </Box>

      {/* 탭 */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="일봉 데이터 (opt10081)" />
            <Tab label="주봉 데이터" />
            <Tab label="분봉 데이터 (opt10080)" />
          </Tabs>
        </Box>

        {/* 일봉 데이터 탭 */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              📊 일봉 데이터 수집
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              opt10081 TR을 사용하여 일봉 OHLCV 데이터를 수집합니다. 최대 10년치 데이터를 수집할 수 있습니다.
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* 수집 설정 */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="종목 코드 (콤마 구분)"
                  placeholder="005930,000660,035420"
                  value={dailyCollection.tickers}
                  onChange={(e) => setDailyCollection(prev => ({ ...prev, tickers: e.target.value }))}
                  disabled={dailyCollection.status === 'running'}
                  fullWidth
                  helperText="예: 삼성전기, SK하이닉스, NAVER (최대 100종목)"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="수집 일수"
                  type="number"
                  value={dailyCollection.days}
                  onChange={(e) => setDailyCollection(prev => ({ ...prev, days: parseInt(e.target.value) || 250 }))}
                  disabled={dailyCollection.status === 'running'}
                  fullWidth
                  helperText="기본 250일 (최대 2500일 = 10년)"
                  inputProps={{ min: 1, max: 2500 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Button
                    variant="contained"
                    startIcon={dailyCollection.status === 'running' ? <Schedule /> : <PlayArrow />}
                    onClick={startDailyCollection}
                    disabled={dailyCollection.status === 'running'}
                    fullWidth
                    sx={{ mr: 1 }}
                  >
                    {dailyCollection.status === 'running' ? '수집 중...' : '수집 시작'}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* 진행률 */}
            {dailyCollection.status === 'running' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  수집 진행 중: {dailyCollection.currentTicker || '초기화 중...'}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dailyCollection.progress}
                  color={getProgressColor(dailyCollection.status)}
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {dailyCollection.progress}% 완료 ({dailyCollection.total}종목)
                </Typography>
              </Alert>
            )}

            {/* 완료 메시지 */}
            {dailyCollection.status === 'completed' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  ✅ 수집 완료!
                </Typography>
                <Typography variant="caption">
                  총 {Object.keys(dailyCollection.results).length}종목 수집 완료
                </Typography>
              </Alert>
            )}

            {/* 에러 메시지 */}
            {dailyCollection.status === 'error' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  ❌ 수집 실패
                </Typography>
                {dailyCollection.errors.length > 0 && (
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {dailyCollection.errors.join('\n')}
                  </Typography>
                )}
              </Alert>
            )}

            {/* 결과 테이블 */}
            {Object.keys(dailyCollection.results).length > 0 && (
              renderResultsTable(dailyCollection.results, dailyCollection.errors)
            )}
          </CardContent>
        </TabPanel>

        {/* 주봉 데이터 탭 */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              📊 주봉 데이터 수집
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              일봉 데이터를 집계하여 주봉 OHLCV 데이터를 생성합니다. 중장기 추세 분석에 활용하세요.
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* 수집 설정 */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="종목 코드"
                  placeholder="047770"
                  value={weeklyCollection.ticker}
                  onChange={(e) => setWeeklyCollection(prev => ({ ...prev, ticker: e.target.value }))}
                  disabled={weeklyCollection.status === 'running'}
                  fullWidth
                  helperText="예: 코데즈컴바인 (047770)"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="수집 일수 (기준)"
                  type="number"
                  value={weeklyCollection.days}
                  onChange={(e) => setWeeklyCollection(prev => ({ ...prev, days: parseInt(e.target.value) || 250 }))}
                  disabled={weeklyCollection.status === 'running'}
                  fullWidth
                  helperText="기본 250일 (약 1년치 주봉)"
                  inputProps={{ min: 1, max: 2500 }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Button
                    variant="contained"
                    startIcon={weeklyCollection.status === 'running' ? <Schedule /> : <PlayArrow />}
                    onClick={startWeeklyCollection}
                    disabled={weeklyCollection.status === 'running'}
                    fullWidth
                    sx={{ mr: 1 }}
                  >
                    {weeklyCollection.status === 'running' ? '수집 중...' : '수집 시작'}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* 진행률 */}
            {weeklyCollection.status === 'running' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  주봉 데이터 생성 중: {weeklyCollection.currentTicker || '처리 중...'}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={weeklyCollection.progress}
                  color={getProgressColor(weeklyCollection.status)}
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {weeklyCollection.progress}% 완료
                </Typography>
              </Alert>
            )}

            {/* 완료 메시지 */}
            {weeklyCollection.status === 'completed' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  ✅ 주봉 데이터 생성 완료!
                </Typography>
                <Typography variant="caption">
                  총 {Object.values(weeklyCollection.results).reduce((sum, r) => sum + (r.saved || 0), 0)}주 데이터 생성됨
                </Typography>
              </Alert>
            )}

            {/* 에러 메시지 */}
            {weeklyCollection.status === 'error' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  ❌ 주봉 데이터 생성 실패
                </Typography>
                {weeklyCollection.errors.length > 0 && (
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {weeklyCollection.errors.join('\n')}
                  </Typography>
                )}
              </Alert>
            )}

            {/* 결과 테이블 */}
            {Object.keys(weeklyCollection.results).length > 0 && (
              renderResultsTable(weeklyCollection.results, weeklyCollection.errors)
            )}
          </CardContent>
        </TabPanel>

        {/* 분봉 데이터 탭 */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              ⏱️ 분봉 데이터 수집
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              opt10080 TR을 사용하여 분봉 OHLCV 데이터를 수집합니다. 1분, 3분, 5분 등 다양한 분봉을 지원합니다.
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* 수집 설정 */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="종목 코드"
                  placeholder="005930"
                  value={minuteCollection.ticker}
                  onChange={(e) => setMinuteCollection(prev => ({ ...prev, ticker: e.target.value }))}
                  disabled={minuteCollection.status === 'running'}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="분봉 주기"
                  select
                  value={minuteCollection.range}
                  onChange={(e) => setMinuteCollection(prev => ({ ...prev, range: e.target.value }))}
                  disabled={minuteCollection.status === 'running'}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="1">1분봉</option>
                  <option value="3">3분봉</option>
                  <option value="5">5분봉</option>
                  <option value="10">10분봉</option>
                  <option value="15">15분봉</option>
                  <option value="30">30분봉</option>
                  <option value="60">60분봉</option>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="수집 일수"
                  type="number"
                  value={minuteCollection.days}
                  onChange={(e) => setMinuteCollection(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))}
                  disabled={minuteCollection.status === 'running'}
                  fullWidth
                  inputProps={{ min: 1, max: 30 }}
                  helperText="최대 30일"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={minuteCollection.status === 'running' ? <Schedule /> : <PlayArrow />}
                  onClick={startMinuteCollection}
                  disabled={minuteCollection.status === 'running'}
                  fullWidth
                >
                  {minuteCollection.status === 'running' ? '수집 중...' : '수집 시작'}
                </Button>
              </Grid>
            </Grid>

            {/* 진행률 */}
            {minuteCollection.status === 'running' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  {minuteCollection.ticker} {minuteCollection.range}분봉 수집 중...
                </Typography>
                <LinearProgress
                  variant="indeterminate"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Alert>
            )}

            {/* 결과 */}
            {minuteCollection.status === 'completed' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                ✅ 분봉 데이터 수집 완료!
                {Object.values(minuteCollection.results).map(r => r.collected).join(',')}건 수집됨
              </Alert>
            )}
          </CardContent>
        </TabPanel>
      </Card>

      {/* 가이드 */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" fontWeight="bold">
            📖 사용 가이드
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                일봉 데이터 수집 (opt10081)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • 최대 10년(2500일)치 데이터 수집 가능<br />
                • 수정주가 반영 자동 처리<br />
                • 연속 조회로 과거 데이터 자동 수집<br />
                • 중복 데이터 자동 업데이트
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                주봉 데이터 수집
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • 일봉 데이터를 주단위로 집계<br />
                • 중장기 추세 분석에 최적<br />
                • 250일 = 약 1년치(52주)<br />
                • 저점/고점 패턴 파악 용이
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                분봉 데이터 수집 (opt10080)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • 1분~60분봉 지원<br />
                • 실시간 매집 감지용<br />
                • 일일 약 240개 1분봉 데이터<br />
                • 장 중 수집 권장
              </Typography>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              ⚠️ 주의사항
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              • 키움증권 과도조회 방지: 1초당 1건 이하 요청<br />
              • 대량 수집 시 시간이 오래 소요될 수 있음<br />
              • 모의투자 계정에서 먼저 테스트 권장<br />
              • 장 운영 시간 외에는 과거 데이터만 수집 가능
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>
    </Container>
  );
}

export default DataCollector;
