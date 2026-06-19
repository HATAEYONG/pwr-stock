"""
ML Predictor (레거시 호환 래퍼)
신규 코드는 apps.ml.pipeline.MLPipeline 을 사용할 것.
이 모듈은 기존 views/API 호환성을 위해 유지된다.
"""
import logging
from datetime import date
from typing import Dict, List, Optional

from apps.market.models import Symbol

logger = logging.getLogger(__name__)

try:
    from apps.ml.pipeline import MLPipeline as _Pipeline
    _pipeline = _Pipeline()
except Exception as _e:
    logger.warning(f"[Predictor] MLPipeline init failed, fallback mode: {_e}")
    _pipeline = None


class MLPredictor:
    """
    레거시 호환 래퍼 — 내부적으로 MLPipeline 위임
    기존 views/serializers는 이 클래스를 그대로 사용 가능
    """

    def __init__(self, model_id: Optional[int] = None):
        self.model_id = model_id

    def train_classifier(
        self,
        symbols: List[Symbol],
        start_date: date,
        end_date: date,
        target_period: int = 5,
        algorithm: str = 'random_forest',
    ) -> Dict:
        """분류 모델 학습 — MLPipeline에 위임"""
        if _pipeline is None:
            raise RuntimeError("MLPipeline not available")
        return _pipeline.train_and_register(
            symbols=symbols,
            start_date=start_date,
            end_date=end_date,
            target_period=target_period,
            algorithm=algorithm,
        )

    def predict(self, symbol: Symbol, prediction_date: date) -> Dict:
        """단일 종목 예측 — MLPipeline에 위임"""
        if _pipeline is None:
            return {'error': 'MLPipeline not available'}
        return _pipeline.predict(symbol, prediction_date, model_id=self.model_id)

    def batch_predict(self, symbols: List[Symbol], prediction_date: date) -> List[Dict]:
        """일괄 예측 — MLPipeline에 위임"""
        if _pipeline is None:
            return []
        return _pipeline.batch_predict(symbols, prediction_date, model_id=self.model_id)
