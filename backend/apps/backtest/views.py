"""
Backtest Views
백테스팅 API
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import BacktestResult, Trade
from .serializers import (
    BacktestResultSerializer,
    BacktestResultListSerializer,
    RunBacktestSerializer,
    TradeSerializer
)
from .engine import BacktestEngine
from apps.market.models import Symbol


class BacktestResultViewSet(viewsets.ReadOnlyModelViewSet):
    """백테스팅 결과 ViewSet"""
    
    queryset = BacktestResult.objects.select_related('symbol').all()
    serializer_class = BacktestResultSerializer
    
    def get_serializer_class(self):
        """목록/상세에 따라 다른 Serializer"""
        if self.action == 'list':
            return BacktestResultListSerializer
        return BacktestResultSerializer
    
    @action(detail=False, methods=['post'])
    def run(self, request):
        """
        백테스팅 실행
        
        POST /api/backtest/run/
        {
            "symbol_id": 1,
            "strategy": "P1",
            "start_date": "2023-01-01",
            "end_date": "2024-01-01",
            "initial_capital": 10000000
        }
        """
        serializer = RunBacktestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 파라미터 추출
        symbol_id = serializer.validated_data['symbol_id']
        strategy = serializer.validated_data['strategy']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        initial_capital = serializer.validated_data['initial_capital']
        
        # Symbol 확인
        symbol = get_object_or_404(Symbol, id=symbol_id)
        
        try:
            # 백테스팅 엔진 실행
            engine = BacktestEngine(
                symbol=symbol,
                start_date=start_date,
                end_date=end_date,
                initial_capital=initial_capital
            )
            
            results = engine.run(strategy)
            
            # 결과 저장
            backtest_result = BacktestResult.objects.create(
                symbol=symbol,
                strategy=strategy,
                start_date=start_date,
                end_date=end_date,
                initial_capital=initial_capital,
                total_return=Decimal(str(results['total_return'])),
                win_rate=Decimal(str(results['win_rate'])),
                total_trades=results['total_trades'],
                winning_trades=results['winning_trades'],
                losing_trades=results['losing_trades'],
                max_drawdown=Decimal(str(results['max_drawdown'])),
                sharpe_ratio=Decimal(str(results['sharpe_ratio'])) if results['sharpe_ratio'] else None,
                avg_win=Decimal(str(results['avg_win'])),
                avg_loss=Decimal(str(results['avg_loss'])),
                profit_factor=Decimal(str(results['profit_factor'])),
                final_capital=Decimal(str(results['final_capital'])),
                trades_data=results['trades'],
                equity_curve=results['equity_curve']
            )
            
            # 응답
            response_serializer = BacktestResultSerializer(backtest_result)
            
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'백테스팅 실행 중 오류: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def by_symbol(self, request):
        """
        종목별 백테스팅 결과
        
        GET /api/backtest/by_symbol/?symbol_id=1
        """
        symbol_id = request.query_params.get('symbol_id')
        
        if not symbol_id:
            return Response(
                {'error': 'symbol_id가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = self.queryset.filter(symbol_id=symbol_id)
        serializer = BacktestResultListSerializer(results, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_strategy(self, request):
        """
        전략별 백테스팅 결과
        
        GET /api/backtest/by_strategy/?strategy=P1
        """
        strategy = request.query_params.get('strategy')
        
        if not strategy:
            return Response(
                {'error': 'strategy가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = self.queryset.filter(strategy=strategy)
        serializer = BacktestResultListSerializer(results, many=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """
        백테스팅 요약
        
        GET /api/backtest/{id}/summary/
        """
        backtest = self.get_object()
        
        from .metrics import PerformanceMetrics
        
        results_dict = {
            'total_return': float(backtest.total_return),
            'win_rate': float(backtest.win_rate),
            'total_trades': backtest.total_trades,
            'winning_trades': backtest.winning_trades,
            'losing_trades': backtest.losing_trades,
            'max_drawdown': float(backtest.max_drawdown),
            'sharpe_ratio': float(backtest.sharpe_ratio) if backtest.sharpe_ratio else None,
            'avg_win': float(backtest.avg_win),
            'avg_loss': float(backtest.avg_loss),
            'profit_factor': float(backtest.profit_factor),
            'final_capital': float(backtest.final_capital),
            'trades': backtest.trades_list
        }
        
        summary = PerformanceMetrics.generate_summary(results_dict)
        
        return Response(summary)


class TradeViewSet(viewsets.ReadOnlyModelViewSet):
    """거래 내역 ViewSet"""
    
    queryset = Trade.objects.select_related('backtest__symbol').all()
    serializer_class = TradeSerializer
    
    def get_queryset(self):
        """백테스팅 ID로 필터링"""
        queryset = super().get_queryset()
        backtest_id = self.request.query_params.get('backtest_id')
        
        if backtest_id:
            queryset = queryset.filter(backtest_id=backtest_id)
        
        return queryset
