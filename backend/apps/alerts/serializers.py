"""
Alert Serializers
"""
from rest_framework import serializers
from .models import AlertSettings, AlertLog


class AlertSettingsSerializer(serializers.ModelSerializer):
    """알림 설정 Serializer"""
    
    class Meta:
        model = AlertSettings
        fields = [
            'id',
            'user_id',
            'telegram_chat_id',
            'is_active',
            'notify_start',
            'notify_risk',
            'notify_sell',
            'daily_summary',
            'min_score',
            'patterns',
            'exchanges',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlertLogSerializer(serializers.ModelSerializer):
    """알림 로그 Serializer"""
    
    symbol_ticker = serializers.CharField(
        source='evaluation.symbol.ticker',
        read_only=True
    )
    symbol_name = serializers.CharField(
        source='evaluation.symbol.name',
        read_only=True
    )
    
    class Meta:
        model = AlertLog
        fields = [
            'id',
            'settings',
            'evaluation',
            'signal_type',
            'message',
            'sent_at',
            'success',
            'symbol_ticker',
            'symbol_name'
        ]
        read_only_fields = fields


class TelegramTestSerializer(serializers.Serializer):
    """Telegram 연결 테스트 Serializer"""
    
    chat_id = serializers.CharField(
        max_length=100,
        help_text="Telegram Chat ID"
    )
