import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Refresh, TrendingUp, TrendingDown, CalendarToday } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function OHLCVViewer() {
  const [ohlcvData, setOHLcvData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [total, setTotal] = useState(0);

  // 필터 상태
  const [filters, setFilters] = useState({
    symbol: '',
    exchange: '',
    start_date: '',
    end_date: ''
  });

  // 통계 로드
  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/ohlcv/viewer/stats/`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // OHLCV 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...filters
      };

      // 빈 값 제거
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await axios.get(`${API_URL}/ohlcv/viewer/list/`, { params });
      setOHLcvData(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error loading OHLCV data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadStats();
    loadData();
  }, [page, rowsPerPage]);

  // 필터 변경 핸들러
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 검색 버튼 클릭
  const handleSearch = () => {
    setPage(0);
    loadData();
  };

  // 엔터키로 검색
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 새로고침
  const handleRefresh = () => {
    loadStats();
    loadData();
  };

  // 테이블 셀 스타일
  const getChangeCell = (change, changeRate) => {
    if (change > 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#f44336' }}>
          <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">
            {change.toFixed(2)} (+{changeRate.toFixed(2)}%)
          </Typography>
        </Box>
      );
    } else if (change < 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#2196f3' }}>
          <TrendingDown fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">
            {change.toFixed(2)} ({changeRate.toFixed(2)}%)
          </Typography>
        </Box>
      );
    } else {
      return <Typography variant="body2">0.00 (0.00%)</Typography>;
    }
  };

  // 페이지 변경
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          OHLCV 데이터 조회
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          새로고침
        </Button>
      </Box>

      {/* 통계 카드 */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  전체 레코드 수
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.total_records.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  전체 종목 수
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.total_symbols.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  최근 데이터 일자
                </Typography>
                <Typography variant="h5" component="div">
                  {stats.latest_date}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  데이터 기간
                </Typography>
                <Typography variant="body2" component="div">
                  {stats.earliest_date} ~ {stats.latest_date}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 시장별 통계 */}
      {stats && stats.market_stats && stats.market_stats.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {stats.market_stats.map((market) => (
            <Grid item xs={12} sm={6} md={3} key={market.exchange}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {market.exchange}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                      {market.records.toLocaleString()}건
                    </Typography>
                    <Chip
                      label={`${market.symbols}종목`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 필터 영역 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="종목 코드"
              size="small"
              value={filters.symbol}
              onChange={(e) => handleFilterChange('symbol', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="예: 005930"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>시장</InputLabel>
              <Select
                value={filters.exchange}
                label="시장"
                onChange={(e) => handleFilterChange('exchange', e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="KOSPI">KOSPI</MenuItem>
                <MenuItem value="KOSDAQ">KOSDAQ</MenuItem>
                <MenuItem value="NASDAQ">NASDAQ</MenuItem>
                <MenuItem value="NYSE">NYSE</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="시작일"
              type="date"
              size="small"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="종료일"
              type="date"
              size="small"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
            >
              검색
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 데이터 테이블 */}
      <Paper>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>종목 코드</TableCell>
                <TableCell>종목명</TableCell>
                <TableCell>시장</TableCell>
                <TableCell>날짜</TableCell>
                <TableCell align="right">시가</TableCell>
                <TableCell align="right">고가</TableCell>
                <TableCell align="right">저가</TableCell>
                <TableCell align="right">종가</TableCell>
                <TableCell align="right">거래량</TableCell>
                <TableCell align="right">등락</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Typography>로딩 중...</Typography>
                  </TableCell>
                </TableRow>
              ) : ohlcvData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Typography>데이터가 없습니다</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                ohlcvData.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {row.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.symbol_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.exchange}
                        size="small"
                        variant="outlined"
                        color={
                          row.exchange === 'KOSPI' ? 'primary' :
                          row.exchange === 'KOSDAQ' ? 'secondary' :
                          row.exchange === 'NASDAQ' ? 'success' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                        {row.date}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace">
                        {row.open.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace" color="#f44336">
                        {row.high.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace" color="#2196f3">
                        {row.low.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
                        {row.close.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace">
                        {row.volume.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {getChangeCell(row.change, row.change_rate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100, 200]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count !== -1 ? count : `${to}+`}`}
        />
      </Paper>

      {/* 최근 샘플 데이터 */}
      {stats && stats.latest_sample && stats.latest_sample.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            최근 업데이트 데이터
          </Typography>
          <Grid container spacing={1}>
            {stats.latest_sample.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Box
                  sx={{
                    p: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    bgcolor: '#fafafa'
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {item.symbol} - {item.symbol_name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {item.date}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    종가: {item.close.toLocaleString()} / 거래량: {item.volume.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Container>
  );
}

export default OHLCVViewer;
