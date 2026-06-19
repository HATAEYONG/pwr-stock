"""
Position Sizer
MDD 임계 초과 시 포지션 비율 자동 축소 — 리스크 관리 레이어
"""
import logging
from typing import List

logger = logging.getLogger(__name__)


class PositionSizer:
    """
    MDD 기반 동적 포지션 사이징

    누적 손실(Drawdown)이 임계를 넘으면 다음 포지션 비중을 줄인다.
    손실이 회복되면 비중을 단계적으로 복원한다.

    사용 예:
        sizer = PositionSizer(initial_capital=10_000_000)
        ratio = sizer.get_position_ratio()   # 이번 포지션에 투입할 자본 비율
        sizer.record_trade(pnl_pct=-0.08)    # 거래 후 결과 기록
    """

    # MDD 임계 → 투입 비율 (단계적 축소)
    MDD_STEPS = [
        (0.05, 0.80),   # MDD 5% 이상 → 80%
        (0.10, 0.60),   # MDD 10% 이상 → 60%
        (0.15, 0.40),   # MDD 15% 이상 → 40%
        (0.20, 0.20),   # MDD 20% 이상 → 20%
        (0.30, 0.00),   # MDD 30% 이상 → 거래 중단
    ]
    DEFAULT_RATIO = 0.95   # 손실 없을 때 기본 비율

    def __init__(self, initial_capital: float = 10_000_000):
        self.initial_capital = initial_capital
        self.peak_equity = initial_capital
        self.current_equity = initial_capital
        self._pnl_history: List[float] = []

    def get_position_ratio(self) -> float:
        """현재 MDD 기준 다음 포지션 투입 비율 반환"""
        current_mdd = self._current_mdd()
        ratio = self.DEFAULT_RATIO
        for threshold, size in self.MDD_STEPS:
            if current_mdd >= threshold:
                ratio = size
        logger.debug(f"[PositionSizer] MDD={current_mdd:.1%} → ratio={ratio:.0%}")
        return ratio

    def record_trade(self, pnl_pct: float):
        """거래 손익률 기록 및 자산 갱신"""
        self._pnl_history.append(pnl_pct)
        self.current_equity *= (1 + pnl_pct)
        if self.current_equity > self.peak_equity:
            self.peak_equity = self.current_equity

    def _current_mdd(self) -> float:
        if self.peak_equity == 0:
            return 0.0
        dd = (self.peak_equity - self.current_equity) / self.peak_equity
        return max(dd, 0.0)

    def reset(self):
        """에쿼티 및 히스토리 초기화"""
        self.peak_equity = self.initial_capital
        self.current_equity = self.initial_capital
        self._pnl_history.clear()

    def stats(self) -> dict:
        return {
            'current_equity': self.current_equity,
            'peak_equity': self.peak_equity,
            'current_mdd': round(self._current_mdd(), 4),
            'current_ratio': self.get_position_ratio(),
            'trade_count': len(self._pnl_history),
        }
