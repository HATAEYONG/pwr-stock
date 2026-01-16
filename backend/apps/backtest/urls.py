"""
Backtest URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BacktestResultViewSet, TradeViewSet

router = DefaultRouter()
router.register(r'results', BacktestResultViewSet, basename='backtest-result')
router.register(r'trades', TradeViewSet, basename='trade')

urlpatterns = [
    path('', include(router.urls)),
]
