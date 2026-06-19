import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import axios from 'axios';
import {
  startBatchAnalysis,
  getBatchAnalysisSummary,
  getTopPatterns
} from '../services/api';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function BatchPatternAnalysis() {
  const [tabValue, setTabValue] = useState(0);

  // 분석 설정
  const [market, setMarket] = useState('all');
  const [timeframe, setTimeframe] = useState('daily');
  const [analysisDate, setAnalysisDate] = useState('');
  const [useMock, setUseMock] = useState(true);

  // 분석 상태
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // 결과 데이터
  const [summary, setSummary] = useState(null);
  const [topP1, setTopP1] = useState([]);
  const [topP2, setTopP2] = useState([]);
  const [topP3, setTopP3] = useState([]);

  const API_BASE = 'http://localhost:8000/api/patterns';

  // 오늘 날짜 설정
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setAnalysisDate(today);
    loadResults();
  }, []);

  // 결과 로드
  const loadResults = async () => {
    try {
      const summaryRes = await getBatchAnalysisSummary(analysisDate);
      setSummary(summaryRes.data.summary);

      const p1Res = await getTopPatterns({ date: analysisDate, pattern: 'P1', limit: 10 });
      setTopP1(p1Res.data.results || []);

      const p2Res = await getTopPatterns({ date: analysisDate, pattern: 'P2', limit: 10 });
      setTopP2(p2Res.data.results || []);

      const p3Res = await getTopPatterns({ date: analysisDate, pattern: 'P3', limit: 10 });
      setTopP3(p3Res.data.results || []);
    } catch (error) {
      console.error('Failed to load results:', error);
    }
  };

  // 분석 시작
  const handleStartAnalysis = async () => {
    if (!market) {
      alert('시장을 선택해주세요.');
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await startBatchAnalysis({
        market,
        timeframe,
        analysis_date: analysisDate || undefined,
        use_mock: useMock
      });

      if (response.data.success) {
        setAnalysisResult(response.data.results);
        // 결과 재로드
        setTimeout(loadResults, 1000);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult({
        error: error.response?.data?.error || error.message
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        📊 전체 종목 패턴 분석
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        전체 종목의 데이터를 수집하고 패턴 1/2/3을 자동으로 분석합니다.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
        >
          <Tab label="분석 실행" />
          <Tab label="결과 요약" />
          <Tab label="상위 종목" />
        </Tabs>

        {/* 분석 실행 탭 */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    분석 설정
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>시장</InputLabel>
                        <Select
                          value={market}
                          label="시장"
                          onChange={(e) => setMarket(e.target.value)}
                        >
                          <MenuItem value="all">전체</MenuItem>
                          <MenuItem value="kospi">KOSPI</MenuItem>
                          <MenuItem value="kosdaq">KOSDAQ</MenuItem>
                          <MenuItem value="nasdaq">NASDAQ</MenuItem>
                          <MenuItem value="nyse">NYSE</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>타임프레임</InputLabel>
                        <Select
                          value={timeframe}
                          label="타임프레임"
                          onChange={(e) => setTimeframe(e.target.value)}
                        >
                          <MenuItem value="daily">일봉</MenuItem>
                          <MenuItem value="weekly">주봉</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="date"
                        label="분석 일자"
                        value={analysisDate}
                        onChange={(e) => setAnalysisDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<StartIcon />}
                        onClick={handleStartAnalysis}
                        disabled={analyzing}
                        size="large"
                      >
                        {analyzing ? '분석 중...' : '분석 시작'}
                      </Button>
                    </Grid>
                  </Grid>

                  {analyzing && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>분석 진행 중...</Typography>
                    </Box>
                  )}

                  {analysisResult && !analyzing && (
                    <Alert
                      severity={analysisResult.error ? 'error' : 'success'}
                      sx={{ mt: 2 }}
                    >
                      {analysisResult.error ? (
                        <Typography variant="body2">{analysisResult.error}</Typography>
                      ) : (
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            분석 완료!
                          </Typography>
                          <Typography variant="caption">
                            총 {analysisResult.analyzed}개 종목 분석 완료
                            (P1: {analysisResult.pattern1_found}, P2: {analysisResult.pattern2_found}, P3: {analysisResult.pattern3_found})
                          </Typography>
                        </Box>
                      )}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    분석 정보
                  </Typography>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>일괄 분석 기능</strong>
                    </Typography>
                    <Typography variant="caption" component="div">
                      • 전체 종목의 OHLCV 데이터 자동 수집<br/>
                      • 패턴 1/2/3 자동 분석<br/>
                      • 상위 점수 종목 자동 추출<br/>
                      • 실시간 결과 대시보드
                    </Typography>
                  </Alert>

                  <Typography variant="body2" color="text.secondary">
                    <strong>분석 프로세스:</strong>
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" component="div">
                      1. 종목 목록 로드<br/>
                      2. 각 종목별 OHLCV 데이터 수집<br/>
                      3. 패턴 1 분석 (V자 반전)<br/>
                      4. 패턴 2 분석 (상승 추세)<br/>
                      5. 패턴 3 분석 (하락 추진)<br/>
                      6. 결과 저장 및 통계 생성
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 결과 요약 탭 */}
        <TabPanel value={tabValue} index={1}>
          {summary ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      총 평가 수
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {summary.total_evaluations || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      패턴 1 발견
                    </Typography>
                    <Typography variant="h3" color="success">
                      {summary.by_pattern?.P1?.total || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      시작 신호: {summary.by_pattern?.P1?.start_signals || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      패턴 2 발견
                    </Typography>
                    <Typography variant="h3" color="info">
                      {summary.by_pattern?.P2?.total || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      시작 신호: {summary.by_pattern?.P2?.start_signals || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      상위 점수 종목
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>티커</TableCell>
                            <TableCell>종목명</TableCell>
                            <TableCell>패턴</TableCell>
                            <TableCell>점수</TableCell>
                            <TableCell>신호</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {summary.top_scoring?.slice(0, 20).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.ticker}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>
                                <Chip
                                  label={item.pattern_type}
                                  size="small"
                                  color={item.pattern_type === 'P1' ? 'success' : item.pattern_type === 'P2' ? 'info' : 'warning'}
                                />
                              </TableCell>
                              <TableCell>{item.score}</TableCell>
                              <TableCell>
                                {item.start_signal && (
                                  <Chip label="시작" size="small" color="success" />
                                )}
                                {item.risk_signal && (
                                  <Chip label="위험" size="small" color="error" />
                                )}
                                {item.sell_signal && (
                                  <Chip label="매도" size="small" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              분석 결과가 없습니다. '분석 실행' 탭에서 분석을 시작하세요.
            </Alert>
          )}
        </TabPanel>

        {/* 상위 종목 탭 */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    패턴 1 상위 종목 (V자 반전)
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>티커</TableCell>
                          <TableCell>종목명</TableCell>
                          <TableCell>거래소</TableCell>
                          <TableCell>점수</TableCell>
                          <TableCell>시작 신호</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topP1.map((stock, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{stock.ticker}</TableCell>
                            <TableCell>{stock.name}</TableCell>
                            <TableCell>{stock.exchange}</TableCell>
                            <TableCell>
                              <Chip
                                label={stock.score}
                                color={stock.score >= 80 ? 'success' : stock.score >= 70 ? 'info' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {stock.start_signal ? (
                                <Chip label="매수" color="success" size="small" />
                              ) : (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    패턴 2 상위 종목 (상승 추세)
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>티커</TableCell>
                          <TableCell>종목명</TableCell>
                          <TableCell>거래소</TableCell>
                          <TableCell>점수</TableCell>
                          <TableCell>시작 신호</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topP2.map((stock, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{stock.ticker}</TableCell>
                            <TableCell>{stock.name}</TableCell>
                            <TableCell>{stock.exchange}</TableCell>
                            <TableCell>
                              <Chip
                                label={stock.score}
                                color={stock.score >= 80 ? 'success' : stock.score >= 70 ? 'info' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {stock.start_signal ? (
                                <Chip label="매수" color="success" size="small" />
                              ) : (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    패턴 3 상위 종목 (하락 저지)
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>티커</TableCell>
                          <TableCell>종목명</TableCell>
                          <TableCell>거래소</TableCell>
                          <TableCell>점수</TableCell>
                          <TableCell>시작 신호</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topP3.map((stock, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{stock.ticker}</TableCell>
                            <TableCell>{stock.name}</TableCell>
                            <TableCell>{stock.exchange}</TableCell>
                            <TableCell>
                              <Chip
                                label={stock.score}
                                color={stock.score >= 80 ? 'success' : stock.score >= 70 ? 'info' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {stock.start_signal ? (
                                <Chip label="매수" color="success" size="small" />
                              ) : (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default BatchPatternAnalysis;
