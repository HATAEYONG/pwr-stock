import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  CircularProgress,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getEvaluations } from '../services/api';

function EvaluationsList() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const response = await getEvaluations({ ordering: '-checklist_score' });
      setEvaluations(response.data.results || response.data);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatternColor = (pattern) => {
    const colors = {
      'P1': 'success',
      'P2': 'info',
      'P3': 'warning',
      'NONE': 'default'
    };
    return colors[pattern] || 'default';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        평가 목록
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>종목</TableCell>
              <TableCell>날짜</TableCell>
              <TableCell>Pattern</TableCell>
              <TableCell>점수</TableCell>
              <TableCell>리스크</TableCell>
              <TableCell>트리거</TableCell>
              <TableCell>액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evaluations.map((evaluation) => (
              <TableRow key={evaluation.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {evaluation.symbol_ticker}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {evaluation.symbol_name}
                  </Typography>
                </TableCell>
                <TableCell>{evaluation.date}</TableCell>
                <TableCell>
                  <Chip 
                    label={evaluation.pattern_type}
                    color={getPatternColor(evaluation.pattern_type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography 
                    fontWeight="bold" 
                    color={getScoreColor(evaluation.checklist_score)}
                  >
                    {evaluation.checklist_score}점
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={evaluation.risk_level}
                    size="small"
                    color={
                      evaluation.risk_level === 'LOW' ? 'success' :
                      evaluation.risk_level === 'MEDIUM' ? 'warning' : 'error'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    {evaluation.start_signal && (
                      <Chip label="🚀 START" size="small" color="primary" sx={{ mr: 0.5, mb: 0.5 }} />
                    )}
                    {evaluation.risk_signal && (
                      <Chip label="⚠️ RISK" size="small" color="error" sx={{ mr: 0.5, mb: 0.5 }} />
                    )}
                    {evaluation.sell_signal && (
                      <Chip label="💰 SELL" size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
                    )}
                  </Box>
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

      {evaluations.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            평가 데이터가 없습니다.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default EvaluationsList;
