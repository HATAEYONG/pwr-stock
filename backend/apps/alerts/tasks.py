"""
Celery 태스크
실시간 트리거 모니터링 및 알림
"""
from celery import shared_task
from django.utils import timezone
from datetime import datetime, timedelta
from typing import List, Dict

from apps.market.models import Symbol, Evaluation
from apps.alerts.models import AlertSettings, AlertLog
from apps.alerts.notifiers import TelegramNotifier


@shared_task(name='monitor_triggers')
def monitor_triggers():
    """
    트리거 모니터링 (5분마다 실행)
    
    - START/RISK/SELL 신호 감지
    - 활성화된 사용자에게 알림 전송
    - 알림 로그 기록
    """
    print(f"🔍 트리거 모니터링 시작: {datetime.now()}")
    
    # 활성화된 알림 설정 가져오기
    active_settings = AlertSettings.objects.filter(is_active=True)
    
    if not active_settings.exists():
        print("활성화된 알림 설정이 없습니다.")
        return
    
    # 오늘 날짜
    today = timezone.now().date()
    
    # 최근 Evaluation 가져오기 (오늘 날짜)
    recent_evaluations = Evaluation.objects.filter(
        date=today
    ).select_related('symbol')
    
    telegram_notifier = TelegramNotifier()
    
    for settings in active_settings:
        user_id = settings.user_id if hasattr(settings, 'user_id') else None
        
        # 사용자별 필터 적용
        evaluations = recent_evaluations
        
        # 최소 점수 필터
        if settings.min_score:
            evaluations = evaluations.filter(
                checklist_score__gte=settings.min_score
            )
        
        # Pattern 필터
        if settings.patterns:
            pattern_list = [p.strip() for p in settings.patterns.split(',')]
            evaluations = evaluations.filter(pattern_type__in=pattern_list)
        
        # 거래소 필터
        if settings.exchanges:
            exchange_list = [e.strip() for e in settings.exchanges.split(',')]
            evaluations = evaluations.filter(symbol__exchange__in=exchange_list)
        
        # 신호별 처리
        sent_count = 0
        
        # START 신호
        if settings.notify_start:
            start_evals = evaluations.filter(start_signal=True)
            
            for evaluation in start_evals:
                # 이미 전송한 알림인지 확인
                already_sent = AlertLog.objects.filter(
                    settings=settings,
                    evaluation=evaluation,
                    signal_type='START'
                ).exists()
                
                if not already_sent:
                    # Telegram 알림 전송
                    success = telegram_notifier.send_start_signal(
                        chat_id=settings.telegram_chat_id,
                        symbol_ticker=evaluation.symbol.ticker,
                        symbol_name=evaluation.symbol.name,
                        pattern_type=evaluation.pattern_type,
                        score=evaluation.checklist_score,
                        exchange=evaluation.symbol.exchange,
                        current_price=float(evaluation.current_price) if evaluation.current_price else 0.0
                    )
                    
                    if success:
                        # 로그 기록
                        AlertLog.objects.create(
                            settings=settings,
                            evaluation=evaluation,
                            signal_type='START',
                            message=f"START 신호: {evaluation.symbol.ticker}",
                            sent_at=timezone.now()
                        )
                        sent_count += 1
        
        # RISK 신호
        if settings.notify_risk:
            risk_evals = evaluations.filter(risk_signal=True)
            
            for evaluation in risk_evals:
                already_sent = AlertLog.objects.filter(
                    settings=settings,
                    evaluation=evaluation,
                    signal_type='RISK'
                ).exists()
                
                if not already_sent:
                    success = telegram_notifier.send_risk_signal(
                        chat_id=settings.telegram_chat_id,
                        symbol_ticker=evaluation.symbol.ticker,
                        symbol_name=evaluation.symbol.name,
                        pattern_type=evaluation.pattern_type,
                        exchange=evaluation.symbol.exchange,
                        current_price=float(evaluation.current_price) if evaluation.current_price else 0.0
                    )
                    
                    if success:
                        AlertLog.objects.create(
                            settings=settings,
                            evaluation=evaluation,
                            signal_type='RISK',
                            message=f"RISK 신호: {evaluation.symbol.ticker}",
                            sent_at=timezone.now()
                        )
                        sent_count += 1
        
        # SELL 신호
        if settings.notify_sell:
            sell_evals = evaluations.filter(sell_signal=True)
            
            for evaluation in sell_evals:
                already_sent = AlertLog.objects.filter(
                    settings=settings,
                    evaluation=evaluation,
                    signal_type='SELL'
                ).exists()
                
                if not already_sent:
                    success = telegram_notifier.send_sell_signal(
                        chat_id=settings.telegram_chat_id,
                        symbol_ticker=evaluation.symbol.ticker,
                        symbol_name=evaluation.symbol.name,
                        pattern_type=evaluation.pattern_type,
                        exchange=evaluation.symbol.exchange,
                        current_price=float(evaluation.current_price) if evaluation.current_price else 0.0
                    )
                    
                    if success:
                        AlertLog.objects.create(
                            settings=settings,
                            evaluation=evaluation,
                            signal_type='SELL',
                            message=f"SELL 신호: {evaluation.symbol.ticker}",
                            sent_at=timezone.now()
                        )
                        sent_count += 1
        
        print(f"✅ 사용자 {user_id}: {sent_count}건 알림 전송")
    
    print(f"✅ 트리거 모니터링 완료: {datetime.now()}")


@shared_task(name='send_daily_summary')
def send_daily_summary():
    """
    일일 요약 알림 (매일 17:00 실행)
    
    - 오늘 발생한 신호 요약
    - Top 종목 리스트
    """
    print(f"📊 일일 요약 전송 시작: {datetime.now()}")
    
    active_settings = AlertSettings.objects.filter(
        is_active=True,
        daily_summary=True
    )
    
    if not active_settings.exists():
        print("일일 요약을 받는 사용자가 없습니다.")
        return
    
    today = timezone.now().date()
    
    # 오늘의 통계
    start_count = Evaluation.objects.filter(
        date=today,
        start_signal=True
    ).count()
    
    risk_count = Evaluation.objects.filter(
        date=today,
        risk_signal=True
    ).count()
    
    sell_count = Evaluation.objects.filter(
        date=today,
        sell_signal=True
    ).count()
    
    total_count = start_count + risk_count + sell_count
    
    # Top 5 고득점 종목
    top_evals = Evaluation.objects.filter(
        date=today
    ).select_related('symbol').order_by('-checklist_score')[:5]
    
    top_stocks = [
        {
            'ticker': e.symbol.ticker,
            'name': e.symbol.name,
            'score': e.checklist_score
        }
        for e in top_evals
    ]
    
    telegram_notifier = TelegramNotifier()
    
    for settings in active_settings:
        success = telegram_notifier.send_daily_summary(
            chat_id=settings.telegram_chat_id,
            total_signals=total_count,
            start_signals=start_count,
            risk_signals=risk_count,
            sell_signals=sell_count,
            top_stocks=top_stocks
        )
        
        if success:
            print(f"✅ 일일 요약 전송 성공: {settings.telegram_chat_id}")
    
    print(f"✅ 일일 요약 전송 완료: {datetime.now()}")


@shared_task(name='test_telegram_connection')
def test_telegram_connection(chat_id: str):
    """
    Telegram 연결 테스트
    
    Args:
        chat_id: Telegram Chat ID
    """
    telegram_notifier = TelegramNotifier()
    success = telegram_notifier.send_test_message(chat_id)
    
    return {
        'success': success,
        'chat_id': chat_id,
        'timestamp': datetime.now().isoformat()
    }
