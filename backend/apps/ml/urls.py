"""
ML API URLs
Machine Learning prediction API endpoints
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MLModelViewSet,
    PredictionViewSet,
    FeatureSetViewSet,
    MLFeatureViewSet,
    BacktestResultViewSet,
    TrainModelView,
    PredictView,
    BatchPredictView,
    LSTMPredictView,
    TrainLSTMView,
    MLBacktestView,
    ModelRegistryView,
)

# Create router
router = DefaultRouter()
router.register(r'models', MLModelViewSet, basename='ml-models')
router.register(r'predictions', PredictionViewSet, basename='ml-predictions')
router.register(r'feature-sets', FeatureSetViewSet, basename='ml-feature-sets')
router.register(r'features', MLFeatureViewSet, basename='ml-features')
router.register(r'backtests', BacktestResultViewSet, basename='ml-backtests')

urlpatterns = [
    # Router endpoints
    path('', include(router.urls)),

    # Training
    path('train/', TrainModelView.as_view(), name='ml-train'),
    path('train-lstm/', TrainLSTMView.as_view(), name='ml-train-lstm'),

    # Predictions
    path('predict/', PredictView.as_view(), name='ml-predict'),
    path('predict-batch/', BatchPredictView.as_view(), name='ml-predict-batch'),
    path('predict-lstm/', LSTMPredictView.as_view(), name='ml-predict-lstm'),

    # ML 고도화 (v2)
    path('backtest-ml/', MLBacktestView.as_view(), name='ml-backtest'),
    path('registry/', ModelRegistryView.as_view(), name='ml-registry'),
]
