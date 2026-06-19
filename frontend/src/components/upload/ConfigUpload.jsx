/**
 * YAML Configuration Upload Component
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
  FormControlLabel,
  Switch,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ConfigUpload = () => {
  const [file, setFile] = useState(null);
  const [configType, setConfigType] = useState('pattern_rules');
  const [overwrite, setOverwrite] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validExtensions = ['yaml', 'yml'];
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        setError('YAML 파일만 업로드 가능합니다');
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
    formData.append('config_type', configType);
    formData.append('overwrite', overwrite);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload/config/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err) {
      console.error('Upload error:', err);
      if (err.response?.status === 409) {
        setError(
          '설정 파일이 이미 존재합니다. 덮어쓰기 옵션을 사용하세요.'
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.response?.data?.detail ||
          '업로드에 실패했습니다'
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const configTypeLabels = {
    pattern_rules: '패턴 규칙 (rules.yaml)',
    backtest_params: '백테스트 파라미터 (backtest_params.yaml)',
    alert_settings: '알림 설정 (alert_settings.yaml)',
    market_config: '시장 설정 (market_config.yaml)'
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        YAML 설정 파일 업로드
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        YAML 형식의 설정 파일을 업로드하여 시스템 설정을 관리합니다.
      </Typography>

      {/* File Input */}
      <Box sx={{ mb: 3 }}>
        <input
          accept=".yaml,.yml"
          style={{ display: 'none' }}
          id="config-file-input"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="config-file-input">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            fullWidth
          >
            {file ? file.name : '파일 선택 (YAML)'}
          </Button>
        </label>
      </Box>

      {/* Config Type Select */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>설정 유형</InputLabel>
        <Select
          value={configType}
          onChange={(e) => setConfigType(e.target.value)}
          label="설정 유형"
          disabled={uploading}
        >
          <MenuItem value="pattern_rules">패턴 규칙 (rules.yaml)</MenuItem>
          <MenuItem value="backtest_params">백테스트 파라미터</MenuItem>
          <MenuItem value="alert_settings">알림 설정</MenuItem>
          <MenuItem value="market_config">시장 설정</MenuItem>
        </Select>
      </FormControl>

      {/* Overwrite Switch */}
      <FormControlLabel
        control={
          <Switch
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            disabled={uploading}
            color="warning"
          />
        }
        label="기존 파일 덮어쓰기"
        sx={{ mb: 2, display: 'block' }}
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
        </Alert>
      )}

      {/* Sample Format */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          📋 YAML 파일 예시 (pattern_rules)
        </Typography>
        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
{`# 패턴 규칙 설정
patterns:
  P1:
    name: "매집급등형"
    min_score: 70
    conditions:
      - ma_alignment: true
      - volume_surge: 1.5
      - price_above_ma60: true

  P2:
    name: "추세전환형"
    min_score: 65
    conditions:
      - ma_crossover: true
      - volume_confirm: true

  P3:
    name: "IPO소형주반등형"
    min_score: 60
    conditions:
      - ipo_days: 365
      - market_cap: 10000000000
      - volume_increase: 2.0
`}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ConfigUpload;
