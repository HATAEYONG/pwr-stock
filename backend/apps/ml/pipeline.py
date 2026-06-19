"""
ML Pipeline (통합 진입점)
Feature Store + Model Registry + Backtest Bridge를 조율한다.
기존 MLPredictor API를 호환하는 래퍼 역할도 겸한다.
"""
import logging
from datetime import date, timedelta
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, f1_score, precision_score,
                              recall_score, roc_auc_score)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from apps.ml.services.feature_store import FeatureStore
from apps.ml.services.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class MLPipeline:
    """
    통합 ML 파이프라인

    train_and_register()  — 학습 + Model Registry 저장
    predict()             — 단일 종목 예측
    batch_predict()       — 다종목 배치 예측
    run_backtest()        — ML 신호 백테스팅 검증
    """

    def __init__(self):
        self.store = FeatureStore(use_cache=True)
        self.registry = ModelRegistry()

    # ─── 학습 ────────────────────────────────────────

    def train_and_register(
        self,
        symbols: list,
        start_date: date,
        end_date: date,
        target_period: int = 5,
        algorithm: str = 'random_forest',
        auto_activate: bool = True,
    ) -> Dict:
        """
        학습 → Model Registry 저장 → 성과 비교 후 활성화

        Returns: {model_id, accuracy, f1, win_rate, improved}
        """
        X_all, y_all = [], []
        valid_symbols = 0

        for sym in symbols:
            try:
                df = self.store.get_features(sym, end_date, lookback_days=120)
                if df.empty or len(df) < 50:
                    continue

                target_col = f'target_return_{target_period}d'
                if target_col not in df.columns:
                    continue

                feat_cols = self.store.get_feature_columns(df)
                X = df[feat_cols].fillna(0)
                y = (df[target_col] > 0.02).astype(int)

                X_all.append(X)
                y_all.append(y)
                valid_symbols += 1
            except Exception as e:
                logger.warning(f"[Pipeline] Feature build failed for {sym.ticker}: {e}")

        if not X_all:
            raise ValueError("No training data available from any symbol")

        X = pd.concat(X_all).reset_index(drop=True)
        y = pd.concat(y_all).reset_index(drop=True)

        # 공통 컬럼만 사용
        feature_names = list(X.columns)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        scaler = StandardScaler()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s = scaler.transform(X_test)

        model = self._build_model(algorithm)
        model.fit(X_train_s, y_train)

        y_pred = model.predict(X_test_s)
        y_proba = model.predict_proba(X_test_s)[:, 1]

        meta = {
            'name': f"ML Classifier ({algorithm}) v-auto",
            'description': f"{target_period}일 후 매수 신호 분류, {valid_symbols} 종목",
            'algorithm': algorithm,
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
            'auc_score': float(roc_auc_score(y_test, y_proba)) if len(set(y_test)) > 1 else None,
            'train_start_date': start_date,
            'train_end_date': end_date,
            'hyperparameters': {'target_period': target_period, 'valid_symbols': valid_symbols},
        }

        model_id = self.registry.save(model, scaler, feature_names, meta, model_type='CLASSIFIER')

        # 이전 활성 모델과 비교 후 활성화 결정
        improved = False
        if auto_activate:
            improved = self._compare_and_activate(model_id, meta['f1_score'])

        logger.info(
            f"[Pipeline] Train done: model_id={model_id}, acc={meta['accuracy']:.3f}, "
            f"f1={meta['f1_score']:.3f}, improved={improved}"
        )

        return {
            'model_id': model_id,
            'accuracy': meta['accuracy'],
            'f1_score': meta['f1_score'],
            'valid_symbols': valid_symbols,
            'improved': improved,
        }

    # ─── 예측 ────────────────────────────────────────

    def predict(self, symbol, prediction_date: date, model_id: Optional[int] = None) -> Dict:
        """단일 종목 예측"""
        loaded = self._load_model(model_id)
        if loaded is None:
            return {'error': 'No model available'}
        model, scaler, features = loaded

        df = self.store.get_features(symbol, prediction_date, lookback_days=120)
        if df.empty:
            return {'error': 'Insufficient data'}

        feat_cols = [f for f in features if f in df.columns]
        X = df.iloc[[-1]][feat_cols].fillna(0)
        X_s = scaler.transform(X)

        pred = model.predict(X_s)[0]
        proba = model.predict_proba(X_s)[0]

        return {
            'symbol': symbol.ticker,
            'date': prediction_date.isoformat(),
            'direction': 'UP' if pred == 1 else 'DOWN',
            'probability': float(proba[pred]),
            'confidence': float(max(proba)),
        }

    def batch_predict(self, symbols: list, prediction_date: date, model_id: Optional[int] = None) -> List[Dict]:
        """다종목 배치 예측"""
        loaded = self._load_model(model_id)
        if loaded is None:
            return []
        model, scaler, features = loaded

        results = []
        for sym in symbols:
            try:
                df = self.store.get_features(sym, prediction_date, lookback_days=120)
                if df.empty:
                    continue
                feat_cols = [f for f in features if f in df.columns]
                X = df.iloc[[-1]][feat_cols].fillna(0)
                X_s = scaler.transform(X)
                pred = model.predict(X_s)[0]
                proba = model.predict_proba(X_s)[0]
                results.append({
                    'symbol': sym.ticker,
                    'direction': 'UP' if pred == 1 else 'DOWN',
                    'probability': float(proba[pred]),
                    'confidence': float(max(proba)),
                })
            except Exception as e:
                logger.warning(f"[Pipeline] Predict failed {sym.ticker}: {e}")
        return results

    # ─── 백테스팅 검증 ───────────────────────────────

    def run_backtest(
        self,
        symbol,
        start_date: date,
        end_date: date,
        strategy: str = 'P1',
        ml_threshold: float = 0.55,
        model_id: Optional[int] = None,
    ) -> Dict:
        """ML 신호 + 패턴 신호 결합 백테스팅"""
        from apps.ml.services.backtest_bridge import MLBacktestBridge

        effective_model_id = model_id or self.registry.get_active_version('CLASSIFIER')
        bridge = MLBacktestBridge(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            model_id=effective_model_id,
        )
        return bridge.run(strategy=strategy, ml_threshold=ml_threshold)

    # ─── 내부 헬퍼 ───────────────────────────────────

    def _build_model(self, algorithm: str):
        if algorithm == 'random_forest':
            return RandomForestClassifier(n_estimators=200, max_depth=10,
                                          min_samples_split=20, random_state=42, n_jobs=-1)
        if algorithm == 'gradient_boosting':
            return GradientBoostingClassifier(n_estimators=100, max_depth=5,
                                              learning_rate=0.1, random_state=42)
        if algorithm == 'logistic':
            return LogisticRegression(max_iter=1000, random_state=42)
        raise ValueError(f"Unknown algorithm: {algorithm}")

    def _load_model(self, model_id: Optional[int]):
        try:
            if model_id:
                return self.registry.load(model_id)
            return self.registry.load_active('CLASSIFIER')
        except Exception as e:
            logger.error(f"[Pipeline] Model load failed: {e}")
            return None

    def _compare_and_activate(self, new_model_id: int, new_f1: float) -> bool:
        """신규 모델이 이전보다 나으면 활성화, 아니면 그냥 저장만"""
        history = self.registry.get_performance_history('CLASSIFIER', limit=2)
        if len(history) < 2:
            self.registry.set_active(new_model_id)
            return True

        prev_f1 = history[1].get('f1_score') or 0
        if new_f1 >= prev_f1:
            self.registry.set_active(new_model_id)
            logger.info(f"[Pipeline] New model activated: f1 {prev_f1:.3f} → {new_f1:.3f}")
            return True

        logger.info(f"[Pipeline] New model NOT activated (f1 {new_f1:.3f} < prev {prev_f1:.3f}). Rollback kept.")
        return False
