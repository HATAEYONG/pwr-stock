"""
ML API Serializers
Machine Learning prediction API serializers
"""
from rest_framework import serializers
from .models import MLModel, Prediction, FeatureSet, MLFeature, BacktestResult


class MLModelSerializer(serializers.ModelSerializer):
    """ML Model Serializer"""

    model_type_display = serializers.CharField(source='get_model_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MLModel
        fields = [
            'id', 'name', 'description', 'model_type', 'model_type_display',
            'algorithm', 'version', 'accuracy', 'precision', 'recall', 'f1_score',
            'auc_score', 'mse', 'mae', 'rmse', 'train_start_date', 'train_end_date',
            'test_start_date', 'test_end_date', 'status', 'status_display',
            'trained_at', 'deployed_at', 'error_message', 'features', 'hyperparameters',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PredictionSerializer(serializers.ModelSerializer):
    """Prediction Serializer"""

    symbol_ticker = serializers.CharField(source='symbol.ticker', read_only=True)
    symbol_name = serializers.CharField(source='symbol.name', read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True)
    predicted_direction_display = serializers.CharField(source='get_predicted_direction_display', read_only=True)
    actual_direction_display = serializers.CharField(source='get_actual_direction_display', read_only=True)

    class Meta:
        model = Prediction
        fields = [
            'id', 'model', 'model_name', 'symbol', 'symbol_ticker', 'symbol_name',
            'evaluation', 'prediction_date', 'target_date', 'predicted_direction',
            'predicted_direction_display', 'predicted_return', 'predicted_price',
            'confidence', 'probability', 'feature_importance', 'actual_return',
            'actual_direction', 'actual_direction_display', 'is_correct', 'created_at'
        ]
        read_only_fields = ['created_at']


class FeatureSetSerializer(serializers.ModelSerializer):
    """Feature Set Serializer"""

    class Meta:
        model = FeatureSet
        fields = [
            'id', 'name', 'description', 'features', 'start_date', 'end_date',
            'total_samples', 'positive_samples', 'negative_samples',
            'preprocessing_steps', 'scaler_params', 'is_active', 'created_at'
        ]
        read_only_fields = ['created_at']


class MLFeatureSerializer(serializers.ModelSerializer):
    """ML Feature Serializer"""

    symbol_ticker = serializers.CharField(source='symbol.ticker', read_only=True)
    feature_set_name = serializers.CharField(source='feature_set.name', read_only=True)

    class Meta:
        model = MLFeature
        fields = [
            'id', 'symbol', 'symbol_ticker', 'feature_set', 'feature_set_name',
            'date', 'features', 'created_at'
        ]
        read_only_fields = ['created_at']


class BacktestResultSerializer(serializers.ModelSerializer):
    """Backtest Result Serializer"""

    model_name = serializers.CharField(source='model.name', read_only=True)

    class Meta:
        model = BacktestResult
        fields = [
            'id', 'model', 'model_name', 'start_date', 'end_date', 'total_return',
            'annualized_return', 'sharpe_ratio', 'max_drawdown', 'total_trades',
            'winning_trades', 'losing_trades', 'win_rate', 'avg_win', 'avg_loss',
            'profit_factor', 'direction_accuracy', 'top_decile_return',
            'bottom_decile_return', 'created_at'
        ]
        read_only_fields = ['created_at']


class TrainModelSerializer(serializers.Serializer):
    """Train Model Request Serializer"""

    name = serializers.CharField(max_length=100, required=False, help_text="Model name")
    description = serializers.CharField(required=False, help_text="Model description")

    # Training data
    symbol_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of symbol IDs to train on"
    )
    start_date = serializers.DateField(help_text="Training start date")
    end_date = serializers.DateField(help_text="Training end date")

    # Model configuration
    model_type = serializers.ChoiceField(
        choices=['CLASSIFIER', 'REGRESSOR'],
        default='CLASSIFIER',
        help_text="Type of model to train"
    )
    algorithm = serializers.ChoiceField(
        choices=['random_forest', 'gradient_boosting', 'logistic'],
        default='random_forest',
        help_text="Algorithm to use"
    )
    target_period = serializers.IntegerField(
        default=5,
        help_text="Prediction period in days"
    )

    # Optional parameters
    test_size = serializers.FloatField(
        default=0.2,
        help_text="Test data ratio",
        required=False
    )
    max_features = serializers.IntegerField(
        default=50,
        help_text="Maximum number of features",
        required=False
    )


class PredictSerializer(serializers.Serializer):
    """Prediction Request Serializer"""

    symbol_id = serializers.IntegerField(help_text="Symbol ID to predict")
    prediction_date = serializers.DateField(
        required=False,
        help_text="Prediction date (default: today)"
    )
    model_id = serializers.IntegerField(
        required=False,
        help_text="Model ID to use (default: active model)"
    )


class BatchPredictSerializer(serializers.Serializer):
    """Batch Prediction Request Serializer"""

    symbol_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of symbol IDs to predict"
    )
    prediction_date = serializers.DateField(
        required=False,
        help_text="Prediction date (default: today)"
    )
    model_id = serializers.IntegerField(
        required=False,
        help_text="Model ID to use (default: active model)"
    )


class LSTMPredictSerializer(serializers.Serializer):
    """LSTM Prediction Request Serializer"""

    symbol = serializers.CharField(max_length=20, help_text="Symbol code")
    prediction_date = serializers.DateField(
        required=False,
        help_text="Prediction date (default: latest available)"
    )
    model_path = serializers.CharField(
        required=False,
        help_text="Path to trained LSTM model"
    )


class TrainLSTMSerializer(serializers.Serializer):
    """Train LSTM Model Request Serializer"""

    symbols = serializers.ListField(
        child=serializers.CharField(max_length=20),
        help_text="List of symbol codes to train on"
    )
    start_date = serializers.DateField(help_text="Training start date")
    end_date = serializers.DateField(help_text="Training end date")

    # LSTM hyperparameters
    sequence_length = serializers.IntegerField(
        default=60,
        help_text="Input sequence length in days",
        required=False
    )
    prediction_horizons = serializers.ListField(
        child=serializers.IntegerField(),
        default=[1, 5, 10, 20],
        help_text="Prediction horizons in days",
        required=False
    )
    epochs = serializers.IntegerField(
        default=100,
        help_text="Maximum training epochs",
        required=False
    )
    batch_size = serializers.IntegerField(
        default=32,
        help_text="Training batch size",
        required=False
    )
    use_attention = serializers.BooleanField(
        default=False,
        help_text="Use attention mechanism",
        required=False
    )

    # Model saving
    save_path = serializers.CharField(
        default='lstm_model.h5',
        help_text="Path to save trained model",
        required=False
    )
