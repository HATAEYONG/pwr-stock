"""
Pattern 2: 초기 추세 전환형
- 연중 최저점 형성
- 저점 갱신 중단
- MA5가 MA10·MA20 상향 돌파
- 거래량 적은 상태에서 가격 우상향
"""
import pandas as pd
from apps.market.services.rules import rules_loader


class Pattern2Analyzer:
    """Pattern 2 분석기"""
    
    def __init__(self):
        self.config = rules_loader.get_pattern2_config()
        self.ma_cross = self.config.get('ma_cross', {})
        self.quiet_volume = self.config.get('quiet_volume', {})
        self.above_yearly_low_pct = self.config.get('above_yearly_low_pct', 0.05)
    
    def evaluate(self, df: pd.DataFrame, current_idx: int) -> dict:
        """
        Pattern 2 평가
        
        Args:
            df: 전체 OHLCV + Indicator DataFrame
            current_idx: 평가할 행의 인덱스
        
        Returns:
            평가 결과 dict {
                'is_p2': bool,
                'ma_cross': bool,
                'vol_quiet': bool,
                'above_low': bool,
                'details': dict
            }
        """
        result = {
            'is_p2': False,
            'ma_cross': False,
            'vol_quiet': False,
            'above_low': False,
            'details': {}
        }
        
        if current_idx < 30:  # 최소 데이터 필요
            return result
        
        current_row = df.iloc[current_idx]
        
        # 1. 연중 최저점 대비 위치 확인
        yearly_low = current_row['yearly_low']
        current_close = current_row['close']
        
        if pd.isna(yearly_low) or pd.isna(current_close):
            return result
        
        if float(current_close) >= float(yearly_low) * (1 + self.above_yearly_low_pct):
            result['above_low'] = True
            result['details']['above_low_pct'] = float((current_close - yearly_low) / yearly_low)
        
        # 2. MA 골든크로스 확인
        ma_cross_info = self._check_ma_cross(df, current_idx)
        if ma_cross_info['crossed']:
            result['ma_cross'] = True
            result['details']['ma_cross'] = ma_cross_info
        
        # 3. 조용한 거래량 확인
        vol_quiet_info = self._check_quiet_volume(df, current_idx)
        if vol_quiet_info['quiet']:
            result['vol_quiet'] = True
            result['details']['vol_quiet'] = vol_quiet_info
        
        # 최종 판정
        result['is_p2'] = (
            result['above_low'] and
            result['ma_cross'] and
            result['vol_quiet']
        )
        
        return result
    
    def _check_ma_cross(self, df: pd.DataFrame, current_idx: int) -> dict:
        """MA 골든크로스 확인 (MA5 > MA10 > MA20)"""
        fast = self.ma_cross.get('fast', 5)
        mid = self.ma_cross.get('mid', 10)
        slow = self.ma_cross.get('slow', 20)
        
        if current_idx < 5:
            return {'crossed': False}
        
        # 현재 시점
        curr_row = df.iloc[current_idx]
        ma_fast_curr = curr_row[f'ma{fast}']
        ma_mid_curr = curr_row[f'ma{mid}']
        ma_slow_curr = curr_row[f'ma{slow}']
        
        # 이전 시점
        prev_row = df.iloc[current_idx - 1]
        ma_fast_prev = prev_row[f'ma{fast}']
        ma_mid_prev = prev_row[f'ma{mid}']
        
        # NaN 체크
        if any(pd.isna(x) for x in [ma_fast_curr, ma_mid_curr, ma_slow_curr]):
            return {'crossed': False}
        
        # 현재 정렬 상태: MA5 > MA10 > MA20
        current_aligned = (
            float(ma_fast_curr) > float(ma_mid_curr) and
            float(ma_mid_curr) > float(ma_slow_curr)
        )
        
        # 최근 크로스 발생 여부 (최근 5일 이내)
        recent_cross = False
        if not pd.isna(ma_fast_prev) and not pd.isna(ma_mid_prev):
            if float(ma_fast_prev) <= float(ma_mid_prev) and float(ma_fast_curr) > float(ma_mid_curr):
                recent_cross = True
        
        if current_aligned or recent_cross:
            return {
                'crossed': True,
                'ma_fast': float(ma_fast_curr),
                'ma_mid': float(ma_mid_curr),
                'ma_slow': float(ma_slow_curr),
                'recent_cross': recent_cross
            }
        
        return {'crossed': False}
    
    def _check_quiet_volume(self, df: pd.DataFrame, current_idx: int) -> dict:
        """조용한 거래량 확인"""
        max_ratio = self.quiet_volume.get('max_ratio_to_volavg20', 1.00)
        
        row = df.iloc[current_idx]
        volume = row['volume']
        volume_avg_20 = row['volume_avg_20']
        
        if pd.isna(volume_avg_20) or volume_avg_20 == 0:
            return {'quiet': False}
        
        ratio = volume / volume_avg_20
        
        if ratio <= max_ratio:
            return {
                'quiet': True,
                'ratio': float(ratio),
                'volume': int(volume),
                'volume_avg_20': int(volume_avg_20)
            }
        
        return {'quiet': False}


# 전역 인스턴스
pattern2_analyzer = Pattern2Analyzer()
