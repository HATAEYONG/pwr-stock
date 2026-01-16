"""
Performance Metrics
백테스팅 성과 지표 계산
"""
import numpy as np
from typing import List, Dict


class PerformanceMetrics:
    """성과 지표 계산기"""
    
    @staticmethod
    def calculate_max_drawdown(equity_curve: List[Dict]) -> float:
        """
        최대 낙폭 (MDD) 계산
        
        Args:
            equity_curve: 자산 곡선 [{date, equity}, ...]
        
        Returns:
            최대 낙폭 (%)
        """
        if not equity_curve:
            return 0.0
        
        equity_values = [point['equity'] for point in equity_curve]
        
        # 누적 최대값 계산
        running_max = np.maximum.accumulate(equity_values)
        
        # Drawdown 계산
        drawdown = (equity_values - running_max) / running_max * 100
        
        # 최대 낙폭
        max_dd = abs(min(drawdown))
        
        return max_dd
    
    @staticmethod
    def calculate_sharpe_ratio(equity_curve: List[Dict], risk_free_rate: float = 0.02) -> float:
        """
        샤프 비율 계산
        
        Args:
            equity_curve: 자산 곡선
            risk_free_rate: 무위험 수익률 (연 2%)
        
        Returns:
            샤프 비율
        """
        if len(equity_curve) < 2:
            return 0.0
        
        equity_values = [point['equity'] for point in equity_curve]
        
        # 일간 수익률 계산
        returns = np.diff(equity_values) / equity_values[:-1]
        
        if len(returns) == 0:
            return 0.0
        
        # 평균 수익률
        mean_return = np.mean(returns)
        
        # 표준편차
        std_return = np.std(returns)
        
        if std_return == 0:
            return 0.0
        
        # 연율화 (252 거래일)
        annual_return = mean_return * 252
        annual_std = std_return * np.sqrt(252)
        
        # 샤프 비율
        sharpe = (annual_return - risk_free_rate) / annual_std
        
        return sharpe
    
    @staticmethod
    def calculate_sortino_ratio(equity_curve: List[Dict], risk_free_rate: float = 0.02) -> float:
        """
        소르티노 비율 계산 (하방 리스크만 고려)
        
        Args:
            equity_curve: 자산 곡선
            risk_free_rate: 무위험 수익률
        
        Returns:
            소르티노 비율
        """
        if len(equity_curve) < 2:
            return 0.0
        
        equity_values = [point['equity'] for point in equity_curve]
        returns = np.diff(equity_values) / equity_values[:-1]
        
        if len(returns) == 0:
            return 0.0
        
        mean_return = np.mean(returns)
        
        # 하방 편차 (손실만)
        downside_returns = returns[returns < 0]
        
        if len(downside_returns) == 0:
            return 0.0
        
        downside_std = np.std(downside_returns)
        
        if downside_std == 0:
            return 0.0
        
        # 연율화
        annual_return = mean_return * 252
        annual_downside_std = downside_std * np.sqrt(252)
        
        sortino = (annual_return - risk_free_rate) / annual_downside_std
        
        return sortino
    
    @staticmethod
    def calculate_calmar_ratio(total_return: float, max_drawdown: float, years: float = 1.0) -> float:
        """
        칼마 비율 계산
        
        Args:
            total_return: 총 수익률 (%)
            max_drawdown: 최대 낙폭 (%)
            years: 기간 (년)
        
        Returns:
            칼마 비율
        """
        if max_drawdown == 0:
            return 0.0
        
        # 연율화
        annual_return = total_return / years
        
        calmar = annual_return / max_drawdown
        
        return calmar
    
    @staticmethod
    def calculate_win_streak(trades: List[Dict]) -> int:
        """
        최대 연승 계산
        
        Args:
            trades: 거래 내역
        
        Returns:
            최대 연승 횟수
        """
        if not trades:
            return 0
        
        max_streak = 0
        current_streak = 0
        
        for trade in trades:
            if trade['profit_loss'] > 0:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 0
        
        return max_streak
    
    @staticmethod
    def calculate_loss_streak(trades: List[Dict]) -> int:
        """
        최대 연패 계산
        
        Args:
            trades: 거래 내역
        
        Returns:
            최대 연패 횟수
        """
        if not trades:
            return 0
        
        max_streak = 0
        current_streak = 0
        
        for trade in trades:
            if trade['profit_loss'] <= 0:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 0
        
        return max_streak
    
    @staticmethod
    def calculate_avg_holding_days(trades: List[Dict]) -> float:
        """
        평균 보유 일수 계산
        
        Args:
            trades: 거래 내역
        
        Returns:
            평균 보유 일수
        """
        if not trades:
            return 0.0
        
        total_days = sum([trade['holding_days'] for trade in trades])
        
        return total_days / len(trades)
    
    @staticmethod
    def calculate_expectancy(trades: List[Dict]) -> float:
        """
        기댓값 계산
        
        Args:
            trades: 거래 내역
        
        Returns:
            거래당 평균 기댓값 (%)
        """
        if not trades:
            return 0.0
        
        total_profit_loss = sum([trade['profit_loss_pct'] for trade in trades])
        
        return total_profit_loss / len(trades)
    
    @staticmethod
    def generate_summary(results: Dict) -> Dict:
        """
        종합 리포트 생성
        
        Args:
            results: 백테스팅 결과
        
        Returns:
            종합 리포트
        """
        trades = results.get('trades', [])
        
        return {
            'performance': {
                'total_return': results.get('total_return'),
                'final_capital': results.get('final_capital'),
                'win_rate': results.get('win_rate'),
                'sharpe_ratio': results.get('sharpe_ratio'),
                'max_drawdown': results.get('max_drawdown'),
            },
            'trade_statistics': {
                'total_trades': results.get('total_trades'),
                'winning_trades': results.get('winning_trades'),
                'losing_trades': results.get('losing_trades'),
                'avg_win': results.get('avg_win'),
                'avg_loss': results.get('avg_loss'),
                'profit_factor': results.get('profit_factor'),
                'max_win_streak': PerformanceMetrics.calculate_win_streak(trades),
                'max_loss_streak': PerformanceMetrics.calculate_loss_streak(trades),
                'avg_holding_days': PerformanceMetrics.calculate_avg_holding_days(trades),
                'expectancy': PerformanceMetrics.calculate_expectancy(trades),
            }
        }
