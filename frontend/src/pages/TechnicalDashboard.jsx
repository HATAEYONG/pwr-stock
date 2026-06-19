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
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  RemoveCircleOutline as SidewaysIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

function TechnicalDashboard() {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  
  // 탭별 데이터
  const [topScores, setTopScores] = useState([]);
  const [breakoutCandidates, setBreakoutCandidates] = useState([]);
  const [accumulationStocks, setAccumulationStocks] = useState([]);
  
  // 필터
  const [minMaLevel, setMinMaLevel] = useState(3);

  useEffect(() => {
    loadStats();
    loadTopScores();
  }, []);

  useEffect(() => {
    if (tab === 1) {
      loadBreakoutCandidates();
    } else if (tab === 2) {
      loadAccumulationStocks();
    }
  }, [tab, minMaLevel]);

  const loadStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/technical/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const loadTopScores = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/technical/top_scores/?limit=50');
      setTopScores(response.data);
    } catch (error) {
      console.error('상위 종목 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBreakoutCandidates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/technical/breakout_candidates/?min_ma_level=${minMaLevel}`
      );
      setBreakoutCandidates(response.data);
    } catch (error) {
      console.error('돌파 후보 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccumulationStocks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/technical/accumulation_stocks/');
      setAccumulationStocks(response.data);
    } catch (error) {
      console.error('매집 종목 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSignalChip = (strength) => {
    const config = {
      very_strong: { label: '매우 강함', color: 'error' },
      strong: { label: '강함', color: 'warning' },
      moderate: { label: '보통', color: 'info' },
      weak: { label: '약함', color: 'default' },
      very_weak: { label: '매우 약함', color: 'default' }
    };
    
    const { label, color } = config[strength] || config.weak;
    return <Chip label={label} color={color} size="small" />;
  };

  const getMaLevelChip = (level) => {
    const colors = ['default', 'info', 'primary', 'success', 'warning', 'error'];
    return (
      <Chip 
        label={`레벨 ${level}/5`} 
        color={colors[level] || 'default'} 
        size="small" 
      />
    );
  };

  const getTrendIcon = (trend) => {
    if (trend === 'bullish') return <TrendingUpIcon color="success" fontSize="small" />;
    if (trend === 'bearish') return <TrendingDownIcon color="error" fontSize="small" />;
    return <SidewaysIcon color="disabled" fontSize="small" />;
  };

  const getVolumeChip = (breakout, strength) => {
    if (!breakout) return <Chip label="정상" size="small" />;
    
    const config = {
      very_strong: { label: '200%+', color: 'error' },
      strong: { label: '150%+', color: 'warning' },
      moderate: { label: '110%+', color: 'success' }
    };
    
    const { label, color } = config[strength] || { label: '돌파', color: 'info' };
    return <Chip label={label} color={color} size="small" />;
  };

  const renderStockTable = (data) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>종목</TableCell>
            <TableCell align="center">이평선</TableCell>
            <TableCell align="center">거래량</TableCell>
            <TableCell align="center">추세</TableCell>
            <TableCell align="center">패턴</TableCell>
            <TableCell align="center">기술점수</TableCell>
            <TableCell align="center">신호</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                <Typography variant="body2">
                  <strong>[{item.symbol_ticker}]</strong> {item.symbol_name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {item.pattern_type} ({item.checklist_score}점)
                </Typography>
              </TableCell>
              
              <TableCell align="center">
                {getMaLevelChip(item.ma_level)}
                <Typography variant="caption" display="block" mt={0.5}>
                  {item.ma_arrangement === 'positive' && '정배열'}
                  {item.ma_arrangement === 'negative' && '역배열'}
                  {item.ma_arrangement === 'mixed' && '혼조'}
                </Typography>
              </TableCell>
              
              <TableCell align="center">
                {getVolumeChip(item.volume_breakout, item.volume_strength)}
                {item.volume_ratio && (
                  <Typography variant="caption" display="block" mt={0.5}>
                    {item.volume_ratio.toFixed(1)}%
                  </Typography>
                )}
              </TableCell>
              
              <TableCell align="center">
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                  {getTrendIcon(item.trend_short)}
                  {getTrendIcon(item.trend_medium)}
                  {getTrendIcon(item.trend_long)}
                </Box>
              </TableCell>
              
              <TableCell align="center">
                {item.double_bottom && (
                  <Chip label="쌍바닥" color="success" size="small" sx={{ mr: 0.5 }} />
                )}
                {item.accumulation_phase && (
                  <Chip label="매집" color="info" size="small" sx={{ mr: 0.5 }} />
                )}
                {item.breakout_signal && (
                  <Chip label="돌파" color="error" size="small" />
                )}
              </TableCell>
              
              <TableCell align="center">
                <Typography variant="h6" color={item.technical_score >= 70 ? 'success.main' : 'text.primary'}>
                  {item.technical_score}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={item.technical_score} 
                  sx={{ mt: 0.5 }}
                  color={item.technical_score >= 70 ? 'success' : 'primary'}
                />
              </TableCell>
              
              <TableCell align="center">
                {getSignalChip(item.signal_strength)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📈 기술적 지표 분석
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>장기이평선 레벨 시스템</strong>으로 종목의 기술적 강도를 평가합니다.
        <br />
        레벨 5: 224일선까지 돌파 (최강) | 레벨 0: 모두 하향 (최약)
      </Alert>

      {/* 통계 카드 */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="caption">
                  전체 종목
                </Typography>
                <Typography variant="h5">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="caption">
                  돌파 신호
                </Typography>
                <Typography variant="h5" color="error.main">
                  {stats.breakout_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="caption">
                  매집 구간
                </Typography>
                <Typography variant="h5" color="info.main">
                  {stats.accumulation_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="caption">
                  평균 점수
                </Typography>
                <Typography variant="h5">
                  {stats.avg_technical_score.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="caption">
                  레벨 4-5
                </Typography>
                <Typography variant="h5" color="success.main">
                  {(stats.by_ma_level.level_4 || 0) + (stats.by_ma_level.level_5 || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="caption">
                  강한 신호
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {(stats.by_signal_strength.very_strong || 0) + (stats.by_signal_strength.strong || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 탭 */}
      <Paper>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="🏆 상위 종목" />
          <Tab label="🚀 돌파 후보" />
          <Tab label="📦 매집 구간" />
        </Tabs>

        <Box p={2}>
          {/* 필터 */}
          {tab === 1 && (
            <Box mb={2}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>최소 이평선 레벨</InputLabel>
                <Select
                  value={minMaLevel}
                  label="최소 이평선 레벨"
                  onChange={(e) => setMinMaLevel(e.target.value)}
                >
                  <MenuItem value={1}>레벨 1 이상</MenuItem>
                  <MenuItem value={2}>레벨 2 이상</MenuItem>
                  <MenuItem value={3}>레벨 3 이상</MenuItem>
                  <MenuItem value={4}>레벨 4 이상</MenuItem>
                  <MenuItem value={5}>레벨 5 (최고)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {/* 로딩 */}
          {loading && <LinearProgress />}

          {/* 테이블 */}
          {tab === 0 && renderStockTable(topScores)}
          {tab === 1 && renderStockTable(breakoutCandidates)}
          {tab === 2 && renderStockTable(accumulationStocks)}

          {/* 빈 상태 */}
          {!loading && tab === 0 && topScores.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                데이터가 없습니다.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default TechnicalDashboard;
