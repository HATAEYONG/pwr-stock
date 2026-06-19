import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Button
} from '@mui/material';
import {
  RocketLaunch,
  Warning,
  TrendingUp,
  Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getSignalEvaluations } from '../services/api';

function Alerts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({
    start: [],
    risk: [],
    sell: []
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const [startRes, riskRes, sellRes] = await Promise.all([
        getSignalEvaluations('start'),
        getSignalEvaluations('risk'),
        getSignalEvaluations('sell')
      ]);

      setAlerts({
        start: startRes.data,
        risk: riskRes.data,
        sell: sellRes.data
      });
    } catch (error) {
      console.error('알림 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderAlertTable = (data, type) => {
    const getColor = () => {
      if (type === 'start') return 'primary';
      if (type === 'risk') return 'error';
      return 'warning';
    };

    if (data.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            트리거 신호가 없습니다.
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>종목</TableCell>
              <TableCell>날짜</TableCell>
              <TableCell>Pattern</TableCell>
              <TableCell>점수</TableCell>
              <TableCell>리스크</TableCell>
              <TableCell>액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {item.symbol_ticker}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {item.symbol_name}
                  </Typography>
                </TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.pattern_type} 
                    size="small"
                    color={
                      item.pattern_type === 'P1' ? 'success' :
                      item.pattern_type === 'P2' ? 'info' : 'warning'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">
                    {item.checklist_score}점
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.risk_level} 
                    size="small"
                    color={
                      item.risk_level === 'LOW' ? 'success' :
                      item.risk_level === 'MEDIUM' ? 'warning' : 'error'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/evaluations/${item.id}`)}
                  >
                    상세보기
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
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
      <Box display="flex" alignItems="center" mb={3}>
        <Notifications sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          트리거 알림
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Step 4:</strong> 패턴 분석 결과에서 발생한 트리거 신호를 확인합니다.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <RocketLaunch sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" color="primary.main">
                    {alerts.start.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    START 신호
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" display="block" mt={1}>
                진입 타이밍 - 거래량 2배 + MA 돌파
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning sx={{ fontSize: 40, mr: 2, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" color="error.main">
                    {alerts.risk.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    RISK 신호
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" display="block" mt={1}>
                손절 경고 - 구조 이탈
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp sx={{ fontSize: 40, mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {alerts.sell.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    SELL 신호
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" display="block" mt={1}>
                익절 타이밍 - 거래량 3배 + 급등
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={`🚀 START (${alerts.start.length})`} 
            icon={<RocketLaunch />}
            iconPosition="start"
          />
          <Tab 
            label={`⚠️ RISK (${alerts.risk.length})`}
            icon={<Warning />}
            iconPosition="start"
          />
          <Tab 
            label={`💰 SELL (${alerts.sell.length})`}
            icon={<TrendingUp />}
            iconPosition="start"
          />
        </Tabs>

        <Box p={2}>
          {activeTab === 0 && renderAlertTable(alerts.start, 'start')}
          {activeTab === 1 && renderAlertTable(alerts.risk, 'risk')}
          {activeTab === 2 && renderAlertTable(alerts.sell, 'sell')}
        </Box>
      </Paper>

      <Box mt={4}>
        <Alert severity="success">
          <Typography variant="h6" gutterBottom>
            🎯 트리거 활용 가이드
          </Typography>
          <Typography variant="body2" component="div">
            <strong>START 신호:</strong> 진입 타이밍. 거래량 2배 + MA20/60 돌파
            <br />
            <strong>RISK 신호:</strong> 손절 경고. 구조 이탈 또는 연중최저 붕괴
            <br />
            <strong>SELL 신호:</strong> 익절 타이밍. 거래량 3배 + 장대양봉
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}

export default Alerts;
