import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Telegram as TelegramIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';

function AlertSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);

  // 폼 데이터
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notifyStart, setNotifyStart] = useState(true);
  const [notifyRisk, setNotifyRisk] = useState(true);
  const [notifySell, setNotifySell] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [minScore, setMinScore] = useState(70);
  const [patterns, setPatterns] = useState('');
  const [exchanges, setExchanges] = useState('');

  // 메시지
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSettings();
    loadLogs();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/alerts/settings/');
      const data = response.data.results || response.data;
      
      if (data.length > 0) {
        const s = data[0];
        setSettings(s);
        setTelegramChatId(s.telegram_chat_id);
        setIsActive(s.is_active);
        setNotifyStart(s.notify_start);
        setNotifyRisk(s.notify_risk);
        setNotifySell(s.notify_sell);
        setDailySummary(s.daily_summary);
        setMinScore(s.min_score);
        setPatterns(s.patterns || '');
        setExchanges(s.exchanges || '');
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/alerts/logs/recent/');
      setLogs(response.data.slice(0, 10));
    } catch (error) {
      console.error('로그 로드 실패:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/alerts/logs/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  const handleGetChatId = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await axios.get('http://localhost:8000/api/alerts/settings/get_chat_id/');
      
      if (response.data.success) {
        setTelegramChatId(response.data.chat_id);
        setSuccessMessage(`Chat ID를 가져왔습니다: ${response.data.chat_id}`);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Chat ID를 가져올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramChatId) {
      setErrorMessage('Chat ID를 입력하세요.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await axios.post('http://localhost:8000/api/alerts/settings/test_telegram/', {
        chat_id: telegramChatId
      });

      if (response.data.success) {
        setSuccessMessage('테스트 메시지를 전송했습니다! Telegram을 확인하세요.');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || '테스트 메시지 전송 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const data = {
      telegram_chat_id: telegramChatId,
      is_active: isActive,
      notify_start: notifyStart,
      notify_risk: notifyRisk,
      notify_sell: notifySell,
      daily_summary: dailySummary,
      min_score: minScore,
      patterns: patterns,
      exchanges: exchanges
    };

    try {
      if (settings) {
        // 업데이트
        await axios.put(`http://localhost:8000/api/alerts/settings/${settings.id}/`, data);
        setSuccessMessage('설정이 업데이트되었습니다!');
      } else {
        // 생성
        await axios.post('http://localhost:8000/api/alerts/settings/', data);
        setSuccessMessage('설정이 저장되었습니다!');
      }
      
      loadSettings();
    } catch (error) {
      setErrorMessage('설정 저장 실패: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🔔 실시간 알림 설정
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Telegram으로 실시간 트리거 알림을 받으세요!</strong>
        <br />
        START/RISK/SELL 신호가 발생하면 즉시 알림을 보내드립니다.
      </Alert>

      {/* 통계 카드 */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  오늘 총 알림
                </Typography>
                <Typography variant="h4">
                  {stats.total}건
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  START 신호
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.start}건
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  RISK 신호
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.risk}건
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  SELL 신호
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.sell}건
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 성공/에러 메시지 */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Telegram 설정 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <TelegramIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Telegram Bot 설정
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="warning">
              <strong>Telegram Bot 설정 방법:</strong>
              <ol>
                <li>Telegram에서 @BotFather 검색</li>
                <li>/newbot 명령어로 새 Bot 생성</li>
                <li>Bot Token을 서버 환경변수 TELEGRAM_BOT_TOKEN에 설정</li>
                <li>생성한 Bot에게 아무 메시지나 보내기</li>
                <li>아래 [Chat ID 가져오기] 버튼 클릭</li>
              </ol>
            </Alert>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Telegram Chat ID"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              helperText="Bot에게 메시지를 보낸 후 'Chat ID 가져오기'를 클릭하세요"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGetChatId}
              disabled={loading}
              sx={{ height: 56 }}
            >
              Chat ID 가져오기
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleTestTelegram}
              disabled={loading || !telegramChatId}
              startIcon={loading ? <CircularProgress size={20} /> : <TelegramIcon />}
            >
              {loading ? '전송 중...' : 'Telegram 연결 테스트'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 알림 설정 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          알림 옵션
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  color="primary"
                />
              }
              label="알림 활성화"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notifyStart}
                    onChange={(e) => setNotifyStart(e.target.checked)}
                    color="success"
                  />
                }
                label="🚀 START 신호 알림"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notifyRisk}
                    onChange={(e) => setNotifyRisk(e.target.checked)}
                    color="warning"
                  />
                }
                label="⚠️ RISK 신호 알림"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notifySell}
                    onChange={(e) => setNotifySell(e.target.checked)}
                    color="error"
                  />
                }
                label="🎯 SELL 신호 알림"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dailySummary}
                    onChange={(e) => setDailySummary(e.target.checked)}
                  />
                }
                label="📊 일일 요약 알림"
              />
            </FormGroup>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="최소 점수"
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              helperText="이 점수 이상의 종목만 알림"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Pattern 필터"
              value={patterns}
              onChange={(e) => setPatterns(e.target.value)}
              helperText="쉼표로 구분 (예: P1,P2)"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="거래소 필터"
              value={exchanges}
              onChange={(e) => setExchanges(e.target.value)}
              helperText="쉼표로 구분 (예: KOSDAQ,NASDAQ)"
            />
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={loading || !telegramChatId}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            sx={{ minWidth: 200 }}
          >
            {loading ? '저장 중...' : '설정 저장'}
          </Button>
        </Box>
      </Paper>

      {/* 최근 알림 로그 */}
      <Paper>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            최근 알림 내역
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>시각</TableCell>
                <TableCell>신호</TableCell>
                <TableCell>종목</TableCell>
                <TableCell>메시지</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.sent_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.signal_type}
                      color={
                        log.signal_type === 'START' ? 'success' :
                        log.signal_type === 'RISK' ? 'warning' :
                        log.signal_type === 'SELL' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {log.symbol_ticker && `[${log.symbol_ticker}] ${log.symbol_name}`}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {log.message.split('\n')[0]}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {logs.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              알림 내역이 없습니다.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default AlertSettings;
