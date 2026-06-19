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
  Alert,
  Chip,
  Divider
} from '@mui/material';
import axios from 'axios';
import { Save as SaveIcon, CheckCircle, Error } from '@mui/icons-material';

function KiwoomApiSettings() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [configInfo, setConfigInfo] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
      setTestResult({ type: 'error', message: 'API 키와 비밀키를 입력해주세요.' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/config/test/`, {
        api_key: apiKey,
        api_secret: apiSecret
      });

      if (response.data.success) {
        setTestResult({ type: 'success', message: 'API 연결이 성공했습니다!' });
      } else {
        setTestResult({ type: 'error', message: response.data.error || '연결 실패' });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setTestResult({ type: 'error', message: '연결 오류: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 설정 저장
  const saveSettings = async () => {
    if (!apiKey || !apiSecret) {
      setSaveResult({ type: 'error', message: 'API 키와 비밀키를 입력해주세요.' });
      return;
    }

    setLoading(true);
    try {
      // .env 파일은 백엔드에서 직접 수정해야 하므로 안내 메시지 표시
      setSaveResult({
        type: 'info',
        message: '설정을 저장하려면 backend/.env 파일에 다음 내용을 추가하세요:\n\n' +
                 'KIWOOM_REST_API_KEY=' + apiKey + '\n' +
                 'KIWOOM_REST_API_SECRET=' + apiSecret + '\n\n' +
                 '그리고 Django 서버를 재시작해주세요.'
      });
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchConfigInfo();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        키움증권 API 설정
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        키움증권 Open API에서 발급받은 API 키와 비밀키를 입력하세요.
      </Typography>

      {/* 현재 설정 상태 */}
      {configInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              현재 설정 상태
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  모드
                </Typography>
                <Chip
                  label={configInfo.mode}
                  color={configInfo.mode === 'REAL' ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  API Key
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {configInfo.has_api_key ? configInfo.api_key_prefix : '설정되지 않음'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Base URL
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontSize: '0.875rem' }}>
                  {configInfo.base_url}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  상태
                </Typography>
                <Chip
                  label={configInfo.has_api_key ? '설정됨' : '미설정'}
                  color={configInfo.has_api_key ? 'success' : 'warning'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* API 설정 입력 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API 인증 정보 입력
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  키움증권 Open API(https://openapi.kiwoom.com)에서
                  API 키와 비밀키를 발급받으세요.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="API Key (App Key)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="발급받은 App Key 입력"
                  fullWidth
                  autoFocus
                  helperText="예: e4nGmfY9eAMzJtPbtUZV2iT-MzK67zLb9I61S-k6Tko"
                />

                <TextField
                  label="API Secret (Secret Key)"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="발급받은 Secret Key 입력"
                  type="password"
                  fullWidth
                  helperText="예: dVSA7tqvSQvQz5gYvwT42jissYcfW0BfKgIqakD4HRY"
                />

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={testConnection}
                    disabled={!apiKey || !apiSecret || loading}
                    startIcon={<CheckCircle />}
                    fullWidth
                  >
                    연결 테스트
                  </Button>
                  <Button
                    variant="contained"
                    onClick={saveSettings}
                    disabled={!apiKey || !apiSecret || loading}
                    startIcon={<SaveIcon />}
                    fullWidth
                  >
                    저장
                  </Button>
                </Box>
              </Box>

              {/* 테스트 결과 */}
              {testResult && (
                <Alert
                  severity={testResult.type}
                  sx={{ mt: 2 }}
                  onClose={() => setTestResult(null)}
                >
                  {testResult.message}
                </Alert>
              )}

              {/* 저장 결과 */}
              {saveResult && (
                <Alert
                  severity={saveResult.type}
                  sx={{ mt: 2 }}
                  onClose={() => setSaveResult(null)}
                >
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>
                    {saveResult.message}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 설정 가이드 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                설정 가이드
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  1. API 키 발급
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  키움증권 Open API 웹사이트에 접속하여 로그인 후
                  API 키와 비밀키를 발급받으세요.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  2. .env 파일 설정
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', mt: 1 }}>
                  <Typography variant="body2" component="pre" sx={{ m: 0, fontSize: '0.875rem' }}>
# backend/.env 파일에 추가
KIWOOM_REST_API_KEY=your_appkey
KIWOOM_REST_API_SECRET=your_secretkey
KIWOOM_REST_BASE_URL=https://api.kiwoom.com
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  3. 서버 재시작
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  .env 파일을 수정한 후 Django 서버를 재시작해야 적용됩니다.
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', mt: 1 }}>
                  <Typography variant="body2" component="pre" sx={{ m: 0, fontSize: '0.875rem' }}>
# 서버 중지: Ctrl+C
# 서버 시작:
cd backend
python manage.py runserver 8000
                  </Typography>
                </Paper>
              </Box>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  보안 주의
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  API 키와 비밀키는 중요한 정보입니다.
                  .env 파일을 Git에 커밋하지 않도록 주의하세요.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 지원되는 기능 */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            지원되는 API 기능
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">✅ 주식 현재가 조회</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">✅ 호가 조회</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">✅ 계좌 정보 조회</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">✅ 예수금 조회</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">✅ 주문 요청</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">✅ 장 운영 상태 조회</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">✅ 종목 검색</Typography>
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              API 연결 실패 시 자동으로 Mock 데이터를 사용하여 테스트할 수 있습니다.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
}

export default KiwoomApiSettings;
