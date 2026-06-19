/**
 * Backtest Result Upload Component
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const BacktestUpload = () => {
  const [file, setFile] = useState(null);
  const [backtestName, setBacktestName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validExtensions = ['json', 'csv', 'xlsx'];
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        setError('JSON, CSV 또는 Excel 파일만 업로드 가능합니다');
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
    if (backtestName) {
      formData.append('backtest_name', backtestName);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/upload/backtest/`, formData, {
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
        백테스트 결과 업로드
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        JSON, CSV 또는 Excel 파일로 백테스트 결과를 업로드합니다.
      </Typography>

      {/* File Input */}
      <Box sx={{ mb: 3 }}>
        <input
          accept=".json,.csv,.xlsx"
          style={{ display: 'none' }}
          id="backtest-file-input"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="backtest-file-input">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            fullWidth
          >
            {file ? file.name : '파일 선택 (JSON/CSV/Excel)'}
          </Button>
        </label>
      </Box>

      {/* Backtest Name */}
      <TextField
        fullWidth
        label="백테스트 이름 (선택사항)"
        value={backtestName}
        onChange={(e) => setBacktestName(e.target.value)}
        placeholder="예: P1 Pattern Backtest 2024-01"
        sx={{ mb: 2 }}
        disabled={uploading}
      />

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
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {result.message}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              • 처리된 레코드: {result.records_processed}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Sample Format */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          📋 JSON 파일 예시
        </Typography>
        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
{`{
  "backtest_name": "P1 Pattern Test",
  "start_date": "2023-01-01",
  "end_date": "2024-01-01",
  "initial_capital": 100000000,
  "final_capital": 115000000,
  "total_return": 0.15,
  "win_rate": 0.65,
  "sharpe_ratio": 1.8,
  "max_drawdown": -0.12,
  "trades": [
    {
      "symbol": "005930",
      "entry_date": "2023-02-01",
      "exit_date": "2023-03-01",
      "entry_price": 82000,
      "exit_price": 85000,
      "return": 0.0366
    }
  ]
}`}
        </Typography>
      </Paper>
    </Box>
  );
};

export default BacktestUpload;
