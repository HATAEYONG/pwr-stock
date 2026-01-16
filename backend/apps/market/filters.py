"""
Django Filters for Evaluation
"""
from django_filters import rest_framework as filters
from datetime import date, timedelta
from .models import Evaluation


class EvaluationFilter(filters.FilterSet):
    """Evaluation 필터"""
    
    # 점수 필터
    min_score = filters.NumberFilter(
        field_name='checklist_score',
        lookup_expr='gte',
        label='최소 점수'
    )
    max_score = filters.NumberFilter(
        field_name='checklist_score',
        lookup_expr='lte',
        label='최대 점수'
    )
    
    # 거래소 필터 (다중 선택)
    exchange = filters.CharFilter(
        method='filter_exchange',
        label='거래소'
    )
    
    # 리스크 필터 (다중 선택)
    risk = filters.CharFilter(
        method='filter_risk',
        label='리스크'
    )
    
    # 시가총액 필터
    market_cap = filters.CharFilter(
        method='filter_market_cap',
        label='시가총액'
    )
    
    # IPO 필터
    ipo = filters.BooleanFilter(
        method='filter_ipo',
        label='IPO 종목'
    )
    
    def filter_exchange(self, queryset, name, value):
        """거래소 필터 (콤마로 구분된 값)"""
        if not value:
            return queryset
        
        exchanges = [ex.strip().upper() for ex in value.split(',')]
        return queryset.filter(symbol__exchange__in=exchanges)
    
    def filter_risk(self, queryset, name, value):
        """리스크 필터 (콤마로 구분된 값)"""
        if not value:
            return queryset
        
        risks = [r.strip().upper() for r in value.split(',')]
        return queryset.filter(risk_level__in=risks)
    
    def filter_market_cap(self, queryset, name, value):
        """시가총액 필터"""
        if value == 'small':
            # 소형주: 1천만주 이하
            return queryset.filter(symbol__shares_outstanding__lte=10_000_000)
        elif value == 'medium':
            # 중형주: 1천만주 ~ 1억주
            return queryset.filter(
                symbol__shares_outstanding__gt=10_000_000,
                symbol__shares_outstanding__lte=100_000_000
            )
        elif value == 'large':
            # 대형주: 1억주 이상
            return queryset.filter(symbol__shares_outstanding__gt=100_000_000)
        
        return queryset
    
    def filter_ipo(self, queryset, name, value):
        """IPO 필터 (1년 이내 상장)"""
        if not value:
            return queryset
        
        # 1년 전 날짜
        one_year_ago = date.today() - timedelta(days=365)
        
        # listing_date가 있고 1년 이내인 종목
        return queryset.filter(
            symbol__listing_date__isnull=False,
            symbol__listing_date__gte=one_year_ago
        )
    
    class Meta:
        model = Evaluation
        fields = {
            'pattern_type': ['exact'],
            'risk_level': ['exact'],
            'start_signal': ['exact'],
            'risk_signal': ['exact'],
            'sell_signal': ['exact'],
            'date': ['exact', 'gte', 'lte'],
        }
