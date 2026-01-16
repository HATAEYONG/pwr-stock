"""
Alerts URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlertSettingsViewSet, AlertLogViewSet

router = DefaultRouter()
router.register(r'settings', AlertSettingsViewSet, basename='alertsettings')
router.register(r'logs', AlertLogViewSet, basename='alertlog')

urlpatterns = [
    path('', include(router.urls)),
]
