import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getSymbols } from '../services/api';

function AnalysisRunner() {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    setLoading(true);
    try {
      const response = await getSymbols();
      setSymbols(response.data.results || response.data);
    } catch (error) {
      console.error('종목 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    
    // 실제로는 backend API 호출 (아직 미구현)
    setTimeout(() => {
      setResults({
        total: 10,
        pattern1: 3,
        pattern2: 4,
        pattern3: 2,
        highScore: 5
      });
      setAnalyzing(false);
    }, 3000);
  };

  const getCommandLine = () => {
    let cmd = 'python manage.py evaluate_patterns';
    if (selectedSymbol !== 'all') {
      cmd += ` --ticker ${selectedSymbol}`;
    }
    if (minScore > 0) {
      cmd += ` --min-score ${minScore}`;
    }
    return cmd;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🚀 패턴 분석 실행
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Step 3:</strong> Pattern 1/2/3 분석을 실행합니다.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              분석 옵션 설정
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>종목 선택</InputLabel>
                  <Select
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="all">전체 종목</MenuItem>
                    {symbols.map((symbol) => (
                      <MenuItem key={symbol.id} value={symbol.ticker}>
                        {symbol.ticker} - {symbol.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="최소 점수"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  helperText="0-100점 (0이면 전체)"
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
            </Grid>

            <Box mt={4}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PlayIcon />}
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? '분석 중...' : '분석 실행'}
              </Button>
            </Box>

            {analyzing && (
              <Box mt={2}>
                <LinearProgress />
                <Typography variant="body2" color="textSecondary" textAlign="center" mt={1}>
                  Pattern 1/2/3 분석 진행 중...
                </Typography>
              </Box>
            )}

            {results && (
              <Box mt={3}>
                <Alert severity="success" icon={<CheckIcon />}>
                  <Typography variant="h6">
                    분석 완료!
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Chip label={`총 ${results.total}개 평가`} color="primary" />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip label={`고득점 ${results.highScore}개`} color="success" />
                    </Grid>
                    <Grid item xs={4}>
                      <Chip label={`P1: ${results.pattern1}개`} />
                    </Grid>
                    <Grid item xs={4}>
                      <Chip label={`P2: ${results.pattern2}개`} />
                    </Grid>
                    <Grid item xs={4}>
                      <Chip label={`P3: ${results.pattern3}개`} />
                    </Grid>
                  </Grid>
                </Alert>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 분석 프로세스
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" gutterBottom>
                  OHLCV 데이터 로드
                </Typography>
                <Typography component="li" variant="body2" gutterBottom>
                  기술적 지표 계산
                </Typography>
                <Typography component="li" variant="body2" gutterBottom>
                  Pattern 1/2/3 판별
                </Typography>
                <Typography component="li" variant="body2" gutterBottom>
                  체크리스트 점수화
                </Typography>
                <Typography component="li" variant="body2" gutterBottom>
                  트리거 분석
                </Typography>
                <Typography component="li" variant="body2" gutterBottom>
                  결과 저장
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⏱️ 예상 시간
              </Typography>
              <Typography variant="body2">
                • 종목당 약 1-2초
                <br />
                • 100개 종목: 약 2-3분
                <br />
                • 1000개 종목: 약 20-30분
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>CLI 명령어:</strong>
        </Typography>
        <Box component="pre" sx={{ mt: 1, backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
{`cd backend
${getCommandLine()}`}
        </Box>
      </Alert>

      <Box mt={4}>
        <Alert severity="success">
          <Typography variant="body2">
            💡 <strong>다음 단계:</strong> 분석이 완료되었다면 
            <strong> "3. 패턴 분석" → "전체 결과"</strong> 메뉴에서 결과를 확인하세요.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}

export default AnalysisRunner;
