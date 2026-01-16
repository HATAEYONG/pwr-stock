"""
Django Admin 설정
운영 화면에서 데이터 확인 및 관리
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Symbol, OHLCV, Indicator, Evaluation


@admin.register(Symbol)
class SymbolAdmin(admin.ModelAdmin):
    """종목 Admin"""
    list_display = ['ticker', 'name', 'exchange', 'sector', 'is_active', 'updated_at']
    list_filter = ['exchange', 'is_active']
    search_fields = ['ticker', 'name']
    list_editable = ['is_active']
    ordering = ['ticker']


@admin.register(OHLCV)
class OHLCVAdmin(admin.ModelAdmin):
    """OHLCV Admin"""
    list_display = ['symbol', 'date', 'open_price', 'high_price', 'low_price', 'close_price', 'volume']
    list_filter = ['symbol', 'date']
    search_fields = ['symbol__ticker', 'symbol__name']
    date_hierarchy = 'date'
    ordering = ['-date', 'symbol']


@admin.register(Indicator)
class IndicatorAdmin(admin.ModelAdmin):
    """Indicator Admin"""
    list_display = ['symbol', 'date', 'ma5', 'ma20', 'ma60', 'yearly_low']
    list_filter = ['symbol', 'date']
    search_fields = ['symbol__ticker', 'symbol__name']
    date_hierarchy = 'date'
    ordering = ['-date', 'symbol']


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    """Evaluation Admin - 핵심 운영 화면"""
    list_display = [
        'symbol',
        'date',
        'pattern_type',
        'checklist_score',
        'risk_level',
        'start_signal',
        'risk_signal',
        'sell_signal'
    ]
    list_filter = [
        'pattern_type',
        'risk_level',
        'start_signal',
        'risk_signal',
        'sell_signal'
    ]
    search_fields = ['symbol__ticker', 'symbol__name']
    date_hierarchy = 'date'
    ordering = ['-date', '-checklist_score']
    
    readonly_fields = ['rules_version', 'evaluated_at']
