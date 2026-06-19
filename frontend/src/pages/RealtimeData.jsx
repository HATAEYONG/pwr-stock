import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Add,
  Remove,
  Refresh,
  Timeline,
  ShowChart
} from '@mui/icons-material';
import axios from 'axios';

function RealtimeData() {
  const [symbols, setSymbols] = useState(['005930', '000660', '035420']);
  const [inputSymbol, setInputSymbol] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [quotesHistory, setQuotesHistory] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 실시간 시세 가져오기
  const fetchLiveQuotes = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

      const promises = symbols.map(async (symbol) => {
        try {
          // 키움 REST API v2 사용
          const response = await axios.get(`${API_BASE}/kiwoom/api/v2/price/${symbol}/`);
          return { symbol, data: response.data };
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
          return { symbol, data: null, error: true };
        }
      });

      const results = await Promise.all(promises);

      const newQuotes = {};
      const newHistory = { ...quotesHistory };

      results.forEach(({ symbol, data, error }) => {
        if (!error && data && data.success) {
          // 키움 API v2 응답 구조: { success: true, data: { price, change, ... } }
          const quoteData = data.data;
          newQuotes[symbol] = quoteData;

          // 히스토리에 추가
          if (!newHistory[symbol]) {
            newHistory[symbol] = [];
          }
          newHistory[symbol].push({
            price: quoteData.price,
            change: quoteData.change,
            timestamp: quoteData.date || new Date().toISOString()
          });

          // 최대 100개만 유지
          if (newHistory[symbol].length > 100) {
            newHistory[symbol] = newHistory[symbol].slice(-100);
          }
        }
      });

      setLiveQuotes(newQuotes);
      setQuotesHistory(newHistory);
    } catch (error) {
      console.error('Error fetching live quotes:', error);
    }
  };

  // 자동 새로고침
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLiveQuotes, 3000); // 3초마다 갱신
      return () => clearInterval(interval);
    }
  }, [autoRefresh, symbols]);

  // 종목 추가
  const handleAddSymbol = () => {
    if (inputSymbol && !symbols.includes(inputSymbol)) {
      setSymbols([...symbols, inputSymbol]);
      setInputSymbol('');
    }
  };

  // 종목 제거
  const handleRemoveSymbol = (symbol) => {
    setSymbols(symbols.filter(s => s !== symbol));
    setLiveQuotes(prev => {
      const newQuotes = { ...prev };
      delete newQuotes[symbol];
      return newQuotes;
    });
  };

  // 수집 시작/중지 (로컬 상태만 변경)
  const handleToggleCollection = () => {
    // 실제 데이터 수집은 REST API 폴링으로 자동 처리
    // 버튼은 수집 상태 토글만 담당
    setIsCollecting(!isCollecting);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          <Timeline sx={{ mr: 2, verticalAlign: 'middle' }} />
          실시간 데이터 수집
        </Typography>
        <Typography variant="body2" color="text.secondary">
          국내/해외 주식 실시간 시세 수집 및 모니터링
        </Typography>
      </Box>

      {/* 컨트롤 패널 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              종목 관리
            </Typography>

            {/* 종목 입력 */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="종목 코드 추가"
                placeholder="예: 005930"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
              />
              <Button
                variant="contained"
                onClick={handleAddSymbol}
                startIcon={<Add />}
              >
                추가
              </Button>
            </Box>

            {/* 종목 칩 */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {symbols.map((symbol) => (
                <Chip
                  key={symbol}
                  label={symbol}
                  onDelete={() => handleRemoveSymbol(symbol)}
                  color={isCollecting ? 'primary' : 'default'}
                  icon={isCollecting ? <ShowChart /> : undefined}
                />
              ))}
            </Box>

            {/* 통계 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                모니터링 중인 종목: <strong>{symbols.length}</strong>개
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              수집 제어
            </Typography>

            {/* 시작/중지 버튼 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                fullWidth
                variant={isCollecting ? 'outlined' : 'contained'}
                color={isCollecting ? 'error' : 'success'}
                startIcon={isCollecting ? <Stop /> : <PlayArrow />}
                onClick={handleToggleCollection}
                size="large"
              >
                {isCollecting ? '수집 중지' : '수집 시작'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchLiveQuotes}
              >
                새로고침
              </Button>
            </Box>

            {/* 자동 새로고침 */}
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="primary"
                />
              }
              label="자동 새로고침 (3초)"
            />

            {/* 상태 메시지 */}
            {isCollecting && (
              <Alert severity="success" sx={{ mt: 2 }}>
                실시간 데이터 수집 중...
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 실시간 시세 테이블 */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            실시간 시세
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>종목</TableCell>
                <TableCell align="right">현재가</TableCell>
                <TableCell align="right">변동</TableCell>
                <TableCell align="right">변동률</TableCell>
                <TableCell align="right">거래량</TableCell>
                <TableCell align="right">고가</TableCell>
                <TableCell align="right">저가</TableCell>
                <TableCell align="center">상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {symbols.map((symbol) => {
                const quote = liveQuotes[symbol];
                const change = quote?.change || 0;
                const price = quote?.price || 0;
                const changePct = price > 0 ? (change / price * 100) : 0;
                const isPositive = change > 0;

                return (
                  <TableRow
                    key={symbol}
                    sx={{
                      bgcolor: isCollecting ? 'action.hover' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {quote ? price.toLocaleString() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={isPositive ? 'error.main' : 'success.main'}
                      >
                        {quote ? `${change > 0 ? '+' : ''}${change.toLocaleString()}` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={quote ? `${changePct.toFixed(2)}%` : '-'}
                        color={isPositive ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {quote ? quote.volume.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {quote ? quote.high.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {quote ? quote.low.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {isCollecting && quote ? (
                        <Chip
                          label="실시간"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="대기"
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 안내 메시지 */}
      <Alert severity="info">
        <Typography variant="body2">
          <strong>실시간 데이터 수집 정보:</strong><br />
          • Yahoo Finance API를 통해 실시간 시세를 가져옵니다.<br />
          • 국내 주식: 종목코드.KS (예: 005930.KS)<br />
          • 미국 주식: 티커符号 (예: AAPL)<br />
          • 자동 새로고침은 3초마다 데이터를 갱신합니다.<br />
          • 데이터는 히스토리에 저장되어 차트로 분석할 수 있습니다.
        </Typography>
      </Alert>
    </Container>
  );
}

export default RealtimeData;
