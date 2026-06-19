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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  AccessTime,
  TrendingUp,
  TrendingDown,
  NotificationsActive,
  Schedule
} from '@mui/icons-material';
import axios from 'axios';

function TimeframeAnalysis() {
  const [symbol, setSymbol] = useState('AAPL');
  const [analysis, setAnalysis] = useState(null);
  const [breakouts, setBreakouts] = useState([]);
  const [intradayPattern, setIntradayPattern] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadAnalysis();
  }, [symbol]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  const loadAnalysis = async () => {
    // Mock 데이터
    setAnalysis({
      symbol: 'AAPL',
      current_price: 178.50,
      trend: 'bullish',
      volatility: 0.015,
      volume_ratio: 1.35,
      ma5: 175.20,
      ma20: 172.80
    });

    setBreakouts([
      {
        date: '2024-01-15',
        gap_up_pct: 3.2,
        volume_ratio: 1.8,
        high: 182.50,
        strength: 'strong'
      },
      {
        date: '2024-01-10',
        gap_up_pct: 2.1,
        volume_ratio: 1.5,
        high: 175.80,
        strength: 'moderate'
      }
    ]);

    setIntradayPattern({
      symbol: 'AAPL',
      total_days: 20,
      patterns: {
        morning_rally: { count: 14, probability: 0.70 },
        afternoon_rally: { count: 12, probability: 0.60 }
      },
      recommendation: 'morning'
    });
  };

  const getTimeBasedSignals = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();

    // 시간대별 신호
    const signals = [
      {
        time: '09:00',
        action: 'WATCH',
        reason: '장 시작, 시가 갭 확인',
        priority: 'high',
        icon: <Schedule />
      },
      {
        time: '10:00',
        action: 'BUY_STRENGTH',
        reason: '초반 강도 확인, 추가 상승 여부 검토',
        priority: 'medium',
        icon: <TrendingUp />
      },
      {
        time: '11:30',
        action: 'TAKE_PROFIT_PARTIAL',
        reason: '오전 익절 일부 실행',
        priority: 'low',
        icon: <TrendingUp />
      },
      {
        time: '13:00',
        action: 'WATCH',
        reason: '오후 장 시작, 추세 확인',
        priority: 'medium',
        icon: <Schedule />
      },
      {
        time: '14:30',
        action: 'POSITION_ADJUST',
        reason: '마감 전 포지션 조정',
        priority: 'high',
        icon: <NotificationsActive />
      },
      {
        time: '15:20',
        action: 'FLATTEN',
        reason: '마감 임박, 포지션 정리',
        priority: 'high',
        icon: <AccessTime />
      }
    ];

    // 현재 시간에 가장 가까운 신호 찾기
    const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    return { signals, currentTimeStr };
  };

  const { signals, currentTimeStr } = getTimeBasedSignals();

  const getActionColor = (action) => {
    switch (action) {
      case 'WATCH': return 'info';
      case 'BUY_STRENGTH': return 'success';
      case 'TAKE_PROFIT_PARTIAL': return 'warning';
      case 'POSITION_ADJUST': return 'warning';
      case 'FLATTEN': return 'error';
      default: return 'default';
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case 'WATCH': return '관망';
      case 'BUY_STRENGTH': return '강한 매수';
      case 'TAKE_PROFIT_PARTIAL': return '부분 익절';
      case 'POSITION_ADJUST': return '포지션 조정';
      case 'FLATTEN': return '포지션 정리';
      default: return action;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          시간대별 분석
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>종목</InputLabel>
            <Select
              value={symbol}
              label="종목"
              onChange={(e) => setSymbol(e.target.value)}
            >
              <MenuItem value="AAPL">AAPL</MenuItem>
              <MenuItem value="TSLA">TSLA</MenuItem>
              <MenuItem value="NVDA">NVDA</MenuItem>
              <MenuItem value="META">META</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="h6">
            {currentTimeStr}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 60분봉 분석 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              60분봉 분석
            </Typography>

            {analysis && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    현재가
                  </Typography>
                  <Typography variant="h5">
                    ${analysis.current_price?.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    추세
                  </Typography>
                  <Chip
                    label={analysis.trend === 'bullish' ? '상승' : '하락'}
                    color={analysis.trend === 'bullish' ? 'success' : 'error'}
                    icon={analysis.trend === 'bullish' ? <TrendingUp /> : <TrendingDown />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    변동성
                  </Typography>
                  <Typography variant="body1">
                    {(analysis.volatility * 100).toFixed(2)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    거래량 비율
                  </Typography>
                  <Typography variant="body1">
                    {analysis.volume_ratio?.toFixed(2)}x
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* 정각 급등 감지 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              정각 급등 감지
            </Typography>

            {breakouts.length > 0 ? (
              <List>
                {breakouts.map((breakout, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={breakout.date}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              갭 상승: {breakout.gap_up_pct.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              거래량: {breakout.volume_ratio.toFixed(1)}x
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={breakout.strength === 'strong' ? '강함' : '보통'}
                        color={breakout.strength === 'strong' ? 'error' : 'default'}
                        size="small"
                      />
                    </ListItem>
                    {index < breakouts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                최근 급등 신호 없음
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* 시간대별 매매 신호 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              시간대별 매매 신호
            </Typography>

            <List>
              {signals.map((signal, index) => {
                const isCurrentTime = signal.time === currentTimeStr;
                return (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        bgcolor: isCurrentTime ? 'action.selected' : 'inherit',
                        borderRadius: 1
                      }}
                    >
                      <ListItemIcon>
                        {signal.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {signal.time}
                            </Typography>
                            {isCurrentTime && (
                              <Chip label="현재" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={signal.reason}
                      />
                      <Chip
                        label={getActionText(signal.action)}
                        color={getActionColor(signal.action)}
                        size="small"
                      />
                    </ListItem>
                    {index < signals.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/* 일중 패턴 분석 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              일중 패턴 분석
            </Typography>

            {intradayPattern && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    추천 시간대
                  </Typography>
                  <Chip
                    label={intradayPattern.recommendation === 'morning' ? '오전' : '오후'}
                    color="primary"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    오전 반등 확률
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flex: 1, mr: 1 }}>
                      <Box
                        sx={{
                          height: 8,
                          bgcolor: 'grey.300',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            bgcolor: 'success.main',
                            width: `${intradayPattern.patterns.morning_rally.probability * 100}%`
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2">
                      {(intradayPattern.patterns.morning_rally.probability * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {intradayPattern.patterns.morning_rally.count} / {intradayPattern.total_days}일
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    오후 반등 확률
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flex: 1, mr: 1 }}>
                      <Box
                        sx={{
                          height: 8,
                          bgcolor: 'grey.300',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            bgcolor: 'warning.main',
                            width: `${intradayPattern.patterns.afternoon_rally.probability * 100}%`
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2">
                      {(intradayPattern.patterns.afternoon_rally.probability * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {intradayPattern.patterns.afternoon_rally.count} / {intradayPattern.total_days}일
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default TimeframeAnalysis;
