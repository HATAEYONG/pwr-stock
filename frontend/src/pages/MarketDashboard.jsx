import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Assessment,
  Warning
} from '@mui/icons-material';
import axios from 'axios';

function MarketDashboard() {
  const [market, setMarket] = useState('US');
  const [regime, setRegime] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [indices, setIndices] = useState([]);
  const [breadth, setBreadth] = useState(null);

  useEffect(() => {
    loadMarketData();
  }, [market]);

  const loadMarketData = async () => {
    // Mock 데이터 (실제로는 API 호출)
    if (market === 'US') {
      setRegime({
        market: 'US',
        regime: 'BULL',
        confidence: 0.82,
        recommended_strategy: 'AGGRESSIVE',
        cash_allocation: 10,
        current_level: 4780.50,
        ma50: 4650.20,
        ma200: 4420.80,
        distance_to_ma50_pct: 2.79,
        distance_to_ma200_pct: 8.14,
        vix_level: 14.5
      });

      setSectors([
        { sector_name: 'Technology', monthly_return: 0.085, rank: 1, rs_score: 58.5 },
        { sector_name: 'Healthcare', monthly_return: 0.052, rank: 2, rs_score: 55.2 },
        { sector_name: 'Financials', monthly_return: 0.041, rank: 3, rs_score: 54.1 },
        { sector_name: 'Consumer Discretionary', monthly_return: 0.038, rank: 4, rs_score: 53.8 },
        { sector_name: 'Industrials', monthly_return: 0.025, rank: 5, rs_score: 52.5 },
        { sector_name: 'Energy', monthly_return: -0.012, rank: 6, rs_score: 48.8 },
        { sector_name: 'Utilities', monthly_return: -0.025, rank: 7, rs_score: 47.5 },
        { sector_name: 'Real Estate', monthly_return: -0.038, rank: 8, rs_score: 46.2 }
      ]);

      setIndices([
        { symbol: 'SPY', name: 'S&P 500', change: 1.25, change_pct: 0.026 },
        { symbol: 'QQQ', name: 'NASDAQ 100', change: 1.85, change_pct: 0.031 },
        { symbol: 'DIA', name: 'DOW JONES', change: 0.95, change_pct: 0.019 },
        { symbol: 'VIX', name: 'VIX', change: -0.82, change_pct: -0.054 }
      ]);

      setBreadth({
        advancing: 2850,
        declining: 1250,
        unchanged: 150,
        total: 4250,
        advance_decline_ratio: 2.28,
        breadth_strength: 37.6,
        interpretation: 'Strong'
      });
    } else {
      // 한국 시장 Mock 데이터
      setRegime({
        market: 'KR',
        regime: 'SIDEWAYS',
        confidence: 0.65,
        recommended_strategy: 'NEUTRAL',
        cash_allocation: 25,
        current_level: 275.30,
        ma50: 278.50,
        ma200: 268.20,
        distance_to_ma50_pct: -1.15,
        distance_to_ma200_pct: 2.65
      });

      setSectors([
        { sector_name: '반도체', monthly_return: 0.062, rank: 1, rs_score: 56.2 },
        { sector_name: '자동차', monthly_return: 0.045, rank: 2, rs_score: 54.5 },
        { sector_name: '바이오', monthly_return: 0.032, rank: 3, rs_score: 53.2 },
        { sector_name: 'IT', monthly_return: 0.025, rank: 4, rs_score: 52.5 }
      ]);

      setIndices([
        { symbol: '^KS200', name: 'KOSPI 200', change: -2.50, change_pct: -0.009 },
        { symbol: '^KQ11', name: 'KOSDAQ', change: -1.25, change_pct: -0.012 }
      ]);
    }
  };

  const getRegimeColor = (regime) => {
    switch (regime) {
      case 'BULL': return 'success';
      case 'BEAR': return 'error';
      case 'SIDEWAYS': return 'warning';
      case 'TRANSITION': return 'info';
      default: return 'default';
    }
  };

  const getRegimeText = (regime) => {
    switch (regime) {
      case 'BULL': return '상승장';
      case 'BEAR': return '하락장';
      case 'SIDEWAYS': return '횡보장';
      case 'TRANSITION': return '전환기';
      default: return regime;
    }
  };

  const getStrategyText = (strategy) => {
    switch (strategy) {
      case 'AGGRESSIVE': return '공격적';
      case 'DEFENSIVE': return '방어적';
      case 'NEUTRAL': return '중립';
      case 'CAUTIOUS': return '신중';
      default: return strategy;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          시장 지수 대시보드
        </Typography>

        <ToggleButtonGroup
          value={market}
          exclusive
          onChange={(e, v) => v && setMarket(v)}
        >
          <ToggleButton value="US">
            미국 시장
          </ToggleButton>
          <ToggleButton value="KR">
            한국 시장
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 마켓 국면 카드 */}
      {regime && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {market === 'US' ? '미국' : '한국'} 시장 국면
              </Typography>
              <Chip
                label={getRegimeText(regime.regime)}
                color={getRegimeColor(regime.regime)}
                icon={regime.regime === 'BULL' ? <TrendingUp /> : regime.regime === 'BEAR' ? <TrendingDown /> : <Assessment />}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  추천 전략
                </Typography>
                <Typography variant="h5">
                  {getStrategyText(regime.recommended_strategy)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  현금 비중
                </Typography>
                <Typography variant="h5">
                  {regime.cash_allocation}%
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  확신도
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flex: 1, mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={regime.confidence * 100}
                    />
                  </Box>
                  <Typography variant="body2">
                    {(regime.confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                {regime.vix_level && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      VIX 수준
                    </Typography>
                    <Typography variant="h5">
                      {regime.vix_level}
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>

            {/* 이동평균선 정보 */}
            {regime.ma50 && regime.ma200 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      현재 레벨
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {regime.current_level?.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      MA50 거리
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color={regime.distance_to_ma50_pct >= 0 ? 'success.main' : 'error.main'}>
                      {regime.distance_to_ma50_pct?.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      MA200 거리
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color={regime.distance_to_ma200_pct >= 0 ? 'success.main' : 'error.main'}>
                      {regime.distance_to_ma200_pct?.toFixed(2)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* 주요 지수 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {indices.map((index) => (
          <Grid item xs={12} sm={6} md={3} key={index.symbol}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {index.symbol}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {index.name}
                </Typography>
                <Typography
                  variant="h5"
                  color={index.change_pct >= 0 ? 'success.main' : 'error.main'}
                >
                  {index.change_pct >= 0 ? '+' : ''}{(index.change_pct * 100).toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* 섹터별 상대 강도 */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              섹터별 상대 강도
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>순위</TableCell>
                    <TableCell>섹터</TableCell>
                    <TableCell align="right">월간 수익률</TableCell>
                    <TableCell align="right">RS Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sectors.map((sector) => (
                    <TableRow key={sector.sector_name}>
                      <TableCell>
                        <Chip
                          label={sector.rank}
                          size="small"
                          color={sector.rank <= 3 ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{sector.sector_name}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={sector.monthly_return >= 0 ? 'success.main' : 'error.main'}
                        >
                          {(sector.monthly_return * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {sector.rs_score.toFixed(1)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* 마켓 브레드쓰 */}
        {breadth && (
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                마켓 브레드쓰
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  상승/하락 비율
                </Typography>
                <Typography variant="h4">
                  {breadth.advance_decline_ratio.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      상승
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {breadth.advancing}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      하락
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {breadth.declining}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      변동 없음
                    </Typography>
                    <Typography variant="h6">
                      {breadth.unchanged}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ p: 2, bgcolor: breadth.breadth_strength > 20 ? 'success.light' : breadth.breadth_strength < -20 ? 'error.light' : 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  시장 강도
                </Typography>
                <Typography variant="h5" color={breadth.breadth_strength > 20 ? 'success.dark' : breadth.breadth_strength < -20 ? 'error.dark' : 'text.primary'}>
                  {breadth.interpretation}
                </Typography>
                <Typography variant="h4">
                  {breadth.breadth_strength > 0 ? '+' : ''}{breadth.breadth_strength.toFixed(1)}%
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default MarketDashboard;
