"""
Pattern 3: IPO 소형주 반등형
- 1년 이내 신규 상장
- 지속 하락 후 최저점 형성
- 방향 전환 (상승 시작)
- 최저점 유지 (깨지지 않음)
- 소형주 (상장주식수 1천만주 이하)
"""
import pandas as pd
from datetime import datetime, timedelta
from apps.market.services.rules import rules_loader


class Pattern3Analyzer:
    """Pattern 3 분석기 - IPO 소형주 반등형"""
    
    def __init__(self):
        self.config = rules_loader.rules.get('pattern3', {})
        self.max_listing_days = self.config.get('max_listing_days', 365)
        self.max_shares_outstanding = self.config.get('max_shares_outstanding', 10_000_000)
        self.min_decline_from_high = self.config.get('min_decline_from_high', 0.30)
        self.bottom_hold_days = self.config.get('bottom_hold_days', [10, 60])
        self.reversal_signal = self.config.get('reversal_signal', {})
    
    def evaluate(self, df: pd.DataFrame, current_idx: int, symbol_obj) -> dict:
        """
        Pattern 3 평가
        
        Args:
            df: 전체 OHLCV + Indicator DataFrame
            current_idx: 평가할 행의 인덱스
            symbol_obj: Symbol 모델 인스턴스
        
        Returns:
            평가 결과 dict
        """
        result = {
            'is_p3': False,
            'is_ipo': False,
            'is_small_cap': False,
            'bottom_formed': False,
            'reversal_confirmed': False,
            'bottom_holding': False,
            'details': {}
        }
        
        if current_idx < 30:
            return result
        
        current_row = df.iloc[current_idx]
        current_date = current_row['date']
        
        # 1. IPO 확인
        ipo_check = self._check_ipo(symbol_obj, current_date)
        if ipo_check['is_ipo']:
            result['is_ipo'] = True
            result['details']['ipo'] = ipo_check
        else:
            return result
        
        # 2. 소형주 확인
        small_cap_check = self._check_small_cap(symbol_obj)
        if small_cap_check['is_small_cap']:
            result['is_small_cap'] = True
            result['details']['small_cap'] = small_cap_check
        else:
            return result
        
        # 3. 바닥 형성
        bottom_info = self._check_bottom_formation(df, current_idx)
        if bottom_info['formed']:
            result['bottom_formed'] = True
            result['details']['bottom'] = bottom_info
        
        # 4. 방향 전환
        reversal_info = self._check_reversal(df, current_idx)
        if reversal_info['confirmed']:
            result['reversal_confirmed'] = True
            result['details']['reversal'] = reversal_info
        
        # 5. 바닥 유지
        holding_info = self._check_bottom_holding(df, current_idx, bottom_info)
        if holding_info['holding']:
            result['bottom_holding'] = True
            result['details']['holding'] = holding_info
        
        # 최종 판정
        result['is_p3'] = (
            result['is_ipo'] and
            result['is_small_cap'] and
            result['bottom_formed'] and
            result['reversal_confirmed'] and
            result['bottom_holding']
        )
        
        return result
    
    def _check_ipo(self, symbol_obj, current_date) -> dict:
        """신규 상장 확인"""
        if not symbol_obj.listing_date:
            return {'is_ipo': False, 'reason': 'listing_date_unknown'}
        
        listing_date = symbol_obj.listing_date
        
        if hasattr(current_date, 'date'):
            current_date = current_date.date()
        
        days_since_listing = (current_date - listing_date).days
        
        if days_since_listing <= self.max_listing_days:
            return {
                'is_ipo': True,
                'listing_date': str(listing_date),
                'days_since_listing': days_since_listing
            }
        
        return {'is_ipo': False, 'reason': 'too_old'}
    
    def _check_small_cap(self, symbol_obj) -> dict:
        """소형주 확인"""
        if not symbol_obj.shares_outstanding:
            return {'is_small_cap': False, 'reason': 'shares_unknown'}
        
        shares = symbol_obj.shares_outstanding
        
        if shares <= self.max_shares_outstanding:
            return {
                'is_small_cap': True,
                'shares_outstanding': shares
            }
        
        return {'is_small_cap': False, 'shares_outstanding': shares}
    
    def _check_bottom_formation(self, df: pd.DataFrame, current_idx: int) -> dict:
        """바닥 형성 확인"""
        all_time_high = df.iloc[:current_idx+1]['high'].max()
        all_time_low = df.iloc[:current_idx+1]['low'].min()
        
        decline_pct = 0
        if all_time_high > 0:
            decline_pct = (all_time_high - all_time_low) / all_time_high
        
        if decline_pct >= self.min_decline_from_high:
            return {
                'formed': True,
                'all_time_high': float(all_time_high),
                'all_time_low': float(all_time_low),
                'decline_pct': float(decline_pct)
            }
        
        return {'formed': False, 'decline_pct': float(decline_pct)}
    
    def _check_reversal(self, df: pd.DataFrame, current_idx: int) -> dict:
        """방향 전환 확인"""
        min_up_days = self.reversal_signal.get('min_consecutive_up_days', 3)
        min_up_pct = self.reversal_signal.get('min_price_increase_pct', 0.10)
        
        lookback = 20
        start_idx = max(0, current_idx - lookback)
        window = df.iloc[start_idx:current_idx+1]
        
        if len(window) < min_up_days:
            return {'confirmed': False}
        
        low_idx = window['low'].idxmin()
        low_val = window.loc[low_idx, 'low']
        
        current_close = df.iloc[current_idx]['close']
        price_increase = 0
        if float(low_val) > 0:
            price_increase = (float(current_close) - float(low_val)) / float(low_val)
        
        if price_increase >= min_up_pct:
            return {
                'confirmed': True,
                'bottom_price': float(low_val),
                'current_price': float(current_close),
                'increase_pct': float(price_increase)
            }
        
        return {'confirmed': False, 'increase_pct': float(price_increase)}
    
    def _check_bottom_holding(self, df: pd.DataFrame, current_idx: int, bottom_info: dict) -> dict:
        """바닥 유지 확인"""
        if not bottom_info.get('formed'):
            return {'holding': False, 'reason': 'no_bottom'}
        
        all_time_low = bottom_info['all_time_low']
        min_days, max_days = self.bottom_hold_days
        
        start_idx = max(0, current_idx - max_days)
        window = df.iloc[start_idx:current_idx+1]
        
        if len(window) < min_days:
            return {'holding': False, 'reason': 'insufficient_days'}
        
        window_low = window['low'].min()
        buffer = 0.01
        threshold = all_time_low * (1 - buffer)
        
        if float(window_low) >= threshold:
            return {
                'holding': True,
                'days_checked': len(window),
                'window_low': float(window_low)
            }
        
        return {'holding': False, 'reason': 'bottom_broken'}


# 전역 인스턴스
pattern3_analyzer = Pattern3Analyzer()
