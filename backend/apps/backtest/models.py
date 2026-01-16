"""
Backtest Models
백테스팅 결과를 저장하는 모델
"""
from django.db import models
from apps.market.models import Symbol
import json


class BacktestResult(models.Model):
    """백테스팅 결과"""
    
    STRATEGY_CHOICES = [
        ('P1', 'Pattern 1'),
        ('P2', 'Pattern 2'),
        ('P3', 'Pattern 3'),
    ]
    
    # 기본 정보
    symbol = models.ForeignKey(Symbol, on_delete=models.CASCADE, related_name='backtests')
    strategy = models.CharField(max_length=2, choices=STRATEGY_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    initial_capital = models.DecimalField(max_digits=15, decimal_places=2, default=10000000)  # 1천만원
    
    # 성과 지표
    total_return = models.DecimalField(max_digits=10, decimal_places=2, help_text='총 수익률 (%)')
    win_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='승률 (%)')
    total_trades = models.IntegerField(default=0, help_text='총 거래 횟수')
    winning_trades = models.IntegerField(default=0, help_text='수익 거래')
    losing_trades = models.IntegerField(default=0, help_text='손실 거래')
    
    # 리스크 지표
    max_drawdown = models.DecimalField(max_digits=10, decimal_places=2, help_text='최대 낙폭 (%)')
    sharpe_ratio = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, help_text='샤프 비율')
    
    # 수익 지표
    avg_win = models.DecimalField(max_digits=10, decimal_places=2, help_text='평균 수익 (%)')
    avg_loss = models.DecimalField(max_digits=10, decimal_places=2, help_text='평균 손실 (%)')
    profit_factor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='손익비')
    
    # 최종 자본
    final_capital = models.DecimalField(max_digits=15, decimal_places=2, help_text='최종 자본')
    
    # 거래 내역 (JSON)
    trades_data = models.JSONField(default=list, help_text='거래 내역')
    equity_curve = models.JSONField(default=list, help_text='자산 곡선 데이터')
    
    # 메타 정보
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'backtest_results'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['symbol', 'strategy']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.symbol.ticker} - {self.strategy} ({self.start_date} ~ {self.end_date})"
    
    @property
    def trades_list(self):
        """거래 내역 리스트 반환"""
        return self.trades_data if isinstance(self.trades_data, list) else []
    
    @property
    def equity_points(self):
        """자산 곡선 포인트 반환"""
        return self.equity_curve if isinstance(self.equity_curve, list) else []


class Trade(models.Model):
    """거래 기록 (선택사항 - 상세 추적용)"""
    
    DIRECTION_CHOICES = [
        ('LONG', 'Long'),
    ]
    
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    ]
    
    backtest = models.ForeignKey(BacktestResult, on_delete=models.CASCADE, related_name='trades')
    
    # 거래 정보
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default='LONG')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    
    # 진입
    entry_date = models.DateField()
    entry_price = models.DecimalField(max_digits=15, decimal_places=2)
    entry_reason = models.CharField(max_length=100, help_text='진입 이유')
    
    # 청산
    exit_date = models.DateField(null=True, blank=True)
    exit_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    exit_reason = models.CharField(max_length=100, null=True, blank=True, help_text='청산 이유')
    
    # 수량
    quantity = models.IntegerField(help_text='매수 수량')
    
    # 손익
    profit_loss = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, help_text='손익 (금액)')
    profit_loss_pct = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='손익률 (%)')
    
    # 보유 기간
    holding_days = models.IntegerField(null=True, blank=True, help_text='보유 일수')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'backtest_trades'
        ordering = ['entry_date']
    
    def __str__(self):
        return f"{self.backtest.symbol.ticker} - {self.entry_date} ({self.status})"
