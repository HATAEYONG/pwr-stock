"""
Technical Indicator Serializers
"""
from rest_framework import serializers
from apps.market.models import TechnicalIndicator, TimeframeAnalysis


class TechnicalIndicatorSerializer(serializers.ModelSerializer):
    """기술적 지표 Serializer"""
    
    symbol_ticker = serializers.CharField(
        source='evaluation.symbol.ticker',
        read_only=True
    )
    symbol_name = serializers.CharField(
        source='evaluation.symbol.name',
        read_only=True
    )
    pattern_type = serializers.CharField(
        source='evaluation.pattern_type',
        read_only=True
    )
    checklist_score = serializers.IntegerField(
        source='evaluation.checklist_score',
        read_only=True
    )
    
    class Meta:
        model = TechnicalIndicator
        fields = [
            'id',
            'evaluation',
            'symbol_ticker',
            'symbol_name',
            'pattern_type',
            'checklist_score',
            
            # 이평선
            'ma5_status',
            'ma20_status',
            'ma60_status',
            'ma112_status',
            'ma224_status',
            'ma_level',
            'ma_arrangement',
            
            # 거래량
            'volume_ratio',
            'volume_breakout',
            'volume_strength',
            'avg_volume_10d',
            
            # 지지/저항
            'support_level',
            'resistance_level',
            'support_strength',
            'resistance_strength',
            
            # 패턴
            'double_bottom',
            'accumulation_phase',
            'breakout_signal',
            
            # 추세
            'trend_short',
            'trend_medium',
            'trend_long',
            
            # 종합
            'technical_score',
            'signal_strength',
            'analyzed_at'
        ]


class TechnicalIndicatorSummarySerializer(serializers.ModelSerializer):
    """기술적 지표 요약 Serializer"""
    
    symbol_ticker = serializers.CharField(
        source='evaluation.symbol.ticker',
        read_only=True
    )
    symbol_name = serializers.CharField(
        source='evaluation.symbol.name',
        read_only=True
    )
    
    class Meta:
        model = TechnicalIndicator
        fields = [
            'id',
            'symbol_ticker',
            'symbol_name',
            'ma_level',
            'volume_breakout',
            'technical_score',
            'signal_strength'
        ]


class TimeframeAnalysisSerializer(serializers.ModelSerializer):
    """시간대 분석 Serializer"""
    
    symbol_ticker = serializers.CharField(
        source='evaluation.symbol.ticker',
        read_only=True
    )
    
    class Meta:
        model = TimeframeAnalysis
        fields = '__all__'
