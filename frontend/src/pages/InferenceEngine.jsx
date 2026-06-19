import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  PlayArrow as PlayArrowIcon,
  AutoFixHigh as AutoFixHighIcon
} from '@mui/icons-material';

function InferenceEngine() {
  const [ruleName, setRuleName] = useState('');
  const [antecedent, setAntecedent] = useState('');
  const [consequent, setConsequent] = useState('');
  const [results, setResults] = useState([]);
  const [openRuleDialog, setOpenRuleDialog] = useState(false);
  const [inferenceHistory, setInferenceHistory] = useState([
    {
      id: 1,
      timestamp: '2026-01-20 10:30:00',
      rule: '매집급등형_규칙',
      input: '삼성전자 외인수급 > 1000000 AND 거래량 > 평균*2',
      output: '매집급등형 패턴 감지',
      confidence: 0.85
    },
    {
      id: 2,
      timestamp: '2026-01-20 11:15:00',
      rule: '추세전환_규칙',
      input: 'SK하이닉스 RSI < 30 AND MACD 골든크로스',
      output: '추세전환 패턴 감지',
      confidence: 0.72
    }
  ]);

  const rules = [
    { id: 1, name: '매집급등형_규칙', active: true, description: '외인수급과 거래량 기반 매집 감지' },
    { id: 2, name: '추세전환_규칙', active: true, description: 'RSI 과매도 및 MACD 골든크로스' },
    { id: 3, name: 'IPO반등_규칙', active: false, description: '상장 후 소형주 반등 패턴' },
    { id: 4, name: '섹터연계_규칙', active: true, description: '동일 섹터 종목 간 연관성 분석' }
  ];

  const handleRunInference = () => {
    // Mock inference result
    setResults([
      {
        entity: '삼성전자',
        rule: '매집급등형_규칙',
        result: 'Positive',
        confidence: 0.85,
        reasoning: '외인 수급(+) AND 거래량 증가(+) → 매집 신호'
      },
      {
        entity: 'SK하이닉스',
        rule: '추세전환_규칙',
        result: 'Positive',
        confidence: 0.72,
        reasoning: 'RSI 과매도 AND MACD 골든크로스 → 상승 반전 신호'
      }
    ]);
  };

  const handleSaveRule = () => {
    setOpenRuleDialog(false);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <PsychologyIcon sx={{ mr: 2, fontSize: 40 }} />
          추론 엔진
        </Typography>
        <Typography variant="body1" color="text.secondary">
          온톨로지 기반 규칙 추론을 실행하고 결과를 분석합니다.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 규칙 실행 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              추론 실행
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>추론 규칙</InputLabel>
                  <Select
                    label="추론 규칙"
                    defaultValue="all"
                  >
                    <MenuItem value="all">전체 규칙 실행</MenuItem>
                    {rules.map((rule) => (
                      <MenuItem key={rule.id} value={rule.id}>
                        {rule.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="대상 엔티티 (선택사항)"
                  placeholder="예: 삼성전자, SK하이닉스"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayArrowIcon />}
                  onClick={handleRunInference}
                >
                  추론 실행
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 규칙 관리 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                활성 규칙 ({rules.filter(r => r.active).length}/{rules.length})
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AutoFixHighIcon />}
                onClick={() => setOpenRuleDialog(true)}
              >
                새 규칙
              </Button>
            </Box>
            <List>
              {rules.map((rule) => (
                <ListItem key={rule.id} divider>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={rule.active}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={rule.name}
                    secondary={rule.description}
                  />
                  <Chip
                    label={rule.active ? '활성' : '비활성'}
                    color={rule.active ? 'success' : 'default'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 추론 결과 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              추론 결과
            </Typography>
            {results.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>엔티티</TableCell>
                      <TableCell>규칙</TableCell>
                      <TableCell>결과</TableCell>
                      <TableCell>신뢰도</TableCell>
                      <TableCell>추론 과정</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Chip label={result.entity} color="primary" />
                        </TableCell>
                        <TableCell>{result.rule}</TableCell>
                        <TableCell>
                          <Chip
                            label={result.result}
                            color={result.result === 'Positive' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${(result.confidence * 100).toFixed(1)}%`}
                            color={result.confidence > 0.7 ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{result.reasoning}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                추론을 실행하면 결과가 여기에 표시됩니다.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* 추론 이력 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              추론 이력
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>시간</TableCell>
                    <TableCell>규칙</TableCell>
                    <TableCell>입력</TableCell>
                    <TableCell>출력</TableCell>
                    <TableCell>신뢰도</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inferenceHistory.map((history) => (
                    <TableRow key={history.id} hover>
                      <TableCell>{history.timestamp}</TableCell>
                      <TableCell>{history.rule}</TableCell>
                      <TableCell>{history.input}</TableCell>
                      <TableCell>{history.output}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${(history.confidence * 100).toFixed(0)}%`}
                          color={history.confidence > 0.7 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* 새 규칙 다이얼로그 */}
      <Dialog open={openRuleDialog} onClose={() => setOpenRuleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>새 추론 규칙</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="규칙 이름"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="전제 (Antecedent)"
                multiline
                rows={3}
                placeholder="예: ?stock :hasPrice ?price AND ?price > 50000"
                value={antecedent}
                onChange={(e) => setAntecedent(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="결론 (Consequent)"
                multiline
                rows={2}
                placeholder="예: ?stock :hasPattern 'HighPricePattern'"
                value={consequent}
                onChange={(e) => setConsequent(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRuleDialog(false)}>취소</Button>
          <Button variant="contained" onClick={handleSaveRule}>저장</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default InferenceEngine;
