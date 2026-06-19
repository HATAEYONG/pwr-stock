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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tab,
  Tabs,
  LinearProgress
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
  Add,
  Close,
  Check,
  Warning
} from '@mui/icons-material';
import axios from 'axios';

function PortfolioDashboard() {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [summary, setSummary] = useState(null);
  const [positions, setPositions] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPositionDialog, setOpenPositionDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 폼 상태
  const [newPortfolio, setNewPortfolio] = useState({
    name: '',
    initial_capital: 10000000,
    max_positions: 10,
    risk_per_trade: 0.02
  });

  const [newPosition, setNewPosition] = useState({
    symbol_id: '',
    entry_price: '',
    pattern_type: 'P3',
    checklist_score: 70
  });

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      loadPortfolioSummary(selectedPortfolio);
      loadPositions(selectedPortfolio);
    }
  }, [selectedPortfolio]);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/portfolio/portfolios/');
      setPortfolios(response.data);
      if (response.data.length > 0) {
        setSelectedPortfolio(response.data[0].id);
      } else {
        // 포트폴리오가 없으면 기본 요약 데이터 설정
        setSummary({
          current_capital: 0,
          total_return: 0,
          win_rate: 0,
          total_positions: 0,
          max_positions: 10,
          invested_capital: 0,
          available_cash: 0,
          cash_ratio: 1
        });
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
      setError('포트폴리오 로딩 실패: ' + error.message);
      // 에러 발생 시에도 기본 데이터 설정으로 화면 표시
      setSummary({
        current_capital: 0,
        total_return: 0,
        win_rate: 0,
        total_positions: 0,
        max_positions: 10,
        invested_capital: 0,
        available_cash: 0,
        cash_ratio: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioSummary = async (portfolioId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/portfolio/portfolios/${portfolioId}/summary/`);
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading summary:', error);
      setError('요약 정보 로딩 실패');
      // 에러 발생 시에도 기본 데이터 설정
      setSummary({
        current_capital: 0,
        total_return: 0,
        win_rate: 0,
        total_positions: 0,
        max_positions: 10,
        invested_capital: 0,
        available_cash: 0,
        cash_ratio: 1
      });
    }
  };

  const loadPositions = async (portfolioId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/portfolio/portfolios/${portfolioId}/positions/?status=OPEN`);
      setPositions(response.data);
    } catch (error) {
      console.error('Error loading positions:', error);
      setPositions([]);
    }
  };

  const handleCreatePortfolio = async () => {
    try {
      await axios.post('http://localhost:8000/api/portfolio/portfolios/', newPortfolio);
      setOpenDialog(false);
      loadPortfolios();
    } catch (error) {
      console.error('Error creating portfolio:', error);
    }
  };

  const handleOpenPosition = async () => {
    try {
      await axios.post(
        `http://localhost:8000/api/portfolio/portfolios/${selectedPortfolio}/open_position/`,
        newPosition
      );
      setOpenPositionDialog(false);
      loadPositions(selectedPortfolio);
      loadPortfolioSummary(selectedPortfolio);
    } catch (error) {
      console.error('Error opening position:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary">
            로딩 중...
          </Typography>
        </Box>
      </Container>
    );
  }

  const totalReturn = summary?.total_return * 100 || 0;
  const isProfit = totalReturn >= 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="error" sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            {error}
          </Typography>
        </Box>
      )}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          포트폴리오 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          새 포트폴리오
        </Button>
      </Box>

      {/* 포트폴리오 선택 */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>포트폴리오 선택</InputLabel>
        <Select
          value={selectedPortfolio || ''}
          label="포트폴리오 선택"
          onChange={(e) => setSelectedPortfolio(e.target.value)}
        >
          {portfolios.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 요약 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWallet sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  총 자산
                </Typography>
              </Box>
              <Typography variant="h5">
                {summary?.current_capital?.toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {isProfit ? (
                  <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                ) : (
                  <TrendingDown sx={{ mr: 1, color: 'error.main' }} />
                )}
                <Typography variant="body2" color="text.secondary">
                  총 수익률
                </Typography>
              </Box>
              <Typography variant="h5" color={isProfit ? 'success.main' : 'error.main'}>
                {totalReturn.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                승률
              </Typography>
              <Typography variant="h5">
                {(summary?.win_rate * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                보유 종목
              </Typography>
              <Typography variant="h5">
                {summary?.total_positions} / {summary?.max_positions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 탭 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="보유 포지션" />
          <Tab label="자금 현황" />
          <Tab label="성과 분석" />
          <Tab label="리스크 지표" />
        </Tabs>
      </Paper>

      {/* 보유 포지션 탭 */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenPositionDialog(true)}
            >
              포지션 진입
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>종목</TableCell>
                  <TableCell align="right">진입가</TableCell>
                  <TableCell align="right">수량</TableCell>
                  <TableCell align="right">평가금액</TableCell>
                  <TableCell align="right">손익</TableCell>
                  <TableCell align="right">손익률</TableCell>
                  <TableCell align="center">패턴</TableCell>
                  <TableCell align="center">상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {pos.symbol_ticker}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pos.symbol_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {parseFloat(pos.entry_price).toLocaleString()}원
                    </TableCell>
                    <TableCell align="right">{pos.quantity}</TableCell>
                    <TableCell align="right">
                      {parseFloat(pos.position_value).toLocaleString()}원
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={pos.profit_loss >= 0 ? 'success.main' : 'error.main'}
                      >
                        {parseFloat(pos.profit_loss).toLocaleString()}원
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${(pos.profit_loss_pct * 100).toFixed(2)}%`}
                        color={pos.profit_loss_pct >= 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={pos.pattern_type} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={pos.status === 'OPEN' ? '보유 중' : '청산'}
                        color={pos.status === 'OPEN' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {positions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        보유 중인 포지션이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* 자금 현황 탭 */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>자금 배분</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    총 자산: {summary?.current_capital?.toLocaleString()}원
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    투자금: {summary?.invested_capital?.toLocaleString()}원
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    가용 현금: {summary?.available_cash?.toLocaleString()}원
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    현금 비중: {(summary?.cash_ratio * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 새 포트폴리오 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 포트폴리오 생성</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="포트폴리오명"
            value={newPortfolio.name}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="초기 자금"
            type="number"
            value={newPortfolio.initial_capital}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, initial_capital: parseFloat(e.target.value) })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="최대 보유 종목 수"
            type="number"
            value={newPortfolio.max_positions}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, max_positions: parseInt(e.target.value) })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="건별 리스크 비율"
            type="number"
            inputProps={{ step: 0.01, min: 0, max: 1 }}
            value={newPortfolio.risk_per_trade}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, risk_per_trade: parseFloat(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleCreatePortfolio} variant="contained">생성</Button>
        </DialogActions>
      </Dialog>

      {/* 포지션 진입 다이얼로그 */}
      <Dialog open={openPositionDialog} onClose={() => setOpenPositionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>포지션 진입</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="종목 ID"
            value={newPosition.symbol_id}
            onChange={(e) => setNewPosition({ ...newPosition, symbol_id: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="진입가"
            type="number"
            value={newPosition.entry_price}
            onChange={(e) => setNewPosition({ ...newPosition, entry_price: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>패턴 타입</InputLabel>
            <Select
              value={newPosition.pattern_type}
              label="패턴 타입"
              onChange={(e) => setNewPosition({ ...newPosition, pattern_type: e.target.value })}
            >
              <MenuItem value="P1">Pattern 1 (매집형)</MenuItem>
              <MenuItem value="P2">Pattern 2 (추세전환)</MenuItem>
              <MenuItem value="P3">Pattern 3 (IPO반등)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="체크리스트 점수"
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={newPosition.checklist_score}
            onChange={(e) => setNewPosition({ ...newPosition, checklist_score: parseInt(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPositionDialog(false)}>취소</Button>
          <Button onClick={handleOpenPosition} variant="contained">진입</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PortfolioDashboard;
