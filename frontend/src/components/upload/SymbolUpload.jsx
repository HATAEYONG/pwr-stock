/**
 * Symbol Master Data Upload Component
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const SymbolUpload = () => {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('upsert');
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

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload/symbols/`, formData, {
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
        종목 마스터 데이터 업로드
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        CSV 또는 Excel 파일로 종목 정보를 일괄 등록합니다.
        필수 컬럼: ticker, name, exchange
      </Typography>

      {/* File Input */}
      <Box sx={{ mb: 3 }}>
        <input
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          id="symbol-file-input"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="symbol-file-input">
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

      {/* Mode Select */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>업로드 모드</InputLabel>
        <Select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          label="업로드 모드"
          disabled={uploading}
        >
          <MenuItem value="create">
            <em>create</em> - 새 종목만 생성
          </MenuItem>
          <MenuItem value="update">
            <em>update</em> - 기존 종목만 업데이트
          </MenuItem>
          <MenuItem value="upsert">
            <em>upsert</em> - 새 종목 생성 + 기존 종목 업데이트
          </MenuItem>
        </Select>
      </FormControl>

      {/* Upload Button */}
      <Button
        variant="contained"
        onClick={handleUpload}
        disabled={!file || uploading}
        fullWidth
        sx={{ mb: 3 }}
      >
        {uploading ? '업로드 중...' : '업로드'}
      </Button>

      {/* Progress */}
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
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
        </Alert>
      )}

      {/* Sample Format */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          📋 CSV 파일 예시
        </Typography>
        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
          ticker,name,exchange,sector,market_cap,listed_shares,listed_date
          005930,삼성전자,KOSPI,전자电气,470000000000,7685928248,1968-11-05
          000660,SK하이닉스,KOSPI,반도체,98000000000,2983782596,1988-07-01
          035420,Naver,KOSDAQ,서비스,25000000000,185467856,1999-10-29
        </Typography>
      </Paper>
    </Box>
  );
};

export default SymbolUpload;
