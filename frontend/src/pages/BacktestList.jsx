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
  Button,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function BacktestList() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/backtest/results/');
      setResults(response.data.results || response.data);
    } catch (error) {
      console.error('결과 로딩 실패:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 백테스팅 결과 목록
      </Typography>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>종목</TableCell>
                <TableCell>전략</TableCell>
                <TableCell>기간</TableCell>
                <TableCell align="right">수익률</TableCell>
                <TableCell align="right">승률</TableCell>
                <TableCell align="right">거래수</TableCell>
                <TableCell align="right">MDD</TableCell>
                <TableCell>실행일</TableCell>
                <TableCell>상세</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.symbol.ticker}</TableCell>
                  <TableCell>
                    <Chip label={result.strategy} size="small" />
                  </TableCell>
                  <TableCell>
                    {result.start_date} ~ {result.end_date}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${result.total_return}%`}
                      color={result.total_return >= 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{result.win_rate}%</TableCell>
                  <TableCell align="right">{result.total_trades}</TableCell>
                  <TableCell align="right">-{result.max_drawdown}%</TableCell>
                  <TableCell>
                    {new Date(result.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/backtest/results/${result.id}`)}
                    >
                      상세보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default BacktestList;
