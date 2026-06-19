/**
 * 패턴 분석 차트 컴포넌트
 *
 * 캔들 차트와 이동평균선을 시각화합니다
 */
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme
} from '@mui/material';

const PatternChart = ({ data, symbolName, startSignal }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary" align="center">
            차트 데이터가 없습니다
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 데이터 포맷팅
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
  }));

  // 최근 90일만 표시
  const recentData = chartData.slice(-90);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {symbolName} - 가격 및 이동평균선 차트
        </Typography>

        {/* 가격 및 이동평균선 차트 */}
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <ComposedChart data={recentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <YAxis
                yAxisId="price"
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8
                }}
                labelFormatter={(label) => `날짜: ${label}`}
                formatter={(value, name) => {
                  if (name === '종가') {
                    return [`${value.toLocaleString()}원`, '종가'];
                  }
                  return [value.toLocaleString(), name];
                }}
              />
              <Legend />

              {/* 캔들 바 (시가-종가 구간) */}
              <Bar
                yAxisId="price"
                dataKey="close"
                fill={startSignal ? '#ff5722' : '#2196f3'}
                opacity={0.3}
                name="종가"
                barSize={8}
              />

              {/* 이동평균선들 */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ma5"
                stroke="#FF6B6B"
                strokeWidth={2}
                dot={false}
                name="MA5"
                connectNulls={false}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ma10"
                stroke="#4ECDC4"
                strokeWidth={2}
                dot={false}
                name="MA10"
                connectNulls={false}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ma20"
                stroke="#45B7D1"
                strokeWidth={2}
                dot={false}
                name="MA20"
                connectNulls={false}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ma60"
                stroke="#96CEB4"
                strokeWidth={2}
                dot={false}
                name="MA60"
                connectNulls={false}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ma120"
                stroke="#FECA57"
                strokeWidth={2}
                dot={false}
                name="MA120"
                connectNulls={false}
              />

              {/* Start Signal 마커 (현재가) */}
              {recentData.length > 0 && (
                <ReferenceLine
                  yAxisId="price"
                  y={recentData[recentData.length - 1].close}
                  stroke="red"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label="현재가"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </Box>

        {/* 거래량 차트 */}
        <Box sx={{ width: '100%', height: 200, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            거래량
          </Typography>
          <ResponsiveContainer>
            <AreaChart data={recentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <YAxis
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8
                }}
                formatter={(value) => [`${value.toLocaleString()}주`, '거래량']}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#f39c12"
                fill="#f39c12"
                fillOpacity={0.3}
                name="거래량"
              />
              <Line
                type="monotone"
                dataKey="volume_ma20"
                stroke="#e67e22"
                strokeWidth={2}
                dot={false}
                name="거래량 20일 평균"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        {/* 범례 설명 */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, bgcolor: '#FF6B6B' }} />
            <Typography variant="caption">MA5</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, bgcolor: '#4ECDC4' }} />
            <Typography variant="caption">MA10</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, bgcolor: '#45B7D1' }} />
            <Typography variant="caption">MA20</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, bgcolor: '#96CEB4' }} />
            <Typography variant="caption">MA60</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, bgcolor: '#FECA57' }} />
            <Typography variant="caption">MA120</Typography>
          </Box>
          {startSignal && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Box sx={{ width: 20, height: 3, bgcolor: '#ff5722', opacity: 0.3 }} />
              <Typography variant="caption" color="error" fontWeight="bold">
                🚨 Start Signal
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PatternChart;
