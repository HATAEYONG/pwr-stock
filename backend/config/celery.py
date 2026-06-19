"""
Celery Configuration
자동화 작업 스케줄링
"""
import os
from celery import Celery
from celery.schedules import crontab

# Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('powerstock')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


# Celery Beat Schedule
app.conf.beat_schedule = {
    # PR-7: 매일 장 시작 전 조건검색 (한국 09:00)
    'daily-condition-search': {
        'task': 'apps.ingest.tasks.collect_watchlist_all_conditions',
        'schedule': crontab(hour=9, minute=0),  # 한국 09:00
        'options': {
            'expires': 3600
        }
    },

    # PR-7: 매일 장 마감 후 OHLCV 수집 (한국 16:30)
    'daily-ohlcv-collection': {
        'task': 'apps.ingest.tasks.collect_ohlcv_for_watchlist',
        'schedule': crontab(hour=16, minute=30),  # 한국 16:30
        'options': {
            'expires': 3600
        }
    },

    # PR-7: 매일 패턴 평가 (한국 17:00)
    'daily-pattern-evaluation': {
        'task': 'apps.ingest.tasks.evaluate_watchlist_patterns',
        'schedule': crontab(hour=17, minute=0),  # 한국 17:00
        'options': {
            'expires': 3600
        }
    },

    # PR-7: 매일 알림 발송 (한국 17:30)
    'daily-alerts': {
        'task': 'apps.alerts.tasks.send_daily_alerts',
        'schedule': crontab(hour=17, minute=30),  # 한국 17:30
        'options': {
            'expires': 3600
        }
    },

    # PR-7: 주간 백테스트 리포트 (토요일 10:00)
    'weekly-backtest-report': {
        'task': 'apps.backtest.tasks.generate_weekly_report',
        'schedule': crontab(day_of_week=6, hour=10, minute=0),  # 토요일 10:00
        'options': {
            'expires': 7200
        }
    },

    # PR-7: 통합 일일 파이프라인 (테스트용 - 수동 실행 권장)
    'daily-pipeline': {
        'task': 'apps.ingest.tasks.daily_data_collection_pipeline',
        'schedule': crontab(hour=18, minute=0),  # 한국 18:00 (모두 완료 후)
        'options': {
            'expires': 7200
        }
    },
}

app.conf.timezone = 'Asia/Seoul'
