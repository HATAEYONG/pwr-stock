"""
Pattern 1: 매집 → 급등형
- 연중 최저점 형성
- 페이크 상승 발생
- 저점 이탈 없는 횡보(매집)
- 거래량 동반 급등
"""
import pandas as pd
from apps.market.services.rules import rules_loader


class Pattern1Analyzer:
    """Pattern 1 분석기"""
    
    def __init__(self):
        self.config = rules_loader.get_pattern1_config()
        self.min_rebound_pct = self.config.get('min_rebound_pct', 0.08)
        self.fake_breakout = self.config.get('fake_breakout', {})
        self.accumulation = self.config.get('accumulation', {})
        self.ma_convergence = self.config.get('ma_convergence', {})
        self.volume_compression = self.config.get('volume_compression', {})
    
    def evaluate(self, df: pd.DataFrame, current_idx: int) -> dict:
        """
        Pattern 1 평가
        
        Args:
            df: 전체 OHLCV + Indicator DataFrame
            current_idx: 평가할 행의 인덱스
        
        Returns:
            평가 결과 dict {
                'is_p1': bool,
                'rebound_ok': bool,
                'fake_breakout_ok': bool,
                'accumulation_ok': bool,
                'ma_convergence_ok': bool,
                'volume_compression_ok': bool,
                'details': dict
            }
        """
        result = {
            'is_p1': False,
            'rebound_ok': False,
            'fake_breakout_ok': False,
            'accumulation_ok': False,
            'ma_convergence_ok': False,
            'volume_compression_ok': False,
            'details': {}
        }
        
        if current_idx < 60:  # 최소 데이터 필요
            return result
        
        current_row = df.iloc[current_idx]
        
        # 1. 연중 최저점 확인
        yearly_low = current_row['yearly_low']
        if pd.isna(yearly_low):
            return result
        
        # 2. 반등폭 확인
        rebound_high = self._find_rebound_high(df, current_idx, yearly_low)
        if rebound_high:
            rebound_pct = (rebound_high['close'] - yearly_low) / yearly_low
            if rebound_pct >= self.min_rebound_pct:
                result['rebound_ok'] = True
                result['details']['rebound_pct'] = float(rebound_pct)
                result['details']['rebound_date'] = str(rebound_high['date'])
        
        # 3. 페이크 상승 확인
        fake_breakout_info = self._check_fake_breakout(df, current_idx, yearly_low)
        if fake_breakout_info['found']:
            result['fake_breakout_ok'] = True
            result['details']['fake_breakout'] = fake_breakout_info
        
        # 4. 매집(횡보) 구간 확인
        accumulation_info = self._check_accumulation(df, current_idx)
        if accumulation_info['found']:
            result['accumulation_ok'] = True
            result['details']['accumulation'] = accumulation_info
        
        # 5. 이평선 수렴 확인
        if self.ma_convergence.get('enabled', False):
            ma_conv_info = self._check_ma_convergence(df, current_idx)
            if ma_conv_info['converged']:
                result['ma_convergence_ok'] = True
                result['details']['ma_convergence'] = ma_conv_info
        
        # 6. 거래량 압축 확인
        if self.volume_compression.get('enabled', False):
            vol_comp_info = self._check_volume_compression(df, current_idx)
            if vol_comp_info['compressed']:
                result['volume_compression_ok'] = True
                result['details']['volume_compression'] = vol_comp_info
        
        # 최종 판정 (필수 조건)
        result['is_p1'] = (
            result['rebound_ok'] and
            result['fake_breakout_ok'] and
            result['accumulation_ok']
        )
        
        return result
    
    def _find_rebound_high(self, df: pd.DataFrame, current_idx: int, yearly_low: float) -> dict:
        """연중 최저 이후 반등 고점 찾기"""
        lookback = self.fake_breakout.get('lookback_days_after_low', 60)
        start_idx = max(0, current_idx - lookback)
        
        window = df.iloc[start_idx:current_idx+1]
        max_idx = window['high'].idxmax()
        max_row = df.iloc[max_idx]
        
        if float(max_row['high']) > float(yearly_low) * 1.05:  # 최소 5% 이상
            return {
                'date': max_row['date'],
                'close': float(max_row['close']),
                'high': float(max_row['high'])
            }
        return None
    
    def _check_fake_breakout(self, df: pd.DataFrame, current_idx: int, yearly_low: float) -> dict:
        """페이크 상승 확인"""
        lookback = self.fake_breakout.get('lookback_days_after_low', 60)
        min_up_pct = self.fake_breakout.get('min_up_candle_pct', 0.06)
        
        start_idx = max(0, current_idx - lookback)
        window = df.iloc[start_idx:current_idx+1]
        
        for idx, row in window.iterrows():
            if idx == 0:
                continue
            
            prev_close = float(df.iloc[idx-1]['close'])
            curr_close = float(row['close'])
            
            if prev_close > 0:
                change_pct = (curr_close - prev_close) / prev_close
                
                if change_pct >= min_up_pct:
                    return {
                        'found': True,
                        'date': str(row['date']),
                        'change_pct': float(change_pct),
                        'close': float(curr_close)
                    }
        
        return {'found': False}
    
    def _check_accumulation(self, df: pd.DataFrame, current_idx: int) -> dict:
        """매집(횡보) 구간 확인"""
        days_range = self.accumulation.get('days_range', [10, 25])
        max_box_pct = self.accumulation.get('max_box_pct', 0.10)
        
        min_days, max_days = days_range
        
        # 최근 max_days 동안 확인
        start_idx = max(0, current_idx - max_days)
        window = df.iloc[start_idx:current_idx+1]
        
        if len(window) < min_days:
            return {'found': False}
        
        high_val = window['high'].max()
        low_val = window['low'].min()
        mid_val = (high_val + low_val) / 2
        
        if mid_val == 0:
            return {'found': False}
        
        box_pct = (high_val - low_val) / mid_val
        
        if box_pct <= max_box_pct:
            return {
                'found': True,
                'box_pct': float(box_pct),
                'high': float(high_val),
                'low': float(low_val),
                'days': len(window)
            }
        
        return {'found': False}
    
    def _check_ma_convergence(self, df: pd.DataFrame, current_idx: int) -> dict:
        """이평선 수렴 확인"""
        max_spread = self.ma_convergence.get('max_spread_ratio', 0.03)
        
        row = df.iloc[current_idx]
        mas = []
        
        for window in [5, 10, 20, 60]:
            ma_val = row.get(f'ma{window}')
            if not pd.isna(ma_val):
                mas.append(float(ma_val))
        
        if len(mas) < 4:
            return {'converged': False}
        
        max_ma = max(mas)
        min_ma = min(mas)
        spread_ratio = (max_ma - min_ma) / min_ma if min_ma > 0 else 1.0
        
        if spread_ratio <= max_spread:
            return {
                'converged': True,
                'spread_ratio': float(spread_ratio),
                'max_ma': float(max_ma),
                'min_ma': float(min_ma)
            }
        
        return {'converged': False}
    
    def _check_volume_compression(self, df: pd.DataFrame, current_idx: int) -> dict:
        """거래량 압축 확인"""
        max_ratio = self.volume_compression.get('max_ratio_to_volavg20', 1.00)
        
        row = df.iloc[current_idx]
        volume = row['volume']
        volume_avg_20 = row['volume_avg_20']
        
        if pd.isna(volume_avg_20) or volume_avg_20 == 0:
            return {'compressed': False}
        
        ratio = volume / volume_avg_20
        
        if ratio <= max_ratio:
            return {
                'compressed': True,
                'ratio': float(ratio),
                'volume': int(volume),
                'volume_avg_20': int(volume_avg_20)
            }
        
        return {'compressed': False}


# 전역 인스턴스
pattern1_analyzer = Pattern1Analyzer()
