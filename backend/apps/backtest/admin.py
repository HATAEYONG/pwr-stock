"""
Backtest Admin
"""
from django.contrib import admin
from .models import BacktestResult, Trade


@admin.register(BacktestResult)
class BacktestResultAdmin(admin.ModelAdmin):
    """백테스팅 결과 Admin"""
    
    list_display = [
        'id', 'symbol', 'strategy', 'start_date', 'end_date',
        'total_return', 'win_rate', 'total_trades',
        'max_drawdown', 'final_capital', 'created_at'
    ]
    list_filter = ['strategy', 'created_at']
    search_fields = ['symbol__ticker', 'symbol__name']
    readonly_fields = [
        'total_return', 'win_rate', 'total_trades',
        'winning_trades', 'losing_trades',
        'max_drawdown', 'sharpe_ratio',
        'avg_win', 'avg_loss', 'profit_factor',
        'final_capital', 'trades_data', 'equity_curve',
        'created_at'
    ]
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('symbol', 'strategy', 'start_date', 'end_date', 'initial_capital')
        }),
        ('성과 지표', {
            'fields': ('total_return', 'win_rate', 'total_trades', 'winning_trades', 'losing_trades')
        }),
        ('리스크 지표', {
            'fields': ('max_drawdown', 'sharpe_ratio')
        }),
        ('수익 지표', {
            'fields': ('avg_win', 'avg_loss', 'profit_factor', 'final_capital')
        }),
        ('상세 데이터', {
            'fields': ('trades_data', 'equity_curve'),
            'classes': ('collapse',)
        }),
        ('메타 정보', {
            'fields': ('created_at',)
        }),
    )


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    """거래 내역 Admin"""
    
    list_display = [
        'id', 'backtest', 'entry_date', 'exit_date',
        'entry_price', 'exit_price', 'quantity',
        'profit_loss', 'profit_loss_pct', 'status'
    ]
    list_filter = ['status', 'direction']
    search_fields = ['backtest__symbol__ticker']
    readonly_fields = ['created_at']
