"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.market.urls')),
    path('api/kiwoom/', include('apps.kiwoom.urls')),
    path('api/patterns/', include('apps.patterns.urls')),  # Pattern analysis API
    path('api/backtest/', include('apps.backtest.urls')),
    path('api/alerts/', include('apps.alerts.urls')),
    path('api/portfolio/', include('apps.portfolio.urls')),
    path('api/ingest/', include('apps.ingest.urls')),  # Agent data ingestion
    path('api/ml/', include('apps.ml.urls')),  # Machine Learning API (PR-13)
    path('api/ontology/', include('apps.ontology.urls')),  # Ontology API (PR-16)
    # path('api/realtime/', include('apps.realtime.urls')),  # Real-time data API (Polygon) 비활성화
    path('api/config/', include('apps.config.urls')),  # API 설정 관리
    path('api/system/', include('apps.common.urls')),  # 시스템 헬스체크 (P3)
    path('api-auth/', include('rest_framework.urls')),
]
