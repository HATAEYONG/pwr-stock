"""
ML Celery Tasks
매주 자동 재학습 + 성과 검증 스케줄
"""
import logging
from datetime import date, timedelta

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def weekly_retrain(self):
    """
    매주 일요일 새벽 자동 재학습
    1. 전체 활성 종목 Feature 생성
    2. Classifier + Regressor 학습
    3. Model Registry에 버전 저장
    4. 직전 버전과 성과 비교 → 개선 시 활성화, 퇴보 시 롤백
    """
    logger.info("[ML Task] weekly_retrain started")
    try:
        from apps.market.models import Symbol
        from apps.ml.services.feature_store import FeatureStore, clear_cache
        from apps.ml.services.model_registry import ModelRegistry
        from apps.ml.pipeline import MLPipeline

        clear_cache()

        symbols = list(Symbol.objects.filter(is_active=True)[:100])
        if not symbols:
            logger.warning("[ML Task] No active symbols found")
            return {"status": "skipped", "reason": "no symbols"}

        end_date = date.today()
        start_date = end_date - timedelta(days=365 * 2)  # 2년치

        pipeline = MLPipeline()
        result = pipeline.train_and_register(
            symbols=symbols,
            start_date=start_date,
            end_date=end_date,
        )

        logger.info(f"[ML Task] weekly_retrain done: {result}")
        return result

    except Exception as exc:
        logger.error(f"[ML Task] weekly_retrain failed: {exc}")
        raise self.retry(exc=exc)


@shared_task
def daily_batch_predict():
    """
    매일 장 마감 후 전체 종목 ML 예측 배치 실행
    """
    logger.info("[ML Task] daily_batch_predict started")
    try:
        from apps.market.models import Symbol
        from apps.ml.pipeline import MLPipeline

        symbols = list(Symbol.objects.filter(is_active=True)[:200])
        pipeline = MLPipeline()
        result = pipeline.batch_predict(symbols, prediction_date=date.today())

        logger.info(f"[ML Task] daily_batch_predict: {len(result)} predictions")
        return {"predicted": len(result)}

    except Exception as exc:
        logger.error(f"[ML Task] daily_batch_predict failed: {exc}")
        return {"error": str(exc)}


@shared_task
def validate_active_model():
    """
    주간 활성 모델 성과 검증 — 승률이 기준 이하면 경고 로그
    """
    from apps.ml.services.model_registry import ModelRegistry
    registry = ModelRegistry()
    history = registry.get_performance_history(model_type='CLASSIFIER', limit=3)

    if not history:
        return {"status": "no_models"}

    latest = history[0]
    accuracy = latest.get('accuracy') or 0
    if accuracy < 0.55:
        logger.warning(
            f"[ML Task] Active model accuracy={accuracy:.2%} below threshold 55%. "
            "Consider retraining or rollback."
        )
    return {"accuracy": accuracy, "model_id": latest['id']}


def register_beat_schedules():
    """
    Django-Celery-Beat DB 스케줄 등록
    최초 실행 또는 설정 변경 시 manage.py shell에서 호출:
        from apps.ml.tasks import register_beat_schedules
        register_beat_schedules()
    """
    from django_celery_beat.models import PeriodicTask, CrontabSchedule
    import json

    # 매주 일요일 02:00
    weekly_cron, _ = CrontabSchedule.objects.get_or_create(
        minute='0', hour='2', day_of_week='0',
        day_of_month='*', month_of_year='*',
    )
    PeriodicTask.objects.update_or_create(
        name='ML 주간 자동 재학습',
        defaults={
            'crontab': weekly_cron,
            'task': 'apps.ml.tasks.weekly_retrain',
            'args': json.dumps([]),
            'enabled': True,
        }
    )

    # 매일 18:30 (장 마감 후)
    daily_cron, _ = CrontabSchedule.objects.get_or_create(
        minute='30', hour='18', day_of_week='1-5',
        day_of_month='*', month_of_year='*',
    )
    PeriodicTask.objects.update_or_create(
        name='ML 일별 배치 예측',
        defaults={
            'crontab': daily_cron,
            'task': 'apps.ml.tasks.daily_batch_predict',
            'args': json.dumps([]),
            'enabled': True,
        }
    )

    # 매주 월요일 03:00 성과 검증
    validate_cron, _ = CrontabSchedule.objects.get_or_create(
        minute='0', hour='3', day_of_week='1',
        day_of_month='*', month_of_year='*',
    )
    PeriodicTask.objects.update_or_create(
        name='ML 모델 성과 검증',
        defaults={
            'crontab': validate_cron,
            'task': 'apps.ml.tasks.validate_active_model',
            'args': json.dumps([]),
            'enabled': True,
        }
    )

    logger.info("[ML Task] Beat schedules registered: weekly_retrain, daily_batch_predict, validate_active_model")
