"""
manage.py ml_setup

ML 파이프라인 초기 설정 커맨드
  --schedules   : Celery Beat 스케줄 등록
  --train       : 활성 종목으로 첫 학습 실행
  --verify      : Feature Store feature 수 검증
  --all         : 위 세 가지 모두 실행
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "ML 파이프라인 초기 설정 (스케줄 등록 / 첫 학습 / feature 검증)"

    def add_arguments(self, parser):
        parser.add_argument('--schedules', action='store_true', help='Celery Beat 스케줄 등록')
        parser.add_argument('--train', action='store_true', help='활성 종목 첫 학습')
        parser.add_argument('--verify', action='store_true', help='Feature Store 검증')
        parser.add_argument('--all', dest='all_steps', action='store_true', help='전체 실행')
        parser.add_argument('--limit', type=int, default=20, help='학습 종목 수 제한 (기본 20)')

    def handle(self, *args, **options):
        run_all = options['all_steps']

        if run_all or options['schedules']:
            self._register_schedules()

        if run_all or options['verify']:
            self._verify_features()

        if run_all or options['train']:
            self._run_train(options['limit'])

    # ─────────────────────────────────────────────

    def _register_schedules(self):
        self.stdout.write("▶ Celery Beat 스케줄 등록 중...")
        try:
            from apps.ml.tasks import register_beat_schedules
            register_beat_schedules()
            self.stdout.write(self.style.SUCCESS("  OK 스케줄 등록 완료 (weekly_retrain / daily_batch_predict / validate_active_model)"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  FAIL 스케줄 등록 실패: {e}"))

    def _verify_features(self):
        self.stdout.write("▶ Feature Store 검증 중...")
        try:
            import numpy as np
            import pandas as pd
            from apps.ml.services.feature_store import FeatureStore

            store = FeatureStore(use_cache=False)

            # 더미 OHLCV로 feature 수 검증
            n = 150
            import numpy as np
            from datetime import date
            dates = pd.date_range(end=date.today(), periods=n, freq='B')
            close = 10000 + np.cumsum(np.random.randn(n) * 100)
            df = pd.DataFrame({
                'open': close * 0.99, 'high': close * 1.02,
                'low': close * 0.98, 'close': close,
                'volume': np.random.randint(100_000, 5_000_000, n).astype(float),
            }, index=dates)

            df = store._add_base_technical(df)
            df = store._add_advanced_technical(df)
            df = store._add_microstructure(df)
            df = store._add_volatility(df)
            df = store._add_pattern_recognition(df)
            df = store._add_market_phase(df)
            df = store._add_targets(df)

            feat_cols = store.get_feature_columns(df)
            count = len(feat_cols)

            if count >= 50:
                self.stdout.write(self.style.SUCCESS(f"  OK Feature 수: {count}개 (목표 50개+)"))
            else:
                self.stdout.write(self.style.WARNING(f"  WARN Feature 수: {count}개 (목표 미달)"))

            self.stdout.write(f"  상위 10개: {feat_cols[:10]}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  FAIL Feature 검증 실패: {e}"))

    def _run_train(self, limit: int):
        self.stdout.write(f"▶ 첫 학습 실행 (최대 {limit}개 종목)...")
        try:
            from datetime import date, timedelta
            from apps.market.models import Symbol
            from apps.ml.pipeline import MLPipeline

            symbols = list(Symbol.objects.filter(is_active=True)[:limit])
            if not symbols:
                self.stdout.write(self.style.WARNING("  WARN 활성 종목이 없습니다. Symbol 등록 후 재실행하세요."))
                return

            end_date = date.today()
            start_date = end_date - timedelta(days=365 * 2)

            pipeline = MLPipeline()
            result = pipeline.train_and_register(
                symbols=symbols,
                start_date=start_date,
                end_date=end_date,
            )

            self.stdout.write(self.style.SUCCESS(
                f"  OK 학습 완료: model_id={result['model_id']}, "
                f"accuracy={result['accuracy']:.3f}, f1={result['f1_score']:.3f}, "
                f"종목={result['valid_symbols']}개"
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  FAIL 학습 실패: {e}"))
            import traceback
            self.stdout.write(traceback.format_exc())
