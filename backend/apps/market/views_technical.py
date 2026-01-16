"""
Technical Indicator Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from apps.market.models import TechnicalIndicator, Evaluation
from apps.market.serializers_technical import (
    TechnicalIndicatorSerializer,
    TechnicalIndicatorSummarySerializer
)
from apps.market.services.technical_service import TechnicalIndicatorService


class TechnicalIndicatorViewSet(viewsets.ReadOnlyModelViewSet):
    """기술적 지표 ViewSet"""
    
    queryset = TechnicalIndicator.objects.select_related(
        'evaluation__symbol'
    ).all()
    serializer_class = TechnicalIndicatorSerializer
    
    def get_queryset(self):
        """필터링"""
        queryset = super().get_queryset()
        
        # 이평선 레벨 필터
        ma_level = self.request.query_params.get('ma_level')
        if ma_level:
            queryset = queryset.filter(ma_level__gte=int(ma_level))
        
        # 거래량 돌파 필터
        volume_breakout = self.request.query_params.get('volume_breakout')
        if volume_breakout == 'true':
            queryset = queryset.filter(volume_breakout=True)
        
        # 돌파 신호 필터
        breakout_signal = self.request.query_params.get('breakout_signal')
        if breakout_signal == 'true':
            queryset = queryset.filter(breakout_signal=True)
        
        # 신호 강도 필터
        signal_strength = self.request.query_params.get('signal_strength')
        if signal_strength:
            queryset = queryset.filter(signal_strength=signal_strength)
        
        # 최소 점수 필터
        min_score = self.request.query_params.get('min_score')
        if min_score:
            queryset = queryset.filter(technical_score__gte=int(min_score))
        
        return queryset.order_by('-technical_score')
    
    @action(detail=False, methods=['get'])
    def top_scores(self, request):
        """
        기술적 점수 상위 종목
        
        GET /api/technical/top_scores/?limit=20
        """
        limit = int(request.query_params.get('limit', 20))
        
        top = TechnicalIndicatorService.get_top_by_technical_score(limit)
        serializer = self.get_serializer(top, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def breakout_candidates(self, request):
        """
        돌파 후보 종목
        
        GET /api/technical/breakout_candidates/?min_ma_level=3
        """
        min_ma_level = int(request.query_params.get('min_ma_level', 3))
        
        candidates = TechnicalIndicatorService.get_breakout_candidates(min_ma_level)
        serializer = self.get_serializer(candidates, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def accumulation_stocks(self, request):
        """
        매집 구간 종목
        
        GET /api/technical/accumulation_stocks/
        """
        stocks = TechnicalIndicatorService.get_accumulation_stocks()
        serializer = self.get_serializer(stocks, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def analyze_evaluation(self, request):
        """
        특정 Evaluation 분석
        
        POST /api/technical/analyze_evaluation/
        {
            "evaluation_id": 123
        }
        """
        evaluation_id = request.data.get('evaluation_id')
        
        if not evaluation_id:
            return Response(
                {'error': 'evaluation_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            evaluation = Evaluation.objects.get(id=evaluation_id)
        except Evaluation.DoesNotExist:
            return Response(
                {'error': 'Evaluation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 기술적 지표 생성/업데이트
        technical = TechnicalIndicatorService.create_or_update_for_evaluation(evaluation)
        serializer = self.get_serializer(technical)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        기술적 지표 통계
        
        GET /api/technical/stats/
        """
        from django.db.models import Count, Avg
        
        stats = {
            'total': TechnicalIndicator.objects.count(),
            'by_ma_level': {},
            'by_signal_strength': {},
            'breakout_count': TechnicalIndicator.objects.filter(
                breakout_signal=True
            ).count(),
            'accumulation_count': TechnicalIndicator.objects.filter(
                accumulation_phase=True
            ).count(),
            'avg_technical_score': TechnicalIndicator.objects.aggregate(
                Avg('technical_score')
            )['technical_score__avg'] or 0
        }
        
        # 레벨별 분포
        for level in range(6):
            count = TechnicalIndicator.objects.filter(ma_level=level).count()
            stats['by_ma_level'][f'level_{level}'] = count
        
        # 신호 강도별 분포
        for strength in ['very_strong', 'strong', 'moderate', 'weak', 'very_weak']:
            count = TechnicalIndicator.objects.filter(signal_strength=strength).count()
            stats['by_signal_strength'][strength] = count
        
        return Response(stats)
