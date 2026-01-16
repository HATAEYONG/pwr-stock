"""
Backtest Engine
과거 데이터로 Pattern 전략을 시뮬레이션하는 엔진
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Tuple
import pandas as pd
import numpy as np

from apps.market.models import Symbol, OHLCV, Evaluation
from apps.patterns.analyzer import PatternAnalyzer
from .metrics import PerformanceMetrics


class BacktestEngine:
    """백테스팅 엔진"""
    
    def __init__(self, symbol: Symbol, start_date: datetime.date, end_date: datetime.date,
                 initial_capital: Decimal = Decimal('10000000')):
        """
        초기화
        
        Args:
            symbol: 종목
            start_date: 시작일
            end_date: 종료일
            initial_capital: 초기 자본 (기본 1천만원)
        """
        self.symbol = symbol
        self.start_date = start_date
        self.end_date = end_date
        self.initial_capital = float(initial_capital)
        self.capital = float(initial_capital)
        
        # 거래 기록
        self.trades = []
        self.equity_curve = []
        self.position = None  # 현재 포지션
        
        # 성과 지표
        self.metrics = PerformanceMetrics()
    
    def load_data(self) -> pd.DataFrame:
        """OHLCV 데이터 로드"""
        ohlcv_data = OHLCV.objects.filter(
            symbol=self.symbol,
            date__gte=self.start_date,
            date__lte=self.end_date
        ).order_by('date')
        
        if not ohlcv_data.exists():
            raise ValueError(f"No OHLCV data for {self.symbol.ticker}")
        
        # DataFrame 변환
        df = pd.DataFrame(list(ohlcv_data.values(
            'date', 'open', 'high', 'low', 'close', 'volume'
        )))
        
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        return df
    
    def run(self, strategy: str) -> Dict:
        """
        백테스팅 실행
        
        Args:
            strategy: 전략 ('P1', 'P2', 'P3')
        
        Returns:
            결과 딕셔너리
        """
        # 데이터 로드
        df = self.load_data()
        
        # Pattern 분석 결과 로드
        evaluations = Evaluation.objects.filter(
            symbol=self.symbol,
            pattern_type=strategy,
            date__gte=self.start_date,
            date__lte=self.end_date
        ).order_by('date')
        
        # 날짜별 evaluation 매핑
        eval_map = {eval.date: eval for eval in evaluations}
        
        # 시뮬레이션 실행
        for date in df.index:
            current_date = date.date()
            current_price = float(df.loc[date, 'close'])
            
            # 자산 곡선 기록
            if self.position:
                position_value = self.position['quantity'] * current_price
                total_value = self.capital + position_value
            else:
                total_value = self.capital
            
            self.equity_curve.append({
                'date': current_date.isoformat(),
                'equity': total_value
            })
            
            # Evaluation 확인
            if current_date in eval_map:
                eval_obj = eval_map[current_date]
                
                # 포지션 없을 때: 진입 신호 확인
                if not self.position:
                    if eval_obj.start_signal and eval_obj.checklist_score >= 70:
                        self._enter_position(current_date, current_price, eval_obj)
                
                # 포지션 있을 때: 청산 신호 확인
                else:
                    if eval_obj.sell_signal or eval_obj.risk_signal:
                        exit_reason = 'SELL_SIGNAL' if eval_obj.sell_signal else 'RISK_SIGNAL'
                        self._exit_position(current_date, current_price, exit_reason)
            
            # 보유 기간 제한 확인 (Pattern별)
            if self.position:
                holding_days = (current_date - self.position['entry_date']).days
                max_holding = self._get_max_holding_days(strategy)
                
                if holding_days >= max_holding:
                    self._exit_position(current_date, current_price, 'MAX_HOLDING')
        
        # 마지막 포지션 청산
        if self.position:
            last_price = float(df.iloc[-1]['close'])
            last_date = df.index[-1].date()
            self._exit_position(last_date, last_price, 'END_OF_PERIOD')
        
        # 성과 계산
        results = self._calculate_performance()
        
        return results
    
    def _enter_position(self, date, price, evaluation):
        """포지션 진입"""
        # 사용 가능 자본의 95% 투자 (수수료 고려)
        investment = self.capital * 0.95
        quantity = int(investment / price)
        
        if quantity > 0:
            cost = quantity * price
            self.capital -= cost
            
            self.position = {
                'entry_date': date,
                'entry_price': price,
                'quantity': quantity,
                'entry_reason': f'START_SIGNAL (Score: {evaluation.checklist_score})'
            }
    
    def _exit_position(self, date, price, reason):
        """포지션 청산"""
        if not self.position:
            return
        
        # 수익 계산
        proceeds = self.position['quantity'] * price
        self.capital += proceeds
        
        entry_price = self.position['entry_price']
        profit_loss = proceeds - (self.position['quantity'] * entry_price)
        profit_loss_pct = ((price - entry_price) / entry_price) * 100
        
        holding_days = (date - self.position['entry_date']).days
        
        # 거래 기록
        trade = {
            'entry_date': self.position['entry_date'].isoformat(),
            'entry_price': entry_price,
            'exit_date': date.isoformat(),
            'exit_price': price,
            'quantity': self.position['quantity'],
            'profit_loss': float(profit_loss),
            'profit_loss_pct': float(profit_loss_pct),
            'holding_days': holding_days,
            'entry_reason': self.position['entry_reason'],
            'exit_reason': reason
        }
        
        self.trades.append(trade)
        self.position = None
    
    def _get_max_holding_days(self, strategy: str) -> int:
        """Pattern별 최대 보유 기간"""
        holding_days = {
            'P1': 45,   # Pattern 1: 30-60일
            'P2': 30,   # Pattern 2: 15-30일
            'P3': 60,   # Pattern 3: 20-90일
        }
        return holding_days.get(strategy, 45)
    
    def _calculate_performance(self) -> Dict:
        """성과 지표 계산"""
        if not self.trades:
            return {
                'total_return': 0,
                'win_rate': 0,
                'total_trades': 0,
                'winning_trades': 0,
                'losing_trades': 0,
                'max_drawdown': 0,
                'sharpe_ratio': 0,
                'avg_win': 0,
                'avg_loss': 0,
                'profit_factor': 0,
                'final_capital': self.initial_capital,
                'trades': [],
                'equity_curve': []
            }
        
        # 기본 통계
        total_return = ((self.capital - self.initial_capital) / self.initial_capital) * 100
        
        winning_trades = [t for t in self.trades if t['profit_loss'] > 0]
        losing_trades = [t for t in self.trades if t['profit_loss'] <= 0]
        
        win_rate = (len(winning_trades) / len(self.trades)) * 100 if self.trades else 0
        
        avg_win = np.mean([t['profit_loss_pct'] for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t['profit_loss_pct'] for t in losing_trades]) if losing_trades else 0
        
        # Profit Factor
        total_win = sum([t['profit_loss'] for t in winning_trades])
        total_loss = abs(sum([t['profit_loss'] for t in losing_trades]))
        profit_factor = total_win / total_loss if total_loss > 0 else 0
        
        # Max Drawdown
        max_drawdown = self.metrics.calculate_max_drawdown(self.equity_curve)
        
        # Sharpe Ratio
        sharpe_ratio = self.metrics.calculate_sharpe_ratio(self.equity_curve)
        
        return {
            'total_return': round(total_return, 2),
            'win_rate': round(win_rate, 2),
            'total_trades': len(self.trades),
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'max_drawdown': round(max_drawdown, 2),
            'sharpe_ratio': round(sharpe_ratio, 4) if sharpe_ratio else None,
            'avg_win': round(avg_win, 2),
            'avg_loss': round(avg_loss, 2),
            'profit_factor': round(profit_factor, 2),
            'final_capital': round(self.capital, 2),
            'trades': self.trades,
            'equity_curve': self.equity_curve
        }
