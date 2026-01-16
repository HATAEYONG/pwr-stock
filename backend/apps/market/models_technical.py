"""
Technical Indicators Models
장기이평선, 거래량, 지지/저항 분석
"""
from django.db import models
from decimal import Decimal


class TechnicalIndicator(models.Model):
    """기술적 지표 분석"""
    
    evaluation = models.OneToOneField(
        'market.Evaluation',
        on_delete=models.CASCADE,
        related_name='technical',
        help_text="연결된 Evaluation"
    )
    
    # ==================== 장기이평선 레벨 ====================
    ma5_status = models.CharField(
        max_length=20,
        choices=[
            ('above', '상향 돌파'),
            ('below', '하향 이탈'),
            ('touching', '접근 중')
        ],
        null=True,
        blank=True,
        help_text="5일선 상태"
    )
    
    ma20_status = models.CharField(max_length=20, null=True, blank=True)
    ma60_status = models.CharField(max_length=20, null=True, blank=True)
    ma112_status = models.CharField(max_length=20, null=True, blank=True)
    ma224_status = models.CharField(max_length=20, null=True, blank=True)
    
    ma_level = models.IntegerField(
        default=0,
        help_text="돌파한 이평선 개수 (0-5)"
    )
    
    ma_arrangement = models.CharField(
        max_length=20,
        choices=[
            ('positive', '정배열'),
            ('negative', '역배열'),
            ('mixed', '혼조')
        ],
        default='mixed',
        help_text="이평선 배열 상태"
    )
    
    # ==================== 거래량 분석 ====================
    volume_ratio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="전일 대비 거래량 비율 (%)"
    )
    
    volume_breakout = models.BooleanField(
        default=False,
        help_text="거래량 돌파 (110% 이상)"
    )
    
    volume_strength = models.CharField(
        max_length=20,
        choices=[
            ('very_strong', '매우 강함 (200%+)'),
            ('strong', '강함 (150%+)'),
            ('moderate', '보통 (110%+)'),
            ('weak', '약함 (110% 미만)')
        ],
        default='weak'
    )
    
    avg_volume_10d = models.BigIntegerField(
        null=True,
        blank=True,
        help_text="10일 평균 거래량"
    )
    
    # ==================== 지지/저항 ====================
    support_level = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="지지선 가격"
    )
    
    resistance_level = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="저항선 가격"
    )
    
    support_strength = models.IntegerField(
        default=0,
        help_text="지지선 강도 (0-100)"
    )
    
    resistance_strength = models.IntegerField(
        default=0,
        help_text="저항선 강도 (0-100)"
    )
    
    # ==================== 패턴 감지 ====================
    double_bottom = models.BooleanField(
        default=False,
        help_text="쌍바닥 패턴"
    )
    
    accumulation_phase = models.BooleanField(
        default=False,
        help_text="매집 구간"
    )
    
    breakout_signal = models.BooleanField(
        default=False,
        help_text="돌파 신호"
    )
    
    # ==================== 추세 ====================
    trend_short = models.CharField(
        max_length=20,
        choices=[
            ('bullish', '상승'),
            ('bearish', '하락'),
            ('sideways', '횡보')
        ],
        default='sideways',
        help_text="단기 추세 (5-20일)"
    )
    
    trend_medium = models.CharField(
        max_length=20,
        choices=[
            ('bullish', '상승'),
            ('bearish', '하락'),
            ('sideways', '횡보')
        ],
        default='sideways',
        help_text="중기 추세 (20-60일)"
    )
    
    trend_long = models.CharField(
        max_length=20,
        choices=[
            ('bullish', '상승'),
            ('bearish', '하락'),
            ('sideways', '횡보')
        ],
        default='sideways',
        help_text="장기 추세 (60-224일)"
    )
    
    # ==================== 종합 점수 ====================
    technical_score = models.IntegerField(
        default=0,
        help_text="기술적 지표 종합 점수 (0-100)"
    )
    
    signal_strength = models.CharField(
        max_length=20,
        choices=[
            ('very_strong', '매우 강함'),
            ('strong', '강함'),
            ('moderate', '보통'),
            ('weak', '약함'),
            ('very_weak', '매우 약함')
        ],
        default='moderate'
    )
    
    # ==================== 메타 데이터 ====================
    analyzed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'technical_indicators'
        verbose_name = '기술적 지표'
        verbose_name_plural = '기술적 지표'
        indexes = [
            models.Index(fields=['ma_level']),
            models.Index(fields=['volume_breakout']),
            models.Index(fields=['technical_score']),
        ]
    
    def __str__(self):
        return f"{self.evaluation.symbol.ticker} - Level {self.ma_level}"
    
    def calculate_technical_score(self):
        """기술적 지표 종합 점수 계산"""
        score = 0
        
        # 이평선 레벨 (최대 30점)
        score += self.ma_level * 6
        
        # 정배열 보너스 (10점)
        if self.ma_arrangement == 'positive':
            score += 10
        
        # 거래량 (최대 20점)
        if self.volume_breakout:
            if self.volume_strength == 'very_strong':
                score += 20
            elif self.volume_strength == 'strong':
                score += 15
            elif self.volume_strength == 'moderate':
                score += 10
        
        # 추세 (최대 20점)
        if self.trend_short == 'bullish':
            score += 7
        if self.trend_medium == 'bullish':
            score += 7
        if self.trend_long == 'bullish':
            score += 6
        
        # 패턴 보너스 (최대 20점)
        if self.double_bottom:
            score += 10
        if self.breakout_signal:
            score += 10
        
        self.technical_score = min(score, 100)
        
        # 신호 강도 결정
        if self.technical_score >= 80:
            self.signal_strength = 'very_strong'
        elif self.technical_score >= 60:
            self.signal_strength = 'strong'
        elif self.technical_score >= 40:
            self.signal_strength = 'moderate'
        elif self.technical_score >= 20:
            self.signal_strength = 'weak'
        else:
            self.signal_strength = 'very_weak'
        
        self.save()
        return self.technical_score


class TimeframeAnalysis(models.Model):
    """시간대별 분석"""
    
    evaluation = models.ForeignKey(
        'market.Evaluation',
        on_delete=models.CASCADE,
        related_name='timeframes'
    )
    
    timeframe = models.CharField(
        max_length=20,
        choices=[
            ('premarket', '프리장 (17:00-22:30)'),
            ('market_open', '본장 초반 (22:30-23:30)'),
            ('market_mid', '본장 중반 (23:30-02:00)'),
            ('market_close', '본장 마감 (02:00-05:00)'),
            ('aftermarket', '애프터 (05:00-09:00)')
        ],
        help_text="시간대"
    )
    
    price_change = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="가격 변동 (%)"
    )
    
    volume = models.BigIntegerField(
        help_text="거래량"
    )
    
    high = models.DecimalField(max_digits=20, decimal_places=4)
    low = models.DecimalField(max_digits=20, decimal_places=4)
    
    pattern_detected = models.CharField(
        max_length=100,
        blank=True,
        help_text="감지된 패턴"
    )
    
    signal = models.CharField(
        max_length=20,
        choices=[
            ('strong_buy', '강한 매수'),
            ('buy', '매수'),
            ('hold', '보유'),
            ('sell', '매도'),
            ('strong_sell', '강한 매도')
        ],
        default='hold'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'timeframe_analysis'
        verbose_name = '시간대 분석'
        verbose_name_plural = '시간대 분석'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.evaluation.symbol.ticker} - {self.timeframe}"
