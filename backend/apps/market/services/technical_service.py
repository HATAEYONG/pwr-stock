"""
Technical Indicator Service
기술적 지표 자동 생성 및 업데이트
"""
import pandas as pd
from typing import Optional
from django.utils import timezone

from apps.market.models import Evaluation, OHLCV, TechnicalIndicator
from apps.market.technical_analyzer import TechnicalAnalyzer


class TechnicalIndicatorService:
    """기술적 지표 서비스"""
    
    @staticmethod
    def create_or_update_for_evaluation(evaluation: Evaluation) -> TechnicalIndicator:
        """
        Evaluation에 대한 기술적 지표 생성/업데이트
        
        Args:
            evaluation: Evaluation 객체
        
        Returns:
            TechnicalIndicator 객체
        """
        # OHLCV 데이터 가져오기
        ohlcv_qs = OHLCV.objects.filter(
            symbol=evaluation.symbol
        ).order_by('date').values(
            'date', 'open', 'high', 'low', 'close', 'volume'
        )
        
        if not ohlcv_qs.exists():
            return TechnicalIndicatorService._create_empty_indicator(evaluation)
        
        # DataFrame 변환
        df = pd.DataFrame(list(ohlcv_qs))
        
        # 분석기 실행
        analyzer = TechnicalAnalyzer(df)
        current_price = float(evaluation.current_price) if evaluation.current_price else float(df.iloc[-1]['close'])
        
        analysis_result = analyzer.analyze_all(current_price)
        
        # TechnicalIndicator 생성 또는 업데이트
        technical, created = TechnicalIndicator.objects.update_or_create(
            evaluation=evaluation,
            defaults={
                # 이평선
                'ma5_status': analysis_result.get('ma5_status'),
                'ma20_status': analysis_result.get('ma20_status'),
                'ma60_status': analysis_result.get('ma60_status'),
                'ma112_status': analysis_result.get('ma112_status'),
                'ma224_status': analysis_result.get('ma224_status'),
                'ma_level': analysis_result.get('ma_level', 0),
                'ma_arrangement': analysis_result.get('ma_arrangement', 'mixed'),
                
                # 거래량
                'volume_ratio': analysis_result.get('volume_ratio'),
                'volume_breakout': analysis_result.get('volume_breakout', False),
                'volume_strength': analysis_result.get('volume_strength', 'weak'),
                'avg_volume_10d': analysis_result.get('avg_volume_10d'),
                
                # 지지/저항
                'support_level': analysis_result.get('support_level'),
                'resistance_level': analysis_result.get('resistance_level'),
                'support_strength': analysis_result.get('support_strength', 0),
                'resistance_strength': analysis_result.get('resistance_strength', 0),
                
                # 패턴
                'double_bottom': analysis_result.get('double_bottom', False),
                'accumulation_phase': analysis_result.get('accumulation_phase', False),
                'breakout_signal': analysis_result.get('breakout_signal', False),
                
                # 추세
                'trend_short': analysis_result.get('trend_short', 'sideways'),
                'trend_medium': analysis_result.get('trend_medium', 'sideways'),
                'trend_long': analysis_result.get('trend_long', 'sideways'),
                
                # 타임스탬프
                'analyzed_at': timezone.now()
            }
        )
        
        # 종합 점수 계산
        technical.calculate_technical_score()
        
        return technical
    
    @staticmethod
    def _create_empty_indicator(evaluation: Evaluation) -> TechnicalIndicator:
        """데이터 부족 시 빈 지표 생성"""
        technical, _ = TechnicalIndicator.objects.get_or_create(
            evaluation=evaluation,
            defaults={
                'ma_level': 0,
                'technical_score': 0,
                'signal_strength': 'weak'
            }
        )
        return technical
    
    @staticmethod
    def bulk_update_for_symbol(symbol):
        """특정 종목의 모든 Evaluation에 대해 기술적 지표 업데이트"""
        evaluations = Evaluation.objects.filter(symbol=symbol)
        
        updated_count = 0
        for evaluation in evaluations:
            try:
                TechnicalIndicatorService.create_or_update_for_evaluation(evaluation)
                updated_count += 1
            except Exception as e:
                print(f"Error updating technical for {evaluation}: {e}")
        
        return updated_count
    
    @staticmethod
    def get_top_by_technical_score(limit: int = 20):
        """기술적 점수 상위 종목"""
        return TechnicalIndicator.objects.select_related(
            'evaluation__symbol'
        ).filter(
            technical_score__gte=60
        ).order_by('-technical_score')[:limit]
    
    @staticmethod
    def get_breakout_candidates(min_ma_level: int = 3):
        """돌파 후보 (이평선 레벨 높고 돌파 신호)"""
        return TechnicalIndicator.objects.select_related(
            'evaluation__symbol'
        ).filter(
            ma_level__gte=min_ma_level,
            breakout_signal=True,
            volume_breakout=True
        ).order_by('-technical_score')
    
    @staticmethod
    def get_accumulation_stocks():
        """매집 구간 종목"""
        return TechnicalIndicator.objects.select_related(
            'evaluation__symbol'
        ).filter(
            accumulation_phase=True,
            ma_level__gte=1
        ).order_by('-technical_score')
