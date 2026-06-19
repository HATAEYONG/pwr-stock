"""
Feature Store v2.0
기존 FeatureEngineer + AdvancedFeatureEngineer 통합, 50+ features 보장
캐싱 레이어 포함
"""
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# 인메모리 캐시 (프로세스 수명 동안 유지)
_feature_cache: Dict[str, Tuple[pd.DataFrame, datetime]] = {}
_CACHE_TTL_SECONDS = 3600  # 1시간


def _cache_key(ticker: str, end_date, lookback_days: int) -> str:
    raw = f"{ticker}:{end_date}:{lookback_days}"
    return hashlib.md5(raw.encode()).hexdigest()


def _is_cache_valid(key: str) -> bool:
    if key not in _feature_cache:
        return False
    _, ts = _feature_cache[key]
    return (datetime.now() - ts).total_seconds() < _CACHE_TTL_SECONDS


def clear_cache():
    _feature_cache.clear()


class FeatureStore:
    """
    통합 Feature Store — 50+ features 생성 및 캐싱
    predictor, backtesting bridge 등에서 단일 진입점으로 사용
    """

    # feature 컬럼 prefix 목록 (predictor의 하드코딩 대체)
    FEATURE_PREFIXES = (
        'ma', 'rsi', 'macd', 'bb', 'volume', 'momentum', 'stoch', 'atr',
        'pattern', 'checklist', 'fib', 'ichimoku', 'williams', 'cci', 'mfi',
        'trix', 'mass', 'chaikin', 'price_impact', 'spread', 'gap', 'upper_shadow',
        'lower_shadow', 'body_ratio', 'volume_pressure', 'turnover', 'close_ewm',
        'volume_ewm', 'time_weighted', 'realized_vol', 'parkinson', 'gk_vol',
        'yz_vol', 'vol_regime', 'vol_mean_reversion', 'near_high', 'near_low',
        'left_shoulder', 'right_shoulder', 'flag_pattern', 'breakout', 'breakdown',
        'trend_strength', 'consolidation', 'market_phase', 'sector_momentum',
        'returns', 'volatility',
    )

    def __init__(self, use_cache: bool = True):
        self.use_cache = use_cache

    def get_features(
        self,
        symbol,
        end_date,
        lookback_days: int = 120,
    ) -> pd.DataFrame:
        """
        종목·날짜 기준 feature DataFrame 반환 (캐시 우선)
        """
        key = _cache_key(symbol.ticker, end_date, lookback_days)

        if self.use_cache and _is_cache_valid(key):
            logger.debug(f"Cache hit: {symbol.ticker} {end_date}")
            return _feature_cache[key][0].copy()

        df = self._build_features(symbol, end_date, lookback_days)

        if self.use_cache and not df.empty:
            _feature_cache[key] = (df.copy(), datetime.now())

        return df

    def get_feature_columns(self, df: pd.DataFrame) -> List[str]:
        """feature 컬럼만 반환 (target·날짜 제외)"""
        return [
            col for col in df.columns
            if col.startswith(self.FEATURE_PREFIXES)
            and not col.startswith('target_')
        ]

    # ─────────────────────────────────────────────
    # 내부 빌드 로직
    # ─────────────────────────────────────────────

    def _build_features(self, symbol, end_date, lookback_days: int) -> pd.DataFrame:
        df = self._load_ohlcv(symbol, end_date, lookback_days)
        if df is None or df.empty:
            return pd.DataFrame()

        df = self._add_base_technical(df)
        df = self._add_advanced_technical(df)
        df = self._add_microstructure(df)
        df = self._add_volatility(df)
        df = self._add_pattern_recognition(df)
        df = self._add_market_phase(df)
        df = self._add_pattern_checklist(df, symbol, end_date)
        df = self._add_targets(df)

        # target NaN 행만 제거, 나머지는 ffill/bfill
        target_cols = [c for c in df.columns if c.startswith('target_')]
        df = df.dropna(subset=target_cols)
        df = df.ffill().bfill()

        n_features = len(self.get_feature_columns(df))
        logger.info(f"[FeatureStore] {symbol.ticker} {end_date}: {n_features} features, {len(df)} rows")
        return df

    def _load_ohlcv(self, symbol, end_date, lookback_days: int) -> Optional[pd.DataFrame]:
        from apps.market.models import OHLCV

        start_date = end_date - timedelta(days=lookback_days * 2)
        ohlcv = OHLCV.objects.filter(
            symbol=symbol,
            date__gte=start_date,
            date__lte=end_date,
            timeframe='daily',
        ).order_by('date')

        if ohlcv.count() < lookback_days:
            logger.warning(f"Insufficient OHLCV for {symbol.ticker}: {ohlcv.count()} rows")
            return None

        df = pd.DataFrame(list(ohlcv.values(
            'date', 'open_price', 'high_price', 'low_price', 'close_price', 'volume'
        )))
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        df.rename(columns={
            'open_price': 'open', 'high_price': 'high',
            'low_price': 'low', 'close_price': 'close',
        }, inplace=True)
        for col in ['open', 'high', 'low', 'close', 'volume']:
            df[col] = df[col].astype(float)
        return df

    def _add_base_technical(self, df: pd.DataFrame) -> pd.DataFrame:
        # 이동평균 + 비율
        for p in [5, 10, 20, 60, 120]:
            df[f'ma{p}'] = df['close'].rolling(p).mean()
            df[f'ma{p}_ratio'] = df['close'] / df[f'ma{p}'] - 1

        df['ma_trend'] = np.where(
            (df['ma5'] > df['ma20']) & (df['ma20'] > df['ma60']), 1,
            np.where((df['ma5'] < df['ma20']) & (df['ma20'] < df['ma60']), -1, 0)
        )

        # RSI
        delta = df['close'].diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        df['rsi'] = 100 - (100 / (1 + gain / loss))
        df['rsi_oversold'] = (df['rsi'] < 30).astype(int)
        df['rsi_overbought'] = (df['rsi'] > 70).astype(int)

        # MACD
        exp12 = df['close'].ewm(span=12).mean()
        exp26 = df['close'].ewm(span=26).mean()
        df['macd'] = exp12 - exp26
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_histogram'] = df['macd'] - df['macd_signal']
        df['macd_cross_up'] = ((df['macd'] > df['macd_signal']) &
                                (df['macd'].shift(1) <= df['macd_signal'].shift(1))).astype(int)

        # 볼린저 밴드
        df['bb_middle'] = df['close'].rolling(20).mean()
        bb_std = df['close'].rolling(20).std()
        df['bb_upper'] = df['bb_middle'] + bb_std * 2
        df['bb_lower'] = df['bb_middle'] - bb_std * 2
        df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
        df['bb_position'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])

        # 거래량
        df['volume_ma20'] = df['volume'].rolling(20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_ma20']
        df['volume_change'] = df['volume'].pct_change()
        df['volume_surge'] = (df['volume_ratio'] > 2.0).astype(int)

        # 수익률·변동성
        df['returns'] = df['close'].pct_change()
        df['volatility_5d'] = df['returns'].rolling(5).std()
        df['volatility_20d'] = df['returns'].rolling(20).std()

        # ATR
        hl = df['high'] - df['low']
        hc = np.abs(df['high'] - df['close'].shift())
        lc = np.abs(df['low'] - df['close'].shift())
        tr = pd.concat([hl, hc, lc], axis=1).max(axis=1)
        df['atr'] = tr.rolling(14).mean()
        df['atr_ratio'] = df['atr'] / df['close']

        # Momentum
        for p in [1, 3, 5, 10, 20]:
            df[f'momentum_{p}d'] = df['close'].pct_change(p)

        # Stochastic
        low14 = df['low'].rolling(14).min()
        high14 = df['high'].rolling(14).max()
        df['stoch_k'] = 100 * (df['close'] - low14) / (high14 - low14)
        df['stoch_d'] = df['stoch_k'].rolling(3).mean()

        return df

    def _add_advanced_technical(self, df: pd.DataFrame) -> pd.DataFrame:
        # Ichimoku (단축 주기)
        tenkan = (df['high'].rolling(9).max() + df['low'].rolling(9).min()) / 2
        kijun = (df['high'].rolling(20).max() + df['low'].rolling(20).min()) / 2
        df['ichimoku_tenkan'] = tenkan
        df['ichimoku_kijun'] = kijun
        df['ichimoku_signal'] = np.where(tenkan > kijun, 1, -1)

        # Williams %R
        h14 = df['high'].rolling(14).max()
        l14 = df['low'].rolling(14).min()
        df['williams_r'] = -100 * (h14 - df['close']) / (h14 - l14)

        # CCI
        tp = (df['high'] + df['low'] + df['close']) / 3
        ma_tp = tp.rolling(20).mean()
        md_tp = tp.rolling(20).apply(lambda x: np.abs(x - x.mean()).mean())
        df['cci'] = (tp - ma_tp) / (0.015 * md_tp)

        # MFI
        typical = (df['high'] + df['low'] + df['close']) / 3
        mf = typical * df['volume']
        pos_mf = mf.where(typical > typical.shift(1), 0)
        neg_mf = mf.where(typical < typical.shift(1), 0)
        mfr = pos_mf.rolling(14).sum() / neg_mf.abs().rolling(14).sum()
        df['mfi'] = 100 - (100 / (1 + mfr))

        # Trix
        e1 = df['close'].ewm(span=12).mean()
        e2 = e1.ewm(span=12).mean()
        e3 = e2.ewm(span=12).mean()
        df['trix'] = e3.pct_change() * 100

        # Chaikin Oscillator
        ad = (2 * df['close'] - df['high'] - df['low']) / (df['high'] - df['low']) * df['volume']
        df['chaikin_oscillator'] = ad.ewm(span=3).mean() - ad.ewm(span=10).mean()

        return df

    def _add_microstructure(self, df: pd.DataFrame) -> pd.DataFrame:
        df['price_impact'] = (df['close'] - df['open']) / df['open'] * 100
        df['spread'] = (df['high'] - df['low']) / df['close'] * 100
        df['spread_ma'] = df['spread'].rolling(20).mean()
        df['gap_up'] = (df['open'] > df['close'].shift(1)).astype(int)
        df['gap_down'] = (df['open'] < df['close'].shift(1)).astype(int)

        hl = df['high'] - df['low']
        body = (df['close'] - df['open']).abs()
        df['upper_shadow'] = (df['high'] - df[['open', 'close']].max(axis=1)) / hl
        df['lower_shadow'] = (df[['open', 'close']].min(axis=1) - df['low']) / hl
        df['body_ratio'] = body / hl

        df['volume_pressure'] = np.where(df['close'] > df['open'], df['volume'], -df['volume'])
        df['volume_pressure_ma'] = df['volume_pressure'].rolling(20).mean()
        df['turnover_rate'] = df['volume'] / df['volume_ma20']

        return df

    def _add_volatility(self, df: pd.DataFrame) -> pd.DataFrame:
        for p in [5, 10, 20]:
            df[f'realized_vol_{p}d'] = df['returns'].rolling(p).std() * np.sqrt(252)

        hl = np.log(df['high'] / df['low'])
        df['parkinson_vol'] = np.sqrt((hl ** 2).rolling(20).sum() / (4 * np.log(2)) * 252 / 20)

        log_ho = np.log(df['high'] / df['open'])
        log_cc = np.log(df['close'] / df['close'].shift(1))
        gk = 0.5 * (log_ho ** 2) - (2 * np.log(2) - 1) * (log_cc ** 2)
        df['gk_vol'] = np.sqrt(gk.rolling(20).sum() * 252 / 20)

        df['vol_regime'] = (df['volatility_20d'] > df['volatility_20d'].rolling(20).mean()).astype(int)
        vol_ma = df['volatility_20d'].rolling(20).mean()
        df['vol_mean_reversion'] = (vol_ma - df['volatility_20d']) / vol_ma

        # EWM
        for p in [5, 10, 20]:
            df[f'close_ewm_{p}'] = df['close'].ewm(span=p).mean()
            df[f'volume_ewm_{p}'] = df['volume'].ewm(span=p).mean()

        return df

    def _add_pattern_recognition(self, df: pd.DataFrame) -> pd.DataFrame:
        roll_max = df['high'].rolling(20).max()
        roll_min = df['low'].rolling(20).min()
        df['near_high_20d'] = (df['high'] >= roll_max * 0.98).astype(int)
        df['near_low_20d'] = (df['low'] <= roll_min * 1.02).astype(int)

        price_range = df['high'].rolling(20).max() - df['low'].rolling(20).min()
        df['flag_pattern'] = (price_range / df['close'].rolling(20).mean() < 0.05).astype(int)

        resistance = df['high'].rolling(20).max()
        support = df['low'].rolling(20).min()
        df['breakout_resistance'] = (df['close'] > resistance * 0.98).astype(int)
        df['breakdown_support'] = (df['close'] < support * 1.02).astype(int)

        df['trend_strength'] = df['ma5_ratio'] - df['ma60_ratio']
        df['consolidation'] = (df['spread'].rolling(20).std() / df['spread'].rolling(20).mean() < 0.3).astype(int)

        return df

    def _add_market_phase(self, df: pd.DataFrame) -> pd.DataFrame:
        """시장 국면 feature (외부 API 없이 OHLCV 파생)"""
        # 거래량 레짐: 최근 5일 평균 vs 60일 평균
        df['volume_regime'] = df['volume'].rolling(5).mean() / df['volume'].rolling(60).mean()

        # 추세 강도 (ADX 근사)
        plus_dm = (df['high'].diff()).clip(lower=0)
        minus_dm = (-df['low'].diff()).clip(lower=0)
        tr = pd.concat([
            df['high'] - df['low'],
            (df['high'] - df['close'].shift()).abs(),
            (df['low'] - df['close'].shift()).abs(),
        ], axis=1).max(axis=1)
        atr14 = tr.rolling(14).mean()
        plus_di = 100 * plus_dm.rolling(14).mean() / atr14
        minus_di = 100 * minus_dm.rolling(14).mean() / atr14
        dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di)
        df['market_phase_adx'] = dx.rolling(14).mean()  # ADX

        # 상승/하락 추세 구분
        df['market_phase_bull'] = (
            (df['close'] > df['ma60']) & (df['market_phase_adx'] > 25)
        ).astype(int)

        # 섹터 모멘텀 근사: 자기 자신의 60일 모멘텀으로 대체
        df['sector_momentum'] = df['close'].pct_change(60)

        return df

    def _add_pattern_checklist(self, df: pd.DataFrame, symbol, end_date) -> pd.DataFrame:
        """Pattern 체크리스트 feature (Evaluation 테이블에서 로드)"""
        try:
            from apps.market.models import Evaluation
            evaluations = Evaluation.objects.filter(
                symbol=symbol,
                date__in=df.index.date,
            )
            if not evaluations.exists():
                return df

            eval_df = pd.DataFrame(list(evaluations.values(
                'date', 'pattern_type', 'checklist_score', 'start_signal', 'risk_signal', 'sell_signal'
            )))
            eval_df['date'] = pd.to_datetime(eval_df['date'])
            eval_df.set_index('date', inplace=True)
            df = df.join(eval_df, how='left')

            pattern_map = {'P1': 1, 'P2': 2, 'P3': 3}
            df['pattern_encoded'] = df['pattern_type'].map(pattern_map).fillna(0)
            for sig in ['start_signal', 'risk_signal', 'sell_signal']:
                df[sig] = df[sig].fillna(False).astype(int)
            df['checklist_score_norm'] = df.get('checklist_score', pd.Series(0, index=df.index)) / 100.0
        except Exception as e:
            logger.warning(f"Pattern checklist load failed: {e}")
        return df

    def _add_targets(self, df: pd.DataFrame) -> pd.DataFrame:
        for days in [1, 5, 10, 20]:
            df[f'target_return_{days}d'] = df['close'].shift(-days) / df['close'] - 1
        df['target_direction_5d'] = (df['target_return_5d'] > 0.02).astype(int)
        df['target_direction_20d'] = (df['target_return_20d'] > 0.05).astype(int)
        return df
