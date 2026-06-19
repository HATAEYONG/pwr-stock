/**
 * 종목 패턴 분석 페이지
 *
 * P1/P2/P3 패턴 분석 결과를 표시하고
 * Start Signal을 탐지합니다.
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PatternChart from '../components/PatternChart';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PatternAnalysis = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [patternData, setPatternData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 종목 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/?q=${searchQuery}`);
      setSearchResults(response.data.results);
    } catch (err) {
      setError('검색 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 종목 선택 및 분석
  const handleSelectSymbol = async (ticker) => {
    setSelectedSymbol(ticker);
    setPatternData(null);
    setMlData(null);
    setLoading(true);
    setError(null);

    try {
      // 패턴 분석 API 호출
      const patternResponse = await axios.get(`${API_BASE_URL}/api/patterns/${ticker}/`);
      setPatternData(patternResponse.data);

      // ML 피처 분석 API 호출
      const mlResponse = await axios.get(`${API_BASE_URL}/api/ml-features/${ticker}/`);
      setMlData(mlResponse.data);
    } catch (err) {
      setError('분석 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 점수 바 렌더링
  const ScoreBar = ({ score, maxScore, color }) => {
    const percentage = Math.min((score / maxScore) * 100, 100);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flexGrow: 1, bgcolor: '#e0e0e0', borderRadius: 1, height: 20 }}>
          <Box
            sx={{
              height: '100%',
              bgcolor: color,
              borderRadius: 1,
              width: `${percentage}%`,
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'right' }}>
          {score.toFixed(1)}/{maxScore}
        </Typography>
      </Box>
    );
  };

  // Start Signal 칩 렌더링
  const renderSignalChip = () => {
    if (!patternData) return null;

    const { start_signal } = patternData;

    if (start_signal.triggered) {
      return (
        <Chip
          label={`🚨 START SIGNAL! (${start_signal.recommendation_en})`}
          color="error"
          sx={{ fontSize: '1.1rem', fontWeight: 'bold', py: 2 }}
        />
      );
    }

    return (
      <Chip
        label={start_signal.recommendation}
        color="default"
        sx={{ fontSize: '1rem', py: 1 }}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Typography variant="h4" gutterBottom fontWeight="bold">
        종목 패턴 분석
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        P1/P2/P3 패턴 분석을 통해 Start Signal을 탐지합니다
      </Typography>

      {/* 검색 섹션 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="종목 검색 (종목명 또는 코드)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="예: 삼성전자, 005930"
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleSearch}
              disabled={loading}
              startIcon={<SearchIcon />}
            >
              검색
            </Button>
          </Box>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {searchResults.map((symbol) => (
                <Chip
                  key={symbol.ticker}
                  label={`${symbol.name} (${symbol.ticker})`}
                  onClick={() => handleSelectSymbol(symbol.ticker)}
                  sx={{ m: 0.5 }}
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 로딩 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 에러 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 분석 결과 */}
      {patternData && !loading && (
        <Grid container spacing={3}>
          {/* 차트 - 전체 너비 */}
          <Grid item xs={12}>
            <PatternChart
              data={patternData.chart_data}
              symbolName={patternData.symbol.name}
              startSignal={patternData.start_signal.triggered}
            />
          </Grid>

          {/* 종목 기본 정보 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {patternData.symbol.name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {patternData.symbol.ticker}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {patternData.latest.close.toLocaleString()}원
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      {patternData.latest.change >= 0 ? (
                        <TrendingUpIcon color="error" />
                      ) : (
                        <TrendingDownIcon color="primary" />
                      )}
                      <Typography
                        variant="body1"
                        color={patternData.latest.change >= 0 ? 'error.main' : 'primary.main'}
                        fontWeight="bold"
                      >
                        {patternData.latest.change >= 0 ? '+' : ''}
                        {patternData.latest.change.toLocaleString()}원
                        ({patternData.latest.change_rate.toFixed(2)}%)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Start Signal 종합 평가 */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: patternData.start_signal.triggered ? '#fff3e0' : 'default' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Start Signal 종합 평가
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {renderSignalChip()}
                </Box>
                <Typography variant="h3" fontWeight="bold" align="center" sx={{ my: 2 }}>
                  {patternData.start_signal.total_score.toFixed(1)}점
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* P1/P2/P3 패턴 분석 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  P1: 매집 → 급등형
                </Typography>
                <ScoreBar
                  score={patternData.patterns.p1.score}
                  maxScore={patternData.patterns.p1.max_score}
                  color="#FF6B6B"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  최대 50점
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  P2: 하락 → 바닥 형성
                </Typography>
                <ScoreBar
                  score={patternData.patterns.p2.score}
                  maxScore={patternData.patterns.p2.max_score}
                  color="#4ECDC4"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  최대 40점
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  P3: IPO 소형주
                </Typography>
                <ScoreBar
                  score={patternData.patterns.p3.score}
                  maxScore={patternData.patterns.p3.max_score}
                  color="#45B7D1"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  최대 10점
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 주요 지표 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  주요 기술적 지표
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {patternData.indicators.ma5 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>MA5 (5일 이동평균):</Typography>
                      <Typography fontWeight="bold">
                        {patternData.indicators.ma5.toLocaleString()}원
                      </Typography>
                    </Box>
                  )}
                  {patternData.indicators.ma20 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>MA20 (20일 이동평균):</Typography>
                      <Typography fontWeight="bold">
                        {patternData.indicators.ma20.toLocaleString()}원
                      </Typography>
                    </Box>
                  )}
                  {patternData.indicators.ma60 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>MA60 (60일 이동평균):</Typography>
                      <Typography fontWeight="bold">
                        {patternData.indicators.ma60.toLocaleString()}원
                      </Typography>
                    </Box>
                  )}
                  {patternData.indicators.rsi && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>RSI:</Typography>
                      <Typography fontWeight="bold">
                        {patternData.indicators.rsi.toFixed(1)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ML 피처 */}
          {mlData && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    ML 피처 분석
                  </Typography>
                  <Typography variant="body2" paragraph>
                    총 {mlData.features.total}개 피처 중 {mlData.features.selected}개 선택
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      상위 15개 중요 피처:
                    </Typography>
                    {mlData.features.top_features.map((feature, index) => (
                      <Box
                        key={feature.name}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          py: 0.5
                        }}
                      >
                        <Typography variant="caption" sx={{ minWidth: 20 }}>
                          {index + 1}.
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={feature.importance * 100}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: 80 }}>
                          {feature.importance.toFixed(4)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* 최신 지표 */}
          {mlData && mlData.latest_indicators && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    최신 거래일 기반 지표
                  </Typography>
                  <Grid container spacing={2}>
                    {mlData.latest_indicators.momentum_5d !== null && (
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          5일 모멘텀
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {mlData.latest_indicators.momentum_5d >= 0 ? '+' : ''}
                          {mlData.latest_indicators.momentum_5d.toFixed(2)}%
                        </Typography>
                      </Grid>
                    )}
                    {mlData.latest_indicators.momentum_20d !== null && (
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          20일 모멘텀
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {mlData.latest_indicators.momentum_20d >= 0 ? '+' : ''}
                          {mlData.latest_indicators.momentum_20d.toFixed(2)}%
                        </Typography>
                      </Grid>
                    )}
                    {mlData.latest_indicators.rsi !== null && (
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          RSI
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {mlData.latest_indicators.rsi.toFixed(1)}
                        </Typography>
                      </Grid>
                    )}
                    {mlData.latest_indicators.volume_ratio !== null && (
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          거래량 비율
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {mlData.latest_indicators.volume_ratio.toFixed(2)}x
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default PatternAnalysis;
