"""
Kiwoom App URLs
"""
from django.urls import path
from . import views

urlpatterns = [
    path('fetch-stocks/', views.fetch_kiwoom_stocks, name='fetch-kiwoom-stocks'),
    path('fetch-nasdaq/', views.fetch_nasdaq_stocks, name='fetch-nasdaq-stocks'),
    path('status/', views.kiwoom_status, name='kiwoom-status'),
]
