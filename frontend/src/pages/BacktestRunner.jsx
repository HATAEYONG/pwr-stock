import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { PlayArrow as RunIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getSymbols } from '../services/api';
import axios from 'axios';

function BacktestRunner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [symbols, setSymbols] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form 상태
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
      console.error('종목 로딩 실패:', error);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8000/api/backtest/results/run/', {
        symbol_id: symbolId,
        strategy: strategy,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital
      });

      setSuccess('백테스팅 완료!');
      
      // 결과 페이지로 이동
      setTimeout(() => {
        navigate(`/backtest/results/${response.data.id}`);
      }, 1500);
    } catch (error) {
      console.error('백테스팅 실행 실패:', error);
      setError(error.response?.data?.error || '백테스팅 실행에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 백테스팅 실행
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>과거 데이터로 전략을 검증하세요!</strong>
        <br />
        Pattern 1·2·3 전략이 과거에 어떻게 동작했는지 시뮬레이션합니다.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* 종목 선택 */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>종목</InputLabel>
              <Select
                value={symbolId}
                onChange={(e) => setSymbolId(e.target.value)}
                label="종목"
                required
              >
                <MenuItem value="">-- 종목 선택 --</MenuItem>
                {symbols.map((symbol) => (
                  <MenuItem key={symbol.id} value={symbol.id}>
                    {symbol.ticker} - {symbol.name}
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
                onChange={(e) => setStrategy(e.target.value)}
                label="전략"
              >
                <MenuItem value="P1">Pattern 1 (매집→급등형)</MenuItem>
                <MenuItem value="P2">Pattern 2 (추세전환형)</MenuItem>
                <MenuItem value="P3">Pattern 3 (IPO반등형)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 시작일 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="시작일"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          {/* 종료일 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="종료일"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          {/* 초기 자본 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="초기 자본 (원)"
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              inputProps={{ min: 1000000, step: 1000000 }}
            />
            <Typography variant="caption" color="textSecondary">
              기본값: 1,000만원
            </Typography>
          </Grid>

          {/* 실행 버튼 */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RunIcon />}
                onClick={handleRun}
                disabled={loading || !symbolId}
                sx={{ minWidth: 200 }}
              >
                {loading ? '실행 중...' : '백테스팅 실행'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box mt={4}>
        <Alert severity="warning">
          <Typography variant="h6">주의사항</Typography>
          <ul>
            <li>과거 성과가 미래 수익을 보장하지 않습니다.</li>
            <li>백테스팅은 참고 자료일 뿐입니다.</li>
            <li>실제 거래 시 슬리피지, 수수료 등이 발생합니다.</li>
            <li>충분한 OHLCV 데이터가 필요합니다.</li>
          </ul>
        </Alert>
      </Box>
    </Box>
  );
}

export default BacktestRunner;
