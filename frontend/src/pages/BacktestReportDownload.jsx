import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  CheckCircle,
  Error
} from '@mui/icons-material';
import axios from 'axios';

function BacktestReportDownload() {
  const [results, setResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadBacktestResults();
  }, []);

  const loadBacktestResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/api/backtest/results/');
      setResults(response.data.results || response.data || []);
    } catch (err) {
      console.error('백테스팅 결과 로드 실패:', err);
      setError('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(results.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const downloadExcel = async (ids = null) => {
    const targetIds = ids || selectedIds;
    if (targetIds.length === 0) {
      setError('다운로드할 항목을 선택하세요.');
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const idsParam = Array.isArray(targetIds) ? targetIds.join(',') : targetIds;
      const response = await axios.get(
        `http://localhost:8000/api/backtest/reports/download_excel/?ids=${idsParam}`,
        { responseType: 'blob' }
      );

      // 파일 다운로드
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backtest_report_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccessMessage('Excel 다운로드 완료!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Excel 다운로드 실패:', err);
      setError('Excel 다운로드 실패');
    } finally {
      setDownloading(false);
    }
  };

  const downloadPDF = async (ids = null) => {
    const targetIds = ids || selectedIds;
    if (targetIds.length === 0) {
      setError('다운로드할 항목을 선택하세요.');
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const idsParam = Array.isArray(targetIds) ? targetIds.join(',') : targetIds;
      const response = await axios.get(
        `http://localhost:8000/api/backtest/reports/download_pdf/?ids=${idsParam}`,
        { responseType: 'blob' }
      );

      // 파일 다운로드
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backtest_report_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccessMessage('PDF 다운로드 완료!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('PDF 다운로드 실패:', err);
      setError('PDF 다운로드 실패');
    } finally {
      setDownloading(false);
    }
  };

  const downloadAll = async () => {
    setDownloading(true);
    setError(null);

    try {
      const response = await axios.get(
        'http://localhost:8000/api/backtest/reports/download_all/',
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backtest_all_report_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccessMessage('전체 리포트 다운로드 완료!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('전체 다운로드 실패:', err);
      setError('전체 다운로드 실패');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>로딩 중...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          백테스팅 리포트 다운로드
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Backtesting Report Download
        </Typography>
      </Box>

      {/* 알림 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* 다운로드 버튼 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ mr: 2 }}>
            다운로드 옵션
          </Typography>

          <Button
            variant="contained"
            startIcon={<TableChart />}
            onClick={() => downloadExcel()}
            disabled={selectedIds.length === 0 || downloading}
            sx={{ bgcolor: 'green', '&:hover': { bgcolor: 'darkgreen' } }}
          >
            선택 항목 Excel
          </Button>

          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={() => downloadPDF()}
            disabled={selectedIds.length === 0 || downloading}
            sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
          >
            선택 항목 PDF
          </Button>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={downloadAll}
            disabled={downloading}
          >
            전체 Excel
          </Button>

          {selectedIds.length > 0 && (
            <Chip
              label={`${selectedIds.length}개 선택`}
              color="primary"
              onDelete={() => setSelectedIds([])}
            />
          )}

          {downloading && (
            <CircularProgress size={24} />
          )}
        </Box>
      </Paper>

      {/* 백테스팅 결과 테이블 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < results.length}
                    checked={selectedIds.length === results.length && results.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>종목코드</TableCell>
                <TableCell>종목명</TableCell>
                <TableCell>전략</TableCell>
                <TableCell>시작일</TableCell>
                <TableCell>종료일</TableCell>
                <TableCell align="right">수익률(%)</TableCell>
                <TableCell align="right">승률(%)</TableCell>
                <TableCell align="right">최대낙폭(%)</TableCell>
                <TableCell align="center">다운로드</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      백테스팅 결과가 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => {
                  const isSelected = selectedIds.includes(result.id);
                  const isPositive = result.total_return >= 0;

                  return (
                    <TableRow
                      key={result.id}
                      hover
                      selected={isSelected}
                      onClick={() => handleSelectOne(result.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold">
                          {result.symbol?.ticker || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{result.symbol?.name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={result.strategy}
                          size="small"
                          color={isPositive ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{result.start_date}</TableCell>
                      <TableCell>{result.end_date}</TableCell>
                      <TableCell align="right">
                        <Typography
                          fontWeight="bold"
                          color={isPositive ? 'success.main' : 'error.main'}
                        >
                          {result.total_return > 0 ? '+' : ''}{result.total_return}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {result.win_rate}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="error.main" fontWeight="bold">
                          -{result.max_drawdown}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Excel 다운로드">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadExcel([result.id]);
                              }}
                              disabled={downloading}
                              sx={{ color: 'green' }}
                            >
                              <TableChart fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="PDF 다운로드">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadPDF([result.id]);
                              }}
                              disabled={downloading}
                              sx={{ color: 'error.main' }}
                            >
                              <PictureAsPdf fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 안내 */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="body2">
            • Excel 파일: 상세 데이터와 요약 통계를 포함합니다.<br />
            • PDF 파일: 깔끔한 포맷의 리포트를 생성합니다.<br />
            • 다중 선택: Ctrl+클릭으로 여러 항목을 선택할 수 있습니다.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
}

export default BacktestReportDownload;
