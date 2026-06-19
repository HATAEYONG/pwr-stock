"""
Backtest Bridge
ML 신호를 백테스팅 엔진에 주입하여 실측 MDD·승률을 산출한다.
기존 BacktestEngine의 Pattern-Evaluation 기반 진입 로직을 ML 확률 점수로 보강한다.
"""
import logging
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class MLBacktestBridge:
    """
    ML 신호 + 기존 패턴 신호를 결합한 백테스팅 실행기

    사용 예:
        bridge = MLBacktestBridge(symbol, start, end, model_id=3)
        result = bridge.run(strategy='P1', ml_threshold=0.6)
        # result['mdd'], result['win_rate'], result['total_return']
    """

    def __init__(
        self,
        symbol,
        start_date: date,
        end_date: date,
        model_id: Optional[int] = None,
        initial_capital: float = 10_000_000,
    ):
        self.symbol = symbol
        self.start_date = start_date
        self.end_date = end_date
        self.model_id = model_id
        self.initial_capital = initial_capital

    def run(
        self,
        strategy: str = 'P1',
        ml_threshold: float = 0.55,
        use_position_sizing: bool = True,
    ) -> Dict:
        """
        ML 보강 백테스팅 실행

        Args:
            strategy: 패턴 전략 ('P1'/'P2'/'P3')
            ml_threshold: ML 매수 확률 최소 임계값 (이 이상일 때만 진입 허용)
            use_position_sizing: MDD 기반 포지션 사이징 적용 여부

        Returns:
            {total_return, mdd, win_rate, trade_count, equity_curve, trades,
             ml_filtered_count, baseline_comparison}
        """
        # 1. OHLCV 로드
        df = self._load_ohlcv()
        if df.empty:
            return self._empty_result("No OHLCV data")

        # 2. ML 예측 확률 맵 생성
        ml_prob_map = self._build_ml_prob_map(df) if self.model_id else {}

        # 3. 패턴 Evaluation 로드
        eval_map = self._load_eval_map(strategy)

        # 4. 포지션 사이저 초기화
        if use_position_sizing:
            from apps.ml.services.position_sizer import PositionSizer
            sizer = PositionSizer(initial_capital=self.initial_capital)
        else:
            sizer = None

        # 5. 시뮬레이션
        capital = self.initial_capital
        position = None
        trades = []
        equity_curve = []
        ml_filtered = 0

        for ts in df.index:
            current_date = ts.date()
            current_price = float(df.loc[ts, 'close'])

            equity = capital + (position['quantity'] * current_price if position else 0)
            equity_curve.append({'date': current_date.isoformat(), 'equity': equity})

            eval_obj = eval_map.get(current_date)
            ml_prob = ml_prob_map.get(current_date, None)

            if not position:
                # 진입 조건: 패턴 신호 AND ML 확률 임계 통과
                if eval_obj and eval_obj.start_signal and eval_obj.checklist_score >= 70:
                    if ml_prob is not None and ml_prob < ml_threshold:
                        ml_filtered += 1
                        continue  # ML이 걸러냄

                    invest_ratio = 0.95
                    if sizer:
                        invest_ratio = sizer.get_position_ratio()
                    invest = capital * invest_ratio
                    quantity = invest / current_price
                    position = {
                        'entry_date': current_date,
                        'entry_price': current_price,
                        'quantity': quantity,
                        'ml_prob': ml_prob,
                    }
                    capital -= invest

            else:
                holding = (current_date - position['entry_date']).days
                exit_reason = None

                if eval_obj:
                    if eval_obj.sell_signal:
                        exit_reason = 'SELL'
                    elif eval_obj.risk_signal:
                        exit_reason = 'RISK'

                if holding >= self._max_holding(strategy):
                    exit_reason = 'MAX_HOLD'

                if exit_reason:
                    proceeds = position['quantity'] * current_price
                    pnl = proceeds - position['quantity'] * position['entry_price']
                    pnl_pct = pnl / (position['quantity'] * position['entry_price'])
                    capital += proceeds
                    trades.append({
                        'entry_date': position['entry_date'].isoformat(),
                        'exit_date': current_date.isoformat(),
                        'entry_price': position['entry_price'],
                        'exit_price': current_price,
                        'pnl': pnl,
                        'pnl_pct': pnl_pct,
                        'ml_prob': position['ml_prob'],
                        'exit_reason': exit_reason,
                        'win': pnl > 0,
                    })
                    if sizer:
                        sizer.record_trade(pnl_pct)
                    position = None

        # 최종 미청산 포지션 처리
        if position:
            last_price = float(df.iloc[-1]['close'])
            proceeds = position['quantity'] * last_price
            pnl = proceeds - position['quantity'] * position['entry_price']
            pnl_pct = pnl / (position['quantity'] * position['entry_price'])
            capital += proceeds
            trades.append({
                'entry_date': position['entry_date'].isoformat(),
                'exit_date': self.end_date.isoformat(),
                'entry_price': position['entry_price'],
                'exit_price': last_price,
                'pnl': pnl,
                'pnl_pct': pnl_pct,
                'ml_prob': position['ml_prob'],
                'exit_reason': 'END',
                'win': pnl > 0,
            })

        # 6. 성과 계산
        return self._calculate_metrics(
            trades, equity_curve, ml_filtered, ml_threshold, strategy
        )

    # ─── 내부 헬퍼 ───────────────────────────────────

    def _load_ohlcv(self) -> pd.DataFrame:
        from apps.market.models import OHLCV
        qs = OHLCV.objects.filter(
            symbol=self.symbol,
            date__gte=self.start_date,
            date__lte=self.end_date,
            timeframe='daily',
        ).order_by('date')
        if not qs.exists():
            return pd.DataFrame()
        df = pd.DataFrame(list(qs.values(
            'date', 'open_price', 'high_price', 'low_price', 'close_price', 'volume'
        )))
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        df.rename(columns={'open_price': 'open', 'high_price': 'high',
                            'low_price': 'low', 'close_price': 'close'}, inplace=True)
        for col in ['open', 'high', 'low', 'close', 'volume']:
            df[col] = df[col].astype(float)
        return df

    def _build_ml_prob_map(self, df: pd.DataFrame) -> Dict[date, float]:
        """종목·날짜별 ML 매수 확률 딕셔너리"""
        from apps.ml.services.model_registry import ModelRegistry
        registry = ModelRegistry()
        try:
            model, scaler, features = registry.load(self.model_id)
        except Exception as e:
            logger.warning(f"[BacktestBridge] Cannot load model {self.model_id}: {e}")
            return {}

        from apps.ml.services.feature_store import FeatureStore
        store = FeatureStore(use_cache=False)
        prob_map = {}

        # 날짜별 슬라이딩 예측 (비효율적이므로 배치로 처리)
        try:
            feat_df = store.get_features(self.symbol, self.end_date, lookback_days=len(df) + 30)
            if feat_df.empty:
                return {}
            feat_cols = [f for f in features if f in feat_df.columns]
            if not feat_cols:
                return {}
            X = feat_df[feat_cols].fillna(0)
            X_scaled = scaler.transform(X)
            probas = model.predict_proba(X_scaled)[:, 1]
            for ts, prob in zip(feat_df.index, probas):
                prob_map[ts.date()] = float(prob)
        except Exception as e:
            logger.warning(f"[BacktestBridge] ML prob map build failed: {e}")

        return prob_map

    def _load_eval_map(self, strategy: str) -> Dict:
        from apps.market.models import Evaluation
        evals = Evaluation.objects.filter(
            symbol=self.symbol,
            pattern_type=strategy,
            date__gte=self.start_date,
            date__lte=self.end_date,
        )
        return {e.date: e for e in evals}

    def _max_holding(self, strategy: str) -> int:
        return {'P1': 60, 'P2': 40, 'P3': 30}.get(strategy, 45)

    def _calculate_metrics(
        self, trades, equity_curve, ml_filtered, ml_threshold, strategy
    ) -> Dict:
        total_return = 0.0
        mdd = 0.0
        win_rate = 0.0

        if equity_curve:
            equities = [e['equity'] for e in equity_curve]
            total_return = (equities[-1] - equities[0]) / equities[0]
            peak = equities[0]
            max_dd = 0.0
            for eq in equities:
                if eq > peak:
                    peak = eq
                dd = (eq - peak) / peak
                if dd < max_dd:
                    max_dd = dd
            mdd = max_dd

        if trades:
            wins = sum(1 for t in trades if t['win'])
            win_rate = wins / len(trades)

        return {
            'strategy': strategy,
            'symbol': self.symbol.ticker,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'total_return': round(total_return, 4),
            'mdd': round(mdd, 4),
            'win_rate': round(win_rate, 4),
            'trade_count': len(trades),
            'ml_filtered_count': ml_filtered,
            'ml_threshold': ml_threshold,
            'avg_pnl_pct': round(np.mean([t['pnl_pct'] for t in trades]), 4) if trades else 0,
            'trades': trades,
            'equity_curve': equity_curve,
        }

    def _empty_result(self, reason: str) -> Dict:
        return {
            'error': reason,
            'total_return': 0, 'mdd': 0, 'win_rate': 0,
            'trade_count': 0, 'ml_filtered_count': 0,
        }
