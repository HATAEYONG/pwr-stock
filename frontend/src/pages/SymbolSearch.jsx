import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
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
  CircularProgress,
  Snackbar
} from '@mui/material';
import { 
  Search as SearchIcon,
  CloudDownload as DownloadIcon
} from '@mui/icons-material';
import {
  getSymbols,
  fetchKiwoomStocks,
  fetchNasdaqStocks,
  getKiwoomRestConfig,
  searchKiwoomStocks
} from '../services/api';

function SymbolSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [kiwoomRestConfig, setKiwoomRestConfig] = useState(null);
  const [useKiwoomSearch, setUseKiwoomSearch] = useState(false);
  const [kiwoomSearchResults, setKiwoomSearchResults] = useState([]);

  // Kiwoom REST API 설정 로드
  useEffect(() => {
    const fetchKiwoomConfig = async () => {
      try {
        const response = await getKiwoomRestConfig();
        setKiwoomRestConfig(response.data);
        // API가 연결된 경우 자동으로 Kiwoom 검색 사용
        if (response.data.has_api_key) {
          setUseKiwoomSearch(true);
        }
      } catch (error) {
        console.error('Kiwoom REST API 설정 조회 실패:', error);
      }
    };
    fetchKiwoomConfig();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);

    // Kiwoom REST API 검색 (API 연결 시 우선)
    if (useKiwoomSearch && kiwoomRestConfig?.has_api_key) {
      try {
        const response = await searchKiwoomStocks(searchTerm);
        const results = response.data.results || response.data;

        // Kiwoom 검색 결과 변환
        const transformedResults = results.map(stock => ({
          id: stock.symbol,
          ticker: stock.symbol,
          name: stock.name,
          exchange: stock.market || 'KOSPI',
          sector: '-',
          is_active: true,
          listing_date: '-',
          shares_outstanding: null,
          source: 'kiwoom_api'
        }));

        setKiwoomSearchResults(transformedResults);

        // 로컬 DB에서도 검색 (병합)
        try {
          const localResponse = await getSymbols({ search: searchTerm });
          setSymbols(localResponse.data.results || localResponse.data);
        } catch (localError) {
          console.error('로컬 DB 검색 실패:', localError);
          setSymbols([]);
        }
      } catch (error) {
        console.error('Kiwoom API 검색 실패:', error);
        setSnackbar({
          open: true,
          message: 'Kiwoom API 검색 실패: ' + (error.response?.data?.error || error.message),
          severity: 'error'
        });
        // 실패 시 로컬 DB로 fallback
        try {
          const response = await getSymbols({ search: searchTerm });
          setSymbols(response.data.results || response.data);
        } catch (localError) {
          console.error('로컬 DB 검색 실패:', localError);
          setSymbols([]);
        }
      }
    } else {
      // 로컬 DB 검색만
      try {
        const response = await getSymbols({ search: searchTerm });
        setSymbols(response.data.results || response.data);
      } catch (error) {
        console.error('검색 실패:', error);
        setSymbols([]);
      }
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFetchKiwoom = async (market) => {
    setFetching(true);
    try {
      const response = await fetchKiwoomStocks(market, true, false);
      setSnackbar({
        open: true,
        message: response.data.message || '종목 수집 완료',
        severity: 'success'
      });
      // 검색 다시 실행
      if (searchTerm) {
        handleSearch();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: '종목 수집 실패: ' + (error.response?.data?.error || error.message),
        severity: 'error'
      });
    } finally {
      setFetching(false);
    }
  };

  const handleFetchNasdaq = async (market) => {
    setFetching(true);
    try {
      const response = await fetchNasdaqStocks(market, true, 100, false);
      setSnackbar({
        open: true,
        message: response.data.message || '종목 수집 완료',
        severity: 'success'
      });
      // 검색 다시 실행
      if (searchTerm) {
        handleSearch();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: '종목 수집 실패: ' + (error.response?.data?.error || error.message),
        severity: 'error'
      });
    } finally {
      setFetching(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🔍 종목 찾기/검색
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Step 1:</strong> 종목 티커(Ticker) 또는 이름으로 검색하거나, API로 자동 수집하세요.
      </Alert>

      {/* Kiwoom REST API 연결 상태 */}
      {kiwoomRestConfig && (
        <Alert
          severity={kiwoomRestConfig.has_api_key ? "success" : "warning"}
          sx={{ mb: 3 }}
          action={
            kiwoomRestConfig.has_api_key && (
              <Chip
                label={useKiwoomSearch ? "Kiwoom API 검색 사용 중" : "로컬 DB 검색"}
                size="small"
                onClick={() => setUseKiwoomSearch(!useKiwoomSearch)}
                sx={{ cursor: 'pointer' }}
              />
            )
          }
        >
          <Typography variant="body2">
            <strong>키움 REST API 상태:</strong> {
              kiwoomRestConfig.has_api_key
                ? `연결됨 (${kiwoomRestConfig.mode} 모드)`
                : '미연결 (API 키가 설정되지 않음)'
            }
            {kiwoomRestConfig.has_api_key && (
              <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                실시간 종목 검색 가능 - 검색 시 키움 API에서 종목 정보를 가져옵니다.
              </Typography>
            )}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🇰🇷 키움증권 API
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                코스닥/코스피 종목 자동 수집
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleFetchKiwoom('kosdaq')}
                    disabled={fetching}
                  >
                    코스닥
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleFetchKiwoom('kospi')}
                    disabled={fetching}
                  >
                    코스피
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleFetchKiwoom('all')}
                    disabled={fetching}
                  >
                    전체
                  </Button>
                </Grid>
              </Grid>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  현재 Mock 데이터 사용 중 (실제 API는 Windows에서만 가능)
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🇺🇸 나스닥 API
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                나스닥/NYSE 종목 자동 수집
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="info"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleFetchNasdaq('nasdaq')}
                    disabled={fetching}
                  >
                    나스닥
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleFetchNasdaq('nyse')}
                    disabled={fetching}
                  >
                    NYSE
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleFetchNasdaq('all')}
                    disabled={fetching}
                  >
                    전체
                  </Button>
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Mock 데이터: AAPL, MSFT, GOOGL, TSLA, NVDA 등
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {fetching && (
        <Box display="flex" justifyContent="center" alignItems="center" py={2}>
          <CircularProgress sx={{ mr: 2 }} />
          <Typography>종목 수집 중...</Typography>
        </Box>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          직접 검색
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            label="종목 티커 또는 이름"
            placeholder="예: AAPL, Apple, 삼성전자"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            검색
          </Button>
        </Box>
      </Paper>

      {searched && (
        <>
          {/* Kiwoom API 검색 결과 */}
          {kiwoomSearchResults.length > 0 && (
            <Paper sx={{ mb: 2 }}>
              <Box p={2} sx={{ bgcolor: 'success.light' }}>
                <Typography variant="h6" gutterBottom>
                  🔗 키움 API 실시간 검색 결과: {kiwoomSearchResults.length}개
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  키움증권 REST API에서 가져온 최신 종목 정보입니다.
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>티커</TableCell>
                      <TableCell>종목명</TableCell>
                      <TableCell>거래소</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>데이터 소스</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {kiwoomSearchResults.map((stock) => (
                      <TableRow key={`kiwoom-${stock.id}`} sx={{ bgcolor: 'action.hover' }}>
                        <TableCell>
                          <Typography fontWeight="bold" color="primary">
                            {stock.ticker}
                          </Typography>
                        </TableCell>
                        <TableCell>{stock.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={stock.exchange}
                            size="small"
                            color={stock.exchange === 'KOSDAQ' ? 'success' : 'primary'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="실시간"
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="키움 API"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* 로컬 DB 검색 결과 */}
          <Paper>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                {kiwoomSearchResults.length > 0 ? '📁 로컬 DB 검색 결과' : '검색 결과'}: {symbols.length}개
              </Typography>
              {kiwoomSearchResults.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  데이터베이스에 저장된 종목 정보입니다.
                </Typography>
              )}
            </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>티커</TableCell>
                  <TableCell>종목명</TableCell>
                  <TableCell>거래소</TableCell>
                  <TableCell>섹터</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>상장일</TableCell>
                  <TableCell>상장주식수</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {symbols.map((symbol) => (
                  <TableRow key={symbol.id}>
                    <TableCell>
                      <Typography fontWeight="bold">
                        {symbol.ticker}
                      </Typography>
                    </TableCell>
                    <TableCell>{symbol.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={symbol.exchange}
                        size="small"
                        color={
                          symbol.exchange === 'NASDAQ' ? 'info' :
                          symbol.exchange === 'NYSE' ? 'secondary' :
                          symbol.exchange === 'KOSDAQ' ? 'success' : 'primary'
                        }
                      />
                    </TableCell>
                    <TableCell>{symbol.sector || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={symbol.is_active ? '활성' : '비활성'}
                        color={symbol.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {symbol.listing_date || '-'}
                    </TableCell>
                    <TableCell>
                      {symbol.shares_outstanding 
                        ? symbol.shares_outstanding.toLocaleString() 
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {symbols.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                검색 결과가 없습니다.
              </Typography>
            </Box>
          )}
        </Paper>
        </>
      )}

      <Box mt={4}>
        <Alert severity="success">
          <Typography variant="body2">
            💡 <strong>다음 단계:</strong> 종목을 찾았다면 
            <strong> "2. 데이터 Import"</strong> 메뉴로 이동하여 OHLCV 데이터를 import 하세요.
          </Typography>
        </Alert>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SymbolSearch;
