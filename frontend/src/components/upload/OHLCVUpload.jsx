/**
 * OHLCV Data Upload Component
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { CloudUpload, CheckCircle, Error } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const OHLCVUpload = () => {
  const [file, setFile] = useState(null);
  const [symbol, setSymbol] = useState('');
  const [exchange, setExchange] = useState('KOSPI');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validExtensions = ['csv', 'xlsx', 'xls'];
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        setError('CSV 또는 Excel 파일만 업로드 가능합니다');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택해주세요');
      return;
    }

    if (!symbol) {
      setError('종목코드를 입력해주세요');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('symbol', symbol);
    formData.append('exchange', exchange);
    formData.append('skip_duplicates', skipDuplicates);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload/ohlcv/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        '업로드에 실패했습니다'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        OHLCV 시세 데이터 업로드
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        CSV 또는 Excel 파일로 OHLCV 데이터를 일괄 등록합니다.
        필수 컬럼: date, open, high, low, close, volume
      </Typography>

      {/* File Input */}
      <Box sx={{ mb: 3 }}>
        <input
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          id="ohlcv-file-input"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="ohlcv-file-input">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            fullWidth
          >
            {file ? file.name : '파일 선택 (CSV/Excel)'}
          </Button>
        </label>
      </Box>

      {/* Symbol Input */}
      <TextField
        fullWidth
        label="종목코드"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="예: 005930"
        sx={{ mb: 2 }}
        disabled={uploading}
      />

      {/* Exchange Select */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>거래소</InputLabel>
        <Select
          value={exchange}
          onChange={(e) => setExchange(e.target.value)}
          label="거래소"
          disabled={uploading}
        >
          <MenuItem value="KOSPI">KOSPI</MenuItem>
          <MenuItem value="KOSDAQ">KOSDAQ</MenuItem>
          <MenuItem value="NASDAQ">NASDAQ</MenuItem>
          <MenuItem value="NYSE">NYSE</MenuItem>
        </Select>
      </FormControl>

      {/* Skip Duplicates Switch */}
      <FormControlLabel
        control={
          <Switch
            checked={skipDuplicates}
            onChange={(e) => setSkipDuplicates(e.target.checked)}
            disabled={uploading}
          />
        }
        label="중복 날짜 데이터 업데이트"
        sx={{ mb: 2, display: 'block' }}
      />

      {/* Upload Button */}
      <Button
        variant="contained"
        onClick={handleUpload}
        disabled={!file || !symbol || uploading}
        fullWidth
        sx={{ mb: 3 }}
      >
        {uploading ? '업로드 중...' : '업로드'}
      </Button>

      {/* Progress */}
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            파일을 처리 중입니다...
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Success Result */}
      {result && (
        <Alert
          severity={result.records_failed > 0 ? 'warning' : 'success'}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {result.message}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              • 처리된 레코드: {result.records_processed}
            </Typography>
            <Typography variant="body2">
              • 생성됨: {result.records_created}
            </Typography>
            <Typography variant="body2">
              • 업데이트됨: {result.records_updated}
            </Typography>
            {result.records_failed > 0 && (
              <Typography variant="body2" color="error">
                • 실패: {result.records_failed}
              </Typography>
            )}
          </Box>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="warning.main" gutterBottom>
                경고:
              </Typography>
              {result.warnings.slice(0, 5).map((warning, idx) => (
                <Typography key={idx} variant="caption" display="block">
                  • {warning}
                </Typography>
              ))}
              {result.warnings.length > 5 && (
                <Typography variant="caption" display="block">
                  ...외 {result.warnings.length - 5}건
                </Typography>
              )}
            </Box>
          )}

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="error.main" gutterBottom>
                오류:
              </Typography>
              {result.errors.slice(0, 5).map((error, idx) => (
                <Typography key={idx} variant="caption" display="block">
                  • {error}
                </Typography>
              ))}
              {result.errors.length > 5 && (
                <Typography variant="caption" display="block">
                  ...외 {result.errors.length - 5}건
                </Typography>
              )}
            </Box>
          )}
        </Alert>
      )}

      {/* Sample Format */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          📋 CSV 파일 예시
        </Typography>
        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
          date,open,high,low,close,volume
          2024-01-01,82000,82500,81800,82300,15000000
          2024-01-02,82300,82800,82100,82600,18000000
          2024-01-03,82600,83100,82400,82900,16000000
        </Typography>
      </Paper>
    </Box>
  );
};

export default OHLCVUpload;
