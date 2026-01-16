import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  CircularProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  ShowChart,
  RocketLaunch,
  Warning,
  Search,
  Upload,
  Analytics,
  Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getHighScoreEvaluations, getSignalEvaluations } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    highScore: 0,
    startSignals: 0,
    riskSignals: 0,
    sellSignals: 0
  });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [highScoreRes, startRes, riskRes, sellRes] = await Promise.all([
        getHighScoreEvaluations(),
        getSignalEvaluations('start'),
        getSignalEvaluations('risk'),
        getSignalEvaluations('sell')
      ]);

      setStats({
        highScore: highScoreRes.data.length,
        startSignals: startRes.data.length,
        riskSignals: riskRes.data.length,
        sellSignals: sellRes.data.length
      });
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      label: '종목 관리',
      description: '종목을 검색하고 등록합니다.',
      icon: <Search />,
      action: () => navigate('/symbols/search')
    },
    {
      label: '데이터 Import',
      description: 'OHLCV 시세 데이터를 CSV로 import 합니다.',
      icon: <Upload />,
      action: () => navigate('/data/import')
    },
    {
      label: '패턴 분석',
      description: 'Pattern 1/2/3 분석을 실행합니다.',
      icon: <Analytics />,
      action: () => navigate('/analysis/run')
    },
    {
      label: '트리거 알림',
      description: 'START/RISK/SELL 신호를 모니터링합니다.',
      icon: <Notifications />,
      action: () => navigate('/alerts')
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: '고득점 종목',
      value: stats.highScore,
      icon: <TrendingUp fontSize="large" />,
      color: '#4caf50',
      description: '80점 이상'
    },
    {
      title: 'START 신호',
      value: stats.startSignals,
      icon: <RocketLaunch fontSize="large" />,
      color: '#2196f3',
      description: '시동 알림'
    },
    {
      title: 'RISK 신호',
      value: stats.riskSignals,
      icon: <Warning fontSize="large" />,
      color: '#f44336',
      description: '위험 알림'
    },
    {
      title: 'SELL 신호',
      value: stats.sellSignals,
      icon: <ShowChart fontSize="large" />,
      color: '#ff9800',
      description: '매도 알림'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 대시보드
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Pattern 1·2·3 기반 구조적 매매 지원 시스템
      </Alert>
      
      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box 
                    sx={{ 
                      backgroundColor: card.color, 
                      color: 'white',
                      borderRadius: '50%',
                      p: 1,
                      mr: 2
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6">{card.title}</Typography>
                </Box>
                <Typography variant="h3" color={card.color}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                📋 워크플로우 가이드
              </Typography>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel>
                      <Box display="flex" alignItems="center">
                        <Box mr={1}>{step.icon}</Box>
                        {step.label}
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="textSecondary">
                        {step.description}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={step.action}
                          sx={{ mr: 1 }}
                        >
                          이동
                        </Button>
                        <Button
                          onClick={() => setActiveStep(index + 1)}
                          disabled={index === steps.length - 1}
                        >
                          다음
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
              {activeStep === steps.length && (
                <Box mt={2}>
                  <Alert severity="success">
                    모든 단계를 완료했습니다!
                  </Alert>
                  <Button
                    onClick={() => setActiveStep(0)}
                    sx={{ mt: 1 }}
                  >
                    처음부터
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                시스템 정보
              </Typography>
              <Box mt={2}>
                <Typography variant="h6" gutterBottom>
                  Pattern 종류
                </Typography>
                <Chip label="Pattern 1: 매집형" color="success" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Pattern 2: 추세전환" color="info" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Pattern 3: IPO반등" color="warning" sx={{ mr: 1, mb: 1 }} />

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  핵심 원칙
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div">
                  ✅ 구조 판별 (예측 금지)
                  <br />
                  ✅ 체크리스트 자동화
                  <br />
                  ✅ 트리거 알림만 제공
                  <br />
                  ✅ 손절/익절 기준 명확
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  기술 스택
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Frontend: React + Material-UI
                  <br />
                  Backend: Django + DRF
                  <br />
                  DB: SQLite / PostgreSQL
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
