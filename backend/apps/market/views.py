"""
Django REST Framework ViewSets
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Symbol, OHLCV, Indicator, Evaluation
from .serializers import (
    SymbolSerializer, OHLCVSerializer, IndicatorSerializer,
    EvaluationSerializer, EvaluationListSerializer
)
from .filters import EvaluationFilter


class SymbolViewSet(viewsets.ModelViewSet):
    """종목 ViewSet"""
    queryset = Symbol.objects.all()
    serializer_class = SymbolSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['exchange', 'is_active']
    search_fields = ['ticker', 'name']
    ordering_fields = ['ticker', 'updated_at']
    ordering = ['ticker']


class OHLCVViewSet(viewsets.ReadOnlyModelViewSet):
    """OHLCV ViewSet (읽기 전용)"""
    queryset = OHLCV.objects.all()
    serializer_class = OHLCVSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['symbol', 'date']
    ordering_fields = ['date']
    ordering = ['-date']


class IndicatorViewSet(viewsets.ReadOnlyModelViewSet):
    """Indicator ViewSet (읽기 전용)"""
    queryset = Indicator.objects.all()
    serializer_class = IndicatorSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['symbol', 'date']
    ordering_fields = ['date']
    ordering = ['-date']


class EvaluationViewSet(viewsets.ReadOnlyModelViewSet):
    """Evaluation ViewSet (읽기 전용)"""
    queryset = Evaluation.objects.select_related('symbol').all()
    serializer_class = EvaluationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = EvaluationFilter
    ordering_fields = ['date', 'checklist_score', 'evaluated_at']
    ordering = ['-date', '-checklist_score']
    
    def get_serializer_class(self):
        """목록/상세에 따라 다른 Serializer 사용"""
        if self.action == 'list':
            return EvaluationListSerializer
        return EvaluationSerializer
    
    @action(detail=False, methods=['get'])
    def high_score(self, request):
        """고득점 종목 (80점 이상)"""
        queryset = self.get_queryset().filter(checklist_score__gte=80)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pattern1(self, request):
        """Pattern 1 종목"""
        queryset = self.get_queryset().filter(pattern_type='P1')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pattern2(self, request):
        """Pattern 2 종목"""
        queryset = self.get_queryset().filter(pattern_type='P2')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pattern3(self, request):
        """Pattern 3 종목"""
        queryset = self.get_queryset().filter(pattern_type='P3')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def signals(self, request):
        """트리거 발생 종목"""
        signal_type = request.query_params.get('type', 'start')
        
        if signal_type == 'start':
            queryset = self.get_queryset().filter(start_signal=True)
        elif signal_type == 'risk':
            queryset = self.get_queryset().filter(risk_signal=True)
        elif signal_type == 'sell':
            queryset = self.get_queryset().filter(sell_signal=True)
        else:
            queryset = self.get_queryset().none()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
