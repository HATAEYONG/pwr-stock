"""
Alert 모델
알림 설정 및 로그
"""
from django.db import models


class AlertSettings(models.Model):
    """알림 설정"""
    
    # 사용자 정보 (향후 User 모델 연동)
    user_id = models.IntegerField(null=True, blank=True, help_text="사용자 ID (향후 사용)")
    
    # Telegram 설정
    telegram_chat_id = models.CharField(
        max_length=100,
        help_text="Telegram Chat ID"
    )
    
    # 알림 활성화
    is_active = models.BooleanField(
        default=True,
        help_text="알림 활성화 여부"
    )
    
    # 신호별 알림 설정
    notify_start = models.BooleanField(
        default=True,
        help_text="START 신호 알림"
    )
    notify_risk = models.BooleanField(
        default=True,
        help_text="RISK 신호 알림"
    )
    notify_sell = models.BooleanField(
        default=True,
        help_text="SELL 신호 알림"
    )
    
    # 일일 요약
    daily_summary = models.BooleanField(
        default=True,
        help_text="일일 요약 알림"
    )
    
    # 필터 조건
    min_score = models.IntegerField(
        default=70,
        help_text="최소 체크리스트 점수"
    )
    
    patterns = models.CharField(
        max_length=50,
        blank=True,
        help_text="Pattern 필터 (쉼표 구분, 예: P1,P2)"
    )
    
    exchanges = models.CharField(
        max_length=100,
        blank=True,
        help_text="거래소 필터 (쉼표 구분, 예: KOSDAQ,NASDAQ)"
    )
    
    # 타임스탬프
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'alert_settings'
        verbose_name = '알림 설정'
        verbose_name_plural = '알림 설정'
    
    def __str__(self):
        return f"AlertSettings(chat_id={self.telegram_chat_id}, active={self.is_active})"


class AlertLog(models.Model):
    """알림 전송 로그"""
    
    SIGNAL_TYPES = [
        ('START', 'START'),
        ('RISK', 'RISK'),
        ('SELL', 'SELL'),
        ('SUMMARY', 'SUMMARY'),
    ]
    
    settings = models.ForeignKey(
        AlertSettings,
        on_delete=models.CASCADE,
        related_name='logs',
        help_text="알림 설정"
    )
    
    evaluation = models.ForeignKey(
        'market.Evaluation',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="관련 Evaluation"
    )
    
    signal_type = models.CharField(
        max_length=10,
        choices=SIGNAL_TYPES,
        help_text="신호 타입"
    )
    
    message = models.TextField(
        help_text="전송된 메시지"
    )
    
    sent_at = models.DateTimeField(
        auto_now_add=True,
        help_text="전송 시각"
    )
    
    success = models.BooleanField(
        default=True,
        help_text="전송 성공 여부"
    )
    
    class Meta:
        db_table = 'alert_logs'
        verbose_name = '알림 로그'
        verbose_name_plural = '알림 로그'
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['-sent_at']),
            models.Index(fields=['settings', 'signal_type']),
        ]
    
    def __str__(self):
        return f"AlertLog({self.signal_type}, {self.sent_at})"

