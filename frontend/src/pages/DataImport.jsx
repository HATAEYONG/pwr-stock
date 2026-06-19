import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  TextField,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  Info as InfoIcon 
} from '@mui/icons-material';

function DataImport() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    csvFile: null,
    listingDate: '',
    sharesOutstanding: ''
  });

  const steps = [
    '종목 정보 입력',
    'CSV 파일 선택',
    'Import 실행'
  ];

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleFileChange = (event) => {
    setFormData({
      ...formData,
      csvFile: event.target.files[0]
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleImport = () => {
    // 실제로는 FormData를 만들어 backend로 전송
    alert(
      `현재 이 기능은 Django 커맨드로만 가능합니다.\n\n` +
      `터미널에서 다음 명령어를 실행하세요:\n\n` +
      `python manage.py import_ohlcv ${formData.csvFile?.name || 'data.csv'} \\\n` +
      `  --ticker ${formData.ticker} \\\n` +
      `  --name "${formData.name}"` +
      (formData.listingDate ? ` \\\n  --listing-date ${formData.listingDate}` : '') +
      (formData.sharesOutstanding ? ` \\\n  --shares ${formData.sharesOutstanding}` : '')
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📥 데이터 Import
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Step 2:</strong> OHLCV 데이터를 CSV 파일로 import 합니다.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              종목 정보를 입력하세요
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="종목 티커"
                  placeholder="예: AAPL"
                  value={formData.ticker}
                  onChange={handleChange('ticker')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="종목명"
                  placeholder="예: Apple Inc."
                  value={formData.name}
                  onChange={handleChange('name')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="상장일 (Pattern 3용)"
                  InputLabelProps={{ shrink: true }}
                  value={formData.listingDate}
                  onChange={handleChange('listingDate')}
                  helperText="Pattern 3 분석 시 필요"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="상장주식수 (Pattern 3용)"
                  placeholder="예: 5000000"
                  value={formData.sharesOutstanding}
                  onChange={handleChange('sharesOutstanding')}
                  helperText="Pattern 3 분석 시 필요"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              CSV 파일을 선택하세요
            </Typography>
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              <strong>CSV 포맷:</strong> date, open, high, low, close, volume
            </Alert>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ mt: 2 }}
            >
              파일 선택
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {formData.csvFile && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                선택된 파일: <strong>{formData.csvFile.name}</strong>
              </Typography>
            )}
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Import 정보 확인
            </Typography>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="body2" gutterBottom>
                  <strong>티커:</strong> {formData.ticker}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>종목명:</strong> {formData.name}
                </Typography>
                {formData.listingDate && (
                  <Typography variant="body2" gutterBottom>
                    <strong>상장일:</strong> {formData.listingDate}
                  </Typography>
                )}
                {formData.sharesOutstanding && (
                  <Typography variant="body2" gutterBottom>
                    <strong>상장주식수:</strong> {Number(formData.sharesOutstanding).toLocaleString()}
                  </Typography>
                )}
                <Typography variant="body2" gutterBottom>
                  <strong>CSV 파일:</strong> {formData.csvFile?.name || '없음'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            이전
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleImport}
                startIcon={<UploadIcon />}
              >
                Import 실행
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && (!formData.ticker || !formData.name)) ||
                  (activeStep === 1 && !formData.csvFile)
                }
              >
                다음
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="body2">
          <strong>CLI 명령어:</strong>
        </Typography>
        <Box component="pre" sx={{ mt: 1, backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
{`cd backend
python manage.py import_ohlcv data.csv \\
  --ticker AAPL \\
  --name "Apple Inc." \\
  --listing-date 2020-01-15 \\
  --shares 5000000`}
        </Box>
      </Alert>

      <Box mt={4}>
        <Alert severity="success">
          <Typography variant="body2">
            💡 <strong>다음 단계:</strong> 데이터를 import 했다면 
            <strong> "3. 패턴 분석"</strong> 메뉴로 이동하여 분석을 실행하세요.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}

export default DataImport;
