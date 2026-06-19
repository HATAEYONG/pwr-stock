import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  Slider,
  FormGroup,
  Checkbox,
  Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { getEvaluations } from '../services/api';
import { useNavigate } from 'react-router-dom';

function PatternSearch() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  // 검색 조건
  const [pattern, setPattern] = useState('all'); // all, P1, P2, P3
  const [minScore, setMinScore] = useState(0);
  const [exchange, setExchange] = useState({
    kosdaq: true,
    kospi: true,
    nasdaq: true,
    nyse: true
  });
  const [riskLevel, setRiskLevel] = useState({
    low: true,
    medium: true,
    high: true
  });
  const [marketCap, setMarketCap] = useState('all'); // all, small, medium, large
  const [ipo, setIpo] = useState(false); // IPO 종목만

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);

    try {
      // API 파라미터 구성
      const params = {
        min_score: minScore
      };

      // Pattern 필터
      if (pattern !== 'all') {
        params.pattern = pattern;
      }

      // 거래소 필터
      const selectedExchanges = Object.keys(exchange).filter(key => exchange[key]);
      if (selectedExchanges.length > 0 && selectedExchanges.length < 4) {
        params.exchange = selectedExchanges.join(',');
      }

      // 리스크 필터
      const selectedRisks = Object.keys(riskLevel).filter(key => riskLevel[key])
        .map(r => r.toUpperCase());
      if (selectedRisks.length > 0 && selectedRisks.length < 3) {
        params.risk = selectedRisks.join(',');
      }

      // 시가총액 필터
      if (marketCap !== 'all') {
        params.market_cap = marketCap;
      }

      // IPO 필터
      if (ipo) {
        params.ipo = true;
      }

      const response = await getEvaluations(params);
      setResults(response.data.results || response.data);
    } catch (error) {
      console.error('검색 실패:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeChange = (event) => {
    setExchange({
      ...exchange,
      [event.target.name]: event.target.checked
    });
  };

  const handleRiskChange = (event) => {
    setRiskLevel({
      ...riskLevel,
      [event.target.name]: event.target.checked
    });
  };

  const getPatternColor = (pattern) => {
    switch (pattern) {
      case 'P1': return 'success';
      case 'P2': return 'info';
      case 'P3': return 'warning';
      default: return 'default';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🔍 패턴 기반 종목 찾기
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Pattern 1·2·3 조건으로 종목을 검색하세요!</strong>
        <br />
        원하는 패턴, 점수, 거래소, 리스크 수준을 선택하면 조건에 맞는 종목을 찾아드립니다.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Pattern 선택 */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">📊 Pattern 선택</FormLabel>
              <RadioGroup
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              >
                <FormControlLabel value="all" control={<Radio />} label="전체 Pattern" />
                <FormControlLabel 
                  value="P1" 
                  control={<Radio />} 
                  label="Pattern 1 (매집→급등형)" 
                />
                <FormControlLabel 
                  value="P2" 
                  control={<Radio />} 
                  label="Pattern 2 (추세전환형)" 
                />
                <FormControlLabel 
                  value="P3" 
                  control={<Radio />} 
                  label="Pattern 3 (IPO반등형)" 
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* 최소 점수 */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <FormLabel component="legend">📈 최소 점수: {minScore}점</FormLabel>
              <Slider
                value={minScore}
                onChange={(e, value) => setMinScore(value)}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '0' },
                  { value: 60, label: '60' },
                  { value: 80, label: '80' },
                  { value: 100, label: '100' }
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="textSecondary">
                {minScore >= 80 ? '우수 (80점 이상)' :
                 minScore >= 60 ? '양호 (60-79점)' :
                 minScore > 0 ? '전체 (1-59점)' :
                 '모든 점수 (0점 포함)'}
              </Typography>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* 거래소 선택 */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">🌍 거래소</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exchange.kosdaq}
                      onChange={handleExchangeChange}
                      name="kosdaq"
                      color="success"
                    />
                  }
                  label="코스닥 (KOSDAQ)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exchange.kospi}
                      onChange={handleExchangeChange}
                      name="kospi"
                      color="primary"
                    />
                  }
                  label="코스피 (KOSPI)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exchange.nasdaq}
                      onChange={handleExchangeChange}
                      name="nasdaq"
                      color="info"
                    />
                  }
                  label="나스닥 (NASDAQ)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exchange.nyse}
                      onChange={handleExchangeChange}
                      name="nyse"
                      color="secondary"
                    />
                  }
                  label="뉴욕증권 (NYSE)"
                />
              </FormGroup>
            </FormControl>
          </Grid>

          {/* 리스크 수준 */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">⚠️ 리스크 수준</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={riskLevel.low}
                      onChange={handleRiskChange}
                      name="low"
                      color="success"
                    />
                  }
                  label="LOW (낮음)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={riskLevel.medium}
                      onChange={handleRiskChange}
                      name="medium"
                      color="warning"
                    />
                  }
                  label="MEDIUM (중간)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={riskLevel.high}
                      onChange={handleRiskChange}
                      name="high"
                      color="error"
                    />
                  }
                  label="HIGH (높음)"
                />
              </FormGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* 시가총액 */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">💰 시가총액</FormLabel>
              <RadioGroup
                value={marketCap}
                onChange={(e) => setMarketCap(e.target.value)}
              >
                <FormControlLabel value="all" control={<Radio />} label="전체" />
                <FormControlLabel value="small" control={<Radio />} label="소형주 (1천만주 이하)" />
                <FormControlLabel value="medium" control={<Radio />} label="중형주 (1천만-1억주)" />
                <FormControlLabel value="large" control={<Radio />} label="대형주 (1억주 이상)" />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* IPO 필터 */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">🌟 특수 조건</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={ipo}
                      onChange={(e) => setIpo(e.target.checked)}
                      color="warning"
                    />
                  }
                  label="IPO 종목만 (1년 이내 상장)"
                />
              </FormGroup>
              <Typography variant="caption" color="textSecondary">
                Pattern 3는 IPO 소형주에 특화되어 있습니다.
              </Typography>
            </FormControl>
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? '검색 중...' : '종목 검색'}
          </Button>
        </Box>
      </Paper>

      {/* 검색 결과 */}
      {searched && (
        <Paper>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              검색 결과: {results.length}개
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>티커</TableCell>
                  <TableCell>종목명</TableCell>
                  <TableCell>거래소</TableCell>
                  <TableCell>Pattern</TableCell>
                  <TableCell>점수</TableCell>
                  <TableCell>리스크</TableCell>
                  <TableCell>평가일</TableCell>
                  <TableCell>상세</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>
                      <Typography fontWeight="bold">
                        {evaluation.symbol_ticker}
                      </Typography>
                    </TableCell>
                    <TableCell>{evaluation.symbol_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={evaluation.exchange}
                        size="small"
                        color={
                          evaluation.exchange === 'NASDAQ' ? 'info' :
                          evaluation.exchange === 'NYSE' ? 'secondary' :
                          evaluation.exchange === 'KOSDAQ' ? 'success' : 'primary'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={evaluation.pattern_type}
                        color={getPatternColor(evaluation.pattern_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${evaluation.checklist_score}점`}
                        color={getScoreColor(evaluation.checklist_score)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={evaluation.risk_level}
                        color={getRiskColor(evaluation.risk_level)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(evaluation.evaluated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/evaluations/${evaluation.id}`)}
                      >
                        상세보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {results.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                검색 조건에 맞는 종목이 없습니다.
              </Typography>
              <Typography variant="caption" color="textSecondary">
                조건을 완화하거나 패턴 분석을 먼저 실행하세요.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <Box mt={4}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Pattern 1
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  매집 → 급등형
                  <br />
                  승률 45-55%, 수익 +35%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  Pattern 2
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  추세 전환형
                  <br />
                  승률 60-70%, 수익 +25%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  Pattern 3
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  IPO 반등형
                  <br />
                  승률 40-50%, 수익 +50-100%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default PatternSearch;
