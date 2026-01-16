import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { getPattern1Evaluations, getPattern2Evaluations, getPattern3Evaluations } from '../services/api';

function PatternView() {
  const { patternType } = useParams();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatternData();
  }, [patternType]);

  const loadPatternData = async () => {
    setLoading(true);
    try {
      let response;
      if (patternType === 'P1') {
        response = await getPattern1Evaluations();
      } else if (patternType === 'P2') {
        response = await getPattern2Evaluations();
      } else if (patternType === 'P3') {
        response = await getPattern3Evaluations();
      }
      setEvaluations(response.data);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatternInfo = () => {
    const info = {
      'P1': {
        title: 'Pattern 1: 매집 → 급등형',
        description: '바닥에서 매집 후 거래량 동반 급등',
        color: '#4caf50'
      },
      'P2': {
        title: 'Pattern 2: 초기 추세 전환형',
        description: '저점 갱신 중단 후 조용히 상승 시작',
        color: '#2196f3'
      },
      'P3': {
        title: 'Pattern 3: IPO 소형주 반등형',
        description: '신규 상장 소형주가 바닥에서 반등',
        color: '#ff9800'
      }
    };
    return info[patternType] || {};
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const patternInfo = getPatternInfo();

  return (
    <Box>
      <Typography variant="h4" gutterBottom style={{ color: patternInfo.color }}>
        {patternInfo.title}
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        {patternInfo.description}
      </Typography>

      <Typography variant="h6" gutterBottom mt={3}>
        발견된 종목: {evaluations.length}개
      </Typography>

      <Grid container spacing={2}>
        {evaluations.map((evaluation) => (
          <Grid item xs={12} sm={6} md={4} key={evaluation.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  {evaluation.symbol_ticker}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {evaluation.symbol_name}
                </Typography>
                <Typography variant="h5" color={patternInfo.color} mt={2}>
                  {evaluation.checklist_score}점
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {evaluation.date}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {evaluations.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            해당 패턴의 종목이 없습니다.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default PatternView;
