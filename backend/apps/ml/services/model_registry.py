"""
Model Registry
버전별 모델 저장·로드·롤백, 성과 메타 관리
"""
import logging
import os
import pickle
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

_REGISTRY_DIR = Path(__file__).resolve().parents[3] / 'ml_models'


def _ensure_dir():
    _REGISTRY_DIR.mkdir(parents=True, exist_ok=True)


class ModelRegistry:
    """
    ML 모델 버전 관리 레지스트리

    사용 예:
        registry = ModelRegistry()
        version_id = registry.save(model_obj, scaler, features, meta)
        model_obj, scaler, features = registry.load(version_id)
        registry.set_active(version_id)
        version_id = registry.get_active_version()
    """

    def save(
        self,
        model,
        scaler,
        features: List[str],
        meta: Dict,
        model_type: str = 'classifier',
    ) -> int:
        """
        모델 저장 → DB MLModel 레코드 생성 → version ID 반환
        meta 예: {'accuracy': 0.65, 'mdd': -0.12, 'win_rate': 0.62, ...}
        """
        _ensure_dir()
        from apps.ml.models import MLModel

        version = self._next_version(model_type)
        filename = _REGISTRY_DIR / f"{model_type}_v{version}.pkl"

        payload = {'model': model, 'scaler': scaler, 'features': features}
        with open(filename, 'wb') as f:
            pickle.dump(payload, f)

        ml_model = MLModel.objects.create(
            name=meta.get('name', f"{model_type} v{version}"),
            description=meta.get('description', ''),
            model_type=model_type.upper() if model_type.upper() in ('CLASSIFIER', 'REGRESSOR', 'LSTM', 'ENSEMBLE') else 'CLASSIFIER',
            algorithm=meta.get('algorithm', 'unknown'),
            version=str(version),
            accuracy=meta.get('accuracy'),
            precision=meta.get('precision'),
            recall=meta.get('recall'),
            f1_score=meta.get('f1_score'),
            auc_score=meta.get('auc_score'),
            mse=meta.get('mse'),
            mae=meta.get('mae'),
            rmse=meta.get('rmse'),
            train_start_date=meta.get('train_start_date'),
            train_end_date=meta.get('train_end_date'),
            status='TRAINED',
            trained_at=datetime.now(),
            features=features,
            hyperparameters=meta.get('hyperparameters', {}),
            is_active=False,
        )
        try:
            rel_path = filename.relative_to(Path(__file__).resolve().parents[3])
        except ValueError:
            rel_path = filename  # 절대경로 폴백
        ml_model.model_file.name = str(rel_path)
        ml_model.save()

        logger.info(f"[ModelRegistry] Saved {model_type} v{version} → id={ml_model.id}, file={filename.name}")
        return ml_model.id

    def load(self, model_id: int) -> Tuple:
        """모델 로드 → (model, scaler, features)"""
        from apps.ml.models import MLModel
        record = MLModel.objects.get(id=model_id)
        filepath = _REGISTRY_DIR / Path(record.model_file.name).name

        if not filepath.exists():
            raise FileNotFoundError(f"Model file not found: {filepath}")

        with open(filepath, 'rb') as f:
            payload = pickle.load(f)

        logger.info(f"[ModelRegistry] Loaded model id={model_id} ({record.name})")
        return payload['model'], payload['scaler'], payload['features']

    def set_active(self, model_id: int):
        """특정 버전을 활성 모델로 지정 (나머지 비활성화)"""
        from apps.ml.models import MLModel
        record = MLModel.objects.get(id=model_id)
        MLModel.objects.filter(model_type=record.model_type).update(is_active=False)
        record.is_active = True
        record.status = 'DEPLOYED'
        record.deployed_at = datetime.now()
        record.save()
        logger.info(f"[ModelRegistry] Active model set: id={model_id}")

    def get_active_version(self, model_type: str = 'CLASSIFIER') -> Optional[int]:
        """현재 활성 모델 ID 반환"""
        from apps.ml.models import MLModel
        record = MLModel.objects.filter(
            model_type=model_type.upper(), is_active=True
        ).order_by('-deployed_at').first()
        return record.id if record else None

    def load_active(self, model_type: str = 'CLASSIFIER') -> Optional[Tuple]:
        """활성 모델 바로 로드"""
        model_id = self.get_active_version(model_type)
        if model_id is None:
            logger.warning(f"[ModelRegistry] No active model for type={model_type}")
            return None
        return self.load(model_id)

    def list_versions(self, model_type: str = 'CLASSIFIER') -> List[Dict]:
        """버전 목록 반환 (최신순)"""
        from apps.ml.models import MLModel
        records = MLModel.objects.filter(
            model_type=model_type.upper()
        ).order_by('-trained_at').values(
            'id', 'name', 'version', 'accuracy', 'f1_score', 'is_active',
            'trained_at', 'status',
        )
        return list(records)

    def rollback(self, model_type: str = 'CLASSIFIER') -> Optional[int]:
        """직전 활성 버전으로 롤백"""
        from apps.ml.models import MLModel
        versions = MLModel.objects.filter(
            model_type=model_type.upper(), status='DEPLOYED'
        ).order_by('-deployed_at')

        if versions.count() < 2:
            logger.warning("[ModelRegistry] No previous version to rollback")
            return None

        current = versions[0]
        previous = versions[1]

        current.is_active = False
        current.save()
        previous.is_active = True
        previous.save()

        logger.info(f"[ModelRegistry] Rolled back from id={current.id} to id={previous.id}")
        return previous.id

    def get_performance_history(self, model_type: str = 'CLASSIFIER', limit: int = 10) -> List[Dict]:
        """성과 추이 반환 (학습 완료 모델 최신순)"""
        from apps.ml.models import MLModel
        return list(
            MLModel.objects.filter(
                model_type=model_type.upper(), status__in=['TRAINED', 'DEPLOYED']
            ).order_by('-trained_at').values(
                'id', 'version', 'accuracy', 'precision', 'recall', 'f1_score',
                'auc_score', 'trained_at',
            )[:limit]
        )

    # ─── 내부 헬퍼 ───────────────────────────────

    def _next_version(self, model_type: str) -> int:
        from apps.ml.models import MLModel
        last = MLModel.objects.filter(
            model_type=model_type.upper()
        ).order_by('-id').first()
        if last is None:
            return 1
        try:
            return int(last.version) + 1
        except (ValueError, TypeError):
            return MLModel.objects.filter(model_type=model_type.upper()).count() + 1
