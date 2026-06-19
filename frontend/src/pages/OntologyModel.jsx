import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Science as ScienceIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import GraphVisualization from '../components/ontology/GraphVisualization';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function OntologyModel() {
  const [tabValue, setTabValue] = useState(0);
  const [models, setModels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('class');
  const [hierarchyData, setHierarchyData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    uri: '',
    description: '',
    parentClass: '',
    domain: '',
    range: '',
    dataType: 'string'
  });

  useEffect(() => {
    fetchModels();
    fetchClasses();
    fetchProperties();
    generateHierarchyData();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      // Mock data - 실제로는 API 호출
      setModels([
        {
          id: 1,
          name: 'Stock Trading Ontology',
          uri: 'http://powerstock.org/ontology/trading',
          version: '1.0',
          classesCount: 25,
          propertiesCount: 40,
          createdAt: '2026-01-15'
        }
      ]);
    } catch (err) {
      setError('모델 로딩 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    // Mock data
    setClasses([
      { id: 1, name: 'Stock', uri: ':Stock', instances: 500 },
      { id: 2, name: 'Pattern', uri: ':Pattern', instances: 50 },
      { id: 3, name: 'Indicator', uri: ':Indicator', instances: 100 },
      { id: 4, name: 'Trade', uri: ':Trade', instances: 1000 },
      { id: 5, name: 'Portfolio', uri: ':Portfolio', instances: 20 }
    ]);
  };

  const fetchProperties = async () => {
    // Mock data
    setProperties([
      { id: 1, name: 'hasPrice', domain: 'Stock', range: 'decimal', type: 'DatatypeProperty' },
      { id: 2, name: 'hasPattern', domain: 'Stock', range: 'Pattern', type: 'ObjectProperty' },
      { id: 3, name: 'hasIndicator', domain: 'Stock', range: 'Indicator', type: 'ObjectProperty' },
      { id: 4, name: 'tradedAt', domain: 'Trade', range: 'dateTime', type: 'DatatypeProperty' },
      { id: 5, name: 'belongsTo', domain: 'Trade', range: 'Portfolio', type: 'ObjectProperty' }
    ]);
  };

  const generateHierarchyData = () => {
    // 클래스 계층 구조 데이터 생성
    const hierarchyClasses = [
      { id: 1, entity: 'Thing', type: 'OntologyClass', properties: { level: 0 } },
      { id: 2, entity: 'Stock', type: 'OntologyClass', properties: { level: 1, instances: 500 } },
      { id: 3, entity: 'Pattern', type: 'OntologyClass', properties: { level: 1, instances: 50 } },
      { id: 4, entity: 'Indicator', type: 'OntologyClass', properties: { level: 1, instances: 100 } },
      { id: 5, entity: 'Trade', type: 'OntologyClass', properties: { level: 1, instances: 1000 } },
      { id: 6, entity: 'Portfolio', type: 'OntologyClass', properties: { level: 1, instances: 20 } },
      { id: 7, entity: 'TechnicalPattern', type: 'OntologyClass', properties: { level: 2, instances: 30 } },
      { id: 8, entity: 'CandlestickPattern', type: 'OntologyClass', properties: { level: 2, instances: 20 } },
      { id: 9, entity: 'TrendIndicator', type: 'OntologyClass', properties: { level: 2, instances: 40 } },
      { id: 10, entity: 'MomentumIndicator', type: 'OntologyClass', properties: { level: 2, instances: 60 } }
    ];

    const hierarchyRelationships = [
      { from: 'Stock', relation: 'subClassOf', to: 'Thing' },
      { from: 'Pattern', relation: 'subClassOf', to: 'Thing' },
      { from: 'Indicator', relation: 'subClassOf', to: 'Thing' },
      { from: 'Trade', relation: 'subClassOf', to: 'Thing' },
      { from: 'Portfolio', relation: 'subClassOf', to: 'Thing' },
      { from: 'TechnicalPattern', relation: 'subClassOf', to: 'Pattern' },
      { from: 'CandlestickPattern', relation: 'subClassOf', to: 'Pattern' },
      { from: 'TrendIndicator', relation: 'subClassOf', to: 'Indicator' },
      { from: 'MomentumIndicator', relation: 'subClassOf', to: 'Indicator' }
    ];

    const nodes = hierarchyClasses.map(cls => ({
      data: {
        id: cls.entity,
        label: cls.entity,
        type: cls.type,
        properties: cls.properties
      }
    }));

    const edges = hierarchyRelationships.map((rel, index) => ({
      data: {
        id: `edge${index}`,
        source: rel.from,
        target: rel.to,
        label: rel.relation
      }
    }));

    setHierarchyData({ elements: { nodes, edges } });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      uri: '',
      description: '',
      parentClass: '',
      domain: '',
      range: '',
      dataType: 'string'
    });
  };

  const handleSave = async () => {
    try {
      // API 호출로 저장
      handleCloseDialog();
      // Refresh data
    } catch (err) {
      setError('저장 실패: ' + err.message);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <ScienceIcon sx={{ mr: 2, fontSize: 40 }} />
          온톨로지 모델
        </Typography>
        <Typography variant="body1" color="text.secondary">
          주식 트레이딩 도메인 온톨로지 모델을 관리합니다.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="모델 목록" />
          <Tab label="클래스 (Classes)" />
          <Tab label="속성 (Properties)" />
          <Tab label="계층 구조" />
        </Tabs>

        {/* 모델 목록 탭 */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('model')}
            >
              새 모델
            </Button>
          </Box>
          <Grid container spacing={3}>
            {models.map((model) => (
              <Grid item xs={12} md={6} lg={4} key={model.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {model.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      URI: {model.uri}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      버전: {model.version}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Chip label={`클래스: ${model.classesCount}`} size="small" />
                      <Chip label={`속성: ${model.propertiesCount}`} size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      생성일: {model.createdAt}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<EditIcon />}>편집</Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>삭제</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* 클래스 탭 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('class')}
            >
              새 클래스
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>URI</TableCell>
                  <TableCell>인스턴스 수</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>{cls.name}</TableCell>
                    <TableCell>{cls.uri}</TableCell>
                    <TableCell>{cls.instances}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>편집</Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>삭제</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* 속성 탭 */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('property')}
            >
              새 속성
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>타입</TableCell>
                  <TableCell>도메인</TableCell>
                  <TableCell>레인지</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell>{prop.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={prop.type}
                        color={prop.type === 'ObjectProperty' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{prop.domain}</TableCell>
                    <TableCell>{prop.range}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<EditIcon />}>편집</Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>삭제</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* 계층 구조 탭 */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="body1" gutterBottom>
            온톨로지 클래스 계층 구조 시각화
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, height: 700 }}>
            {/* 그래프 시각화 */}
            <Box sx={{ flex: 1 }}>
              {hierarchyData ? (
                <GraphVisualization
                  data={hierarchyData}
                  onNodeClick={setSelectedNode}
                  layoutType="hierarchical"
                />
              ) : (
                <Paper sx={{ p: 3, minHeight: 600, bgcolor: '#f5f5f5' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                    <ScienceIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      계층 구조 뷰 준비 중
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>

            {/* 노드 상세 정보 패널 */}
            {selectedNode && (
              <Paper sx={{ width: 300, p: 2, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  클래스 상세 정보
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    클래스 이름
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedNode.label}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    타입
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedNode.type}
                  </Typography>

                  {selectedNode.properties && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                        속성
                      </Typography>
                      {Object.entries(selectedNode.properties).map(([key, value]) => (
                        <Box key={key} sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {key}
                          </Typography>
                          <Typography variant="body2">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </Typography>
                        </Box>
                      ))}
                    </>
                  )}
                </Box>
              </Paper>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* 다이얼로그 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'class' && '새 클래스 추가'}
          {dialogType === 'property' && '새 속성 추가'}
          {dialogType === 'model' && '새 모델 추가'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'class' && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="클래스 이름"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="URI"
                fullWidth
                variant="outlined"
                value={formData.uri}
                onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>부모 클래스</InputLabel>
                <Select
                  value={formData.parentClass}
                  label="부모 클래스"
                  onChange={(e) => setFormData({ ...formData, parentClass: e.target.value })}
                >
                  <MenuItem value="">없음</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.name}>{cls.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          {dialogType === 'property' && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="속성 이름"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>속성 타입</InputLabel>
                <Select
                  value={formData.dataType}
                  label="속성 타입"
                  onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                >
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="integer">Integer</MenuItem>
                  <MenuItem value="decimal">Decimal</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                  <MenuItem value="dateTime">DateTime</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>도메인 클래스</InputLabel>
                <Select
                  value={formData.domain}
                  label="도메인 클래스"
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.name}>{cls.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSave} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default OntologyModel;
