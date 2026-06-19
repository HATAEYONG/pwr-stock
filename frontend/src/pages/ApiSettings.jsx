/**
 * API 설정 관리 페이지
 * API Configuration Management Page
 *
 * 모든 API의 활성화/비활성화 상태를 관리하는 페이지
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Switch,
  Chip,
  Grid,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Api as ApiIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 기본 API 설정 정보
const DEFAULT_API_CONFIGS = [
  {
    service_id: 'kiwoom',
    service_name: '키움증권 API',
    description: '키움증권 Open API (Windows 로컬 환경 전용)',
    base_url: 'https://mockapi.kiwoom.com',
    requires_auth: true,
    icon: '🔑',
    category: '국내 주식',
  },
  {
    service_id: 'koreainvestment',
    service_name: '한국투자증권 API',
    description: '한국투자증권 Open API',
    base_url: 'https://openapivts.koreainvestment.com:29443',
    requires_auth: true,
    icon: '📈',
    category: '국내 주식',
  },
  {
    service_id: 'polygon',
    service_name: 'Polygon.io API',
    description: '미국 시장 실시간 데이터 API',
    base_url: 'https://api.polygon.io',
    requires_auth: true,
    icon: '🇺🇸',
    category: '해외 주식',
  },
  {
    service_id: 'yahoo',
    service_name: 'Yahoo Finance API',
    description: 'Yahoo Finance API',
    base_url: 'https://query1.finance.yahoo.com',
    requires_auth: false,
    icon: '📊',
    category: '해외 주식',
  },
  {
    service_id: 'nasdaq',
    service_name: '나스닥 API',
    description: '나스닥 데이터 API',
    base_url: 'https://api.nasdaq.com',
    requires_auth: false,
    icon: '🏛️',
    category: '해외 주식',
  },
];

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function ApiSettings() {
  const [tabValue, setTabValue] = useState(0);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  // API 설정 로드
  const loadConfigs = async () => {
    setLoading(true);
    try {
      // 먼저 초기화 시도
      await axios.post(`${API_BASE_URL}/api/config/initialize/`);

      // 설정 로드
      const response = await axios.get(`${API_BASE_URL}/api/config/`);
      if (response.data.success) {
        setConfigs(response.data.data);
      }
    } catch (error) {
      console.error('API 설정 로드 실패:', error);
      // 기본 설정 사용
      setConfigs(
        DEFAULT_API_CONFIGS.map((config) => ({
          ...config,
          is_enabled: config.service_id === 'kiwoom',
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  // 통계 로드
  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/config/stats/?days=7`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  // 로그 로드
  const loadLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/config/logs/?limit=20`);
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error('로그 로드 실패:', error);
    }
  };

  useEffect(() => {
    loadConfigs();
    loadStats();
    loadLogs();
  }, []);

  // 토글 변경
  const handleToggle = async (serviceId) => {
    setSaving(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/config/${serviceId}/toggle/`
      );

      if (response.data.success) {
        setConfigs((prev) =>
          prev.map((config) =>
            config.service_id === serviceId
              ? { ...config, is_enabled: !config.is_enabled }
              : config
          )
        );
        showSnackbar(response.data.message, 'success');
      }
    } catch (error) {
      showSnackbar('토글 실패: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  // 대량 업데이트
  const handleBulkUpdate = async (updatedConfigs) => {
    setSaving(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/config/bulk-update/`, {
        configs: updatedConfigs.map((config) => ({
          service_id: config.service_id,
          is_enabled: config.is_enabled,
        })),
      });

      if (response.data.success) {
        setConfigs(updatedConfigs);
        showSnackbar(`${response.data.updated.length}개 설정이 업데이트되었습니다.`, 'success');
      }
    } catch (error) {
      showSnackbar('저장 실패: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 활성화된 API 수
  const enabledCount = configs.filter((c) => c.is_enabled).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <ApiIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              API 설정 관리
            </Typography>
            <Typography variant="body2" color="text.secondary">
              활성화된 API: {enabledCount} / {configs.length}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadConfigs();
              loadStats();
              loadLogs();
            }}
            disabled={loading}
          >
            새로고침
          </Button>
        </Box>
      </Box>

      {/* 상태 요약 */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {enabledCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    활성화된 API
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {configs.length - enabledCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    비활성화된 API
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TimelineIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.reduce((sum, s) => sum + s.total_calls, 0) || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    7일간 총 호출
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <BarChartIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.reduce((sum, s) => sum + s.failed_calls, 0) || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    7일간 실패
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 탭 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="API 설정" />
          <Tab label="호출 통계" />
          <Tab label="최근 로그" />
        </Tabs>
      </Paper>

      {/* API 설정 탭 */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          {configs.map((config) => (
            <Grid item xs={12} md={6} key={config.service_id}>
              <Card
                sx={{
                  border: config.is_enabled ? '2px solid' : '1px solid',
                  borderColor: config.is_enabled ? 'success.main' : 'divider',
                  opacity: config.is_enabled ? 1 : 0.7,
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h3">{config.icon}</Typography>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {config.service_name}
                        </Typography>
                        <Chip
                          label={config.category}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                    <Switch
                      checked={config.is_enabled}
                      onChange={() => handleToggle(config.service_id)}
                      disabled={saving}
                      color="success"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {config.description}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`Base URL: ${config.base_url}`}
                      size="small"
                      variant="filled"
                      sx={{ fontSize: '0.75rem' }}
                    />
                    {config.requires_auth && (
                      <Chip
                        label="인증 필요"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label={`우선순위: ${config.priority || 0}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* 호출 통계 탭 */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>서비스</TableCell>
                <TableCell align="right">총 호출</TableCell>
                <TableCell align="right">성공</TableCell>
                <TableCell align="right">실패</TableCell>
                <TableCell align="right">성공률</TableCell>
                <TableCell align="right">평균 응답시간</TableCell>
                <TableCell>마지막 호출</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats?.map((stat) => (
                <TableRow key={stat.service}>
                  <TableCell>
                    <Typography fontWeight="bold">
                      {configs.find((c) => c.service_id === stat.service)?.service_name || stat.service}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{stat.total_calls.toLocaleString()}</TableCell>
                  <TableCell align="right">{stat.success_calls.toLocaleString()}</TableCell>
                  <TableCell align="right">{stat.failed_calls.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${stat.success_rate.toFixed(1)}%`}
                      color={stat.success_rate >= 95 ? 'success' : stat.success_rate >= 80 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{stat.avg_duration_ms.toFixed(0)}ms</TableCell>
                  <TableCell>
                    {stat.last_call_at
                      ? new Date(stat.last_call_at).toLocaleString('ko-KR')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {(!stats || stats.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">통계 데이터가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* 최근 로그 탭 */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>시간</TableCell>
                <TableCell>서비스</TableCell>
                <TableCell>엔드포인트</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell align="right">소요시간</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(log.created_at).toLocaleString('ko-KR')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.service}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {log.endpoint}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {log.success ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <ErrorIcon color="error" fontSize="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">로그가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ApiSettings;
