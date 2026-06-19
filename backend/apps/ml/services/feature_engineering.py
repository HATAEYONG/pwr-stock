"""
Feature Engineering
머신러닝을 위한 Feature 생성 및 전처리
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

from apps.market.models import Symbol, OHLCV, Evaluation, TechnicalIndicator

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """Feature 엔지니어링 클래스"""

    @staticmethod
    def create_features(
        symbol: Symbol,
        end_date: datetime.date,
        lookback_days: int = 90
    ) -> pd.DataFrame:
        """
        Feature DataFrame 생성

        Args:
            symbol: 종목
            end_date: 기준일
            lookback_days: 조회 기간

        Returns:
            Feature DataFrame
        """
        start_date = end_date - timedelta(days=lookback_days * 2)  # 여유있게

        # 1. OHLCV 데이터 로드 (daily 데이터만)
        ohlcv = OHLCV.objects.filter(
            symbol=symbol,
            date__gte=start_date,
            date__lte=end_date,
            timeframe='daily'
        ).order_by('date')

        if ohlcv.count() < lookback_days:
            logger.warning(f"Insufficient data for {symbol.ticker}")
            return pd.DataFrame()

        df = pd.DataFrame(list(ohlcv.values('date', 'open_price', 'high_price', 'low_price', 'close_price', 'volume')))
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)

        # 컬럼명 표준화 (open_price -> open, etc.)
        df.rename(columns={
            'open_price': 'open',
            'high_price': 'high',
            'low_price': 'low',
            'close_price': 'close'
        }, inplace=True)

        # Decimal 타입을 float로 변환
        for col in ['open', 'high', 'low', 'close', 'volume']:
            df[col] = df[col].astype(float)

        # 2. Technical Features 추가
        df = FeatureEngineer._add_technical_features(df)

        # 3. Pattern Features 추가
        df = FeatureEngineer._add_pattern_features(df, symbol, end_date)

        # 4. Target Variable 추가
        df = FeatureEngineer._add_target_variables(df)

        # 5. NaN 처리
        df = df.dropna()

        return df

    @staticmethod
    def _add_technical_features(df: pd.DataFrame) -> pd.DataFrame:
        """기술적 지표 Feature 추가"""
        # 이동평균선
        for period in [5, 10, 20, 60, 120]:
            df[f'ma{period}'] = df['close'].rolling(window=period).mean()
            df[f'ma{period}_ratio'] = df['close'] / df[f'ma{period}'] - 1

        # 이동평균선 배열
        df['ma_trend'] = np.where(
            (df['ma5'] > df['ma20']) & (df['ma20'] > df['ma60']), 1,  # 정배열
            np.where(
                (df['ma5'] < df['ma20']) & (df['ma20'] < df['ma60']), -1,  # 역배열
                0  # 혼조
            )
        )

        # RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))

        # MACD
        exp12 = df['close'].ewm(span=12).mean()
        exp26 = df['close'].ewm(span=26).mean()
        df['macd'] = exp12 - exp26
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_histogram'] = df['macd'] - df['macd_signal']

        # 볼린저 밴드
        df['bb_middle'] = df['close'].rolling(window=20).mean()
        bb_std = df['close'].rolling(window=20).std()
        df['bb_upper'] = df['bb_middle'] + (bb_std * 2)
        df['bb_lower'] = df['bb_middle'] - (bb_std * 2)
        df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
        df['bb_position'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])

        # 거래량
        df['volume_ma'] = df['volume'].rolling(window=20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_ma']
        df['volume_change'] = df['volume'].pct_change()

        # 가격 변동성
        df['returns'] = df['close'].pct_change()
        df['volatility_5d'] = df['returns'].rolling(window=5).std()
        df['volatility_20d'] = df['returns'].rolling(window=20).std()

        # ATR (Average True Range)
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df['atr'] = true_range.rolling(window=14).mean()
        df['atr_ratio'] = df['atr'] / df['close']

        # Price Momentum
        for period in [1, 3, 5, 10, 20]:
            df[f'momentum_{period}d'] = df['close'].pct_change(period)

        # Stochastic Oscillator
        low_14 = df['low'].rolling(window=14).min()
        high_14 = df['high'].rolling(window=14).max()
        df['stoch_k'] = 100 * (df['close'] - low_14) / (high_14 - low_14)
        df['stoch_d'] = df['stoch_k'].rolling(window=3).mean()

        return df

    @staticmethod
    def _add_pattern_features(df: pd.DataFrame, symbol: Symbol, end_date: datetime.date) -> pd.DataFrame:
        """Pattern Feature 추가"""
        # Evaluation 데이터 로드
        evaluations = Evaluation.objects.filter(
            symbol=symbol,
            date__in=df.index.date
        )

        if not evaluations.exists():
            return df

        # DataFrame으로 변환
        eval_df = pd.DataFrame(list(evaluations.values(
            'date', 'pattern_type', 'checklist_score', 'start_signal', 'risk_signal', 'sell_signal'
        )))
        eval_df['date'] = pd.to_datetime(eval_df['date'])
        eval_df.set_index('date', inplace=True)

        # 병합
        df = df.join(eval_df, how='left')

        # Pattern Type 인코딩
        pattern_map = {'P1': 1, 'P2': 2, 'P3': 3}
        df['pattern_encoded'] = df['pattern_type'].map(pattern_map).fillna(0)

        # Signal 인코딩
        df['start_signal'] = df['start_signal'].astype(int).fillna(0)
        df['risk_signal'] = df['risk_signal'].astype(int).fillna(0)
        df['sell_signal'] = df['sell_signal'].astype(int).fillna(0)

        # Checklist Score 정규화
        df['checklist_score_norm'] = df['checklist_score'] / 100.0

        return df

    @staticmethod
    def _add_target_variables(df: pd.DataFrame) -> pd.DataFrame:
        """Target Variable 추가 (미래 수익률)"""
        # 미래 수익률 (1일, 5일, 10일, 20일 후)
        for days in [1, 5, 10, 20]:
            df[f'target_return_{days}d'] = df['close'].shift(-days) / df['close'] - 1

        # Target Direction (상승/하락)
        df['target_direction_5d'] = np.where(df['target_return_5d'] > 0.02, 1, 0)  # 2% 이상 상승
        df['target_direction_20d'] = np.where(df['target_return_20d'] > 0.05, 1, 0)  # 5% 이상 상승

        return df

    @staticmethod
    def get_feature_importance(model, feature_names: List[str]) -> Dict[str, float]:
        """Feature 중요도 추출"""
        try:
            importances = model.feature_importances_
            feature_importance = dict(zip(feature_names, importances))

            # 내림차순 정렬
            sorted_importance = dict(
                sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            )

            return sorted_importance

        except Exception as e:
            logger.error(f"Error getting feature importance: {e}")
            return {}

    @staticmethod
    def select_features(
        df: pd.DataFrame,
        target_col: str,
        max_features: int = 50
    ) -> List[str]:
        """
        Feature 선택 (상위 N개)

        Args:
            df: DataFrame
            target_col: Target 컬럼명
            max_features: 최대 Feature 수

        Returns:
            선택된 Feature 목록
        """
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler

        # Feature/Target 분리
        feature_cols = [col for col in df.columns if col.startswith(('ma_', 'rsi', 'macd', 'bb', 'volume', 'momentum', 'stoch', 'atr', 'pattern', 'checklist'))]

        X = df[feature_cols].fillna(0)
        y = df[target_col].fillna(0)

        # 모델 학습 (Feature 중요도 계산용)
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X, y)

        # Feature 중요도
        importances = dict(zip(feature_cols, rf.feature_importances_))
        sorted_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)

        # 상위 N개 선택
        selected_features = [f[0] for f in sorted_features[:max_features]]

        logger.info(f"Selected {len(selected_features)} features out of {len(feature_cols)}")

        return selected_features
