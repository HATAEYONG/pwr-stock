"""
고도화 ML 피처 엔지니어링 시스템 v2.0

[개선사항]
1. 자동 피처 선택 (Feature Selection)
2. 피처 중요도 자동 계산
3. 하이퍼파라미터 튜닝 (Optuna)
4. 앙상블 피처 생성
5. 시계열 특화 피처
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class AdvancedFeatureEngineer:
    """
    고도화 피처 엔지니어링 v2.0

    기존 FeatureEngineer의 고도화 버전으로
    더 많은 피처와 자동화된 피처 선택을 제공
    """

    def __init__(self):
        self.selected_features = None
        self.feature_importance = None

    def create_advanced_features(
        self,
        symbol,
        end_date: datetime.date,
        lookback_days: int = 120
    ) -> pd.DataFrame:
        """
        고도화 피처 생성

        Args:
            symbol: 종목 Symbol 모델
            end_date: 기준일
            lookback_days: 조회 기간

        Returns:
            고도화 피처 DataFrame
        """
        from apps.market.models import Symbol, OHLCV

        # 기본 피처 로드
        from apps.ml.services.feature_engineering import FeatureEngineer
        df = FeatureEngineer.create_features(symbol, end_date, lookback_days)

        if df.empty:
            return df

        # 고급 피처 추가
        df = self._add_advanced_technical_features(df)
        df = self._add_market_microstructure_features(df)
        df = self._add_time_decay_features(df)
        df = self._add_volatility_features(df)
        df = self._add_pattern_recognition_features(df)

        # NaN 처리 (대부분의 NaN은 forward fill로 처리)
        before_count = len(df)

        # Target 변수의 NaN만 제거
        target_cols = [col for col in df.columns if col.startswith('target_')]
        df = df.dropna(subset=target_cols)

        # 그 외 NaN은 forward fill + backward fill
        df = df.ffill().bfill()

        after_count = len(df)

        logger.info(f"Created {len(df.columns)} features for {symbol.ticker} (rows: {before_count} -> {after_count})")

        return df

    def _add_advanced_technical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """고급 기술적 지표 피처"""

        # 1. Fibonacci Retracement Levels
        df['fib_236'] = df['close'] * 0.236
        df['fib_382'] = df['close'] * 0.382
        df['fib_500'] = df['close'] * 0.500
        df['fib_618'] = df['close'] * 0.618

        # 2. Ichimoku Cloud (일목정지표) - shorter periods
        tenkan_sen = (df['high'].rolling(9).max() + df['low'].rolling(9).min()) / 2
        kijun_sen = (df['high'].rolling(20).max() + df['low'].rolling(20).min()) / 2
        df['ichimoku_tenkan'] = tenkan_sen
        df['ichimoku_kijun'] = kijun_sen
        df['ichimoku_span_a'] = ((tenkan_sen + kijun_sen) / 2).shift(5)
        df['ichimoku_span_b'] = (df['close'].rolling(20).max() + df['close'].rolling(20).min()) / 2
        df['ichimoku_signal'] = np.where(df['ichimoku_span_a'] > df['ichimoku_span_b'], 1, -1)

        # 3. Williams %R
        high_14 = df['high'].rolling(14).max()
        low_14 = df['low'].rolling(14).min()
        df['williams_r'] = -100 * (high_14 - df['close']) / (high_14 - low_14)

        # 4. CCI (Commodity Channel Index)
        tp = (df['high'] + df['low'] + df['close']) / 3
        ma_tp = tp.rolling(20).mean()
        md_tp = tp.rolling(20).apply(lambda x: np.abs(x - x.mean()).mean())
        df['cci'] = (tp - ma_tp) / (0.015 * md_tp)

        # 5. MFI (Money Flow Index)
        typical_price = (df['high'] + df['low'] + df['close']) / 3
        money_flow = typical_price * df['volume']

        positive_flow = money_flow.where(typical_price > typical_price.shift(1), 0)
        negative_flow = money_flow.where(typical_price < typical_price.shift(1), 0)

        mfr = positive_flow.rolling(14).sum() / abs(negative_flow.rolling(14).sum())
        df['mfi'] = 100 - (100 / (1 + mfr))

        # 6. Trix (Triple Exponential Average)
        ema1 = df['close'].ewm(span=12).mean()
        ema2 = ema1.ewm(span=12).mean()
        ema3 = ema2.ewm(span=12).mean()
        df['trix'] = ema3.pct_change() * 100

        # 7. Mass Index
        high_low = df['high'] - df['low']
        ema1 = high_low.ewm(span=9).mean()
        ema2 = ema1.ewm(span=9).mean()
        df['mass_index'] = ema1 / ema2

        # 8. Chaikin Oscillator
        ad_line = (2 * df['close'] - df['high'] - df['low']) / (df['high'] - df['low']) * df['volume']
        df['chaikin_oscillator'] = ad_line.ewm(span=3).mean() - ad_line.ewm(span=10).mean()

        logger.debug("Added advanced technical features")
        return df

    def _add_market_microstructure_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """시장 미시구조 피처"""

        # 1. Price Impact
        df['price_impact'] = (df['close'] - df['open']) / df['open'] * 100

        # 2. Spread (고가-저가 갭)
        df['spread'] = (df['high'] - df['low']) / df['close'] * 100
        df['spread_ma'] = df['spread'].rolling(20).mean()

        # 3. Gap (상한가 gap)
        df['gap_up'] = np.where(df['open'] > df['close'].shift(1), 1, 0)
        df['gap_down'] = np.where(df['open'] < df['close'].shift(1), 1, 0)

        # 4. Upper/Lower Shadow wick size
        df['upper_shadow'] = (df['high'] - df[['open', 'close']].max(axis=1)) / (df['high'] - df['low'])
        df['lower_shadow'] = (df[['open', 'close']].min(axis=1) - df['low']) / (df['high'] - df['low'])

        # 5. Body size
        body_size = abs(df['close'] - df['open'])
        df['body_ratio'] = body_size / (df['high'] - df['low'])

        # 6. Volume pressure
        df['volume_pressure'] = np.where(df['close'] > df['open'], df['volume'], -df['volume'])
        df['volume_pressure_ma'] = df['volume_pressure'].rolling(20).mean()

        # 7. Turnover rate approximation
        if 'volume_ma' in df.columns:
            df['turnover_rate'] = df['volume'] / df['volume_ma']

        logger.debug("Added market microstructure features")
        return df

    def _add_time_decay_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """시간 감소 피처 (최근 데이터에 더 높은 가중치)"""

        # Exponential weights for recent data (shorter periods)
        for period in [5, 10, 20]:
            df[f'close_ewm_{period}'] = df['close'].ewm(span=period).mean()
            df[f'volume_ewm_{period}'] = df['volume'].ewm(span=period).mean()

        # Time decay weights (shorter half-life)
        time_weights = np.exp(-np.arange(len(df)) / 30)  # 30일 반감기
        df['time_weighted_close'] = df['close'] * time_weights
        df['time_weighted_volume'] = df['volume'] * time_weights

        logger.debug("Added time decay features")
        return df

    def _add_volatility_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """변동성 피처"""

        # 1. Realized Volatility (shorter periods to avoid excessive NaN)
        for period in [5, 10, 20]:
            df[f'realized_vol_{period}d'] = df['returns'].rolling(period).std() * np.sqrt(252)

        # 2. Parkinson Volatility (고가-저가 기반) - shorter period
        hl = np.log(df['high'] / df['low'])
        df['parkinson_vol'] = np.sqrt((hl ** 2).rolling(20).sum() / (4 * np.log(2)) * 252 / 20)

        # 3. Garman-Klass Volatility - shorter period
        log_ho = np.log(df['high'] / df['open'])
        log_lo = np.log(df['low'] / df['open'])
        log_cc = np.log(df['close'] / df['close'].shift(1))

        gk_vol_squared = 0.5 * (log_ho ** 2) - (2 * np.log(2) - 1) * (log_cc ** 2)
        df['gk_vol'] = np.sqrt(gk_vol_squared.rolling(20).sum() * 252 / 20)

        # 4. Yang-Zhang Volatility - shorter period
        k = 0.34 / (1.34 + (len(df) + 1) / (len(df) - 1))
        yz_vol_squared = k * (log_ho ** 2) + (1 - k) * (log_cc ** 2)
        df['yz_vol'] = np.sqrt(yz_vol_squared.rolling(20).sum() * 252 / 20)

        # 5. Volatility Regime (변동성 레짐) - shorter period
        df['vol_regime'] = np.where(df['volatility_20d'] > df['volatility_20d'].rolling(20).mean(), 1, 0)

        # 6. Volatility Mean Reversion - shorter period
        vol_ma = df['volatility_20d'].rolling(20).mean()
        df['vol_mean_reversion'] = (vol_ma - df['volatility_20d']) / vol_ma

        logger.debug("Added volatility features")
        return df

    def _add_pattern_recognition_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """패턴 인식 피처"""

        # 1. Double Top/Bottom
        rolling_max = df['high'].rolling(20).max()
        rolling_min = df['low'].rolling(20).min()

        df['near_high_20d'] = (df['high'] >= rolling_max * 0.98).astype(int)
        df['near_low_20d'] = (df['low'] <= rolling_min * 1.02).astype(int)

        # 2. Head and Shoulders (단순화)
        df['left_shoulder'] = df['near_high_20d'].rolling(5).sum() >= 2
        df['right_shoulder'] = df['near_high_20d'].shift(-5).rolling(5).sum() >= 2

        # 3. Flag Pattern (횡보)
        price_range = df['high'].rolling(20).max() - df['low'].rolling(20).min()
        df['flag_pattern'] = (price_range / df['close'].rolling(20).mean() < 0.05).astype(int)

        # 4. Breakout detection (shorter period)
        resistance = df['high'].rolling(20).max()
        support = df['low'].rolling(20).min()

        df['breakout_resistance'] = (df['close'] > resistance * 0.98).astype(int)
        df['breakdown_support'] = (df['close'] < support * 1.02).astype(int)

        # 5. Trend Strength
        df['trend_strength'] = df['ma5_ratio'] - df['ma60_ratio']

        # 6. Consolidation (횡보장)
        df['consolidation'] = (df['spread'].rolling(20).std() / df['spread'].rolling(20).mean() < 0.3).astype(int)

        logger.debug("Added pattern recognition features")
        return df

    def auto_select_features(
        self,
        df: pd.DataFrame,
        target_col: str = 'target_direction_5d',
        method: str = 'rf',
        max_features: int = 30
    ) -> Tuple[List[str], Dict[str, float]]:
        """
        자동 피처 선택

        Args:
            df: 피처 DataFrame
            target_col: 타겟 컬럼
            method: 선택 방법 (rf=RandomForest, xgb=XGBoost, lgbm=LightGBM)
            max_features: 최대 피처 수

        Returns:
            (선택된 피처 목록, 피처 중요도 딕셔너리)
        """
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
        from sklearn.model_selection import cross_val_score

        # Feature/Target 분리
        exclude_cols = [target_col, 'target_return_1d', 'target_return_5d', 'target_return_10d', 'target_return_20d']
        feature_cols = [col for col in df.columns if col not in exclude_cols and not col.startswith('target_')]

        X = df[feature_cols].fillna(0)
        y = df[target_col].fillna(0)

        # 모델 선택
        if method == 'rf':
            model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        elif method == 'xgb':
            try:
                import xgboost as xgb
                model = xgb.XGBClassifier(n_estimators=100, random_state=42, use_label_encoder=False, eval_metric='logloss')
            except ImportError:
                logger.warning("XGBoost not installed, using RandomForest")
                model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        else:
            model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)

        # Feature 중요도 계산
        model.fit(X, y)

        # Feature 중요도 추출
        importances = dict(zip(feature_cols, model.feature_importances_))
        sorted_importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))

        # 상위 N개 선택
        selected_features = list(sorted_importances.keys())[:max_features]

        # Cross-validation 점수
        cv_scores = cross_val_score(model, X[selected_features], y, cv=5, scoring='f1')

        logger.info(f"Auto-selected {len(selected_features)} features (Method: {method})")
        logger.info(f"Cross-validation F1: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

        self.selected_features = selected_features
        self.feature_importance = sorted_importances

        return selected_features, sorted_importances

    def get_top_features(self, n: int = 20) -> List[Tuple[str, float]]:
        """상위 N개 피처 반환"""
        if self.feature_importance is None:
            return []

        return list(self.feature_importance.items())[:n]

    def optimize_hyperparameters(
        self,
        df: pd.DataFrame,
        target_col: str = 'target_direction_5d',
        n_trials: int = 50
    ) -> Dict:
        """
        하이퍼파라미터 최적화 (Optuna)

        Args:
            df: 피처 DataFrame
            target_col: 타겟 컬럼
            n_trials: 최적화 시도 횟수

        Returns:
            최적 하이퍼파라미터
        """
        try:
            import optuna

            # Feature/Target 분리
            if self.selected_features:
                feature_cols = self.selected_features
            else:
                exclude_cols = [target_col, 'target_return_1d', 'target_return_5d', 'target_return_10d', 'target_return_20d']
                feature_cols = [col for col in df.columns if col not in exclude_cols and not col.startswith('target_')]

            X = df[feature_cols].fillna(0)
            y = df[target_col].fillna(0)

            def objective(trial):
                # XGBoost 하이퍼파라미터
                params = {
                    'n_estimators': trial.suggest_int('n_estimators', 50, 500),
                    'max_depth': trial.suggest_int('max_depth', 3, 10),
                    'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                    'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                    'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                    'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
                }

                try:
                    import xgboost as xgb
                    model = xgb.XGBClassifier(**params, random_state=42, use_label_encoder=False)

                    from sklearn.model_selection import cross_val_score
                    scores = cross_val_score(model, X, y, cv=3, scoring='f1')

                    return scores.mean()
                except:
                    # XGBoost가 없으면 RandomForest
                    from sklearn.ensemble import RandomForestClassifier
                    model = RandomForestClassifier(
                        n_estimators=params['n_estimators'],
                        max_depth=params['max_depth'],
                        min_samples_split=params['min_child_weight'],
                        random_state=42,
                        n_jobs=-1
                    )

                    from sklearn.model_selection import cross_val_score
                    scores = cross_val_score(model, X, y, cv=3, scoring='f1')

                    return scores.mean()

            # Optuna study
            study = optuna.create_study(direction='maximize')
            study.optimize(objective, n_trials=n_trials)

            best_params = study.best_params
            best_score = study.best_value

            logger.info(f"Best hyperparameters: {best_params}")
            logger.info(f"Best F1 score: {best_score:.4f}")

            return {
                'best_params': best_params,
                'best_score': best_score,
                'n_trials': n_trials
            }

        except ImportError:
            logger.warning("Optuna not installed. Install: pip install optuna")
            return {}
        except Exception as e:
            logger.error(f"Hyperparameter optimization failed: {e}")
            return {}


# 테스트 및 실행
if __name__ == '__main__':
    import sys
    import os

    # Windows UTF-8
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    # Django 설정
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    sys.path.insert(0, r'C:\powerstock\trading-platform\backend')

    import django
    django.setup()

    from apps.market.models import Symbol

    print("="*100)
    print(" "*25 + "고도화 ML 피처 엔지니어링 v2.0")
    print("="*100)

    # 테스트 종목
    symbol = Symbol.objects.filter(ticker='047770').first()

    if not symbol:
        print("종목을 찾을 수 없습니다: 047770")
        sys.exit(1)

    print(f"\n종목: {symbol.name} ({symbol.ticker})")
    print("\n고도화 피처 생성 시작...")

    from datetime import date

    engineer = AdvancedFeatureEngineer()

    # 피처 생성
    df = engineer.create_advanced_features(symbol, date.today(), lookback_days=120)

    if not df.empty:
        print(f"\n✅ 피처 생성 완료")
        print(f"   총 피처 수: {len(df.columns)}개")
        print(f"   데이터 행 수: {len(df)}일")

        # 자동 피처 선택
        print("\n자동 피처 선택 시작...")
        selected_features, importance = engineer.auto_select_features(df, method='rf', max_features=30)

        print(f"\n✅ 피처 선택 완료")
        print(f"   선택된 피처: {len(selected_features)}개")

        # 상위 10개 피처
        print("\n[상위 10개 피처]")
        for i, (feat, imp) in enumerate(importance.items()[:10], 1):
            print(f"  {i:2}. {feat:40} - {imp:.4f}")

        # 하이퍼파라미터 최적화 (선택적)
        print("\n하이퍼파라미터 최적화 (선택 사항)")
        print("진행하시겠습니까? (시간이 오래 걸릴 수 있습니다)")

        print("\n" + "="*100)
        print("완료")
        print("="*100)
    else:
        print("\n❌ 데이터가 충분하지 않습니다")
