"""
시장 데이터 모델
- Symbol: 종목 정보
- OHLCV: 일별 시세 데이터
- Indicator: 기술적 지표 (이동평균선, 거래량 평균 등)
- Evaluation: 패턴 평가 결과 (체크리스트, 트리거, 근거 포함)
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Symbol(models.Model):
    """종목 마스터"""
    ticker = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    exchange = models.CharField(max_length=20, default='KRX')
    sector = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Pattern 3용 필드
    listing_date = models.DateField(null=True, blank=True, help_text='상장일')
    shares_outstanding = models.BigIntegerField(null=True, blank=True, help_text='상장주식수')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'symbols'
        ordering = ['ticker']

    def __str__(self):
        return f"{self.ticker} - {self.name}"


class OHLCV(models.Model):
    """일별 시세 데이터"""
    symbol = models.ForeignKey(Symbol, on_delete=models.CASCADE, related_name='ohlcv')
    date = models.DateField(db_index=True)
    open_price = models.DecimalField(max_digits=12, decimal_places=4)
    high_price = models.DecimalField(max_digits=12, decimal_places=4)
    low_price = models.DecimalField(max_digits=12, decimal_places=4)
    close_price = models.DecimalField(max_digits=12, decimal_places=4)
    volume = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ohlcv'
        ordering = ['symbol', 'date']
        unique_together = ['symbol', 'date']
        indexes = [
            models.Index(fields=['symbol', 'date']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.symbol.ticker} - {self.date}"


class Indicator(models.Model):
    """기술적 지표 스냅샷"""
    symbol = models.ForeignKey(Symbol, on_delete=models.CASCADE, related_name='indicators')
    date = models.DateField(db_index=True)
    
    # 이동평균선
    ma5 = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    ma10 = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    ma20 = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    ma60 = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    ma112 = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    ma224 = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    
    # 거래량 평균
    volume_avg_20 = models.BigIntegerField(null=True, blank=True)
    volume_avg_60 = models.BigIntegerField(null=True, blank=True)
    
    # 52주 고저
    week52_high = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    week52_low = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    
    # 연중 최저
    yearly_low = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    yearly_low_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'indicators'
        ordering = ['symbol', 'date']
        unique_together = ['symbol', 'date']
        indexes = [
            models.Index(fields=['symbol', 'date']),
        ]

    def __str__(self):
        return f"{self.symbol.ticker} Indicators - {self.date}"


class Evaluation(models.Model):
    """패턴 평가 결과"""
    PATTERN_CHOICES = [
        ('NONE', 'No Pattern'),
        ('P1', 'Pattern 1'),
        ('P2', 'Pattern 2'),
        ('P3', 'Pattern 3'),
    ]
    
    RISK_LEVELS = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
    ]
    
    symbol = models.ForeignKey(Symbol, on_delete=models.CASCADE, related_name='evaluations')
    date = models.DateField(db_index=True)
    
    # 패턴 분류
    pattern_type = models.CharField(max_length=10, choices=PATTERN_CHOICES, default='NONE')
    
    # 체크리스트 점수
    checklist_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0
    )
    
    # 리스크 등급
    risk_level = models.CharField(max_length=10, choices=RISK_LEVELS, default='MEDIUM')
    
    # 트리거 신호
    start_signal = models.BooleanField(default=False)
    risk_signal = models.BooleanField(default=False)
    sell_signal = models.BooleanField(default=False)
    
    # JSON 근거 필드 (완전한 투명성)
    checklist_json = models.JSONField(default=dict, blank=True)
    triggers_json = models.JSONField(default=dict, blank=True)
    pattern_evidence_json = models.JSONField(default=dict, blank=True)
    
    # 메타데이터
    rules_version = models.CharField(max_length=64, blank=True)  # rules.yaml 버전
    evaluated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evaluations'
        ordering = ['-date', '-checklist_score']
        unique_together = ['symbol', 'date']
        indexes = [
            models.Index(fields=['symbol', 'date']),
            models.Index(fields=['pattern_type', 'checklist_score']),
            models.Index(fields=['start_signal']),
            models.Index(fields=['risk_signal']),
            models.Index(fields=['sell_signal']),
        ]

    def __str__(self):
        return f"{self.symbol.ticker} - {self.pattern_type} ({self.checklist_score}점) - {self.date}"


# Technical Indicators 모델 import
from .models_technical import TechnicalIndicator, TimeframeAnalysis

__all__ = [
    'Symbol',
    'OHLCV',
    'Indicator',
    'Evaluation',
    'TechnicalIndicator',
    'TimeframeAnalysis'
]

