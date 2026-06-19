/**
 * 실시간 P1/P2/P3 패턴 모니터링 화면
 *
 * Phase 3 전체 기능:
 * 1. 실시간 종목 구독
 * 2. P1/P2/P3 점수 실시간 업데이트
 * 3. Start Signal 알림
 * 4. 실시간 차트 업데이트
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  IconButton,
  Badge,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Remove,
  Notifications,
  NotificationsActive,
  ShowChart,
  TrendingUp,
  Warning,
  CheckCircle,
  Delete,
  VolumeUp
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function RealtimePatternMonitor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [symbols, setSymbols] = useState([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    loading: false
  });
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const websocketRef = useRef(null);
  const audioRef = useRef(null);

  // 쿼리 파라미터에서 자동 추가할 종목 처리
  useEffect(() => {
    const tickersParam = searchParams.get('tickers');
    const screeningName = searchParams.get('screening');

    if (tickersParam) {
      const tickerList = tickersParam.split(',');
      autoAddSymbols(tickerList, screeningName);
    }
  }, [searchParams]);

  // 자동 종목 추가
  const autoAddSymbols = async (tickerList, screeningName) => {
    for (const ticker of tickerList) {
      try {
        const response = await axios.get(`${API_BASE}/patterns/${ticker}/`);
        const data = response.data;

        const symbolData = {
          ticker: ticker,
          name: data.symbol.name,
          price: data.latest.close,
          change: data.latest.change,
          volume: data.latest.volume,
          high: data.latest.high,
          low: data.latest.low,
          p1Score: data.patterns.p1.score,
          p2Score: data.patterns.p2.score,
          p3Score: data.patterns.p3.score,
          totalScore: data.start_signal.total_score,
          bestPattern: data.patterns.p1.score > data.patterns.p2.score ?
                        (data.patterns.p1.score > data.patterns.p3.score ? 'P1' : 'P3') :
                        (data.patterns.p2.score > data.patterns.p3.score ? 'P2' : 'P3'),
          startSignal: data.start_signal.triggered,
          timestamp: new Date().toISOString()
        };

        setSymbols(prev => {
          // 중복 방지
          if (!prev.find(s => s.ticker === ticker)) {
            return [...prev, symbolData];
          }
          return prev;
        });

        // WebSocket 구독 요청
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({
            action: 'subscribe',
            symbol: ticker
          }));
        }
      } catch (error) {
        console.error(`자동 추가 실패 (${ticker}):`, error);
      }
    }
  };

  // WebSocket 연결 (Daphne 서버가 없으므로 비활성화)
  useEffect(() => {
    // 현재는 Django runserver 사용 중으로 WebSocket 미지원
    // REST API 폴링으로 대체
    if (autoRefresh) {
      // 대신 주기적 데이터 갱신 사용
      const interval = setInterval(() => {
        monitoredTickers.forEach(ticker => {
          fetchPatternData(ticker);
        });
      }, 10000); // 10초마다 갱신

      return () => clearInterval(interval);
    }
  }, [autoRefresh, monitoredTickers]);

  // 알림 소리 생성
  useEffect(() => {
    if (soundEnabled) {
      // Web Audio API로 알림 소리 생성
      audioRef.current = new AudioContext();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.close();
      }
    };
  }, [soundEnabled]);

  const playAlertSound = () => {
    if (!soundEnabled || !audioRef.current) return;

    try {
      const oscillator = audioRef.current.createOscillator();
      const gainNode = audioRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioRef.current.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioRef.current.currentTime + 0.5);

      oscillator.start(audioRef.current.currentTime);
      oscillator.stop(audioRef.current.currentTime + 0.5);
    } catch (e) {
      console.error('Sound play error:', e);
    }
  };

  const connectWebSocket = () => {
    try {
      // Django Channels WebSocket 연결
      // WebSocket은 Daphne ASGI 서버가 필요하지만, 현재는 runserver 사용 중
      // WebSocket 연결 실패 시 조용히 실패 처리하고 REST API로 대체
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/kiwoom/';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus({ connected: true, loading: false });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealtimeData(data);
      };

      ws.onerror = (error) => {
        console.warn('WebSocket not available (Daphne server not running)');
        setConnectionStatus({ connected: false, loading: false });
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setConnectionStatus({ connected: false, loading: false });

        // WebSocket 연결 실패 시 재시도하지 않음 (Daphne 미사용)
      };

      websocketRef.current = ws;

    } catch (error) {
      console.warn('WebSocket connection error (using REST API fallback):');
      setConnectionStatus({ connected: false, loading: false });
    }
  };

  const handleRealtimeData = (data) => {
    const symbolCode = data.symbol;

    // 기존 종목 업데이트
    setSymbols(prev => prev.map(s => {
      if (s.ticker === symbolCode) {
        const updated = {
          ...s,
          price: data.price,
          change: data.change,
          volume: data.volume,
          high: data.high,
          low: data.low,
          timestamp: data.timestamp
        };

        // 분석 결과 업데이트
        if (data.analysis) {
          updated.p1Score = data.analysis.P1_score;
          updated.p2Score = data.analysis.P2_score;
          updated.p3Score = data.analysis.P3_score;
          updated.totalScore = data.analysis.total_score;
          updated.bestPattern = data.analysis.best_pattern;
          updated.startSignal = data.analysis.start_signal;

          // Start Signal 발생 시 알림
          if (data.analysis.start_signal && !s.startSignal) {
            addNotification(symbolCode, data.analysis);
            playAlertSound();
          }
        }

        return updated;
      }
      return s;
    }));
  };

  const addNotification = (symbol, analysis) => {
    const notification = {
      id: Date.now(),
      symbol: symbol,
      message: `🚨 ${symbol} Start Signal 발생! (${analysis.total_score.toFixed(1)}점)`,
      pattern: analysis.best_pattern,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50)); // 최대 50개
  };

  const addSymbol = async () => {
    if (!newSymbol) return;

    try {
      // 종목 검증
      const response = await axios.get(`${API_BASE}/patterns/${newSymbol}/`);
      const data = response.data;

      const symbolData = {
        ticker: newSymbol,
        name: data.symbol.name,
        price: data.latest.close,
        change: data.latest.change,
        volume: data.latest.volume,
        high: data.latest.high,
        low: data.latest.low,
        p1Score: data.patterns.p1.score,
        p2Score: data.patterns.p2.score,
        p3Score: data.patterns.p3.score,
        totalScore: data.start_signal.total_score,
        bestPattern: data.patterns.p1.score > data.patterns.p2.score ?
                      (data.patterns.p1.score > data.patterns.p3.score ? 'P1' : 'P3') :
                      (data.patterns.p2.score > data.patterns.p3.score ? 'P2' : 'P3'),
        startSignal: data.start_signal.triggered,
        timestamp: new Date().toISOString()
      };

      setSymbols(prev => [...prev, symbolData]);
      setNewSymbol('');

      // WebSocket 구독 요청
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          action: 'subscribe',
          symbol: newSymbol
        }));
      }

    } catch (error) {
      console.error('종목 추가 오류:', error);
      alert('종목을 찾을 수 없습니다: ' + newSymbol);
    }
  };

  const removeSymbol = (ticker) => {
    setSymbols(prev => prev.filter(s => s.ticker !== ticker));

    // WebSocket 구독 해제
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        action: 'unsubscribe',
        symbol: ticker
      }));
    }
  };

  const getScoreColor = (score, max) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'error';
    if (percentage >= 60) return 'warning';
    if (percentage >= 40) return 'info';
    return 'default';
  };

  const getRecommendationColor = (triggered) => {
    return triggered ? 'error' : 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            📡 실시간 패턴 모니터링
          </Typography>
          <Typography variant="body2" color="text.secondary">
            P1/P2/P3 패턴 실시간 분석 및 Start Signal 알림
          </Typography>
          {/* 검색식 이름 표시 */}
          {searchParams.get('screening') && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                🔍 검색식: <strong>{searchParams.get('screening')}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {symbols.length}개 종목 자동 추가됨
              </Typography>
            </Alert>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={connectionStatus.connected ? <CheckCircle /> : <Warning />}
            label={connectionStatus.connected ? '연결됨' : '연결 안됨'}
            color={connectionStatus.connected ? 'success' : 'default'}
          />

          <FormControlLabel
            control={
              <Switch
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
            }
            label="알림 소리"
          />

          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="자동 연결"
          />
        </Box>
      </Box>

      {/* 종목 추가 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="종목 코드 추가"
              placeholder="005930"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addSymbol}
              disabled={!newSymbol || !connectionStatus.connected}
            >
              추가
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* 종목 모니터링 리스트 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📊 모니터링 종목 ({symbols.length})
              </Typography>

              {symbols.length === 0 ? (
                <Alert severity="info">
                  종목을 추가하여 실시간 모니터링을 시작하세요
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {symbols.map((symbol) => (
                    <Grid item xs={12} key={symbol.ticker}>
                      <Paper
                        sx={{
                          p: 2,
                          border: symbol.startSignal ? '2px solid #ff5722' : '1px solid #e0e0e0',
                          bgcolor: symbol.startSignal ? 'error.lighter' : 'background.paper'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {symbol.name} ({symbol.ticker})
                            </Typography>
                            {symbol.startSignal && (
                              <Chip
                                icon={<TrendingUp />}
                                label="🚨 START SIGNAL"
                                color="error"
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Box>

                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h5" fontWeight="bold">
                              {symbol.price?.toLocaleString()}원
                            </Typography>
                            <Typography variant="body2" color={symbol.change >= 0 ? 'error.main' : 'primary.main'}>
                              {symbol.change >= 0 ? '+' : ''}{symbol.change?.toFixed(2)}%
                            </Typography>
                          </Box>

                          <IconButton
                            size="small"
                            onClick={() => removeSymbol(symbol.ticker)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>

                        {/* P1/P2/P3 점수 */}
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                P1 (매집)
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={(symbol.p1Score / 50) * 100}
                                color={getScoreColor(symbol.p1Score, 50)}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                              <Typography variant="body2" fontWeight="bold">
                                {symbol.p1Score?.toFixed(1)}/50
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                P2 (바닥)
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={(symbol.p2Score / 40) * 100}
                                color={getScoreColor(symbol.p2Score, 40)}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                              <Typography variant="body2" fontWeight="bold">
                                {symbol.p2Score?.toFixed(1)}/40
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                P3 (소형주)
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={(symbol.p3Score / 10) * 100}
                                color={getScoreColor(symbol.p3Score, 10)}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                              <Typography variant="body2" fontWeight="bold">
                                {symbol.p3Score?.toFixed(1)}/10
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* 총점 */}
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            종합 점수: {symbol.totalScore?.toFixed(1)}/100
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            최고 패턴: {symbol.bestPattern}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 알림 패널 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Badge badgeContent={notifications.length} color="error">
                  <Notifications color="action" />
                </Badge>
                <Typography variant="h6" fontWeight="bold" sx={{ ml: 1 }}>
                  알림
                </Typography>
                <Button
                  size="small"
                  onClick={() => setNotifications([])}
                  sx={{ ml: 'auto' }}
                >
                  지우기
                </Button>
              </Box>

              {notifications.length === 0 ? (
                <Alert severity="info">
                  알림이 없습니다
                </Alert>
              ) : (
                <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {notifications.map((notif) => (
                    <Alert
                      key={notif.id}
                      severity="warning"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {notif.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notif.timestamp).toLocaleTimeString('ko-KR')}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default RealtimePatternMonitor;
