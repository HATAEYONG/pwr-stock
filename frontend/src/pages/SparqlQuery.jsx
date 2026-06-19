import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  History as HistoryIcon,
  Save as SaveIcon
} from '@mui/icons-material';

function SparqlQuery() {
  const [query, setQuery] = useState(`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX powerstock: <http://powerstock.org/ontology/>

SELECT ?stock ?price ?pattern
WHERE {
  ?stock a powerstock:Stock .
  ?stock powerstock:hasPrice ?price .
  ?stock powerstock:hasPattern ?pattern .
  FILTER (?price > 50000)
}
LIMIT 10`);
  const [results, setResults] = useState([]);
  const [queryTime, setQueryTime] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([
    {
      id: 1,
      timestamp: '2026-01-20 10:00:00',
      query: 'SELECT ?stock WHERE { ?stock a powerstock:Stock }',
      resultCount: 500
    },
    {
      id: 2,
      timestamp: '2026-01-20 11:30:00',
      query: 'SELECT ?pattern WHERE { ?pattern a powerstock:Pattern }',
      resultCount: 50
    }
  ]);

  const handleExecute = () => {
    setError(null);
    const startTime = Date.now();

    // Mock execution
    setTimeout(() => {
      setQueryTime((Date.now() - startTime));
      setResults([
        {
          stock: '삼성전자',
          price: '72500',
          pattern: '매집급등형'
        },
        {
          stock: 'SK하이닉스',
          price: '185000',
          pattern: '추세전환형'
        },
        {
          stock: 'LG화학',
          price: '380000',
          pattern: 'IPO반등형'
        }
      ]);
    }, 500);
  };

  const templates = [
    {
      name: '전체 종목 조회',
      query: `PREFIX powerstock: <http://powerstock.org/ontology/>\n\nSELECT ?stock ?price\nWHERE {\n  ?stock a powerstock:Stock .\n  ?stock powerstock:hasPrice ?price\n}`
    },
    {
      name: '패턴별 종목',
      query: `PREFIX powerstock: <http://powerstock.org/ontology/>\n\nSELECT ?stock ?pattern\nWHERE {\n  ?stock a powerstock:Stock .\n  ?stock powerstock:hasPattern ?pattern\n}`
    },
    {
      name: '기술적 지표 조회',
      query: `PREFIX powerstock: <http://powerstock.org/ontology/>\n\nSELECT ?stock ?indicator ?value\nWHERE {\n  ?stock a powerstock:Stock .\n  ?stock powerstock:hasIndicator ?indicator .\n  ?indicator powerstock:hasValue ?value\n}`
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <CodeIcon sx={{ mr: 2, fontSize: 40 }} />
          SPARQL 쿼리
        </Typography>
        <Typography variant="body1" color="text.secondary">
          온톨로지 데이터를 SPARQL로 쿼리하고 결과를 확인합니다.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 쿼리 에디터 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">SPARQL 쿼리</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<SaveIcon />}>
                  저장
                </Button>
                <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleExecute}>
                  실행
                </Button>
              </Box>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={15}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                }
              }}
              placeholder="SPARQL 쿼리를 입력하세요..."
            />
            {queryTime && (
              <Box sx={{ mt: 2 }}>
                <Chip label={`실행 시간: ${queryTime}ms`} color="primary" />
                <Chip label={`결과: ${results.length}건`} sx={{ ml: 1 }} />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 쿼리 템플릿 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              쿼리 템플릿
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {templates.map((template, index) => (
                <Card
                  key={index}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                  onClick={() => setQuery(template.query)}
                >
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle2">
                      {template.name}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* 쿼리 결과 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              쿼리 결과
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {results.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {Object.keys(results[0]).map((key) => (
                        <TableCell key={key}>{key}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((row, index) => (
                      <TableRow key={index} hover>
                        {Object.values(row).map((value, i) => (
                          <TableCell key={i}>{value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                쿼리를 실행하면 결과가 여기에 표시됩니다.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* 쿼리 이력 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1 }} />
                쿼리 이력
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>시간</TableCell>
                    <TableCell>쿼리</TableCell>
                    <TableCell>결과 수</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.timestamp}</TableCell>
                      <TableCell>
                        <Box sx={{ maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.query}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${item.resultCount}건`} size="small" />
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => setQuery(item.query)}>
                          불러오기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default SparqlQuery;
