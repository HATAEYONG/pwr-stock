"""
Machine Learning Models
예측 모델, feature engineering, 학습 결과
"""
from django.db import models
from apps.market.models import Symbol, Evaluation


class MLModel(models.Model):
    """머신러닝 모델"""

    MODEL_TYPE_CHOICES = [
        ('CLASSIFIER', '분류 모델 (승률 예측)'),
        ('REGRESSOR', '회귀 모델 (수익률 예측)'),
        ('LSTM', 'LSTM (시계열 예측)'),
        ('ENSEMBLE', '앙상블 모델'),
    ]

    STATUS_CHOICES = [
        ('TRAINING', '학습 중'),
        ('TRAINED', '학습 완료'),
        ('EVALUATING', '평가 중'),
        ('DEPLOYED', '배포 완료'),
        ('FAILED', '학습 실패'),
    ]

    name = models.CharField(max_length=100, verbose_name='모델명')
    description = models.TextField(blank=True, verbose_name='설명')

    model_type = models.CharField(
        max_length=20,
        choices=MODEL_TYPE_CHOICES,
        verbose_name='모델 타입'
    )
    algorithm = models.CharField(max_length=50, verbose_name='알고리즘')

    # 모델 파일
    model_file = models.FileField(upload_to='ml_models/', null=True, blank=True, verbose_name='모델 파일')
    version = models.CharField(max_length=20, verbose_name='버전')

    # 성능 지표
    accuracy = models.FloatField(null=True, blank=True, verbose_name='정확도')
    precision = models.FloatField(null=True, blank=True, verbose_name='정밀도')
    recall = models.FloatField(null=True, blank=True, verbose_name='재현율')
    f1_score = models.FloatField(null=True, blank=True, verbose_name='F1 Score')
    auc_score = models.FloatField(null=True, blank=True, verbose_name='AUC Score')
    mse = models.FloatField(null=True, blank=True, verbose_name='MSE')
    mae = models.FloatField(null=True, blank=True, verbose_name='MAE')
    rmse = models.FloatField(null=True, blank=True, verbose_name='RMSE')

    # 학습 데이터
    train_start_date = models.DateField(null=True, blank=True, verbose_name='학습 시작일')
    train_end_date = models.DateField(null=True, blank=True, verbose_name='학습 종료일')
    test_start_date = models.DateField(null=True, blank=True, verbose_name='테스트 시작일')
    test_end_date = models.DateField(null=True, blank=True, verbose_name='테스트 종료일')

    # 상태
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TRAINING')
    trained_at = models.DateTimeField(null=True, blank=True, verbose_name='학습 완료일')
    deployed_at = models.DateTimeField(null=True, blank=True, verbose_name='배포일')
    error_message = models.TextField(blank=True, verbose_name='에러 메시지')

    # Feature 목록
    features = models.JSONField(default=list, verbose_name='Feature 목록')

    # 하이퍼파라미터
    hyperparameters = models.JSONField(default=dict, verbose_name='하이퍼파라미터')

    is_active = models.BooleanField(default=False, verbose_name='활성화 여부')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일')

    class Meta:
        db_table = 'ml_models'
        verbose_name = 'ML 모델'
        verbose_name_plural = 'ML 모델'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_model_type_display()})"


class Prediction(models.Model):
    """예측 결과"""

    model = models.ForeignKey(
        MLModel,
        on_delete=models.CASCADE,
        related_name='predictions',
        verbose_name='모델'
    )
    symbol = models.ForeignKey(
        Symbol,
        on_delete=models.CASCADE,
        related_name='predictions',
        verbose_name='종목'
    )
    evaluation = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='predictions',
        verbose_name='평가'
    )

    # 예측일
    prediction_date = models.DateField(verbose_name='예측일')
    target_date = models.DateField(verbose_name='목표일')

    # 예측 결과
    predicted_direction = models.CharField(
        max_length=10,
        choices=[('UP', '상승'), ('DOWN', '하락'), ('SIDEWAYS', '횡보')],
        null=True, blank=True,
        verbose_name='예측 방향'
    )
    predicted_return = models.FloatField(null=True, blank=True, verbose_name='예측 수익률')
    predicted_price = models.DecimalField(
        max_digits=12, decimal_places=4,
        null=True, blank=True,
        verbose_name='예측가'
    )

    # 확신도
    confidence = models.FloatField(verbose_name='확신도 (0-1)')
    probability = models.JSONField(default=dict, verbose_name='클래스별 확률')

    # Feature importance
    feature_importance = models.JSONField(default=dict, verbose_name='Feature 중요도')

    # 실제 결과
    actual_return = models.FloatField(null=True, blank=True, verbose_name='실제 수익률')
    actual_direction = models.CharField(
        max_length=10,
        choices=[('UP', '상승'), ('DOWN', '하락'), ('SIDEWAYS', '횡보')],
        null=True, blank=True,
        verbose_name='실제 방향'
    )
    is_correct = models.BooleanField(null=True, blank=True, verbose_name='예측 적중 여부')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일')

    class Meta:
        db_table = 'predictions'
        verbose_name = '예측'
        verbose_name_plural = '예측'
        unique_together = [['model', 'symbol', 'prediction_date']]
        ordering = ['-prediction_date']

    def __str__(self):
        return f"{self.symbol.ticker} - {self.prediction_date}: {self.predicted_direction}"


class FeatureSet(models.Model):
    """Feature Set (학습용 데이터셋)"""

    name = models.CharField(max_length=100, verbose_name='Feature Set명')
    description = models.TextField(blank=True, verbose_name='설명')

    # Feature 목록
    features = models.JSONField(default=list, verbose_name='Feature 목록')

    # 데이터 기간
    start_date = models.DateField(verbose_name='데이터 시작일')
    end_date = models.DateField(verbose_name='데이터 종료일')

    # 통계
    total_samples = models.IntegerField(default=0, verbose_name='총 샘플 수')
    positive_samples = models.IntegerField(default=0, verbose_name='양성 샘플 수')
    negative_samples = models.IntegerField(default=0, verbose_name='음성 샘플 수')

    # 전처리 정보
    preprocessing_steps = models.JSONField(default=list, verbose_name='전처리 단계')
    scaler_params = models.JSONField(default=dict, verbose_name='Scaler 파라미터')

    is_active = models.BooleanField(default=True, verbose_name='활성화 여부')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일')

    class Meta:
        db_table = 'feature_sets'
        verbose_name = 'Feature Set'
        verbose_name_plural = 'Feature Sets'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.total_samples} samples)"


class MLFeature(models.Model):
    """ML Feature (계산된 기술적 지표)"""

    symbol = models.ForeignKey(
        Symbol,
        on_delete=models.CASCADE,
        related_name='ml_features',
        verbose_name='종목'
    )
    feature_set = models.ForeignKey(
        FeatureSet,
        on_delete=models.CASCADE,
        related_name='ml_features',
        verbose_name='Feature Set'
    )

    date = models.DateField(verbose_name='날짜')

    # Feature 값들 (JSON)
    features = models.JSONField(default=dict, verbose_name='Feature 값들')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일')

    class Meta:
        db_table = 'ml_features'
        verbose_name = 'ML Feature'
        verbose_name_plural = 'ML Features'
        unique_together = [['symbol', 'date', 'feature_set']]
        ordering = ['-date']

    def __str__(self):
        return f"{self.symbol.ticker} - {self.date}"


class BacktestResult(models.Model):
    """백테스트 결과 (ML 모델 성능 검증)"""

    model = models.ForeignKey(
        MLModel,
        on_delete=models.CASCADE,
        related_name='backtest_results',
        verbose_name='모델'
    )

    # 기간
    start_date = models.DateField(verbose_name='시작일')
    end_date = models.DateField(verbose_name='결과일')

    # 성과
    total_return = models.FloatField(verbose_name='총 수익률')
    annualized_return = models.FloatField(verbose_name='연환산 수익률')
    sharpe_ratio = models.FloatField(verbose_name='샤프 비율')
    max_drawdown = models.FloatField(verbose_name='최대 낙폭')

    # 거래 통계
    total_trades = models.IntegerField(verbose_name='총 거래 횟수')
    winning_trades = models.IntegerField(verbose_name='수익 거래')
    losing_trades = models.IntegerField(verbose_name='손실 거래')
    win_rate = models.FloatField(verbose_name='승률')

    # 수익 분석
    avg_win = models.FloatField(verbose_name='평균 수익')
    avg_loss = models.FloatField(verbose_name='평균 손실')
    profit_factor = models.FloatField(verbose_name='Profit Factor')

    # 예측 정확도
    direction_accuracy = models.FloatField(verbose_name='방향 예측 정확도')
    top_decile_return = models.FloatField(verbose_name='상위 10% 수익률')
    bottom_decile_return = models.FloatField(verbose_name='하위 10% 수익률')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일')

    class Meta:
        db_table = 'ml_backtest_results'
        verbose_name = 'ML 백테스트 결과'
        verbose_name_plural = 'ML 백테스트 결과'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.model.name} - {self.start_date} ~ {self.end_date}"
