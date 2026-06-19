import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Storage as StorageIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

function SemanticTriples() {
  const [triples, setTriples] = useState([]);
  const [subject, setSubject] = useState('');
  const [predicate, setPredicate] = useState('');
  const [object, setObject] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    uniqueSubjects: 0,
    uniquePredicates: 0,
    uniqueObjects: 0
  });

  useEffect(() => {
    fetchTriples();
  }, []);

  const fetchTriples = async () => {
    // Mock data
    const mockTriples = [
      { id: 1, subject: '삼성전자', predicate: 'rdf:type', object: 'powerstock:Stock' },
      { id: 2, subject: '삼성전자', predicate: 'powerstock:hasPrice', object: '72500' },
      { id: 3, subject: '삼성전자', predicate: 'powerstock:hasPattern', object: '매집급등형' },
      { id: 4, subject: 'SK하이닉스', predicate: 'rdf:type', object: 'powerstock:Stock' },
      { id: 5, subject: 'SK하이닉스', predicate: 'powerstock:hasPrice', object: '185000' },
      { id: 6, subject: 'SK하이닉스', predicate: 'powerstock:hasPattern', object: '추세전환형' },
      { id: 7, subject: '삼성전자', predicate: 'powerstock:hasIndicator', object: 'RSI' },
      { id: 8, subject: 'RSI', predicate: 'powerstock:hasValue', object: '65.5' },
      { id: 9, subject: '매집급등형', predicate: 'rdf:type', object: 'powerstock:Pattern' },
      { id: 10, subject: '추세전환형', predicate: 'rdf:type', object: 'powerstock:Pattern' }
    ];
    setTriples(mockTriples);
    setStats({
      total: mockTriples.length,
      uniqueSubjects: new Set(mockTriples.map(t => t.subject)).size,
      uniquePredicates: new Set(mockTriples.map(t => t.predicate)).size,
      uniqueObjects: new Set(mockTriples.map(t => t.object)).size
    });
  };

  const handleAddTriple = () => {
    if (subject && predicate && object) {
      const newTriple = {
        id: triples.length + 1,
        subject,
        predicate,
        object
      };
      setTriples([...triples, newTriple]);
      setOpenDialog(false);
      setSubject('');
      setPredicate('');
      setObject('');
    }
  };

  const handleDeleteTriple = (id) => {
    setTriples(triples.filter(t => t.id !== id));
  };

  const handleExport = () => {
    const rdf = triples.map(t =>
      `<${t.subject}> <${t.predicate}> "${t.object}" .`
    ).join('\n');

    const blob = new Blob([rdf], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'triples.rdf';
    a.click();
  };

  const filteredTriples = triples.filter(t =>
    t.subject.toLowerCase().includes(filterSubject.toLowerCase())
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <StorageIcon sx={{ mr: 2, fontSize: 40 }} />
          시맨틱 트리플
        </Typography>
        <Typography variant="body1" color="text.secondary">
          RDF 트리플 데이터를 관리하고 조회합니다.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 통계 카드 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                전체 트리플
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                고유 주체
              </Typography>
              <Typography variant="h4">
                {stats.uniqueSubjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                고유 술어
              </Typography>
              <Typography variant="h4">
                {stats.uniquePredicates}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                고유 객체
              </Typography>
              <Typography variant="h4">
                {stats.uniqueObjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 트리플 관리 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                트리플 목록 ({filteredTriples.length}건)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                >
                  가져오기
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                >
                  내보내기
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                >
                  트리플 추가
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="주체로 필터"
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  placeholder="예: 삼성전자"
                />
              </Grid>
            </Grid>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>주체 (Subject)</TableCell>
                    <TableCell>술어 (Predicate)</TableCell>
                    <TableCell>객체 (Object)</TableCell>
                    <TableCell align="right">작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTriples.map((triple) => (
                    <TableRow key={triple.id} hover>
                      <TableCell>
                        <Chip label={triple.subject} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={triple.predicate}
                          variant="outlined"
                          size="small"
                          color="secondary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={triple.object} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTriple(triple.id)}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredTriples.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                표시할 트리플이 없습니다.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* RDF 예시 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              RDF 형식 예시
            </Typography>
            <Box sx={{
              bgcolor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              overflow: 'auto'
            }}>
              {triples.slice(0, 5).map(t => (
                <Box key={t.id}>
                  &lt;{t.subject}&gt; &lt;{t.predicate}&gt; "{t.object}" .
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 트리플 추가 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 트리플 추가</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="주체 (Subject)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="예: 삼성전자"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>술어 (Predicate)</InputLabel>
                <Select
                  value={predicate}
                  label="술어 (Predicate)"
                  onChange={(e) => setPredicate(e.target.value)}
                >
                  <MenuItem value="rdf:type">rdf:type</MenuItem>
                  <MenuItem value="powerstock:hasPrice">powerstock:hasPrice</MenuItem>
                  <MenuItem value="powerstock:hasPattern">powerstock:hasPattern</MenuItem>
                  <MenuItem value="powerstock:hasIndicator">powerstock:hasIndicator</MenuItem>
                  <MenuItem value="powerstock:correlatedWith">powerstock:correlatedWith</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="객체 (Object)"
                value={object}
                onChange={(e) => setObject(e.target.value)}
                placeholder="예: 72500 또는 매집급등형"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button variant="contained" onClick={handleAddTriple}>추가</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SemanticTriples;
