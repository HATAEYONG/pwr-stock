import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { getSymbols } from '../services/api';

function SymbolManagement() {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    try {
      const response = await getSymbols();
      setSymbols(response.data.results || response.data);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          📋 종목 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => alert('종목 추가 기능은 Django Admin에서 이용하세요')}
        >
          종목 추가
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          종목 추가/수정은 현재 <strong>Django Admin</strong>에서만 가능합니다.
          <br />
          → <a href="http://localhost:8000/admin/market/symbol/" target="_blank" rel="noopener noreferrer">
            http://localhost:8000/admin/market/symbol/
          </a>
        </Typography>
      </Alert>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>티커</TableCell>
                <TableCell>종목명</TableCell>
                <TableCell>거래소</TableCell>
                <TableCell>섹터</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>상장일</TableCell>
                <TableCell>상장주식수</TableCell>
                <TableCell>등록일</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {symbols.map((symbol) => (
                <TableRow key={symbol.id}>
                  <TableCell>
                    <Typography fontWeight="bold">
                      {symbol.ticker}
                    </Typography>
                  </TableCell>
                  <TableCell>{symbol.name}</TableCell>
                  <TableCell>{symbol.exchange}</TableCell>
                  <TableCell>{symbol.sector || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={symbol.is_active ? '활성' : '비활성'}
                      color={symbol.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {symbol.listing_date || '-'}
                    {symbol.listing_date && (
                      <Chip 
                        label="IPO" 
                        size="small" 
                        color="warning" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {symbol.shares_outstanding 
                      ? symbol.shares_outstanding.toLocaleString() 
                      : '-'}
                    {symbol.shares_outstanding && symbol.shares_outstanding <= 10000000 && (
                      <Chip 
                        label="소형주" 
                        size="small" 
                        color="info" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(symbol.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => window.open(
                        `http://localhost:8000/admin/market/symbol/${symbol.id}/change/`,
                        '_blank'
                      )}
                    >
                      수정
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {symbols.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              등록된 종목이 없습니다.
            </Typography>
          </Box>
        )}
      </Paper>

      <Box mt={4}>
        <Alert severity="success">
          <Typography variant="body2">
            💡 <strong>다음 단계:</strong> 종목을 등록했다면 
            <strong> "2. 데이터 Import"</strong>로 이동하여 OHLCV 데이터를 import 하세요.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}

export default SymbolManagement;
