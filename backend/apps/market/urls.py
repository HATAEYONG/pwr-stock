"""
Market App URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_technical import TechnicalIndicatorViewSet

router = DefaultRouter()
router.register(r'symbols', views.SymbolViewSet, basename='symbol')
router.register(r'ohlcv', views.OHLCVViewSet, basename='ohlcv')
router.register(r'indicators', views.IndicatorViewSet, basename='indicator')
router.register(r'evaluations', views.EvaluationViewSet, basename='evaluation')
router.register(r'technical', TechnicalIndicatorViewSet, basename='technical')

urlpatterns = [
    path('', include(router.urls)),
]

