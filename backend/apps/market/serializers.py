"""
Django REST Framework Serializers
"""
from rest_framework import serializers
from .models import Symbol, OHLCV, Indicator, Evaluation


class SymbolSerializer(serializers.ModelSerializer):
    """종목 Serializer"""
    class Meta:
        model = Symbol
        fields = '__all__'


class OHLCVSerializer(serializers.ModelSerializer):
    """OHLCV Serializer"""
    symbol_ticker = serializers.CharField(source='symbol.ticker', read_only=True)
    symbol_name = serializers.CharField(source='symbol.name', read_only=True)
    
    class Meta:
        model = OHLCV
        fields = '__all__'


class IndicatorSerializer(serializers.ModelSerializer):
    """Indicator Serializer"""
    symbol_ticker = serializers.CharField(source='symbol.ticker', read_only=True)
    
    class Meta:
        model = Indicator
        fields = '__all__'


class EvaluationSerializer(serializers.ModelSerializer):
    """Evaluation Serializer"""
    symbol_ticker = serializers.CharField(source='symbol.ticker', read_only=True)
    symbol_name = serializers.CharField(source='symbol.name', read_only=True)
    pattern_display = serializers.CharField(source='get_pattern_type_display', read_only=True)
    risk_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    
    class Meta:
        model = Evaluation
        fields = '__all__'


class EvaluationListSerializer(serializers.ModelSerializer):
    """Evaluation 목록용 간단 Serializer"""
    symbol_ticker = serializers.CharField(source='symbol.ticker', read_only=True)
    symbol_name = serializers.CharField(source='symbol.name', read_only=True)
    
    class Meta:
        model = Evaluation
        fields = [
            'id', 'symbol_ticker', 'symbol_name', 'date',
            'pattern_type', 'checklist_score', 'risk_level',
            'start_signal', 'risk_signal', 'sell_signal',
            'evaluated_at'
        ]
