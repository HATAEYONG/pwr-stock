"""
Backtest Serializers
"""
from rest_framework import serializers
from .models import BacktestResult, Trade
from apps.market.serializers import SymbolSerializer


class TradeSerializer(serializers.ModelSerializer):
    """거래 Serializer"""
    
    class Meta:
        model = Trade
        fields = [
            'id', 'direction', 'status',
            'entry_date', 'entry_price', 'entry_reason',
            'exit_date', 'exit_price', 'exit_reason',
            'quantity', 'profit_loss', 'profit_loss_pct',
            'holding_days'
        ]


class BacktestResultSerializer(serializers.ModelSerializer):
    """백테스팅 결과 Serializer"""
    
    symbol = SymbolSerializer(read_only=True)
    symbol_id = serializers.IntegerField(write_only=True)
    trades = TradeSerializer(many=True, read_only=True)
    
    class Meta:
        model = BacktestResult
        fields = [
            'id', 'symbol', 'symbol_id', 'strategy',
            'start_date', 'end_date', 'initial_capital',
            'total_return', 'win_rate', 'total_trades',
            'winning_trades', 'losing_trades',
            'max_drawdown', 'sharpe_ratio',
            'avg_win', 'avg_loss', 'profit_factor',
            'final_capital', 'trades_data', 'equity_curve',
            'trades', 'created_at'
        ]
        read_only_fields = [
            'total_return', 'win_rate', 'total_trades',
            'winning_trades', 'losing_trades',
            'max_drawdown', 'sharpe_ratio',
            'avg_win', 'avg_loss', 'profit_factor',
            'final_capital', 'trades_data', 'equity_curve',
            'created_at'
        ]


class BacktestResultListSerializer(serializers.ModelSerializer):
    """백테스팅 결과 목록 Serializer (간단)"""
    
    symbol = SymbolSerializer(read_only=True)
    
    class Meta:
        model = BacktestResult
        fields = [
            'id', 'symbol', 'strategy',
            'start_date', 'end_date',
            'total_return', 'win_rate', 'total_trades',
            'max_drawdown', 'sharpe_ratio',
            'final_capital', 'created_at'
        ]


class RunBacktestSerializer(serializers.Serializer):
    """백테스팅 실행 요청 Serializer"""
    
    symbol_id = serializers.IntegerField()
    strategy = serializers.ChoiceField(choices=['P1', 'P2', 'P3'])
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    initial_capital = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=10000000
    )
    
    def validate(self, data):
        """유효성 검사"""
        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError(
                "종료일은 시작일보다 나중이어야 합니다."
            )
        
        return data
