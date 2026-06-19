import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  ExpandMore,
  TrendingUp,
  Warning,
  MonetizationOn
} from '@mui/icons-material';
import { getEvaluation } from '../services/api';

function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  // 체크리스트 항목 한글 라벨 매핑
  const checklistLabels = {
    // Pattern 1
    yearly_low: '연중 최저점 형성',
    fake_breakout: '가상 상승 발생',
    accumulation_box: '매집 박스 형성',
    volume_compression: '거래량 압축',
    price_near_high: '가격이 박스 상단 근접',

    // Pattern 2
    ma_golden_cross: 'MA Golden Cross',
    price_above_ma: '가격이 MA 위쪽',
    volume_confirmation: '거래량 확인',
    higher_low: '고점 상승',

    // Pattern 3
    ipo_small_cap: '소형주 IPO',
    price_dump: '가격 하락',
    volume_surge: '거래량 급증',
    rebound_start: '반등 시작'
  };

  // 트리거 항목 한글 라벨 매핑
  const triggerLabels = {
    start: '시동',
    risk: '위험',
    sell: '매도',
    start_confirmed: '시동 확인',
    risk_confirmed: '위험 확인',
    sell_confirmed: '매도 확인'
  };

  useEffect(() => {
    loadEvaluation();
  }, [id]);

  const loadEvaluation = async () => {
    try {
      const response = await getEvaluation(id);
      setEvaluation(response.data);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!evaluation) {
    return <Typography>데이터를 찾을 수 없습니다.</Typography>;
  }

  // 체크리스트 렌더링 헬퍼 함수
  const renderChecklist = (checklist) => {
    if (!checklist || typeof checklist !== 'object') return null;

    const items = Object.entries(checklist).filter(([key, value]) => value === true);

    if (items.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
          <Typography>체크리스트 항목이 없습니다</Typography>
        </Box>
      );
    }

    return (
      <List>
        {items.map(([key, value]) => (
          <ListItem key={key} divider>
            <ListItemIcon>
              <CheckCircle color="success" />
            </ListItemIcon>
            <ListItemText primary={checklistLabels[key] || key} />
          </ListItem>
        ))}
      </List>
    );
  };

  // 트리거 신호 렌더링 헬퍼 함수
  const renderTriggers = (triggers) => {
    if (!triggers || typeof triggers !== 'object') return null;

    return (
      <Grid container spacing={2}>
        {triggers.start !== false && (
          <Grid item>
            <Chip
              icon={<TrendingUp />}
              label="START 신호"
              color={triggers.start === 'confirmed' ? 'success' : 'primary'}
              variant={triggers.start === 'confirmed' ? 'filled' : 'outlined'}
            />
          </Grid>
        )}
        {triggers.risk !== false && (
          <Grid item>
            <Chip
              icon={<Warning />}
              label="RISK 신호"
              color={triggers.risk === 'confirmed' ? 'error' : 'warning'}
              variant={triggers.risk === 'confirmed' ? 'filled' : 'outlined'}
            />
          </Grid>
        )}
        {triggers.sell !== false && (
          <Grid item>
            <Chip
              icon={<MonetizationOn />}
              label="SELL 신호"
              color={triggers.sell === 'confirmed' ? 'success' : 'info'}
              variant={triggers.sell === 'confirmed' ? 'filled' : 'outlined'}
            />
          </Grid>
        )}
        {!triggers.start && !triggers.risk && !triggers.sell && (
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              현재 활성화된 신호가 없습니다
            </Typography>
          </Grid>
        )}
      </Grid>
    );
  };

  const getPatternColor = (patternType) => {
    switch (patternType) {
      case 'P1': return 'error';
      case 'P2': return 'warning';
      case 'P3': return 'info';
      default: return 'default';
    }
  };

  const getPatternLabel = (patternType) => {
    switch (patternType) {
      case 'P1': return 'Pattern 1 (매집→급등형)';
      case 'P2': return 'Pattern 2 (추세전환형)';
      case 'P3': return 'Pattern 3 (IPO반등형)';
      default: return patternType || '없음';
    }
  };

  return (
    <Box>
      {/* Header with Back Button */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/pattern-search')}
          sx={{ mr: 2 }}
        >
          목록으로
        </Button>
        <Typography variant="h4" component="h1">
          {evaluation.symbol_ticker} - {evaluation.symbol_name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Info Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                기본 정보
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>평가 날짜:</strong> {evaluation.date}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>거래소:</strong> <Chip label={evaluation.exchange} size="small" />
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>패턴 유형:</strong>{' '}
                  <Chip
                    label={getPatternLabel(evaluation.pattern_type)}
                    color={getPatternColor(evaluation.pattern_type)}
                    size="small"
                  />
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>체크리스트 점수:</strong>{' '}
                  <Chip
                    label={`${evaluation.checklist_score}점`}
                    color={evaluation.checklist_score >= 80 ? 'success' : evaluation.checklist_score >= 60 ? 'warning' : 'default'}
                    size="small"
                  />
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>리스크 레벨:</strong>{' '}
                  <Chip
                    label={evaluation.risk_level}
                    color={evaluation.risk_level === 'LOW' ? 'success' : evaluation.risk_level === 'MEDIUM' ? 'warning' : 'error'}
                    size="small"
                  />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Trigger Signals Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                트리거 신호
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box mt={2}>
                {evaluation.triggers_json ? (
                  renderTriggers(evaluation.triggers_json)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    트리거 정보가 없습니다
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Checklist Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                체크리스트 상세
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box>
                {evaluation.checklist_json ? (
                  renderChecklist(evaluation.checklist_json)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    체크리스트 정보가 없습니다
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pattern Evidence Card - Collapsible */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                Pattern 근거 (상세 데이터)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="pre" sx={{
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                fontSize: '0.875rem'
              }}>
                {JSON.stringify(evaluation.pattern_evidence_json, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
}

export default EvaluationDetail;
