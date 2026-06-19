import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function BacktestResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [strategyFilter, setStrategyFilter] = useState('all');

  useEffect(() => {
    loadResults();
  }, [strategyFilter]);

  const loadResults = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:8000/api/backtest/results/';

      const response = await axios.get(url);

      // DRF pagination 응답 처리
      if (response.data.results) {
        setResults(response.data.results);
      } else if (Array.isArray(response.data)) {
        setResults(response.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('결과 로드 실패:', error);
      setResults([]);
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
    return `${value >= 0 ? '+' : ''}${value}%`;
  };

  const getStrategyColor = (strategy) => {
    switch (strategy) {
      case 'P1': return 'success';
      case 'P2': return 'info';
      case 'P3': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          📊 백테스팅 결과
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/backtest/run')}
        >
          새 백테스팅 실행
        </Button>
      </Box>

      {/* 필터 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>전략 필터</InputLabel>
              <Select
                value={strategyFilter}
                label="전략 필터"
                onChange={(e) => setStrategyFilter(e.target.value)}
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="P1">Pattern 1</MenuItem>
                <MenuItem value="P2">Pattern 2</MenuItem>
                <MenuItem value="P3">Pattern 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* 결과 테이블 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>종목</TableCell>
                <TableCell>전략</TableCell>
                <TableCell>기간</TableCell>
                <TableCell>총 수익률</TableCell>
                <TableCell>승률</TableCell>
                <TableCell>거래횟수</TableCell>
                <TableCell>MDD</TableCell>
                <TableCell>Sharpe</TableCell>
                <TableCell>실행일</TableCell>
                <TableCell>상세</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <Typography fontWeight="bold">
                      {result.symbol?.ticker}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {result.symbol?.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={result.strategy}
                      color={getStrategyColor(result.strategy)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {result.start_date}
                    </Typography>
                    <Typography variant="body2">
                      ~ {result.end_date}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatPercent(result.total_return)}
                      color={result.total_return >= 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{result.win_rate}%</TableCell>
                  <TableCell>
                    {result.total_trades}회
                    <Typography variant="caption" color="textSecondary">
                      ({result.winning_trades}승/{result.losing_trades}패)
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="error.main">
                      {result.max_drawdown}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {result.sharpe_ratio || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(result.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/backtest/${result.id}`)}
                    >
                      상세
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {results.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              백테스팅 결과가 없습니다.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/backtest/run')}
            >
              첫 백테스팅 실행하기
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default BacktestResults;
