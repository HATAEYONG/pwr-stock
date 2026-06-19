import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function ImageAnalysis() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('이미지를 선택해주세요.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      // Backend에 이미지 업로드 및 분석 요청
      const response = await axios.post(`${API_BASE_URL}/analysis/analyze-image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err) {
      console.error('이미지 분석 오류:', err);
      setError('이미지 분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getPatternColor = (patternType) => {
    switch (patternType) {
      case 'P1': return '#4caf50';
      case 'P2': return '#2196f3';
      case 'P3': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#4caf50';
    if (confidence >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          📊 차트 이미지 분석
        </Typography>
        <Typography variant="body1" color="text.secondary">
          차트 이미지를 업로드하면 AI가 패턴을 자동으로 분석합니다.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left: Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              1. 이미지 업로드
            </Typography>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => document.getElementById('image-upload').click()}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    borderRadius: 1,
                  }}
                />
              ) : (
                <Box>
                  <UploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    클릭하여 이미지 선택
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PNG, JPG, JPEG (최대 10MB)
                  </Typography>
                </Box>
              )}
            </Box>

            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  선택된 파일: {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  크기: {(selectedFile.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleAnalyze}
              disabled={!selectedFile || analyzing}
              startIcon={analyzing ? <CircularProgress size={20} /> : <AnalyticsIcon />}
              sx={{ mt: 3 }}
            >
              {analyzing ? '분석 중...' : '분석 시작'}
            </Button>
          </Paper>
        </Grid>

        {/* Right: Results Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              2. 분석 결과
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!result && !analyzing && !error && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  color: 'text.secondary',
                }}
              >
                <ImageIcon sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="body1">
                  이미지를 업로드하고 분석을 시작하세요
                </Typography>
              </Box>
            )}

            {analyzing && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  AI가 차트를 분석 중입니다...
                </Typography>
                <LinearProgress sx={{ mt: 2 }} />
              </Box>
            )}

            {result && !analyzing && (
              <Box>
                {/* Overall Status */}
                <Box sx={{ mb: 3 }}>
                  <Chip
                    icon={result.success ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={result.success ? '분석 완료' : '분석 실패'}
                    color={result.success ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  />
                </Box>

                {/* Detected Patterns */}
                {result.patterns && result.patterns.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      감지된 패턴
                    </Typography>
                    {result.patterns.map((pattern, idx) => (
                      <Card key={idx} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h6" sx={{ color: getPatternColor(pattern.name) }}>
                              {pattern.name}
                            </Typography>
                            <Chip
                              label={`확신도: ${pattern.confidence || 0}%`}
                              size="small"
                              sx={{
                                bgcolor: getConfidenceColor(pattern.confidence || 0),
                                color: 'white',
                              }}
                            />
                          </Box>

                          {pattern.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {pattern.description}
                            </Typography>
                          )}

                          {pattern.signals && pattern.signals.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                신호:
                              </Typography>
                              {pattern.signals.map((signal, sidx) => (
                                <Chip
                                  key={sidx}
                                  label={signal}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}

                {/* Indicators */}
                {result.indicators && result.indicators.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      기술적 지표
                    </Typography>
                    <Grid container spacing={1}>
                      {result.indicators.map((indicator, idx) => (
                        <Grid item xs={6} key={idx}>
                          <Card variant="outlined">
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Typography variant="caption" color="text.secondary">
                                {indicator.name}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {indicator.value}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Recommendation */}
                {result.recommendation && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      추천사항
                    </Typography>
                    <Typography variant="body2">
                      {result.recommendation}
                    </Typography>
                  </Alert>
                )}

                {/* Analysis Time */}
                {result.analysis_time && (
                  <Typography variant="caption" color="text.secondary">
                    분석 시간: {new Date(result.analysis_time).toLocaleString()}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Analyses */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          최근 분석 내역
        </Typography>
        <Typography variant="body2" color="text.secondary">
          최근 7일간 {result?.recent_count || 0}건의 이미지 분석이 있습니다.
        </Typography>
      </Paper>
    </Container>
  );
}

export default ImageAnalysis;
