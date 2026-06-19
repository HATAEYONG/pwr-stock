import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import GraphVisualization from '../components/ontology/GraphVisualization';

function RelationshipGraph() {
  const [nodeSize, setNodeSize] = useState(30);
  const [showLabels, setShowLabels] = useState(true);
  const [layoutType, setLayoutType] = useState('force');
  const [filterRelation, setFilterRelation] = useState('all');
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  const relations = [
    'all',
    'hasPattern',
    'hasIndicator',
    'correlatedWith',
    'belongsTo',
    'tradedAt'
  ];

  // Mock 데이터
  const mockEntities = [
    { id: 1, entity: '삼성전자', type: 'Stock', properties: { price: 72500, volume: 15234000, marketCap: '430조' } },
    { id: 2, entity: 'SK하이닉스', type: 'Stock', properties: { price: 185000, volume: 2345000, marketCap: '108조' } },
    { id: 3, entity: '매집급등형', type: 'Pattern', properties: { reliability: 0.75, description: '급등하는 패턴' } },
    { id: 4, entity: 'RSI', type: 'Indicator', properties: { value: 65.5, period: 14 } },
    { id: 5, entity: 'MACD', type: 'Indicator', properties: { value: 1.2, signal: 0.8 } },
    { id: 6, entity: 'LG화학', type: 'Stock', properties: { price: 380000, volume: 890000, marketCap: '65조' } },
    { id: 7, entity: '추세전환형', type: 'Pattern', properties: { reliability: 0.68, description: '추세가 바뀌는 패턴' } },
    { id: 8, entity: '셀트리온', type: 'Stock', properties: { price: 195000, volume: 560000, marketCap: '28조' } },
    { id: 9, entity: '이격도', type: 'Indicator', properties: { value: 2.5, period: 5 } },
    { id: 10, entity: '박스권', type: 'Pattern', properties: { reliability: 0.82, description: '횡보 장세' } },
    { id: 11, entity: '반도체', type: 'OntologyClass', properties: { category: 'Sector' } },
    { id: 12, entity: '화학', type: 'OntologyClass', properties: { category: 'Sector' } },
    { id: 13, entity: '바이오', type: 'OntologyClass', properties: { category: 'Sector' } }
  ];

  const mockRelationships = [
    { from: '삼성전자', relation: 'hasPattern', to: '매집급등형' },
    { from: '삼성전자', relation: 'hasIndicator', to: 'RSI' },
    { from: 'SK하이닉스', relation: 'hasIndicator', to: 'RSI' },
    { from: '삼성전자', relation: 'correlatedWith', to: 'SK하이닉스' },
    { from: '삼성전자', relation: 'hasIndicator', to: 'MACD' },
    { from: 'LG화학', relation: 'hasPattern', to: '추세전환형' },
    { from: 'LG화학', relation: 'hasIndicator', to: 'MACD' },
    { from: '셀트리온', relation: 'hasIndicator', to: '이격도' },
    { from: '셀트리온', relation: 'hasPattern', to: '박스권' },
    { from: 'SK하이닉스', relation: 'correlatedWith', to: '삼성전자' },
    { from: 'LG화학', relation: 'correlatedWith', to: '삼성전자' },
    { from: '삼성전자', relation: 'belongsTo', to: '반도체' },
    { from: 'SK하이닉스', relation: 'belongsTo', to: '반도체' },
    { from: 'LG화학', relation: 'belongsTo', to: '화학' },
    { from: '셀트리온', relation: 'belongsTo', to: '바이오' }
  ];

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/ontology/relationships/');
        const data = response.data;
        const cytoscapeData = convertToCytoscapeFormat(data.entities || mockEntities, data.relationships || mockRelationships);
        setGraphData(cytoscapeData);
      } catch (error) {
        console.error('Failed to load relationship data:', error);
        // Mock 데이터 사용
        const cytoscapeData = convertToCytoscapeFormat(mockEntities, mockRelationships);
        setGraphData(cytoscapeData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Cytoscape 형식으로 변환
  const convertToCytoscapeFormat = (entities, relationships) => {
    const nodes = entities.map(entity => ({
      data: {
        id: entity.entity,
        label: entity.entity.includes('/') ? entity.entity.split('/').pop() : entity.entity,
        type: entity.type,
        properties: entity.properties || {}
      }
    }));

    let filteredRelationships = relationships;
    if (filterRelation !== 'all') {
      filteredRelationships = relationships.filter(rel => rel.relation === filterRelation);
    }

    const edges = filteredRelationships.map((rel, index) => {
      const sourceExists = entities.some(e => e.entity === rel.from);
      const targetExists = entities.some(e => e.entity === rel.to);

      if (sourceExists && targetExists) {
        return {
          data: {
            id: `edge${index}`,
            source: rel.from,
            target: rel.to,
            label: rel.relation
          }
        };
      }
      return null;
    }).filter(edge => edge !== null);

    return { elements: { nodes, edges } };
  };

  const handleNodeClick = (nodeData) => {
    setSelectedNode(nodeData);
  };

  const handleZoomIn = () => {
    // Zoom in logic would be handled by Cytoscape
    console.log('Zoom in');
  };

  const handleZoomOut = () => {
    // Zoom out logic would be handled by Cytoscape
    console.log('Zoom out');
  };

  const handleReset = () => {
    setSelectedNode(null);
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <AccountTreeIcon sx={{ mr: 2, fontSize: 40 }} />
          관계 그래프
        </Typography>
        <Typography variant="body1" color="text.secondary">
          엔티티 간의 관계를 시각화하고 분석합니다.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 컨트롤 패널 */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              그래프 설정
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>레이아웃 타입</InputLabel>
              <Select
                value={layoutType}
                label="레이아웃 타입"
                onChange={(e) => setLayoutType(e.target.value)}
              >
                <MenuItem value="force">Force-Directed</MenuItem>
                <MenuItem value="circular">Circular</MenuItem>
                <MenuItem value="hierarchical">Hierarchical</MenuItem>
                <MenuItem value="grid">Grid</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>관계 필터</InputLabel>
              <Select
                value={filterRelation}
                label="관계 필터"
                onChange={(e) => setFilterRelation(e.target.value)}
              >
                {relations.map((rel) => (
                  <MenuItem key={rel} value={rel}>
                    {rel === 'all' ? '전체' : rel}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>노드 크기</Typography>
              <Slider
                value={nodeSize}
                onChange={(e, newValue) => setNodeSize(newValue)}
                min={10}
                max={100}
                valueLabelDisplay="auto"
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                />
              }
              label="라벨 표시"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ZoomInIcon />}
                fullWidth
              >
                확대
              </Button>
              <Button
                variant="outlined"
                startIcon={<ZoomOutIcon />}
                fullWidth
              >
                축소
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                fullWidth
              >
                초기화
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* 그래프 뷰 */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3, minHeight: 600 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                그래프 뷰
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small">
                  PNG 다운로드
                </Button>
                <Button variant="outlined" size="small">
                  SVG 다운로드
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, height: 700 }}>
              {/* 그래프 시각화 */}
              <Box sx={{ flex: 1 }}>
                {graphData ? (
                  <GraphVisualization
                    data={graphData}
                    onNodeClick={handleNodeClick}
                    layoutType={layoutType}
                  />
                ) : (
                  <Box sx={{
                    bgcolor: '#fafafa',
                    borderRadius: 2,
                    height: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #ddd'
                  }}>
                    <Typography variant="h6" color="text.secondary">
                      그래프 데이터가 없습니다
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* 노드 상세 정보 패널 */}
              {selectedNode && (
                <Paper sx={{ width: 300, p: 2, overflow: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    노드 상세 정보
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedNode.id}
                    </Typography>

                    <Typography variant="subtitle2" color="text.secondary">
                      라벨
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
          </Paper>
        </Grid>

        {/* 통계 카드 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                총 노드 수
              </Typography>
              <Typography variant="h4">
                {graphData?.elements?.nodes?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                총 엣지 수
              </Typography>
              <Typography variant="h4">
                {graphData?.elements?.edges?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                그래프 밀도
              </Typography>
              <Typography variant="h4">
                {graphData?.elements?.nodes?.length && graphData?.elements?.edges?.length
                  ? (graphData.elements.edges.length / (graphData.elements.nodes.length * (graphData.elements.nodes.length - 1) / 2)).toFixed(3)
                  : '0.000'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default RelationshipGraph;
