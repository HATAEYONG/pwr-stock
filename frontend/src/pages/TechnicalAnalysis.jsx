/**
 * 기술적 분석 페이지
 * 이동평균선 기반 차트 분석 및 ML 예측
 */
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  ShowChart,
  TrendingUp,
  TrendingDown,
  Analytics,
  AutoAwesome,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// ChartJS 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = 'http://localhost:8000/api';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function TechnicalAnalysis() {
  const [tabValue, setTabValue] = useState(0);

  // 종목 검색 상태
  const [symbol, setSymbol] = useState('047770');
  const [symbolInfo, setSymbolInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // 이동평균선 설정
  const [maPeriods, setMaPeriods] = useState([5, 20, 60, 120]);
  const [showMA, setShowMA] = useState([true, true, true, false]);
  const [timeframe, setTimeframe] = useState('daily');

  // 차트 데이터
  const [chartData, setChartData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // ML 예측 상태
  const [mlPrediction, setMlPrediction] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  // 기술적 지표
  const [indicators, setIndicators] = useState({
    rsi: null,
    macd: null,
    volume: null
  });

  // 종목 정보 조회
  const fetchSymbolInfo = async () => {
    if (!symbol) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/symbols/?ticker=${symbol}`);
      if (response.data.results && response.data.results.length > 0) {
        setSymbolInfo(response.data.results[0]);
        fetchChartData();
      } else {
        alert('종목을 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('종목 조회 오류:', error);
      alert('종목 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // 차트 데이터 조회
  const fetchChartData = async () => {
    if (!symbol) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE}/ohlcv/?symbol__ticker=${symbol}&timeframe=${timeframe}&ordering=-date&limit=250`
      );

      const ohlcvData = response.data.results || [];
      if (ohlcvData.length === 0) {
        alert('데이터가 없습니다');
        setLoading(false);
        return;
      }

      // 데이터 정렬 (오름차순)
      const sortedData = [...ohlcvData].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      );

      // 이동평균선 계산
      const maData = calculateMovingAverages(sortedData);

      // 차트 데이터 생성
      const chartDataset = createChartDataset(sortedData, maData);

      setChartData(chartDataset);
      analyzeTrend(sortedData, maData);
      calculateIndicators(sortedData);

    } catch (error) {
      console.error('차트 데이터 조회 오류:', error);
      alert('데이터 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // 이동평균선 계산
  const calculateMovingAverages = (data) => {
    const mas = {};

    maPeriods.forEach((period, index) => {
      if (!showMA[index]) return;

      const maValues = [];
      for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1)
          .reduce((acc, d) => acc + d.close_price, 0);
        maValues.push({
          date: data[i].date,
          value: sum / period
        });
      }
      mas[`MA${period}`] = maValues;
    });

    return mas;
  };

  // 차트 데이터셋 생성
  const createChartDataset = (data, maData) => {
    const labels = data.map(d => d.date);
    const closePrices = data.map(d => d.close_price);

    const datasets = [
      {
        label: '종가',
        data: closePrices,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5
      }
    ];

    // 이동평균선 추가
    const colors = ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)', 'rgb(153, 102, 255)'];
    maPeriods.forEach((period, index) => {
      if (!showMA[index] || !maData[`MA${period}`]) return;

      const maKey = `MA${period}`;
      const maValues = maData[maKey];

      // 데이터 매핑 (NaN으로 빈 공간 채우기)
      const maDataset = new Array(data.length).fill(null);
      maValues.forEach(ma => {
        const index = data.findIndex(d => d.date === ma.date);
        if (index !== -1) {
          maDataset[index] = ma.value;
        }
      });

      datasets.push({
        label: maKey,
        data: maDataset,
        borderColor: colors[index],
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 3
      });
    });

    return {
      labels,
      datasets
    };
  };

  // 추세 분석
  const analyzeTrend = (data, maData) => {
    if (data.length < 20) return;

    const latest = data[data.length - 1];
    const prev = data[data.length - 2];

    // 현재가와 이동평균선 비교
    const maComparison = {};
    maPeriods.forEach((period, index) => {
      if (!showMA[index] || !maData[`MA${period}`]) return;
      const maValues = maData[`MA${period}`];
      if (maValues.length > 0) {
        const latestMA = maValues[maValues.length - 1].value;
        maComparison[`MA${period}`] = {
          value: latestMA,
          position: latest.close_price > latestMA ? '상위' : '하위',
          diff: ((latest.close_price - latestMA) / latestMA * 100).toFixed(2)
        };
      }
    });

    // 추세 판정
    let trend = '횡보';
    if (maData.MA5 && maData.MA20) {
      const ma5 = maData.MA5[maData.MA5.length - 1].value;
      const ma20 = maData.MA20[maData.MA20.length - 1].value;

      if (ma5 > ma20 && latest.close_price > ma5) {
        trend = '상승';
      } else if (ma5 < ma20 && latest.close_price < ma5) {
        trend = '하락';
      }
    }

    setAnalysisResult({
      currentPrice: latest.close_price,
      change: ((latest.close_price - prev.close_price) / prev.close_price * 100).toFixed(2),
      trend,
      maComparison
    });
  };

  // 기술적 지표 계산
  const calculateIndicators = (data) => {
    if (data.length < 14) return;

    // RSI 계산 (14일)
    const rsiPeriod = 14;
    let gains = 0, losses = 0;

    for (let i = data.length - rsiPeriod; i < data.length; i++) {
      const change = data[i].close_price - data[i - 1].close_price;
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / rsiPeriod;
    const avgLoss = losses / rsiPeriod;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    setIndicators({
      rsi: rsi.toFixed(2),
      rsiSignal: rsi > 70 ? '과매수' : rsi < 30 ? '과매도' : '중립'
    });
  };

  // ML 예측 요청
  const fetchMLPrediction = async () => {
    if (!symbol) {
      alert('종목을 선택해주세요');
      return;
    }

    setMlLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/ml/predict-lstm/`, {
        symbol: symbol,
        days: 5  // 5일 예측
      });

      setMlPrediction(response.data);
    } catch (error) {
      console.error('ML 예측 오류:', error);
      alert('ML 예측 실패: ' + (error.response?.data?.error || error.message));
    } finally {
      setMlLoading(false);
    }
  };

  // 이동평균선 토글
  const handleMAToggle = (index) => {
    const newShowMA = [...showMA];
    newShowMA[index] = !newShowMA[index];
    setShowMA(newShowMA);

    // 데이터 재계산
    if (chartData) {
      fetchChartData();
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${symbolInfo?.name || ''} (${symbol}) - ${timeframe === 'daily' ? '일봉' : '주봉'} 차트`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}원`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 10
        }
      },
      y: {
        position: 'right',
        ticks: {
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📊 기술적 분석
        </Typography>
        <Typography variant="body2" color="text.secondary">
          이동평균선 기반 차트 분석 및 ML 예측
        </Typography>
      </Box>

      {/* 종목 검색 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                label="종목 코드"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                fullWidth
                placeholder="047770"
              />
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>타임프레임</InputLabel>
                <Select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  label="타임프레임"
                >
                  <MenuItem value="daily">일봉</MenuItem>
                  <MenuItem value="weekly">주봉</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <Button
                variant="contained"
                startIcon={<ShowChart />}
                onClick={fetchSymbolInfo}
                disabled={loading}
                fullWidth
              >
                {loading ? '분석 중...' : '분석 시작'}
              </Button>
            </Grid>

            <Grid item xs={12} sm={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<AutoAwesome />}
                onClick={fetchMLPrediction}
                disabled={mlLoading || !symbol}
                fullWidth
              >
                {mlLoading ? '예측 중...' : 'ML 예측'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 탭 */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="📈 차트 분석" />
            <Tab label="📊 기술적 지표" />
            <Tab label="🤖 ML 예측" />
          </Tabs>
        </Box>

        {/* 차트 분석 탭 */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            {/* 이동평균선 토글 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                이동평균선 표시
              </Typography>
              <ToggleButtonGroup value={maPeriods.filter((_, i) => showMA[i])}>
                {maPeriods.map((period, index) => (
                  <ToggleButton
                    key={period}
                    value={period}
                    selected={showMA[index]}
                    onClick={() => handleMAToggle(index)}
                  >
                    MA{period}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* 차트 */}
            {chartData ? (
              <Box sx={{ height: 500, mb: 3 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            ) : (
              <Alert severity="info">
                종목을 선택하고 '분석 시작' 버튼을 클릭하세요
              </Alert>
            )}

            {/* 분석 결과 */}
            {analysisResult && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  분석 결과
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          현재가
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {analysisResult.currentPrice.toLocaleString()}원
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          전일 대비
                        </Typography>
                        <Typography variant="h5" fontWeight="bold"
                          color={parseFloat(analysisResult.change) >= 0 ? 'error' : 'primary'}>
                          {parseFloat(analysisResult.change) >= 0 ? '+' : ''}{analysisResult.change}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          추세
                        </Typography>
                        <Chip
                          icon={analysisResult.trend === '상승' ? <TrendingUp /> :
                                analysisResult.trend === '하락' ? <TrendingDown /> : <Analytics />}
                          label={analysisResult.trend}
                          color={analysisResult.trend === '상승' ? 'error' :
                                 analysisResult.trend === '하락' ? 'primary' : 'default'}
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          RSI
                        </Typography>
                        <Typography variant="h5" fontWeight="bold"
                          color={indicators.rsiSignal === '과매수' ? 'error' :
                                 indicators.rsiSignal === '과매도' ? 'primary' : 'text.primary'}>
                          {indicators.rsi || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {indicators.rsiSignal || '-'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* 이동평균선 비교 */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                    이동평균선 비교
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>이동평균선</TableCell>
                          <TableCell align="right">값</TableCell>
                          <TableCell align="center">위치</TableCell>
                          <TableCell align="right">괴리율</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(analysisResult.maComparison).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell align="right">
                              {value.value.toLocaleString()}원
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={value.position}
                                size="small"
                                color={value.position === '상위' ? 'error' : 'primary'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {value.diff > 0 ? '+' : ''}{value.diff}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            )}
          </CardContent>
        </TabPanel>

        {/* 기술적 지표 탭 */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              기술적 지표 상세
            </Typography>

            {indicators.rsi ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        RSI (상대강도지수)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ mr: 2 }}>
                          {indicators.rsi}
                        </Typography>
                        <Chip
                          label={indicators.rsiSignal}
                          color={indicators.rsiSignal === '과매수' ? 'error' :
                                 indicators.rsiSignal === '과매도' ? 'success' : 'default'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        • 70 이상: 과매수 (매도 고려)<br />
                        • 30 이하: 과매도 (매수 고려)<br />
                        • 30-70: 중립 구간
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                데이터가 부족하여 지표를 계산할 수 없습니다 (최소 14일 데이터 필요)
              </Alert>
            )}
          </CardContent>
        </TabPanel>

        {/* ML 예측 탭 */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              AI 기반 가격 예측 (LSTM)
            </Typography>

            {mlPrediction ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      ⚠️ ML 예측은 참고용이며, 실제 투자 결정에 활용할 때는 신중하게 검토해야 합니다.
                    </Typography>
                  </Alert>

                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        예측 결과
                      </Typography>

                      {mlPrediction.predictions ? (
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>날짜</TableCell>
                                <TableCell align="right">예측가</TableCell>
                                <TableCell align="right">변동률</TableCell>
                                <TableCell align="center">신뢰도</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {mlPrediction.predictions.map((pred, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{pred.date}</TableCell>
                                  <TableCell align="right">
                                    {pred.predicted_price?.toLocaleString()}원
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography
                                      variant="body2"
                                      color={pred.change_percent >= 0 ? 'error' : 'primary'}
                                    >
                                      {pred.change_percent >= 0 ? '+' : ''}{pred.change_percent}%
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={`${pred.confidence || 'N/A'}%`}
                                      size="small"
                                      color={pred.confidence >= 80 ? 'success' :
                                             pred.confidence >= 60 ? 'warning' : 'default'}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="warning">
                          예측 데이터가 없습니다
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                'ML 예측' 버튼을 클릭하여 AI 기반 가격 예측을 실행하세요
              </Alert>
            )}
          </CardContent>
        </TabPanel>
      </Card>
    </Container>
  );
}

export default TechnicalAnalysis;
