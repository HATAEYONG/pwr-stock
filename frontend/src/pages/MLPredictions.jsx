import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  AutoGraph,
  School,
  Refresh,
  Info
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function MLPredictions() {
  const [tabValue, setTabValue] = useState(0);
  const [predictions, setPredictions] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trainDialogOpen, setTrainDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [trainConfig, setTrainConfig] = useState({
    name: '',
    description: '',
    symbol_ids: '',
    start_date: '2023-01-01',
    end_date: '2024-12-31',
    model_type: 'CLASSIFIER',
    algorithm: 'random_forest',
    target_period: 5
  });

  const [featureImportance, setFeatureImportance] = useState([]);

  // ML 백테스팅 상태
  const [btConfig, setBtConfig] = useState({
    ticker: '', strategy: 'P1', ml_threshold: 0.55,
    start_date: '2023-01-01', end_date: '2024-12-31',
  });
  const [btResult, setBtResult] = useState(null);
  const [btLoading, setBtLoading] = useState(false);

  // 모델 레지스트리 상태
  const [registry, setRegistry] = useState({ versions: [], active_id: null });
  const [registryLoading, setRegistryLoading] = useState(false);

  useEffect(() => {
    loadModels();
    loadPredictions();
  }, []);

  const loadRegistry = async () => {
    setRegistryLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/ml/registry/`);
      setRegistry(res.data);
    } catch (e) {
      console.error('Registry load error:', e);
    } finally {
      setRegistryLoading(false);
    }
  };

  const handleActivate = async (modelId) => {
    try {
      await axios.post(`${API_BASE_URL}/ml/registry/`, { action: 'activate', model_id: modelId });
      setSuccess(`모델 ${modelId} 활성화 완료`);
      loadRegistry();
    } catch (e) {
      setError('활성화 실패: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleRollback = async () => {
    try {
      await axios.post(`${API_BASE_URL}/ml/registry/`, { action: 'rollback', type: 'CLASSIFIER' });
      setSuccess('이전 버전으로 롤백 완료');
      loadRegistry();
    } catch (e) {
      setError('롤백 실패: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleRunBacktest = async () => {
    setBtLoading(true);
    setBtResult(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/ml/backtest-ml/`, {
        ticker: btConfig.ticker,
        strategy: btConfig.strategy,
        ml_threshold: parseFloat(btConfig.ml_threshold),
        start_date: btConfig.start_date,
        end_date: btConfig.end_date,
      });
      setBtResult(res.data);
    } catch (e) {
      setError('백테스팅 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBtLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ml/models/`);
      setModels(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading models:', error);
      if (error.response?.status !== 404) {
        setError('모델 목록을 불러오는데 실패했습니다');
      }
    }
  };

  const loadPredictions = async () => {
    try {
      // Get active model
      const activeModel = await axios.get(`${API_BASE_URL}/ml/models/active/?model_type=CLASSIFIER`);

      if (activeModel.data) {
        // Get latest predictions
        const response = await axios.get(`${API_BASE_URL}/ml/predictions/latest/?model_id=${activeModel.data.id}`);

        if (response.data) {
          const formattedPredictions = response.data.map(pred => ({
            symbol: pred.symbol_ticker,
            symbol_name: pred.symbol_name,
            predicted_direction: pred.predicted_direction,
            probability: pred.probability?.UP || pred.probability?.DOWN || 0.5,
            predicted_return: pred.predicted_return || 0,
            confidence: pred.confidence
          }));
          setPredictions(formattedPredictions);

          // Extract feature importance from first prediction
          if (response.data.length > 0 && response.data[0].feature_importance) {
            const features = Object.entries(response.data[0].feature_importance)
              .map(([feature, importance]) => ({ feature, importance }))
              .sort((a, b) => b.importance - a.importance)
              .slice(0, 10);
            setFeatureImportance(features);
          }
        }
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      // Don't show error on initial load - predictions may not exist yet
    }
  };

  const handleTrainModel = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse symbol IDs
      const symbol_ids = trainConfig.symbol_ids
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      if (symbol_ids.length === 0) {
        setError('유효한 종목 ID를 입력해주세요');
        setLoading(false);
        return;
      }

      const trainData = {
        ...trainConfig,
        symbol_ids
      };

      await axios.post(`${API_BASE_URL}/ml/train/`, trainData);

      setSuccess('모델 학습이 완료되었습니다');
      setTrainDialogOpen(false);

      // Reload models and predictions
      loadModels();
      loadPredictions();

    } catch (error) {
      console.error('Error training model:', error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        '모델 학습에 실패했습니다'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeployModel = async (modelId) => {
    try {
      await axios.post(`${API_BASE_URL}/ml/models/${modelId}/deploy/`);
      setSuccess('모델이 배포되었습니다');
      loadModels();
    } catch (error) {
      console.error('Error deploying model:', error);
      setError('모델 배포에 실패했습니다');
    }
  };

  const handleRefresh = () => {
    setError(null);
    setSuccess(null);
    loadModels();
    loadPredictions();
  };

  const getDirectionIcon = (direction) => {
    if (direction === 'UP') return <TrendingUp />;
    if (direction === 'DOWN') return <TrendingDown />;
    return null;
  };

  const getDirectionLabel = (direction) => {
    if (direction === 'UP') return '상승';
    if (direction === 'DOWN') return '하락';
    return '횡보';
  };

  const getDirectionColor = (direction) => {
    if (direction === 'UP') return 'success';
    if (direction === 'DOWN') return 'error';
    return 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            AI/ML 예측
          </Typography>
          <Typography variant="body2" color="text.secondary">
            머신러닝 모델을 활용한 종목 방향 및 수익률 예측
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button
            variant="contained"
            startIcon={<School />}
            onClick={() => setTrainDialogOpen(true)}
          >
            모델 학습
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>ML 예측 기능:</strong> RandomForest, GradientBoosting, Logistic Regression 알고리즘을 지원합니다.
          LSTM 딥러닝 모델도 학습할 수 있습니다. 종목의 기술적 지표를 기반으로 향후 방향과 수익률을 예측합니다.
        </Typography>
      </Alert>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="예측 결과" />
          <Tab label="모델 관리" />
          <Tab label="Feature 중요도" />
          <Tab label="ML 백테스팅" onClick={()=>{}} />
          <Tab label="모델 레지스트리" onClick={loadRegistry} />
        </Tabs>
      </Paper>

      {/* 예측 결과 탭 */}
      {tabValue === 0 && (
        <>
          {predictions.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Psychology sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                예측 결과가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                먼저 모델을 학습시켜주세요
              </Typography>
              <Button
                variant="contained"
                startIcon={<School />}
                onClick={() => setTrainDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                모델 학습 시작
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {predictions.map((pred) => (
                <Grid item xs={12} md={6} lg={4} key={pred.symbol}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">{pred.symbol}</Typography>
                        <Chip
                          icon={getDirectionIcon(pred.predicted_direction)}
                          label={getDirectionLabel(pred.predicted_direction)}
                          color={getDirectionColor(pred.predicted_direction)}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {pred.symbol_name}
                      </Typography>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          예측 확신도
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={pred.confidence * 100}
                              color={pred.confidence > 0.7 ? 'success' : 'primary'}
                            />
                          </Box>
                          <Typography variant="body2">
                            {(pred.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          예상 수익률
                        </Typography>
                        <Typography
                          variant="h5"
                          color={pred.predicted_return >= 0 ? 'success.main' : 'error.main'}
                        >
                          {(pred.predicted_return * 100).toFixed(1)}%
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          승률 예측
                        </Typography>
                        <Typography variant="h6">
                          {(pred.probability * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* 모델 관리 탭 */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>모델명</TableCell>
                <TableCell>알고리즘</TableCell>
                <TableCell align="right">정확도</TableCell>
                <TableCell align="right">F1 Score</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="center">활성화</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {model.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {model.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={model.algorithm} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    {model.accuracy ? (model.accuracy * 100).toFixed(1) + '%' : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {model.f1_score ? model.f1_score.toFixed(3) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={model.status_display}
                      color={model.status === 'TRAINED' || model.status === 'DEPLOYED' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {model.is_active ? (
                      <Chip label="활성" color="success" size="small" />
                    ) : (
                      <Chip label="비활성" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {!model.is_active && model.status === 'TRAINED' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleDeployModel(model.id)}
                      >
                        배포
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {models.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      학습된 모델이 없습니다. '모델 학습' 버튼을 클릭하여 모델을 학습시켜주세요.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Feature 중요도 탭 */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Feature Importance
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            모델 예측에 가장 큰 영향을 미치는 기술적 지표 순위
          </Typography>
          <Paper sx={{ p: 3 }}>
            {featureImportance.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Feature 데이터가 없습니다. 모델을 학습시킨 후 확인해주세요.
              </Typography>
            ) : (
              featureImportance.map((item, index) => (
                <Box key={item.feature} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {index + 1}. {item.feature}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(item.importance * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.importance * 100}
                    color="primary"
                  />
                </Box>
              ))
            )}
          </Paper>
        </Box>
      )}

      {/* ML 백테스팅 탭 */}
      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <MLBacktestPanel
            btConfig={btConfig}
            setBtConfig={setBtConfig}
            btResult={btResult}
            btLoading={btLoading}
            onRun={handleRunBacktest}
          />
        </Paper>
      )}

      {/* 모델 레지스트리 탭 */}
      {tabValue === 4 && (
        <Paper sx={{ p: 3 }}>
          <ModelRegistryPanel
            registry={registry}
            loading={registryLoading}
            onActivate={handleActivate}
            onRollback={handleRollback}
          />
        </Paper>
      )}

      {/* 모델 학습 다이얼로그 */}
      <Dialog open={trainDialogOpen} onClose={() => setTrainDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ML 모델 학습</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body2">모델 학습 중...</Typography>
              <Typography variant="caption" color="text.secondary">
                시간이 다소 소요될 수 있습니다
              </Typography>
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                label="모델명 (선택사항)"
                value={trainConfig.name}
                onChange={(e) => setTrainConfig({ ...trainConfig, name: e.target.value })}
                sx={{ mb: 2, mt: 1 }}
                placeholder="예: Win Rate Predictor v1"
              />
              <TextField
                fullWidth
                label="설명 (선택사항)"
                value={trainConfig.description}
                onChange={(e) => setTrainConfig({ ...trainConfig, description: e.target.value })}
                sx={{ mb: 2 }}
                multiline
                rows={2}
                placeholder="모델에 대한 설명"
              />
              <TextField
                fullWidth
                label="종목 IDs (콤마 구분)"
                value={trainConfig.symbol_ids}
                onChange={(e) => setTrainConfig({ ...trainConfig, symbol_ids: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="1,2,3,4,5"
                helperText="종목 관리 페이지에서 ID 확인 가능"
              />
              <TextField
                fullWidth
                label="학습 시작일"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={trainConfig.start_date}
                onChange={(e) => setTrainConfig({ ...trainConfig, start_date: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="학습 종료일"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={trainConfig.end_date}
                onChange={(e) => setTrainConfig({ ...trainConfig, end_date: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>모델 타입</InputLabel>
                <Select
                  value={trainConfig.model_type}
                  label="모델 타입"
                  onChange={(e) => setTrainConfig({ ...trainConfig, model_type: e.target.value })}
                >
                  <MenuItem value="CLASSIFIER">분류 (승률 예측)</MenuItem>
                  <MenuItem value="REGRESSOR">회귀 (수익률 예측)</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>알고리즘</InputLabel>
                <Select
                  value={trainConfig.algorithm}
                  label="알고리즘"
                  onChange={(e) => setTrainConfig({ ...trainConfig, algorithm: e.target.value })}
                >
                  <MenuItem value="random_forest">Random Forest</MenuItem>
                  <MenuItem value="gradient_boosting">Gradient Boosting</MenuItem>
                  <MenuItem value="logistic">Logistic Regression</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="예측 기간 (일)"
                type="number"
                value={trainConfig.target_period}
                onChange={(e) => setTrainConfig({ ...trainConfig, target_period: parseInt(e.target.value) })}
                helperText="향후 N일 후의 방향/수익률 예측"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrainDialogOpen(false)} disabled={loading}>
            취소
          </Button>
          <Button onClick={handleTrainModel} variant="contained" disabled={loading || !trainConfig.symbol_ids}>
            학습 시작
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// ─── ML 백테스팅 패널 ───────────────────────────────────────────────────────
function MLBacktestPanel({ btConfig, setBtConfig, btResult, btLoading, onRun }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>ML 신호 + 패턴 결합 백테스팅</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        ML이 매수 확률 임계값 이상으로 판단한 신호만 진입 허용 — MDD와 승률 실측
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="종목코드" value={btConfig.ticker}
            onChange={e => setBtConfig({ ...btConfig, ticker: e.target.value })} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <FormControl fullWidth>
            <InputLabel>전략</InputLabel>
            <Select value={btConfig.strategy} label="전략"
              onChange={e => setBtConfig({ ...btConfig, strategy: e.target.value })}>
              <MenuItem value="P1">P1 매집형</MenuItem>
              <MenuItem value="P2">P2 추세전환</MenuItem>
              <MenuItem value="P3">P3 IPO반등</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField fullWidth label="ML 임계값" type="number"
            inputProps={{ step: 0.05, min: 0.5, max: 0.95 }}
            value={btConfig.ml_threshold}
            onChange={e => setBtConfig({ ...btConfig, ml_threshold: e.target.value })} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField fullWidth label="시작일" type="date" InputLabelProps={{ shrink: true }}
            value={btConfig.start_date}
            onChange={e => setBtConfig({ ...btConfig, start_date: e.target.value })} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField fullWidth label="종료일" type="date" InputLabelProps={{ shrink: true }}
            value={btConfig.end_date}
            onChange={e => setBtConfig({ ...btConfig, end_date: e.target.value })} />
        </Grid>
      </Grid>
      <Button variant="contained" onClick={onRun} disabled={btLoading || !btConfig.ticker}
        startIcon={btLoading ? <CircularProgress size={16} /> : <AutoGraph />}>
        {btLoading ? '실행 중...' : '백테스팅 실행'}
      </Button>

      {btResult && !btResult.error && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            {[
              { label: '총 수익률', value: `${(btResult.total_return * 100).toFixed(2)}%`, color: btResult.total_return >= 0 ? 'success.main' : 'error.main' },
              { label: 'MDD', value: `${(btResult.mdd * 100).toFixed(2)}%`, color: 'error.main' },
              { label: '승률', value: `${(btResult.win_rate * 100).toFixed(1)}%`, color: btResult.win_rate >= 0.6 ? 'success.main' : 'warning.main' },
              { label: '총 거래수', value: btResult.trade_count },
              { label: 'ML 필터 제외', value: btResult.ml_filtered_count },
              { label: '평균 손익률', value: `${(btResult.avg_pnl_pct * 100).toFixed(2)}%` },
            ].map(item => (
              <Grid item xs={6} sm={4} md={2} key={item.label}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography variant="h6" sx={{ color: item.color || 'text.primary', fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {btResult.trades?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>거래 내역 (최근 10건)</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>진입일</TableCell>
                      <TableCell>청산일</TableCell>
                      <TableCell align="right">진입가</TableCell>
                      <TableCell align="right">청산가</TableCell>
                      <TableCell align="right">손익률</TableCell>
                      <TableCell>ML확률</TableCell>
                      <TableCell>결과</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {btResult.trades.slice(-10).map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.entry_date}</TableCell>
                        <TableCell>{t.exit_date}</TableCell>
                        <TableCell align="right">{t.entry_price?.toLocaleString()}</TableCell>
                        <TableCell align="right">{t.exit_price?.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: t.pnl_pct >= 0 ? 'success.main' : 'error.main' }}>
                          {(t.pnl_pct * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell>{t.ml_prob != null ? `${(t.ml_prob * 100).toFixed(0)}%` : '-'}</TableCell>
                        <TableCell>
                          <Chip label={t.win ? '수익' : '손실'} color={t.win ? 'success' : 'error'} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      )}
      {btResult?.error && <Alert severity="error" sx={{ mt: 2 }}>{btResult.error}</Alert>}
    </Box>
  );
}

// ─── 모델 레지스트리 패널 ────────────────────────────────────────────────────
function ModelRegistryPanel({ registry, loading, onActivate, onRollback }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">모델 버전 관리</Typography>
        <Button variant="outlined" color="warning" onClick={onRollback} disabled={loading}>
          이전 버전 롤백
        </Button>
      </Box>
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>버전</TableCell>
                <TableCell align="right">정확도</TableCell>
                <TableCell align="right">F1</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>학습일</TableCell>
                <TableCell>활성</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registry.versions.map(v => (
                <TableRow key={v.id} sx={{ bgcolor: v.id === registry.active_id ? 'action.selected' : 'inherit' }}>
                  <TableCell>{v.id}</TableCell>
                  <TableCell>{v.name}</TableCell>
                  <TableCell>v{v.version}</TableCell>
                  <TableCell align="right">{v.accuracy != null ? `${(v.accuracy * 100).toFixed(1)}%` : '-'}</TableCell>
                  <TableCell align="right">{v.f1_score != null ? `${(v.f1_score * 100).toFixed(1)}%` : '-'}</TableCell>
                  <TableCell><Chip label={v.status} size="small" /></TableCell>
                  <TableCell>{v.trained_at ? new Date(v.trained_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    {v.is_active && <Chip label="활성" color="success" size="small" />}
                  </TableCell>
                  <TableCell>
                    {!v.is_active && (
                      <Button size="small" onClick={() => onActivate(v.id)}>활성화</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {registry.versions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">학습된 모델이 없습니다</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default MLPredictions;
