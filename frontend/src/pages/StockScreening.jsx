/**
 * 키움증권 검색식(스크리닝) 설정 화면
 *
 * 기능:
 * 1. 다양한 조건으로 종목 1차 필터링
 * 2. 프리셋 검색식 선택
 * 3. 필터링 결과 실시간 모니터링 자동 연계
 * 4. 검색식 저장/불러오기
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Slider,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Search,
  Save,
  PlayArrow,
  Add,
  ExpandMore,
  Tune,
  CheckCircle,
  TrendingUp
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/kiwoom/screening';

function StockScreening() {
  const navigate = useNavigate();
  const [conditions, setConditions] = useState({
    market: [],
    priceRange: [0, 1000000],
    marketCapMin: 0,
    volumeMin: 0,
    p1ScoreMin: 0,
    p2ScoreMin: 0,
    p3ScoreMin: 0,
    totalScoreMin: 50,
    sectors: [],
    excludeStocks: true
  });

  const [presets, setPresets] = useState([]);
  const [screeningResults, setScreeningResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [screeningName, setScreeningName] = useState('새 검색식');
  const [autoMonitor, setAutoMonitor] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedScreenings, setSavedScreenings] = useState([]);

  // 프리셋 로드
  useEffect(() => {
    fetchPresets();
    fetchSavedScreenings();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await axios.get(`${API_BASE}/presets/`);
      setPresets(response.data.presets);
    } catch (error) {
      console.error('프리셋 로드 오류:', error);
    }
  };

  const fetchSavedScreenings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/saved/`);
      setSavedScreenings(response.data.screenings || []);
    } catch (error) {
      console.error('저장된 검색식 로드 오류:', error);
    }
  };

  const handleScreening = async () => {
    setLoading(true);
    try {
      const requestData = {
        conditions: {
          market: conditions.market.length > 0 ? conditions.market : undefined,
          price_range: conditions.priceRange,
          market_cap_min: conditions.marketCapMin || undefined,
          volume_min: conditions.volumeMin || undefined,
          p1_score_min: conditions.p1ScoreMin || undefined,
          p2_score_min: conditions.p2ScoreMin || undefined,
          p3_score_min: conditions.p3ScoreMin || undefined,
          total_score_min: conditions.totalScoreMin,
          sectors: conditions.sectors.length > 0 ? conditions.sectors : undefined,
          exclude_stocks: conditions.excludeStocks
        },
        auto_monitor: autoMonitor,
        name: screeningName
      };

      const response = await axios.post(`${API_BASE}/search/`, requestData);
      setScreeningResults(response.data.results);

      // 자동 모니터링 설정
      if (autoMonitor && response.data.results.length > 0) {
        await setupAutoMonitor(response.data.results);

        // 실시간 모니터링 화면으로 자동 이동
        // tickers를 쿼리 파라미터로 전달
        const tickers = response.data.results.map(r => r.ticker).join(',');
        navigate(`/realtime-monitor?tickers=${tickers}&screening=${encodeURIComponent(screeningName)}`);
      }

    } catch (error) {
      console.error('검색식 실행 오류:', error);
      alert('검색식 실행 실패: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const setupAutoMonitor = async (results) => {
    try {
      const tickers = results.map(r => r.ticker);
      await axios.post(`${API_BASE}/auto-monitor/`, {
        tickers: tickers,
        screening_name: screeningName
      });
    } catch (error) {
      console.error('자동 모니터링 설정 오류:', error);
    }
  };

  const applyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setScreeningName(preset.name);

    // 조건 적용
    const presetConditions = preset.conditions;
    setConditions(prev => ({
      ...prev,
      market: presetConditions.market || [],
      priceRange: presetConditions.price_range || [0, 1000000],
      marketCapMin: presetConditions.market_cap_min || 0,
      volumeMin: presetConditions.volume_min || 0,
      p1ScoreMin: presetConditions.p1_score_min || 0,
      p2ScoreMin: presetConditions.p2_score_min || 0,
      p3ScoreMin: presetConditions.p3_score_min || 0,
      totalScoreMin: presetConditions.total_score_min || 50,
      sectors: presetConditions.sectors || [],
      excludeStocks: presetConditions.exclude_stocks !== false
    }));
  };

  const saveScreening = async () => {
    try {
      const response = await axios.post(`${API_BASE}/saved/`, {
        name: screeningName,
        conditions: {
          market: conditions.market.length > 0 ? conditions.market : undefined,
          price_range: conditions.priceRange,
          market_cap_min: conditions.marketCapMin || undefined,
          volume_min: conditions.volumeMin || undefined,
          p1_score_min: conditions.p1ScoreMin || undefined,
          p2_score_min: conditions.p2ScoreMin || undefined,
          p3_score_min: conditions.p3ScoreMin || undefined,
          total_score_min: conditions.totalScoreMin,
          sectors: conditions.sectors.length > 0 ? conditions.sectors : undefined,
          exclude_stocks: conditions.excludeStocks
        }
      });

      alert('검색식이 저장되었습니다!');
      setSaveDialogOpen(false);
      fetchSavedScreenings();

    } catch (error) {
      console.error('검색식 저장 오류:', error);
      alert('저장 실패: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🔍 종목 검색식 (스크리닝)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          다양한 조건으로 종목을 1차 필터링하고 실시간 모니터링에 자동 연계
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 왼쪽: 조건 설정 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                ⚙️ 검색 조건 설정
              </Typography>

              {/* 프리셋 선택 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  프리셋 선택
                </Typography>
                <Select
                  fullWidth
                  value={selectedPreset}
                  onChange={(e) => {
                    const preset = presets.find(p => p.id === e.target.value);
                    if (preset) applyPreset(preset);
                  }}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>직접 설정</em>
                  </MenuItem>
                  {presets.map(preset => (
                    <MenuItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 시장 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  시장
                </Typography>
                <ToggleButtonGroup
                  value={conditions.market}
                  onChange={(e, newVal) => setConditions({ ...conditions, market: newVal })}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="KOSPI">KOSPI</ToggleButton>
                  <ToggleButton value="KOSDAQ">KOSDAQ</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* 가격대 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  가격대: {conditions.priceRange[0].toLocaleString()}원 ~ {conditions.priceRange[1].toLocaleString()}원
                </Typography>
                <Slider
                  value={conditions.priceRange}
                  onChange={(e, newVal) => setConditions({ ...conditions, priceRange: newVal })}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000000}
                  step={1000}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 100000, label: '10만' },
                    { value: 500000, label: '50만' },
                    { value: 1000000, label: '100만' }
                  ]}
                />
              </Box>

              {/* 최소 시가총액 */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="최소 시가총액 (억원)"
                  type="number"
                  value={conditions.marketCapMin}
                  onChange={(e) => setConditions({ ...conditions, marketCapMin: parseInt(e.target.value) || 0 })}
                  fullWidth
                  size="small"
                  helperText="예: 1000 (1천억 이상)"
                />
              </Box>

              {/* 최소 거래량 */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="최소 거래량 (주)"
                  type="number"
                  value={conditions.volumeMin}
                  onChange={(e) => setConditions({ ...conditions, volumeMin: parseInt(e.target.value) || 0 })}
                  fullWidth
                  size="small"
                  helperText="예: 100000 (10만주 이상)"
                />
              </Box>

              {/* 점수 조건 */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">
                    📊 패턴 점수 조건
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        label="P1 최소점"
                        type="number"
                        value={conditions.p1ScoreMin}
                        onChange={(e) => setConditions({ ...conditions, p1ScoreMin: parseInt(e.target.value) || 0 })}
                        fullWidth
                        size="small"
                        inputProps={{ min: 0, max: 50 }}
                        helperText="/ 50"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="P2 최소점"
                        type="number"
                        value={conditions.p2ScoreMin}
                        onChange={(e) => setConditions({ ...conditions, p2ScoreMin: parseInt(e.target.value) || 0 })}
                        fullWidth
                        size="small"
                        inputProps={{ min: 0, max: 40 }}
                        helperText="/ 40"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="P3 최소점"
                        type="number"
                        value={conditions.p3ScoreMin}
                        onChange={(e) => setConditions({ ...conditions, p3ScoreMin: parseInt(e.target.value) || 0 })}
                        fullWidth
                        size="small"
                        inputProps={{ min: 0, max: 10 }}
                        helperText="/ 10"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="총점 최소점"
                        type="number"
                        value={conditions.totalScoreMin}
                        onChange={(e) => setConditions({ ...conditions, totalScoreMin: parseInt(e.target.value) || 0 })}
                        fullWidth
                        size="small"
                        inputProps={{ min: 0, max: 100 }}
                        helperText="/ 100"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 기타 조건 */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={conditions.excludeStocks}
                    onChange={(e) => setConditions({ ...conditions, excludeStocks: e.target.checked })}
                  />
                }
                label="관리주 제외"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={autoMonitor}
                    onChange={(e) => setAutoMonitor(e.target.checked)}
                  />
                }
                label="검색 결과 자동 실시간 모니터링"
              />

              {/* 검색식 이름 */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <TextField
                  label="검색식 이름"
                  value={screeningName}
                  onChange={(e) => setScreeningName(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Box>

              {/* 버튼들 */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleScreening}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? '검색 중...' : '검색 실행'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={() => setSaveDialogOpen(true)}
                >
                  저장
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 오른쪽: 결과 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  📋 검색 결과 ({screeningResults.length}종목)
                </Typography>
                {autoMonitor && screeningResults.length > 0 && (
                  <Chip
                    icon={<CheckCircle />}
                    label="자동 모니터링 설정됨"
                    color="success"
                    size="small"
                  />
                )}
              </Box>

              {screeningResults.length === 0 ? (
                <Alert severity="info">
                  검색 조건을 설정하고 [검색 실행] 버튼을 클릭하세요
                </Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>종목코드</TableCell>
                        <TableCell>종목명</TableCell>
                        <TableCell align="right">현재가</TableCell>
                        <TableCell align="center">P1</TableCell>
                        <TableCell align="center">P2</TableCell>
                        <TableCell align="center">P3</TableCell>
                        <TableCell align="center">총점</TableCell>
                        <TableCell align="center">Signal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {screeningResults.map((result) => (
                        <TableRow
                          key={result.ticker}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => window.open(`/pattern-analysis?ticker=${result.ticker}`, '_blank')}
                        >
                          <TableCell>{result.ticker}</TableCell>
                          <TableCell>{result.name}</TableCell>
                          <TableCell align="right">
                            {result.price?.toLocaleString()}원
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color={result.p1_score >= 35 ? 'error' : 'inherit'}>
                              {result.p1_score.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color={result.p2_score >= 25 ? 'warning' : 'inherit'}>
                              {result.p2_score.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {result.p3_score.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold">
                              {result.total_score.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {result.start_signal ? (
                              <Chip
                                icon={<TrendingUp />}
                                label="ON"
                                color="error"
                                size="small"
                              />
                            ) : (
                              <Chip label="OFF" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 저장 대화상자 */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>검색식 저장</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="검색식 이름"
            fullWidth
            variant="outlined"
            value={screeningName}
            onChange={(e) => setScreeningName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>취소</Button>
          <Button onClick={saveScreening} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default StockScreening;
