import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Chip,
  Grid
} from '@mui/material';
import { getEvaluation } from '../services/api';

function EvaluationDetail() {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {evaluation.symbol_ticker} - {evaluation.symbol_name}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                기본 정보
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" gutterBottom>
                  <strong>평가 날짜:</strong> {evaluation.date}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Pattern:</strong> <Chip label={evaluation.pattern_type} size="small" />
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>체크리스트 점수:</strong> {evaluation.checklist_score}점
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>리스크 레벨:</strong> <Chip label={evaluation.risk_level} size="small" />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                트리거 신호
              </Typography>
              <Box mt={2}>
                {evaluation.start_signal && (
                  <Chip label="🚀 START" color="primary" sx={{ mr: 1, mb: 1 }} />
                )}
                {evaluation.risk_signal && (
                  <Chip label="⚠️ RISK" color="error" sx={{ mr: 1, mb: 1 }} />
                )}
                {evaluation.sell_signal && (
                  <Chip label="💰 SELL" color="warning" sx={{ mr: 1, mb: 1 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                체크리스트 상세
              </Typography>
              <Box component="pre" sx={{ overflow: 'auto', backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                {JSON.stringify(evaluation.checklist_json, null, 2)}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pattern 근거
              </Typography>
              <Box component="pre" sx={{ overflow: 'auto', backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                {JSON.stringify(evaluation.pattern_evidence_json, null, 2)}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default EvaluationDetail;
