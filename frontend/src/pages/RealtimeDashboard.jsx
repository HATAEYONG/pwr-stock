import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  IconButton,
  Avatar,
  LinearProgress,
  Fade,
  Slide,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  Refresh,
  Add,
  Remove,
  TrendingUp,
  TrendingDown,
  NotificationsActive,
  NotificationsOff,
  ShowChart,
  Speed,
  AccessTime,
  Circle,
  DeleteOutline,
  Timeline
} from '@mui/icons-material';
import axios from 'axios';
import { useWebSocket as useWebSocketService } from '../utils/useWebSocket';

function RealtimeDashboard() {
  const [watchlist, setWatchlist] = useState(['005930', '000660', '035420', '051910']);
  const [prices, setPrices] = useState({});
  const [previousPrices, setPreviousPrices] = useState({});
  const [newTicker, setNewTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [enableWebSocket, setEnableWebSocket] = useState(true);

  // WebSocket connection
  const { isConnected, connectionState, lastMessage, reconnect } = useWebSocketService({
    autoConnect: enableWebSocket,
    onMessage: (data) => {
      if (data.type === 'price_update') {
        const { symbol, price, change, change_pct, volume } = data.payload;
        setPrices(prev => ({
          ...prev,
          [symbol]: { price, change, change_pct, volume }
        }));
        setLastUpdate(new Date());
      }
    }
  });

  useEffect(() => {
    // Only poll via HTTP if WebSocket is not connected
    if (!isConnected) {
      loadPrices();

      let interval;
      if (autoRefresh) {
        interval = setInterval(loadPrices, 5000);
      }

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [watchlist, autoRefresh, isConnected]);

  const loadPrices = async () => {
    setLoading(true);
    try {
      if (watchlist.length === 0) {
        setPrices({});
        setLastUpdate(new Date());
        return;
      }

      const response = await axios.get(
        `http://localhost:8000/api/kiwoom/realtime/watchlist/?tickers=${watchlist.join(',')}`
      );

      if (response.data.results) {
        // 이전 가격 저장
        setPreviousPrices(prices);

        const pricesMap = {};
        response.data.results.forEach(item => {
          pricesMap[item.ticker] = item;
        });
        setPrices(pricesMap);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('시세 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTicker = () => {
    if (newTicker && !watchlist.includes(newTicker)) {
      setWatchlist([...watchlist, newTicker]);
      setNewTicker('');
    }
  };

  const removeTicker = (ticker) => {
    setWatchlist(watchlist.filter(t => t !== ticker));
    setPrices(prev => {
      const newPrices = { ...prev };
      delete newPrices[ticker];
      return newPrices;
    });
    setPreviousPrices(prev => {
      const newPrices = { ...prev };
      delete newPrices[ticker];
      return newPrices;
    });
  };

  const getName = (ticker) => {
    const names = {
      '005930': '삼성전자',
      '000660': 'SK하이닉스',
      '035420': 'NAVER',
      '051910': 'LG화학',
      '068270': '셀트리온',
      '005380': '현대차',
      '035720': '카카오',
      '000270': '기아',
      '006400': '삼성SDS',
      '005935': '삼성전자우',
      '005945': '삼성SDI',
      '028260': '삼성물산'
    };
    return names[ticker] || prices[ticker]?.name || ticker;
  };

  const getPriceChange = (ticker) => {
    const current = prices[ticker]?.price || 0;
    const previous = previousPrices[ticker]?.price || 0;
    return current - previous;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <ShowChart sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                실시간 시세
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-Time Stock Quotes
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* WebSocket Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isConnected ? (
                <NotificationsActive fontSize="small" color="success" />
              ) : (
                <NotificationsOff fontSize="small" color="disabled" />
              )}
              <Typography variant="body2" color="text.secondary">
                {isConnected ? 'WebSocket' : 'HTTP Polling'}
              </Typography>
              <Chip
                label={isConnected ? 'ON' : 'OFF'}
                size="small"
                color={isConnected ? 'success' : 'default'}
              />
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed fontSize="small" color={autoRefresh ? 'success' : 'disabled'} />
              <Typography variant="body2" color="text.secondary">
                {autoRefresh ? '자동 갱신 중' : '수동 갱신'}
              </Typography>
            </Box>

            <Chip
              label={autoRefresh ? 'ON' : 'OFF'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? 'success' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />

            <Divider orientation="vertical" flexItem />

            {/* WebSocket Toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                WebSocket:
              </Typography>
              <Switch
                checked={enableWebSocket}
                onChange={(e) => setEnableWebSocket(e.target.checked)}
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              <AccessTime sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              {lastUpdate ? lastUpdate.toLocaleTimeString() : '-'}
            </Typography>

            <IconButton
              onClick={loadPrices}
              disabled={loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'action.disabled' }
              }}
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {loading && (
          <LinearProgress sx={{ height: 2, borderRadius: 1 }} />
        )}
      </Box>

      {/* 종목 추가 */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="종목 코드 추가"
              placeholder="예: 005930"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addTicker();
                }
              }}
              size="small"
              sx={{
                bgcolor: 'white',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addTicker}
              sx={{
                bgcolor: 'white',
                color: '#764ba2',
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              추가
            </Button>

            <Box sx={{ ml: 'auto', color: 'white' }}>
              <Typography variant="body2">
                📊 현재 {watchlist.length}개 종목 모니터링 중
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 시계 카드 그리드 */}
      <Grid container spacing={3}>
        {watchlist.map((ticker, index) => {
          const price = prices[ticker];
          const isUp = price?.change_pct > 0;
          const isDown = price?.change_pct < 0;
          const priceChange = getPriceChange(ticker);
          const isPriceUp = priceChange > 0;
          const isPriceDown = priceChange < 0;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={ticker}>
              <Slide in={true} direction="up" timeout={300 + index * 50}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                    border: 2,
                    borderColor: isUp ? 'success.main' : isDown ? 'error.main' : 'divider',
                  }}
                >
                  {/* 상태 바 */}
                  <Box
                    sx={{
                      height: 4,
                      bgcolor: isUp ? 'success.main' : isDown ? 'error.main' : 'grey.300',
                    }}
                  />

                  <CardContent>
                    {/* 종목 정보 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {ticker}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getName(ticker)}
                        </Typography>
                      </Box>

                      <Chip
                        icon={isUp ? <TrendingUp /> : isDown ? <TrendingDown /> : <Circle />}
                        label={isUp ? '상승' : isDown ? '하락' : '보합'}
                        color={isUp ? 'success' : isDown ? 'error' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* 가격 정보 */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        현재가
                      </Typography>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{
                          color: isUp ? 'success.main' : isDown ? 'error.main' : 'text.primary',
                          transition: 'color 0.3s ease',
                        }}
                      >
                        {price?.price ? price.price.toLocaleString() : '-'}
                        <Typography component="span" variant="h6" ml={0.5}>
                          원
                        </Typography>
                      </Typography>
                    </Box>

                    {/* 전일대비 */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          전일대비
                        </Typography>
                        <Typography
                          variant="body1"
                          color={isUp ? 'success.main' : isDown ? 'error.main' : 'text.primary'}
                          fontWeight="bold"
                        >
                          {price?.change !== undefined ? (
                            price.change > 0 ? `+${price.change.toLocaleString()}` : price.change.toLocaleString()
                          ) : '-'}
                        </Typography>
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          등락률
                        </Typography>
                        <Typography
                          variant="body1"
                          color={isUp ? 'success.main' : isDown ? 'error.main' : 'text.primary'}
                          fontWeight="bold"
                        >
                          {price?.change_pct ? `${price.change_pct.toFixed(2)}%` : '-'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* 거래량 */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        거래량
                      </Typography>
                      <Typography variant="body1">
                        {price?.volume ? price.volume.toLocaleString() : '-'}
                      </Typography>
                    </Box>

                    {/* 삭제 버튼 */}
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutline />}
                      onClick={() => removeTicker(ticker)}
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      삭제
                    </Button>
                  </CardContent>

                  {/* 애니메이션 효과 */}
                  {(isPriceUp || isPriceDown) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: isPriceUp ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        pointerEvents: 'none',
                        animation: 'flash 0.5s ease-out',
                      }}
                    />
                  )}
                </Card>
              </Slide>
            </Grid>
          );
        })}

        {/* 빈 상태 */}
        {watchlist.length === 0 && (
          <Grid item xs={12}>
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <ShowChart sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                관심종목이 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                종목 코드를 추가하여 실시간 시세를 확인하세요.
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 안내 섹션 */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: isConnected ? 'success.light' : 'info.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {isConnected ? (
                  <Timeline color="success" fontSize="large" />
                ) : (
                  <NotificationsActive color="info" fontSize="large" />
                )}
                <Typography variant="h6" fontWeight="bold">
                  {isConnected ? 'WebSocket 연결됨' : '실시간 데이터 안내'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {isConnected ? (
                  <>
                    • WebSocket을 통한 실시간 데이터 수집 중
                    <br />
                    • 저지연(latency) 실시간 업데이트
                    <br />
                    • 서버 푸시 기반 업데이트
                  </>
                ) : (
                  <>
                    • 키움증권 API를 사용하여 실시간 시세 데이터를 수집합니다.
                    <br />
                    • 실시간 데이터는 장 운영 시간(09:00-15:30)에만 제공됩니다.
                    <br />
                    • 5초마다 자동 갱신되며, 수동으로도 새로고침할 수 있습니다.
                  </>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                사용 방법
              </Typography>
              <Typography variant="body2" component="div" color="text.secondary">
                <Box component="ol" sx={{ pl: 2 }}>
                  <li>종목 코드 6자리를 입력하세요 (예: 005930)</li>
                  <li>추가 버튼 클릭 또는 Enter 키를 누르세요</li>
                  <li>WebSocket: 실시간 서버 푸시 업데이트</li>
                  <li>HTTP: 5초마다 자동으로 시세가 갱신됩니다</li>
                  <li>상승: 초록색, 하락: 적색으로 표시됩니다</li>
                  <li>삭제 버튼으로 종목을 제거할 수 있습니다</li>
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Speed color="warning" fontSize="large" />
                <Typography variant="h6" fontWeight="bold">
                  연결 상태
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                • 현재 상태: <strong>{connectionState}</strong>
                <br />
                • {isConnected ? 'WebSocket 활성화' : 'HTTP 폴링 모드'}
                <br />
                • 마지막 업데이트: {lastUpdate ? lastUpdate.toLocaleTimeString() : '-'}
              </Typography>
              {!isConnected && enableWebSocket && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  WebSocket 연결 대기 중...
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes flash {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>
    </Container>
  );
}

export default RealtimeDashboard;
