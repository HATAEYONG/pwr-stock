"""
알림 트리거 시스템
- start_signal: 시동 알림
- risk_signal: 위험 알림
- sell_signal: 매도 알림
"""
import pandas as pd
from apps.market.services.rules import rules_loader


class TriggerAnalyzer:
    """트리거 분석기"""
    
    def __init__(self):
        self.volume_triggers = rules_loader.get_volume_triggers_config()
        self.pattern1_config = rules_loader.get_pattern1_config()
        self.pattern2_config = rules_loader.get_pattern2_config()
    
    def evaluate_triggers(self, df: pd.DataFrame, current_idx: int, pattern_type: str) -> dict:
        """
        모든 트리거 평가
        
        Args:
            df: DataFrame
            current_idx: 현재 인덱스
            pattern_type: 'P1' or 'P2' or 'NONE'
        
        Returns:
            {
                'start_signal': bool,
                'risk_signal': bool,
                'sell_signal': bool,
                'details': dict
            }
        """
        result = {
            'start_signal': False,
            'risk_signal': False,
            'sell_signal': False,
            'details': {}
        }
        
        row = df.iloc[current_idx]
        
        # 1. Start Signal (시동 알림)
        start_info = self._check_start_signal(df, current_idx)
        if start_info['triggered']:
            result['start_signal'] = True
            result['details']['start_signal'] = start_info
        
        # 2. Risk Signal (위험 알림)
        risk_info = self._check_risk_signal(df, current_idx, pattern_type)
        if risk_info['triggered']:
            result['risk_signal'] = True
            result['details']['risk_signal'] = risk_info
        
        # 3. Sell Signal (매도 알림)
        sell_info = self._check_sell_signal(df, current_idx, pattern_type)
        if sell_info['triggered']:
            result['sell_signal'] = True
            result['details']['sell_signal'] = sell_info
        
        return result
    
    def _check_start_signal(self, df: pd.DataFrame, current_idx: int) -> dict:
        """
        시동 알림: 거래량 폭증 + MA20/MA60 돌파
        """
        config = self.volume_triggers.get('start_signal', {})
        ratio_threshold = config.get('ratio_to_volavg20', 2.0)
        require_mas = config.get('require_close_above_mas', [20, 60])
        
        row = df.iloc[current_idx]
        volume = row['volume']
        volume_avg_20 = row['volume_avg_20']
        close_price = row['close']
        
        # 거래량 확인
        if pd.isna(volume_avg_20) or volume_avg_20 == 0:
            return {'triggered': False}
        
        volume_ratio = volume / volume_avg_20
        
        if volume_ratio < ratio_threshold:
            return {'triggered': False}
        
        # MA 위치 확인
        mas_ok = True
        ma_status = {}
        
        for ma_window in require_mas:
            ma_val = row.get(f'ma{ma_window}')
            if pd.isna(ma_val):
                mas_ok = False
                ma_status[f'ma{ma_window}'] = 'N/A'
            else:
                above = float(close_price) > float(ma_val)
                ma_status[f'ma{ma_window}'] = 'above' if above else 'below'
                if not above:
                    mas_ok = False
        
        if volume_ratio >= ratio_threshold and mas_ok:
            return {
                'triggered': True,
                'volume_ratio': float(volume_ratio),
                'volume': int(volume),
                'volume_avg_20': int(volume_avg_20),
                'ma_status': ma_status,
                'close': float(close_price)
            }
        
        return {'triggered': False}
    
    def _check_risk_signal(self, df: pd.DataFrame, current_idx: int, pattern_type: str) -> dict:
        """
        위험 알림: 연중 최저 종가 이탈
        """
        row = df.iloc[current_idx]
        yearly_low = row['yearly_low']
        close_price = row['close']
        
        if pd.isna(yearly_low) or pd.isna(close_price):
            return {'triggered': False}
        
        # 손절 기준: 연중 최저 종가 이탈
        if float(close_price) < float(yearly_low):
            return {
                'triggered': True,
                'reason': 'yearly_low_break',
                'close': float(close_price),
                'yearly_low': float(yearly_low),
                'break_pct': float((close_price - yearly_low) / yearly_low)
            }
        
        # Pattern 1의 매집 박스 하단 이탈 (추가 확인)
        if pattern_type == 'P1':
            # 매집 박스 체크 (간단 버전)
            lookback = 20
            start_idx = max(0, current_idx - lookback)
            window = df.iloc[start_idx:current_idx]
            
            if len(window) > 0:
                box_low = window['low'].min()
                if float(close_price) < float(box_low) * 0.98:  # 2% 버퍼
                    return {
                        'triggered': True,
                        'reason': 'accumulation_box_break',
                        'close': float(close_price),
                        'box_low': float(box_low)
                    }
        
        return {'triggered': False}
    
    def _check_sell_signal(self, df: pd.DataFrame, current_idx: int, pattern_type: str) -> dict:
        """
        매도 알림: 거래량 폭발 (평균 3배)
        """
        config = self.volume_triggers.get('sell_signal', {})
        ratio_threshold = config.get('ratio_to_volavg20', 3.0)
        
        row = df.iloc[current_idx]
        volume = row['volume']
        volume_avg_20 = row['volume_avg_20']
        
        if pd.isna(volume_avg_20) or volume_avg_20 == 0:
            return {'triggered': False}
        
        volume_ratio = volume / volume_avg_20
        
        if volume_ratio >= ratio_threshold:
            # 추가 확인: 장대양봉 여부
            open_price = row['open_price']
            close_price = row['close']
            
            candle_change = 0
            if not pd.isna(open_price) and float(open_price) > 0:
                candle_change = (float(close_price) - float(open_price)) / float(open_price)
            
            return {
                'triggered': True,
                'volume_ratio': float(volume_ratio),
                'volume': int(volume),
                'volume_avg_20': int(volume_avg_20),
                'candle_change_pct': float(candle_change),
                'is_strong_candle': candle_change > 0.05
            }
        
        return {'triggered': False}


# 전역 인스턴스
trigger_analyzer = TriggerAnalyzer()
