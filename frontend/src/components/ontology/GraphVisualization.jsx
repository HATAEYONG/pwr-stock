/**
 * Graph Visualization Component using Cytoscape.js
 * 온톨로지 그래프 시각화 컴포넌트
 */
import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';

// Register cola layout extension
cytoscape.use(cola);

const GraphVisualization = ({ data, onNodeClick, layoutType = 'cola' }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!data || !containerRef.current || initializedRef.current) return;

    initializedRef.current = true;

    // Debug: 데이터 확인
    console.log('GraphVisualization data:', data);
    console.log('Nodes:', data.elements?.nodes);
    console.log('Edges:', data.elements?.edges);

    // Validate edges
    const validEdges = [];
    const nodeIds = new Set(data.elements?.nodes?.map(n => n.data.id) || []);

    console.log('All node IDs:', Array.from(nodeIds));

    data.elements?.edges?.forEach((edge, index) => {
      console.log(`Checking edge ${index}:`, edge.data);
      console.log(`  - Source: ${edge.data.source}, exists: ${nodeIds.has(edge.data.source)}`);
      console.log(`  - Target: ${edge.data.target}, exists: ${nodeIds.has(edge.data.target)}`);

      if (nodeIds.has(edge.data.source) && nodeIds.has(edge.data.target)) {
        validEdges.push(edge);
      } else {
        console.warn('Invalid edge:', edge);
      }
    });

    const validatedElements = {
      nodes: data.elements?.nodes || [],
      edges: validEdges
    };

    console.log('Validated elements:', validatedElements);

    // Small delay to ensure container is ready
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      // Initialize Cytoscape
      const cy = cytoscape({
        container: containerRef.current,
        elements: validatedElements,
        style: [
        {
          selector: 'node',
          style: {
            'background-color': '#667eea',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '60px',
            'height': '60px',
            'font-size': '14px',
            'font-weight': 'bold',
            'border-width': 2,
            'border-color': '#4552b5',
            'text-outline-width': 2,
            'text-outline-color': '#667eea'
          }
        },
        {
          selector: 'node[type="Stock"]',
          style: {
            'background-color': '#667eea',
            'border-color': '#4552b5'
          }
        },
        {
          selector: 'node[type="Pattern"]',
          style: {
            'background-color': '#48bb78',
            'border-color': '#38a169'
          }
        },
        {
          selector: 'node[type="Indicator"]',
          style: {
            'background-color': '#ed8936',
            'border-color': '#dd6b20'
          }
        },
        {
          selector: 'node[type="OntologyClass"]',
          style: {
            'background-color': '#764ba2',
            'border-color': '#4e2b7a'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#f56565',
            'border-color': '#e53e3e',
            'border-width': 3
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#cbd5e0',
            'target-arrow-color': '#cbd5e0',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.5,
            'label': 'data(label)',
            'font-size': '11px',
            'text-rotation': 'autorotate',
            'text-margin-y': -10
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#667eea',
            'target-arrow-color': '#667eea',
            'width': 4
          }
        }
      ],
      layout: {
        name: layoutType === 'force' ? 'cola' :
              layoutType === 'circle' ? 'circle' :
              layoutType === 'grid' ? 'grid' : 'concentric',
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 50,
        nodeSpacing: 50,
        edgeLength: 100
      },
        minZoom: 0.1,
        maxZoom: 3,
        wheelSensitivity: 0.2
      });

      // Store reference
      cyRef.current = cy;

      // Add event listeners
      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        const data = node.data();
        if (onNodeClick) {
          onNodeClick(data);
        }
      });

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          // Clicked on background
          cy.$(':selected').unselect();
        }
      });
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [data, layoutType, onNodeClick]);

  // Update layout when layout type changes
  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: layoutType === 'force' ? 'cola' :
              layoutType === 'circle' ? 'circle' :
              layoutType === 'grid' ? 'grid' : 'concentric',
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 50
      }).run();
    }
  }, [layoutType]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '600px',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}
    />
  );
};

export default GraphVisualization;
