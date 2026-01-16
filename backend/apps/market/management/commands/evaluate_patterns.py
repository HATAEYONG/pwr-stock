"""
evaluate_patterns 관리 커맨드
전체 파이프라인 실행:
1. OHLCV 데이터 로드
2. 지표 계산
3. Pattern 1/2 판별
4. 체크리스트 점수화
5. 트리거 분석
6. Evaluation 저장
"""
from django.core.management.base import BaseCommand
from django.db import transaction
import pandas as pd
from decimal import Decimal

from apps.market.models import Symbol, OHLCV, Indicator, Evaluation
from apps.market.services.indicators import indicator_calculator
from apps.market.services.rules import rules_loader
from apps.patterns.pattern1 import pattern1_analyzer
from apps.patterns.pattern2 import pattern2_analyzer
from apps.patterns.pattern3 import pattern3_analyzer
from apps.checklist.engine import checklist_engine
from apps.alerts.triggers import trigger_analyzer


class Command(BaseCommand):
    help = 'Pattern 평가 및 Evaluation 생성'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--ticker',
            type=str,
            help='특정 종목만 평가 (선택)'
        )
        parser.add_argument(
            '--date',
            type=str,
            help='특정 날짜만 평가 (YYYY-MM-DD) (선택)'
        )
        parser.add_argument(
            '--min-score',
            type=int,
            default=0,
            help='최소 체크리스트 점수 (기본값: 0)'
        )
    
    def handle(self, *args, **options):
        ticker = options.get('ticker')
        target_date = options.get('date')
        min_score = options.get('min_score', 0)
        
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS('Pattern Evaluation 시작'))
        self.stdout.write(self.style.SUCCESS('='*70))
        
        # 종목 필터링
        symbols = Symbol.objects.filter(is_active=True)
        if ticker:
            symbols = symbols.filter(ticker=ticker)
        
        if not symbols.exists():
            self.stdout.write(self.style.ERROR('평가할 종목이 없습니다.'))
            return
        
        total_evaluated = 0
        total_p1 = 0
        total_p2 = 0
        total_p3 = 0
        high_score_count = 0
        
        for symbol in symbols:
            self.stdout.write(f'\n[{symbol.ticker}] {symbol.name} 평가 중...')
            
            result = self.evaluate_symbol(symbol, target_date, min_score)
            
            if result:
                total_evaluated += 1
                if result['pattern_type'] == 'P1':
                    total_p1 += 1
                elif result['pattern_type'] == 'P2':
                    total_p2 += 1
                elif result['pattern_type'] == 'P3':
                    total_p3 += 1
                
                if result['checklist_score'] >= 80:
                    high_score_count += 1
                
                self.print_result(result)
        
        # 요약
        self.stdout.write(self.style.SUCCESS('\n' + '='*70))
        self.stdout.write(self.style.SUCCESS('평가 완료 요약'))
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(f'총 평가: {total_evaluated}건')
        self.stdout.write(f'Pattern 1: {total_p1}건')
        self.stdout.write(f'Pattern 2: {total_p2}건')
        self.stdout.write(f'Pattern 3 (신규상장): {total_p3}건')
        self.stdout.write(f'고득점 (80점 이상): {high_score_count}건')
        self.stdout.write(self.style.SUCCESS('='*70))
    
    def evaluate_symbol(self, symbol, target_date=None, min_score=0):
        """종목 평가 실행"""
        # 1. OHLCV 데이터 로드
        ohlcv_qs = OHLCV.objects.filter(symbol=symbol).order_by('date')
        
        if target_date:
            ohlcv_qs = ohlcv_qs.filter(date__lte=target_date)
        
        if not ohlcv_qs.exists():
            self.stdout.write(self.style.WARNING(f'  → OHLCV 데이터 없음'))
            return None
        
        # DataFrame 변환
        df = pd.DataFrame(list(ohlcv_qs.values(
            'date', 'open_price', 'high_price', 'low_price', 'close_price', 'volume'
        )))
        
        df.columns = ['date', 'open', 'high', 'low', 'close', 'volume']
        df['date'] = pd.to_datetime(df['date'])
        
        # 2. 지표 계산
        df = indicator_calculator.calculate_all_indicators(df)
        
        # 3. 최신 시점 평가
        current_idx = len(df) - 1
        current_row = df.iloc[current_idx]
        
        # 4. Pattern 판별
        p1_result = pattern1_analyzer.evaluate(df, current_idx)
        p2_result = pattern2_analyzer.evaluate(df, current_idx)
        p3_result = pattern3_analyzer.evaluate(df, current_idx, symbol)
        
        # Pattern 결정 (P1 > P2 > P3 우선순위)
        if p1_result['is_p1']:
            pattern_type = 'P1'
            pattern_evidence = p1_result
        elif p2_result['is_p2']:
            pattern_type = 'P2'
            pattern_evidence = p2_result
        elif p3_result['is_p3']:
            pattern_type = 'P3'
            pattern_evidence = p3_result
        else:
            pattern_type = 'NONE'
            pattern_evidence = {
                'p1': p1_result,
                'p2': p2_result,
                'p3': p3_result
            }
        
        # 5. 체크리스트 평가
        checklist_result = checklist_engine.evaluate(p1_result, p2_result, p3_result, df, current_idx)
        
        # 최소 점수 필터
        if checklist_result['score'] < min_score:
            self.stdout.write(self.style.WARNING(f'  → 점수 미달 ({checklist_result["score"]}점 < {min_score}점)'))
            return None
        
        # 6. 트리거 분석
        trigger_result = trigger_analyzer.evaluate_triggers(df, current_idx, pattern_type)
        
        # 7. Evaluation 저장
        with transaction.atomic():
            evaluation, created = Evaluation.objects.update_or_create(
                symbol=symbol,
                date=current_row['date'].date(),
                defaults={
                    'pattern_type': pattern_type,
                    'checklist_score': checklist_result['score'],
                    'risk_level': self._determine_risk_level(pattern_type, checklist_result['score']),
                    'start_signal': trigger_result['start_signal'],
                    'risk_signal': trigger_result['risk_signal'],
                    'sell_signal': trigger_result['sell_signal'],
                    'checklist_json': checklist_result,
                    'triggers_json': trigger_result,
                    'pattern_evidence_json': pattern_evidence,
                    'rules_version': rules_loader.version
                }
            )
            
            # Indicator 저장
            self._save_indicators(symbol, df.iloc[current_idx])
        
        return {
            'symbol': symbol,
            'pattern_type': pattern_type,
            'checklist_score': checklist_result['score'],
            'recommendation': checklist_result['recommendation'],
            'start_signal': trigger_result['start_signal'],
            'risk_signal': trigger_result['risk_signal'],
            'sell_signal': trigger_result['sell_signal'],
            'date': current_row['date'].date()
        }
    
    def _determine_risk_level(self, pattern_type, score):
        """리스크 레벨 결정"""
        if pattern_type == 'NONE':
            return 'HIGH'
        elif score >= 80:
            return 'LOW'
        elif score >= 60:
            return 'MEDIUM'
        else:
            return 'HIGH'
    
    def _save_indicators(self, symbol, row):
        """Indicator 저장"""
        indicator_data = {
            'ma5': self._to_decimal(row.get('ma5')),
            'ma10': self._to_decimal(row.get('ma10')),
            'ma20': self._to_decimal(row.get('ma20')),
            'ma60': self._to_decimal(row.get('ma60')),
            'ma112': self._to_decimal(row.get('ma112')),
            'ma224': self._to_decimal(row.get('ma224')),
            'volume_avg_20': int(row.get('volume_avg_20', 0)) if pd.notna(row.get('volume_avg_20')) else None,
            'volume_avg_60': int(row.get('volume_avg_60', 0)) if pd.notna(row.get('volume_avg_60')) else None,
            'week52_high': self._to_decimal(row.get('week52_high')),
            'week52_low': self._to_decimal(row.get('week52_low')),
            'yearly_low': self._to_decimal(row.get('yearly_low')),
            'yearly_low_date': pd.to_datetime(row.get('yearly_low_date')).date() if pd.notna(row.get('yearly_low_date')) else None,
        }
        
        Indicator.objects.update_or_create(
            symbol=symbol,
            date=pd.to_datetime(row['date']).date(),
            defaults=indicator_data
        )
    
    def _to_decimal(self, value):
        """값을 Decimal로 변환"""
        if pd.isna(value) or value is None:
            return None
        return Decimal(str(round(float(value), 4)))
    
    def print_result(self, result):
        """결과 출력"""
        symbol = result['symbol']
        pattern = result['pattern_type']
        score = result['checklist_score']
        recommendation = result['recommendation']
        
        # 색상 결정
        if pattern == 'P1':
            pattern_style = self.style.SUCCESS
        elif pattern == 'P2':
            pattern_style = self.style.WARNING
        elif pattern == 'P3':
            pattern_style = self.style.HTTP_INFO  # 파란색 (신규상장)
        else:
            pattern_style = self.style.ERROR
        
        self.stdout.write(f'  Pattern: {pattern_style(pattern)} | 점수: {score}점 | {recommendation}')
        
        # 트리거 출력
        triggers = []
        if result['start_signal']:
            triggers.append(self.style.SUCCESS('🚀 START'))
        if result['risk_signal']:
            triggers.append(self.style.ERROR('⚠️  RISK'))
        if result['sell_signal']:
            triggers.append(self.style.WARNING('💰 SELL'))
        
        if triggers:
            self.stdout.write(f'  트리거: {" ".join(triggers)}')
