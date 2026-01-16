"""
Technical Indicator Analyzer
장기이평선, 거래량, 지지/저항 자동 분석
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from decimal import Decimal


class TechnicalAnalyzer:
    """기술적 지표 분석기"""
    
    def __init__(self, ohlcv_data: pd.DataFrame):
        """
        Args:
            ohlcv_data: OHLCV 데이터 (date, open, high, low, close, volume)
        """
        self.df = ohlcv_data.copy()
        self.df = self.df.sort_values('date')
        self._calculate_moving_averages()
    
    def _calculate_moving_averages(self):
        """이동평균선 계산"""
        for period in [5, 20, 60, 112, 224]:
            self.df[f'ma{period}'] = self.df['close'].rolling(window=period).mean()
    
    def analyze_ma_levels(self, current_price: float) -> Dict:
        """
        장기이평선 레벨 분석
        
        Returns:
            {
                'ma_level': int (0-5),
                'ma5_status': str,
                'ma20_status': str,
                ...
                'ma_arrangement': str (positive/negative/mixed)
            }
        """
        if len(self.df) < 224:
            return self._default_ma_analysis()
        
        latest = self.df.iloc[-1]
        result = {'ma_level': 0}
        
        # 각 이평선 상태 확인
        mas = [5, 20, 60, 112, 224]
        for ma in mas:
            ma_value = latest[f'ma{ma}']
            
            if pd.isna(ma_value):
                status = 'unknown'
            elif current_price > ma_value * 1.02:  # 2% 이상
                status = 'above'
                result['ma_level'] += 1
            elif current_price < ma_value * 0.98:  # 2% 이하
                status = 'below'
            else:
                status = 'touching'
            
            result[f'ma{ma}_status'] = status
        
        # 배열 상태 판단
        result['ma_arrangement'] = self._determine_arrangement(latest)
        
        return result
    
    def _determine_arrangement(self, row) -> str:
        """이평선 배열 상태 판단"""
        mas = [row['ma5'], row['ma20'], row['ma60'], row['ma112'], row['ma224']]
        
        # NaN 제거
        mas = [ma for ma in mas if not pd.isna(ma)]
        
        if len(mas) < 3:
            return 'mixed'
        
        # 정배열: 단기 > 중기 > 장기
        is_positive = all(mas[i] >= mas[i+1] for i in range(len(mas)-1))
        # 역배열: 단기 < 중기 < 장기
        is_negative = all(mas[i] <= mas[i+1] for i in range(len(mas)-1))
        
        if is_positive:
            return 'positive'
        elif is_negative:
            return 'negative'
        else:
            return 'mixed'
    
    def analyze_volume(self) -> Dict:
        """
        거래량 분석
        
        Returns:
            {
                'volume_ratio': float,
                'volume_breakout': bool,
                'volume_strength': str,
                'avg_volume_10d': int
            }
        """
        if len(self.df) < 11:
            return self._default_volume_analysis()
        
        latest_volume = self.df.iloc[-1]['volume']
        yesterday_volume = self.df.iloc[-2]['volume']
        avg_10d = self.df.iloc[-11:-1]['volume'].mean()
        
        # 전일 대비 비율
        if yesterday_volume > 0:
            ratio = (latest_volume / yesterday_volume) * 100
        else:
            ratio = 0
        
        # 돌파 여부
        breakout = ratio >= 110
        
        # 강도 판단
        if ratio >= 200:
            strength = 'very_strong'
        elif ratio >= 150:
            strength = 'strong'
        elif ratio >= 110:
            strength = 'moderate'
        else:
            strength = 'weak'
        
        return {
            'volume_ratio': round(ratio, 2),
            'volume_breakout': breakout,
            'volume_strength': strength,
            'avg_volume_10d': int(avg_10d)
        }
    
    def find_support_resistance(self, current_price: float) -> Dict:
        """
        지지/저항선 찾기
        
        Args:
            current_price: 현재 가격
        
        Returns:
            {
                'support_level': float,
                'resistance_level': float,
                'support_strength': int,
                'resistance_strength': int
            }
        """
        if len(self.df) < 20:
            return self._default_support_resistance()
        
        # 최근 60일 데이터
        recent_df = self.df.tail(60)
        
        # 지지선: 최근 저점들의 평균
        lows = recent_df['low'].values
        support_candidates = self._find_pivot_lows(lows)
        
        # 현재가 아래 지지선 찾기
        support_below = [s for s in support_candidates if s < current_price]
        support_level = max(support_below) if support_below else recent_df['low'].min()
        
        # 저항선: 최근 고점들의 평균
        highs = recent_df['high'].values
        resistance_candidates = self._find_pivot_highs(highs)
        
        # 현재가 위 저항선 찾기
        resistance_above = [r for r in resistance_candidates if r > current_price]
        resistance_level = min(resistance_above) if resistance_above else recent_df['high'].max()
        
        # 강도 계산 (터치 횟수)
        support_strength = self._calculate_touch_strength(recent_df['low'], support_level)
        resistance_strength = self._calculate_touch_strength(recent_df['high'], resistance_level)
        
        return {
            'support_level': float(support_level),
            'resistance_level': float(resistance_level),
            'support_strength': support_strength,
            'resistance_strength': resistance_strength
        }
    
    def _find_pivot_lows(self, data: np.ndarray, window: int = 5) -> List[float]:
        """피벗 저점 찾기"""
        pivots = []
        for i in range(window, len(data) - window):
            if data[i] == min(data[i-window:i+window+1]):
                pivots.append(data[i])
        return pivots
    
    def _find_pivot_highs(self, data: np.ndarray, window: int = 5) -> List[float]:
        """피벗 고점 찾기"""
        pivots = []
        for i in range(window, len(data) - window):
            if data[i] == max(data[i-window:i+window+1]):
                pivots.append(data[i])
        return pivots
    
    def _calculate_touch_strength(self, prices: pd.Series, level: float, tolerance: float = 0.02) -> int:
        """레벨 터치 횟수 계산"""
        touches = 0
        for price in prices:
            if abs(price - level) / level < tolerance:
                touches += 1
        return min(touches * 20, 100)  # 최대 100점
    
    def detect_patterns(self) -> Dict:
        """
        패턴 감지
        
        Returns:
            {
                'double_bottom': bool,
                'accumulation_phase': bool,
                'breakout_signal': bool
            }
        """
        if len(self.df) < 30:
            return {
                'double_bottom': False,
                'accumulation_phase': False,
                'breakout_signal': False
            }
        
        recent = self.df.tail(30)
        
        # 쌍바닥 패턴
        double_bottom = self._detect_double_bottom(recent)
        
        # 매집 구간
        accumulation = self._detect_accumulation(recent)
        
        # 돌파 신호
        breakout = self._detect_breakout(recent)
        
        return {
            'double_bottom': double_bottom,
            'accumulation_phase': accumulation,
            'breakout_signal': breakout
        }
    
    def _detect_double_bottom(self, df: pd.DataFrame) -> bool:
        """쌍바닥 패턴 감지"""
        lows = df['low'].values
        
        # 최저점 2개 찾기
        sorted_lows = sorted(enumerate(lows), key=lambda x: x[1])
        
        if len(sorted_lows) < 2:
            return False
        
        low1_idx, low1_val = sorted_lows[0]
        low2_idx, low2_val = sorted_lows[1]
        
        # 조건: 두 저점이 비슷하고 (5% 이내), 시간 차이 있음
        if abs(low1_val - low2_val) / low1_val < 0.05:
            if abs(low1_idx - low2_idx) > 5:  # 5일 이상 차이
                return True
        
        return False
    
    def _detect_accumulation(self, df: pd.DataFrame) -> bool:
        """매집 구간 감지 (횡보)"""
        # 가격 변동성이 낮고 거래량이 평균 이상
        price_volatility = df['close'].std() / df['close'].mean()
        avg_volume = df['volume'].mean()
        recent_volume = df['volume'].tail(5).mean()
        
        # 변동성 10% 이하, 거래량 평균 이상
        if price_volatility < 0.1 and recent_volume >= avg_volume * 0.8:
            return True
        
        return False
    
    def _detect_breakout(self, df: pd.DataFrame) -> bool:
        """돌파 신호 감지"""
        if len(df) < 20:
            return False
        
        latest = df.iloc[-1]
        recent_high = df.iloc[-20:-1]['high'].max()
        
        # 최근 20일 고점 돌파
        if latest['close'] > recent_high * 1.02:  # 2% 이상
            # 거래량도 증가
            if latest['volume'] > df.iloc[-20:-1]['volume'].mean():
                return True
        
        return False
    
    def analyze_trend(self) -> Dict:
        """
        추세 분석
        
        Returns:
            {
                'trend_short': str,
                'trend_medium': str,
                'trend_long': str
            }
        """
        if len(self.df) < 60:
            return {
                'trend_short': 'sideways',
                'trend_medium': 'sideways',
                'trend_long': 'sideways'
            }
        
        latest = self.df.iloc[-1]
        
        # 단기: 5일선 vs 20일선
        trend_short = self._determine_trend(latest['ma5'], latest['ma20'])
        
        # 중기: 20일선 vs 60일선
        trend_medium = self._determine_trend(latest['ma20'], latest['ma60'])
        
        # 장기: 60일선 vs 224일선
        if not pd.isna(latest['ma224']):
            trend_long = self._determine_trend(latest['ma60'], latest['ma224'])
        else:
            trend_long = 'sideways'
        
        return {
            'trend_short': trend_short,
            'trend_medium': trend_medium,
            'trend_long': trend_long
        }
    
    def _determine_trend(self, short_ma: float, long_ma: float) -> str:
        """추세 판단"""
        if pd.isna(short_ma) or pd.isna(long_ma):
            return 'sideways'
        
        diff = (short_ma - long_ma) / long_ma
        
        if diff > 0.02:  # 2% 이상
            return 'bullish'
        elif diff < -0.02:
            return 'bearish'
        else:
            return 'sideways'
    
    def _default_ma_analysis(self) -> Dict:
        """기본 이평선 분석"""
        return {
            'ma_level': 0,
            'ma5_status': 'unknown',
            'ma20_status': 'unknown',
            'ma60_status': 'unknown',
            'ma112_status': 'unknown',
            'ma224_status': 'unknown',
            'ma_arrangement': 'mixed'
        }
    
    def _default_volume_analysis(self) -> Dict:
        """기본 거래량 분석"""
        return {
            'volume_ratio': 0,
            'volume_breakout': False,
            'volume_strength': 'weak',
            'avg_volume_10d': 0
        }
    
    def _default_support_resistance(self) -> Dict:
        """기본 지지/저항"""
        return {
            'support_level': 0,
            'resistance_level': 0,
            'support_strength': 0,
            'resistance_strength': 0
        }
    
    def analyze_all(self, current_price: float) -> Dict:
        """
        전체 분석 실행
        
        Args:
            current_price: 현재 가격
        
        Returns:
            모든 분석 결과 통합
        """
        result = {}
        
        # 이평선 레벨
        result.update(self.analyze_ma_levels(current_price))
        
        # 거래량
        result.update(self.analyze_volume())
        
        # 지지/저항
        result.update(self.find_support_resistance(current_price))
        
        # 패턴
        result.update(self.detect_patterns())
        
        # 추세
        result.update(self.analyze_trend())
        
        return result
