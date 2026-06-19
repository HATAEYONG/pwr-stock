import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent
} from '@mui/material';
import {
  Hub as HubIcon,
  Search as SearchIcon,
  AccountTree as AccountTreeIcon,
  List as ListIcon
} from '@mui/icons-material';
import axios from 'axios';
import GraphVisualization from '../components/ontology/GraphVisualization';

function KnowledgeGraph() {
  const [viewMode, setViewMode] = useState('graph');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [entities, setEntities] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [graphData, setGraphData] = useState({ elements: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [layoutType, setLayoutType] = useState('force');

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      // API 호출
      const response = await axios.get('http://localhost:8000/api/ontology/knowledge-graph/');
      const data = response.data;

      setEntities(data.entities || []);
      setRelationships(data.relationships || []);

      // Cytoscape용 데이터 변환
      const elements = convertToCytoscapeFormat(data.entities, data.relationships);
      setGraphData({ elements });

    } catch (error) {
      console.error('Failed to fetch graph data:', error);

      // Mock data (API 연결 전용)
      const mockEntities = [
        { id: 1, entity: '삼성전자', type: 'Stock', properties: { price: 72500, volume: 15234000 } },
        { id: 2, entity: 'SK하이닉스', type: 'Stock', properties: { price: 185000, volume: 2345000 } },
        { id: 3, entity: '매집급등형', type: 'Pattern', properties: { reliability: 0.75 } },
        { id: 4, entity: 'RSI', type: 'Indicator', properties: { value: 65.5 } },
        { id: 5, entity: 'MACD', type: 'Indicator', properties: { value: 1.2 } },
        { id: 6, entity: 'LG화학', type: 'Stock', properties: { price: 380000, volume: 890000 } },
        { id: 7, entity: '추세전환형', type: 'Pattern', properties: { reliability: 0.68 } }
      ];

      const mockRelationships = [
        { from: '삼성전자', relation: 'hasPattern', to: '매집급등형' },
        { from: '삼성전자', relation: 'hasIndicator', to: 'RSI' },
        { from: 'SK하이닉스', relation: 'hasIndicator', to: 'RSI' },
        { from: '삼성전자', relation: 'correlatedWith', to: 'SK하이닉스' },
        { from: '삼성전자', relation: 'hasIndicator', to: 'MACD' },
        { from: 'LG화학', relation: 'hasPattern', to: '추세전환형' },
        { from: 'LG화학', relation: 'hasIndicator', to: 'MACD' }
      ];

      setEntities(mockEntities);
      setRelationships(mockRelationships);

      const elements = convertToCytoscapeFormat(mockEntities, mockRelationships);
      setGraphData({ elements });
    } finally {
      setLoading(false);
    }
  };

  const convertToCytoscapeFormat = (entities, relationships) => {
    // entity 필드 자체를 ID로 사용
    const nodes = entities.map(entity => ({
      data: {
        id: entity.entity, // 전체 entity 값을 ID로 사용
        label: entity.entity.includes('/') ? entity.entity.split('/').pop() : entity.entity,
        type: entity.type,
        ...entity
      }
    }));

    const edges = relationships.map((rel, index) => {
      // 관계의 from/to가 실제로 존재하는지 확인
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

    return { nodes, edges };
  };

  const handleNodeClick = (nodeData) => {
    setSelectedNode(nodeData);
  };

  const filteredEntities = entities.filter(entity =>
    entity.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <HubIcon sx={{ mr: 2, fontSize: 40 }} />
          지식 그래프
        </Typography>
        <Typography variant="body1" color="text.secondary">
          온톨로지 기반 지식 그래프를 조회하고 탐색합니다.
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="엔티티 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>클래스 필터</InputLabel>
              <Select
                value={selectedClass}
                label="클래스 필터"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="Stock">종목</MenuItem>
                <MenuItem value="Pattern">패턴</MenuItem>
                <MenuItem value="Indicator">지표</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>레이아웃</InputLabel>
              <Select
                value={layoutType}
                label="레이아웃"
                onChange={(e) => setLayoutType(e.target.value)}
              >
                <MenuItem value="force">Force-Directed</MenuItem>
                <MenuItem value="circle">Circle</MenuItem>
                <MenuItem value="grid">Grid</MenuItem>
                <MenuItem value="concentric">Concentric</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              fullWidth
            >
              <ToggleButton value="graph">
                <AccountTreeIcon sx={{ mr: 1 }} />
                그래프
              </ToggleButton>
              <ToggleButton value="list">
                <ListIcon sx={{ mr: 1 }} />
                목록
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" fullWidth onClick={fetchGraphData} disabled={loading}>
              {loading ? '로딩 중...' : '조회'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* 그래프 뷰 */}
        {viewMode === 'graph' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  그래프 시각화
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`노드: ${graphData.elements?.nodes?.length || 0}`} color="primary" />
                  <Chip label={`엣지: ${graphData.elements?.edges?.length || 0}`} color="secondary" />
                </Box>
              </Box>

              {graphData.elements && (graphData.elements.nodes?.length > 0) ? (
                <GraphVisualization
                  data={graphData}
                  layoutType={layoutType}
                  onNodeClick={handleNodeClick}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <HubIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    그래프 데이터가 없습니다
                  </Typography>
                </Box>
              )}

              {/* 선택된 노드 정보 */}
              {selectedNode && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      선택된 엔티티
                    </Typography>
                    <Typography><strong>이름:</strong> {selectedNode.label}</Typography>
                    <Typography><strong>타입:</strong> {selectedNode.type}</Typography>
                    {selectedNode.properties && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>속성:</Typography>
                        {Object.entries(selectedNode.properties).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${value}`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Paper>
          </Grid>
        )}

        {/* 목록 뷰 */}
        {viewMode === 'list' && (
          <>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  엔티티 ({filteredEntities.length})
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredEntities.map((entity, index) => (
                    <Card key={index} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => setSelectedNode(entity)}>
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {entity.entity.split('/').pop()}
                          </Typography>
                          <Chip
                            label={entity.type}
                            color={entity.type === 'Stock' ? 'primary' : entity.type === 'Pattern' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                        {entity.properties && Object.entries(entity.properties).slice(0, 3).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${value}`}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  관계 ({relationships.length})
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {relationships.map((rel, index) => (
                    <Box key={index} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={rel.from.split('/').pop()} size="small" color="primary" />
                        <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 'bold' }}>
                          {rel.relation}
                        </Typography>
                        <Chip label={rel.to.split('/').pop()} size="small" color="primary" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
}

export default KnowledgeGraph;
