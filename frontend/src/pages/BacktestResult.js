import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress
} from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function BacktestResult() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadResult();
  }, [id]);

  const loadResult = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/backtest/results/${id}/`);
      setResult(response.data);
    } catch (error) {
      console.error('결과 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!result) {
    return <Typography>결과를 찾을 수 없습니다.</Typography>;
  }

  // 자산 곡선 데이터 변환
  const equityData = result.equity_curve.map(point => ({
    date: point.date,
    equity: point.equity
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 백테스팅 결과
      </Typography>

      {/* 기본 정보 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="textSecondary">종목</Typography>
            <Typography variant="h6">{result.symbol.ticker} - {result.symbol.name}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="textSecondary">전략</Typography>
            <Typography variant="h6">{result.strategy}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="textSecondary">기간</Typography>
            <Typography variant="body1">{result.start_date} ~ {result.end_date}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="textSecondary">초기 자본</Typography>
            <Typography variant="body1">{Number(result.initial_capital).toLocaleString()}원</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 성과 지표 */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">총 수익률</Typography>
              <Typography variant="h4" color={result.total_return >= 0 ? 'success.main' : 'error.main'}>
                {result.total_return}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">승률</Typography>
              <Typography variant="h4" color="primary">
                {result.win_rate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">최대 낙폭 (MDD)</Typography>
              <Typography variant="h4" color="error.main">
                -{result.max_drawdown}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">샤프 비율</Typography>
              <Typography variant="h4">
                {result.sharpe_ratio || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 거래 통계 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>거래 통계</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={2}>
            <Typography variant="body2" color="textSecondary">총 거래</Typography>
            <Typography variant="h6">{result.total_trades}회</Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="body2" color="textSecondary">승리</Typography>
            <Typography variant="h6" color="success.main">{result.winning_trades}회</Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="body2" color="textSecondary">패배</Typography>
            <Typography variant="h6" color="error.main">{result.losing_trades}회</Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="body2" color="textSecondary">평균 수익</Typography>
            <Typography variant="h6" color="success.main">+{result.avg_win}%</Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="body2" color="textSecondary">평균 손실</Typography>
            <Typography variant="h6" color="error.main">{result.avg_loss}%</Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="body2" color="textSecondary">손익비</Typography>
            <Typography variant="h6">{result.profit_factor}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 자산 곡선 차트 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>자산 곡선</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={equityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="equity" stroke="#8884d8" name="총 자산" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* 거래 내역 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>거래 내역</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>진입일</TableCell>
                <TableCell>청산일</TableCell>
                <TableCell align="right">진입가</TableCell>
                <TableCell align="right">청산가</TableCell>
                <TableCell align="right">수량</TableCell>
                <TableCell align="right">손익</TableCell>
                <TableCell align="right">손익률</TableCell>
                <TableCell>보유일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.trades_data.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell>{trade.entry_date}</TableCell>
                  <TableCell>{trade.exit_date}</TableCell>
                  <TableCell align="right">{trade.entry_price.toLocaleString()}</TableCell>
                  <TableCell align="right">{trade.exit_price.toLocaleString()}</TableCell>
                  <TableCell align="right">{trade.quantity.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toLocaleString()}원`}
                      color={trade.profit_loss >= 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${trade.profit_loss_pct >= 0 ? '+' : ''}${trade.profit_loss_pct.toFixed(2)}%`}
                      color={trade.profit_loss_pct >= 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{trade.holding_days}일</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default BacktestResult;
