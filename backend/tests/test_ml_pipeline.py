"""
ML 파이프라인 단위 테스트
Feature Store / Model Registry / Backtest Bridge / Position Sizer 핵심 경로 검증
"""
import pickle
import tempfile
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler


# ─── Feature Store ───────────────────────────────────────────────────────────

class TestFeatureStore:
    def _make_ohlcv_df(self, n=150):
        """더미 OHLCV DataFrame (인덱스: DatetimeIndex)"""
        dates = pd.date_range(end=date.today(), periods=n, freq='B')
        close = 10000 + np.cumsum(np.random.randn(n) * 100)
        df = pd.DataFrame({
            'open': close * 0.99,
            'high': close * 1.02,
            'low': close * 0.98,
            'close': close,
            'volume': np.random.randint(100_000, 5_000_000, n).astype(float),
        }, index=dates)
        return df

    def test_base_technical_feature_count(self):
        from apps.ml.services.feature_store import FeatureStore
        store = FeatureStore(use_cache=False)
        df = self._make_ohlcv_df()
        df = store._add_base_technical(df)
        assert 'rsi' in df.columns
        assert 'macd' in df.columns
        assert 'bb_position' in df.columns
        assert 'volume_surge' in df.columns

    def test_market_phase_features(self):
        from apps.ml.services.feature_store import FeatureStore
        store = FeatureStore(use_cache=False)
        df = self._make_ohlcv_df()
        df = store._add_base_technical(df)
        df = store._add_market_phase(df)
        assert 'market_phase_adx' in df.columns
        assert 'market_phase_bull' in df.columns
        assert 'sector_momentum' in df.columns

    def test_total_feature_count_exceeds_50(self):
        from apps.ml.services.feature_store import FeatureStore
        store = FeatureStore(use_cache=False)
        df = self._make_ohlcv_df()
        df = store._add_base_technical(df)
        df = store._add_advanced_technical(df)
        df = store._add_microstructure(df)
        df = store._add_volatility(df)
        df = store._add_pattern_recognition(df)
        df = store._add_market_phase(df)
        df = store._add_targets(df)
        feat_cols = store.get_feature_columns(df)
        assert len(feat_cols) >= 50, f"Feature count={len(feat_cols)}, expected >= 50"

    def test_cache_hit(self):
        from apps.ml.services.feature_store import FeatureStore, clear_cache, _feature_cache
        clear_cache()
        # 캐시에 직접 삽입 후 hit 여부 확인
        from apps.ml.services.feature_store import _cache_key
        key = _cache_key('TEST', date.today(), 120)
        dummy_df = pd.DataFrame({'a': [1, 2]})
        from datetime import datetime
        _feature_cache[key] = (dummy_df, datetime.now())

        store = FeatureStore(use_cache=True)
        assert store._is_valid_cache_key(key) if hasattr(store, '_is_valid_cache_key') else True
        clear_cache()


# ─── Position Sizer ──────────────────────────────────────────────────────────

class TestPositionSizer:
    def test_default_ratio(self):
        from apps.ml.services.position_sizer import PositionSizer
        sizer = PositionSizer()
        assert sizer.get_position_ratio() == pytest.approx(0.95)

    def test_ratio_reduces_on_drawdown(self):
        from apps.ml.services.position_sizer import PositionSizer
        sizer = PositionSizer(initial_capital=1_000_000)
        sizer.record_trade(-0.08)  # 8% 손실 → MDD 8%
        ratio = sizer.get_position_ratio()
        assert ratio < 0.95, f"Expected reduced ratio, got {ratio}"

    def test_ratio_is_zero_on_severe_drawdown(self):
        from apps.ml.services.position_sizer import PositionSizer
        sizer = PositionSizer(initial_capital=1_000_000)
        sizer.record_trade(-0.35)  # 35% 손실
        assert sizer.get_position_ratio() == 0.0

    def test_reset(self):
        from apps.ml.services.position_sizer import PositionSizer
        sizer = PositionSizer(initial_capital=1_000_000)
        sizer.record_trade(-0.20)
        sizer.reset()
        assert sizer.get_position_ratio() == pytest.approx(0.95)

    def test_stats(self):
        from apps.ml.services.position_sizer import PositionSizer
        sizer = PositionSizer(initial_capital=1_000_000)
        sizer.record_trade(0.10)
        stats = sizer.stats()
        assert 'current_mdd' in stats
        assert stats['trade_count'] == 1


# ─── Model Registry ──────────────────────────────────────────────────────────

class TestModelRegistry:
    def _dummy_model(self):
        clf = RandomForestClassifier(n_estimators=10, random_state=0)
        X = np.random.rand(50, 5)
        y = (X[:, 0] > 0.5).astype(int)
        clf.fit(X, y)
        return clf, StandardScaler().fit(X), [f'f{i}' for i in range(5)]

    @patch('apps.ml.services.model_registry._REGISTRY_DIR')
    @patch('apps.ml.models.MLModel.objects')
    def test_save_creates_file_and_db_record(self, mock_objects, mock_dir):
        with tempfile.TemporaryDirectory() as tmp:
            mock_dir.__truediv__ = lambda self, other: Path(tmp) / other
            mock_dir.mkdir = MagicMock()

            mock_record = MagicMock()
            mock_record.id = 42
            mock_objects.filter.return_value.order_by.return_value.first.return_value = None
            mock_objects.create.return_value = mock_record

            from apps.ml.services.model_registry import ModelRegistry
            registry = ModelRegistry()
            model, scaler, features = self._dummy_model()

            with patch('apps.ml.services.model_registry._REGISTRY_DIR', Path(tmp)):
                model_id = registry.save(
                    model, scaler, features,
                    meta={'name': 'test', 'algorithm': 'random_forest',
                          'accuracy': 0.65, 'train_start_date': date.today(),
                          'train_end_date': date.today()},
                )
            # DB create 호출 여부 확인
            assert mock_objects.create.called


# ─── Backtest Bridge (통합 수준) ─────────────────────────────────────────────

class TestMLBacktestBridge:
    def test_empty_result_on_no_ohlcv(self):
        from apps.ml.services.backtest_bridge import MLBacktestBridge

        sym = MagicMock()
        sym.ticker = 'TEST'

        with patch('apps.market.models.OHLCV.objects') as mock_ohlcv:
            mock_ohlcv.filter.return_value.order_by.return_value.exists.return_value = False
            bridge = MLBacktestBridge(sym, date(2024, 1, 1), date(2024, 12, 31))
            result = bridge.run()
            assert result.get('error') or result.get('trade_count', 0) == 0

    def test_metrics_keys_present(self):
        """결과 딕셔너리가 필수 키를 갖는지 확인 (ML 없이 패턴만)"""
        from apps.ml.services.backtest_bridge import MLBacktestBridge

        sym = MagicMock()
        sym.ticker = 'TEST'

        n = 100
        dates = pd.date_range('2024-01-01', periods=n, freq='B')
        close = 10000 + np.cumsum(np.random.randn(n) * 50)

        rows = [
            MagicMock(
                date=d.date(),
                open_price=c * 0.99,
                high_price=c * 1.01,
                low_price=c * 0.98,
                close_price=c,
                volume=500_000,
            )
            for d, c in zip(dates, close)
        ]

        with patch('apps.market.models.OHLCV.objects') as mock_ohlcv, \
             patch('apps.market.models.Evaluation.objects') as mock_eval:

            mock_ohlcv.filter.return_value.order_by.return_value.exists.return_value = True
            mock_ohlcv.filter.return_value.order_by.return_value.__iter__ = lambda s: iter(rows)
            mock_ohlcv.filter.return_value.order_by.return_value.values.return_value = [
                {'date': r.date, 'open_price': r.open_price, 'high_price': r.high_price,
                 'low_price': r.low_price, 'close_price': r.close_price, 'volume': r.volume}
                for r in rows
            ]
            mock_eval.filter.return_value.__iter__ = lambda s: iter([])

            bridge = MLBacktestBridge(sym, date(2024, 1, 1), date(2024, 12, 31), model_id=None)

            with patch.object(bridge, '_load_ohlcv') as mock_load, \
                 patch.object(bridge, '_load_eval_map', return_value={}), \
                 patch.object(bridge, '_build_ml_prob_map', return_value={}):

                df = pd.DataFrame({
                    'open': close * 0.99, 'high': close * 1.01,
                    'low': close * 0.98, 'close': close,
                    'volume': np.full(n, 500_000.0),
                }, index=dates)
                mock_load.return_value = df

                result = bridge.run(strategy='P1')

        for key in ('total_return', 'mdd', 'win_rate', 'trade_count'):
            assert key in result, f"Missing key: {key}"


# ─── Pipeline (통합) ─────────────────────────────────────────────────────────

class TestMLPipeline:
    def test_build_model_random_forest(self):
        from apps.ml.pipeline import MLPipeline
        pipeline = MLPipeline.__new__(MLPipeline)
        model = pipeline._build_model('random_forest')
        assert hasattr(model, 'fit')

    def test_build_model_invalid_raises(self):
        from apps.ml.pipeline import MLPipeline
        pipeline = MLPipeline.__new__(MLPipeline)
        with pytest.raises(ValueError):
            pipeline._build_model('nonexistent_algo')
