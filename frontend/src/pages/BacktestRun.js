import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  TrendingUp,
  TrendingDown,
  ShowChart
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSymbols } from '../services/api';
import axios from 'axios';

function BacktestRun() {
  const [loading, setLoading] = useState(false);
  const [symbols, setSymbols] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 입력 파라미터
  const [symbolId, setSymbolId] = useState('');
  const [strategy, setStrategy] = useState('P1');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [initialCapital, setInitialCapital] = useState(10000000);

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    try {
      const response = await getSymbols();
      setSymbols(response.data.results || response.data);
    } catch (error) {
      console.error('종목 로드 실패:', error);
    }
  };

  const runBacktest = async () => {
    if (!symbolId) {
      setError('종목을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:8000/api/backtest/run/', {
        symbol_id: symbolId,
        strategy: strategy,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital
      });

      setResult(response.data);
    } catch (error) {
      console.error('백테스팅 실패:', error);
      setError(error.response?.data?.error || '백테스팅 실행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🎯 백테스팅 시뮬레이션
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>과거 데이터로 전략을 검증하세요!</strong>
        <br />
        Pattern 1/2/3 전략을 실제 OHLCV 데이터로 시뮬레이션하여 승률, 수익률, MDD 등을 확인할 수 있습니다.
      </Alert>

      {/* 입력 폼 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          백테스팅 설정
        </Typography>

        <Grid container spacing={3}>
          {/* 종목 선택 */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>종목</InputLabel>
              <Select
                value={symbolId}
                label="종목"
                onChange={(e) => setSymbolId(e.target.value)}
              >
                {symbols.map((symbol) => (
                  <MenuItem key={symbol.id} value={symbol.id}>
                    [{symbol.ticker}] {symbol.name} ({symbol.exchange})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 전략 선택 */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>전략</InputLabel>
              <Select
                value={strategy}
                label="전략"
                onChange={(e) => setStrategy(e.target.value)}
              >
                <MenuItem value="P1">Pattern 1 (매집→급등형)</MenuItem>
                <MenuItem value="P2">Pattern 2 (추세전환형)</MenuItem>
                <MenuItem value="P3">Pattern 3 (IPO반등형)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 시작일 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="시작일"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* 종료일 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="종료일"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* 초기 자본금 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="초기 자본금 (원)"
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
            />
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
            onClick={runBacktest}
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? '실행 중...' : '백테스팅 실행'}
          </Button>
        </Box>
      </Paper>

      {/* 에러 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 결과 */}
      {result && (
        <Box>
          {/* 요약 지표 */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    총 수익률
                  </Typography>
                  <Typography variant="h4" color={result.total_return >= 0 ? 'success.main' : 'error.main'}>
                    {formatPercent(result.total_return)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    승률
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {result.win_rate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {result.winning_trades}승 / {result.losing_trades}패
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    MDD (최대 낙폭)
                  </Typography>
                  <Typography variant="h4" color="error">
                    {result.max_drawdown.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Sharpe Ratio
                  </Typography>
                  <Typography variant="h4">
                    {result.sharpe_ratio ? result.sharpe_ratio.toFixed(3) : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 상세 지표 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              상세 성과
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  초기 자본금
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(result.initial_capital)}
                </Typography>
              </Grid>

              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  최종 자본금
                </Typography>
                <Typography variant="h6" color={result.total_return >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(result.final_capital)}
                </Typography>
              </Grid>

              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  총 거래 횟수
                </Typography>
                <Typography variant="h6">
                  {result.total_trades}회
                </Typography>
              </Grid>

              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Profit Factor
                </Typography>
                <Typography variant="h6">
                  {result.profit_factor.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  평균 수익
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatPercent(result.avg_win)}
                </Typography>
              </Grid>

              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  평균 손실
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatPercent(result.avg_loss)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* 자산 곡선 */}
          {result.equity_curve && result.equity_curve.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                자산 곡선
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={result.equity_curve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="#8884d8"
                    name="자산"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {/* 거래 내역 */}
          {result.trades_data && result.trades_data.length > 0 && (
            <Paper>
              <Box p={2}>
                <Typography variant="h6" gutterBottom>
                  거래 내역 ({result.trades_data.length}건)
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>진입일</TableCell>
                      <TableCell>진입가</TableCell>
                      <TableCell>청산일</TableCell>
                      <TableCell>청산가</TableCell>
                      <TableCell>수익률</TableCell>
                      <TableCell>손익</TableCell>
                      <TableCell>보유일</TableCell>
                      <TableCell>진입사유</TableCell>
                      <TableCell>청산사유</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.trades_data.map((trade, index) => (
                      <TableRow key={index}>
                        <TableCell>{trade.entry_date}</TableCell>
                        <TableCell>{formatCurrency(trade.entry_price)}</TableCell>
                        <TableCell>{trade.exit_date}</TableCell>
                        <TableCell>{formatCurrency(trade.exit_price)}</TableCell>
                        <TableCell>
                          <Chip
                            label={formatPercent(trade.profit_loss_pct)}
                            color={trade.profit_loss_pct >= 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            color: trade.profit_loss >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {formatCurrency(trade.profit_loss)}
                        </TableCell>
                        <TableCell>{trade.holding_days}일</TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {trade.entry_reason}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {trade.exit_reason}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}

export default BacktestRun;
