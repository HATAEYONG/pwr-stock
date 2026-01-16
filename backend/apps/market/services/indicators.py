"""
기술적 지표 계산 서비스
- 이동평균선 (MA5, MA10, MA20, MA60, MA112, MA224)
- 거래량 평균
- 52주 / 연중 최저점
"""
import pandas as pd
from decimal import Decimal
from apps.market.services.rules import rules_loader


class IndicatorCalculator:
    """기술적 지표 계산기"""
    
    def __init__(self):
        self.config = rules_loader.get_indicators_config()
        self.system_config = rules_loader.get_system_config()
        self.ma_windows = self.config.get('ma_windows', [5, 10, 20, 60, 112, 224])
        self.volume_windows = self.config.get('volume_avg_windows', [20, 60])
        self.lookback_days = self.system_config.get('lookback_days', 250)
    
    def calculate_all_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        모든 지표 계산
        
        Args:
            df: OHLCV DataFrame (date, open, high, low, close, volume)
        
        Returns:
            indicators가 추가된 DataFrame
        """
        df = df.copy()
        df = df.sort_values('date').reset_index(drop=True)
        
        # 이동평균선 계산
        for window in self.ma_windows:
            df[f'ma{window}'] = df['close'].rolling(window=window, min_periods=1).mean()
        
        # 거래량 평균 계산
        for window in self.volume_windows:
            df[f'volume_avg_{window}'] = df['volume'].rolling(window=window, min_periods=1).mean()
        
        # 52주 고저 (252거래일)
        df['week52_high'] = df['high'].rolling(window=252, min_periods=1).max()
        df['week52_low'] = df['low'].rolling(window=252, min_periods=1).min()
        
        # 연중 최저 (lookback_days 기간)
        df['yearly_low'] = df['low'].rolling(window=self.lookback_days, min_periods=1).min()
        
        # 연중 최저 발생 날짜 찾기
        df['yearly_low_date'] = None
        for idx in range(len(df)):
            start_idx = max(0, idx - self.lookback_days + 1)
            window_df = df.iloc[start_idx:idx+1]
            min_idx = window_df['low'].idxmin()
            df.at[idx, 'yearly_low_date'] = df.at[min_idx, 'date']
        
        return df
    
    def get_ma_convergence_ratio(self, row: pd.Series) -> float:
        """
        이평선 수렴도 계산 (MA5~MA60 간 최대 이격률)
        
        Returns:
            최대 이격률 (0.03 = 3%)
        """
        mas = []
        for window in [5, 10, 20, 60]:
            ma_val = row.get(f'ma{window}')
            if ma_val and not pd.isna(ma_val):
                mas.append(float(ma_val))
        
        if len(mas) < 2:
            return 1.0  # 데이터 부족 시 높은 값 반환
        
        max_ma = max(mas)
        min_ma = min(mas)
        
        if min_ma == 0:
            return 1.0
        
        return (max_ma - min_ma) / min_ma
    
    def get_ma112_slope(self, df: pd.DataFrame, current_idx: int, days: int = 10) -> float:
        """
        MA112 기울기 계산
        
        Args:
            df: DataFrame
            current_idx: 현재 인덱스
            days: 기울기 계산 기간
        
        Returns:
            일별 평균 기울기 (절대값)
        """
        if current_idx < days:
            return 0.0
        
        start_idx = current_idx - days
        ma112_start = df.at[start_idx, 'ma112']
        ma112_end = df.at[current_idx, 'ma112']
        
        if pd.isna(ma112_start) or pd.isna(ma112_end) or ma112_start == 0:
            return 0.0
        
        slope = (float(ma112_end) - float(ma112_start)) / float(ma112_start) / days
        return abs(slope)
    
    def round_decimal(self, value, precision: int = 4) -> Decimal:
        """Decimal 반올림"""
        if pd.isna(value) or value is None:
            return None
        return Decimal(str(round(float(value), precision)))


# 전역 인스턴스
indicator_calculator = IndicatorCalculator()
