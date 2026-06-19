import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import axios from 'axios';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function KiwoomRestApi() {
  const [tabValue, setTabValue] = useState(0);

  // Config State
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [configInfo, setConfigInfo] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState(null);

  // Stock Price State
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockPrice, setStockPrice] = useState(null);

  // Order Book State
  const [orderbookSymbol, setOrderbookSymbol] = useState('');
  const [orderbook, setOrderbook] = useState(null);

  // Account Info State
  const [accountInfo, setAccountInfo] = useState(null);

  // Balance State
  const [accountNo, setAccountNo] = useState('');
  const [balance, setBalance] = useState(null);

  // Order State
  const [orderForm, setOrderForm] = useState({
    account_no: '',
    symbol: '',
    order_type: 'BUY',
    quantity: '',
    price: ''
  });
  const [orderResult, setOrderResult] = useState(null);

  // Market Status State
  const [marketStatus, setMarketStatus] = useState(null);

  // Search State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // API Status
  const [apiStatus, setApiStatus] = useState(null);

  // API 기본 URL
  const API_BASE = 'http://localhost:8000/api/kiwoom/rest';

  // 설정 정보 로드
  const fetchConfigInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE}/config/info/`);
      setConfigInfo(response.data);
    } catch (error) {
      console.error('Error fetching config info:', error);
    }
  };

  // 연결 테스트
  const testConnection = async () => {
    if (!apiKey || !apiSecret) {
      setTestResult({ type: 'error', message: 'API 키와 시크릿을 입력해주세요.' });
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/config/test/`, {
        api_key: apiKey,
        api_secret: apiSecret
      });

      if (response.data.success) {
        setTestResult({ type: 'success', message: response.data.message });
      } else {
        setTestResult({ type: 'error', message: response.data.error || '연결 실패' });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setTestResult({ type: 'error', message: '연결 오류: ' + error.message });
    }
  };

  // 로그인 처리
  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE}/login/`, {
        username,
        password
      });

      if (response.data.success) {
        setIsLoggedIn(true);
        setLoginStatus({ type: 'success', message: '로그인 성공!' });
        // 자동으로 계좌 번호 설정
        if (response.data.accounts && response.data.accounts.length > 0) {
          setAccountNo(response.data.accounts[0]);
          setOrderForm(prev => ({ ...prev, account_no: response.data.accounts[0] }));
        }
      } else {
        setLoginStatus({ type: 'error', message: response.data.message || '로그인 실패' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginStatus({ type: 'error', message: '로그인 오류: ' + error.message });
    }
  };

  // 주식 현재가 조회
  const fetchStockPrice = async () => {
    if (!stockSymbol) return;

    try {
      const response = await axios.get(`${API_BASE}/price/`, {
        params: { symbol: stockSymbol }
      });
      setStockPrice(response.data);
    } catch (error) {
      console.error('Error fetching stock price:', error);
      setStockPrice({ error: error.response?.data?.error || error.message });
    }
  };

  // 호가 조회
  const fetchOrderbook = async () => {
    if (!orderbookSymbol) return;

    try {
      const response = await axios.get(`${API_BASE}/orderbook/`, {
        params: { symbol: orderbookSymbol }
      });
      setOrderbook(response.data);
    } catch (error) {
      console.error('Error fetching orderbook:', error);
      setOrderbook({ error: error.response?.data?.error || error.message });
    }
  };

  // 계좌 정보 조회
  const fetchAccountInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE}/account/`);
      setAccountInfo(response.data);
    } catch (error) {
      console.error('Error fetching account info:', error);
      setAccountInfo({ error: error.response?.data?.error || error.message });
    }
  };

  // 예수금 조회
  const fetchBalance = async () => {
    if (!accountNo) return;

    try {
      const response = await axios.get(`${API_BASE}/balance/`, {
        params: { account_no: accountNo }
      });
      setBalance(response.data);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance({ error: error.response?.data?.error || error.message });
    }
  };

  // 주문
  const placeOrder = async () => {
    try {
      const response = await axios.post(`${API_BASE}/order/`, {
        account_no: orderForm.account_no,
        symbol: orderForm.symbol,
        order_type: orderForm.order_type,
        quantity: parseInt(orderForm.quantity),
        price: orderForm.price ? parseInt(orderForm.price) : null
      });
      setOrderResult({ success: true, data: response.data });
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderResult({ success: false, error: error.response?.data?.error || error.message });
    }
  };

  // 장 운영 상태 조회
  const fetchMarketStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/market-status/`);
      setMarketStatus(response.data);
    } catch (error) {
      console.error('Error fetching market status:', error);
      setMarketStatus({ error: error.response?.data?.error || error.message });
    }
  };

  // 종목 검색
  const searchStocks = async () => {
    if (!searchKeyword) return;

    try {
      const response = await axios.get(`${API_BASE}/search/`, {
        params: { keyword: searchKeyword }
      });
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    }
  };

  // API 상태 확인
  const fetchApiStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/status/`);
      setApiStatus(response.data);
    } catch (error) {
      console.error('Error fetching API status:', error);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchApiStatus();
    fetchMarketStatus();
    fetchConfigInfo();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        키움증권 REST API
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        OS 독립적인 REST API 방식 (실제 사용 시 키움증권에서 API 키 발급 필요)
      </Typography>

      {/* API Status */}
      {apiStatus && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>{apiStatus.api_type}</strong> - {apiStatus.description}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="⚙️ API 설정" />
          <Tab label="로그인" />
          <Tab label="시세 조회" />
          <Tab label="계좌 정보" />
          <Tab label="주문" />
          <Tab label="종목 검색" />
        </Tabs>

        {/* Config Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    API 연결 설정
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    키움증권 REST API 키를 설정하세요. .env 파일에 설정하거나 여기서 테스트할 수 있습니다.
                  </Alert>

                  {configInfo && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        현재 모드: <Chip label={configInfo.mode} size="small" />
                      </Typography>
                      {configInfo.has_api_key && (
                        <Typography variant="body2" color="text.secondary">
                          API Key: {configInfo.api_key_prefix}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="API Key (App Key)"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="발급받은 App Key 입력"
                      fullWidth
                    />
                    <TextField
                      label="API Secret (Secret Key)"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="발급받은 Secret Key 입력"
                      type="password"
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={testConnection}
                      disabled={!apiKey || !apiSecret}
                    >
                      연결 테스트
                    </Button>
                  </Box>

                  {testResult && (
                    <Alert severity={testResult.type} sx={{ mt: 2 }}>
                      {testResult.message}
                    </Alert>
                  )}

                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      .env 파일 설정 방법:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                      KIWOOM_REST_API_KEY=your_appkey{'\n'}
                      KIWOOM_REST_API_SECRET=your_secretkey
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Login Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    로그인
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="사용자 ID"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoggedIn}
                    />
                    <TextField
                      label="비밀번호"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoggedIn}
                    />
                    <Button
                      variant="contained"
                      onClick={handleLogin}
                      disabled={isLoggedIn || !username || !password}
                    >
                      {isLoggedIn ? '로그인 완료' : '로그인'}
                    </Button>
                  </Box>

                  {loginStatus && (
                    <Alert severity={loginStatus.type} sx={{ mt: 2 }}>
                      {loginStatus.message}
                    </Alert>
                  )}

                  {isLoggedIn && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      로그인 상태입니다. 모든 기능을 사용할 수 있습니다.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Stock Price Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    주식 현재가 조회
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="종목 코드"
                      value={stockSymbol}
                      onChange={(e) => setStockSymbol(e.target.value)}
                      placeholder="예: 005930"
                    />
                    <Button
                      variant="contained"
                      onClick={fetchStockPrice}
                      disabled={!stockSymbol}
                    >
                      조회
                    </Button>
                  </Box>

                  {stockPrice && !stockPrice.error && (
                    <Box>
                      <Typography variant="subtitle1" color="primary">
                        {stockPrice.name}
                      </Typography>
                      <Typography variant="h4">
                        {stockPrice.price?.toLocaleString()}원
                      </Typography>
                      <Typography
                        variant="body2"
                        color={stockPrice.change >= 0 ? 'error.main' : 'primary.main'}
                      >
                        {stockPrice.change >= 0 ? '+' : ''}
                        {stockPrice.change?.toLocaleString()}원
                        ({stockPrice.change_pct?.toFixed(2)}%)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        거래량: {stockPrice.volume?.toLocaleString()}주
                      </Typography>
                    </Box>
                  )}

                  {stockPrice?.error && (
                    <Alert severity="error">{stockPrice.error}</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    호가 조회
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="종목 코드"
                      value={orderbookSymbol}
                      onChange={(e) => setOrderbookSymbol(e.target.value)}
                      placeholder="예: 005930"
                    />
                    <Button
                      variant="contained"
                      onClick={fetchOrderbook}
                      disabled={!orderbookSymbol}
                    >
                      조회
                    </Button>
                  </Box>

                  {orderbook && !orderbook.error && (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>구분</TableCell>
                            <TableCell align="right">가격</TableCell>
                            <TableCell align="right">수량</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orderbook.asks?.map((ask, idx) => (
                            <TableRow key={`ask-${idx}`}>
                              <TableCell>매도 {idx + 1}</TableCell>
                              <TableCell align="right">{ask.price?.toLocaleString()}</TableCell>
                              <TableCell align="right">{ask.qty?.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell colSpan={3} align="center">
                              <strong>현재가</strong>
                            </TableCell>
                          </TableRow>
                          {orderbook.bids?.map((bid, idx) => (
                            <TableRow key={`bid-${idx}`}>
                              <TableCell>매수 {idx + 1}</TableCell>
                              <TableCell align="right">{bid.price?.toLocaleString()}</TableCell>
                              <TableCell align="right">{bid.qty?.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {orderbook?.error && (
                    <Alert severity="error">{orderbook.error}</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Account Info Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    계좌 정보
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={fetchAccountInfo}
                    sx={{ mb: 2 }}
                  >
                    계좌 정보 조회
                  </Button>

                  {accountInfo && !accountInfo.error && (
                    <Box>
                      {accountInfo.accounts?.map((acc, idx) => (
                        <Typography key={idx} variant="body2">
                          계좌 {idx + 1}: {acc}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {accountInfo?.error && (
                    <Alert severity="error">{accountInfo.error}</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    예수금 조회
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="계좌 번호"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="계좌 번호 입력"
                    />
                    <Button
                      variant="contained"
                      onClick={fetchBalance}
                      disabled={!accountNo}
                    >
                      조회
                    </Button>
                  </Box>

                  {balance && !balance.error && (
                    <Box>
                      <Typography variant="body2">
                        예수금: {balance.deposit?.toLocaleString()}원
                      </Typography>
                      <Typography variant="body2">
                        출금 가능: {balance.withdrawable?.toLocaleString()}원
                      </Typography>
                      <Typography variant="body2">
                        주문 가능: {balance.orderable?.toLocaleString()}원
                      </Typography>
                    </Box>
                  )}

                  {balance?.error && (
                    <Alert severity="error">{balance.error}</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Market Status */}
          <Grid item xs={12}>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  장 운영 상태
                </Typography>
                {marketStatus && !marketStatus.error && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`KOSPI: ${marketStatus.kospi_status || '알 수 없음'}`}
                      color={marketStatus.kospi_status === 'OPEN' ? 'success' : 'default'}
                    />
                    <Chip
                      label={`KOSDAQ: ${marketStatus.kosdaq_status || '알 수 없음'}`}
                      color={marketStatus.kosdaq_status === 'OPEN' ? 'success' : 'default'}
                    />
                  </Box>
                )}
                {marketStatus?.error && (
                  <Alert severity="error">{marketStatus.error}</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </TabPanel>

        {/* Order Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    주문 요청
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="계좌 번호"
                        value={orderForm.account_no}
                        onChange={(e) => setOrderForm({ ...orderForm, account_no: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="종목 코드"
                        value={orderForm.symbol}
                        onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="주문 유형"
                        value={orderForm.order_type}
                        onChange={(e) => setOrderForm({ ...orderForm, order_type: e.target.value })}
                        SelectProps={{ native: true }}
                      >
                        <option value="BUY">매수</option>
                        <option value="SELL">매도</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="수량"
                        type="number"
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="가격 (비워두면 시장가)"
                        type="number"
                        value={orderForm.price}
                        onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={placeOrder}
                        disabled={!orderForm.account_no || !orderForm.symbol || !orderForm.quantity}
                        fullWidth
                      >
                        주문하기
                      </Button>
                    </Grid>
                  </Grid>

                  {orderResult && (
                    <Alert
                      severity={orderResult.success ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                    >
                      {orderResult.success ? (
                        <div>
                          <Typography>주문이 접수되었습니다.</Typography>
                          <Typography variant="body2">
                            주문 번호: {orderResult.data.order_no}
                          </Typography>
                        </div>
                      ) : (
                        <Typography>{orderResult.error}</Typography>
                      )}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Search Tab */}
        <TabPanel value={tabValue} index={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                종목 검색
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="검색어"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchStocks()}
                  placeholder="종목명 또는 코드 입력"
                />
                <Button
                  variant="contained"
                  onClick={searchStocks}
                  disabled={!searchKeyword}
                >
                  검색
                </Button>
              </Box>

              {searchResults.length > 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>종목 코드</TableCell>
                        <TableCell>종목명</TableCell>
                        <TableCell>현재가</TableCell>
                        <TableCell>변동률</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map((stock, idx) => (
                        <TableRow
                          key={idx}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            setStockSymbol(stock.symbol);
                            setOrderForm(prev => ({ ...prev, symbol: stock.symbol }));
                            setTabValue(1);
                          }}
                        >
                          <TableCell>{stock.symbol}</TableCell>
                          <TableCell>{stock.name}</TableCell>
                          <TableCell>{stock.price?.toLocaleString()}원</TableCell>
                          <TableCell
                            sx={{
                              color: stock.change_pct >= 0 ? 'error.main' : 'primary.main'
                            }}
                          >
                            {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct?.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default KiwoomRestApi;
