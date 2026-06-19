"""
ML API Views
Machine Learning prediction API endpoints
"""
import os
import logging
from datetime import date, datetime, timedelta
from typing import Dict, List

from django.db.models import Q, F, Avg, Max, Min
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

from .models import MLModel, Prediction, FeatureSet, MLFeature, BacktestResult
from .serializers import (
    MLModelSerializer, PredictionSerializer, FeatureSetSerializer,
    MLFeatureSerializer, BacktestResultSerializer,
    TrainModelSerializer, PredictSerializer, BatchPredictSerializer,
    LSTMPredictSerializer, TrainLSTMSerializer
)
from .services.predictor import MLPredictor
from apps.market.models import Symbol, OHLCV

logger = logging.getLogger(__name__)


class MLModelViewSet(viewsets.ModelViewSet):
    """ML Model ViewSet"""

    queryset = MLModel.objects.all()
    serializer_class = MLModelSerializer
    filterset_fields = ['model_type', 'algorithm', 'status', 'is_active']
    search_fields = ['name', 'description']

    def get_queryset(self):
        """Custom queryset with optimizations"""
        queryset = super().get_queryset()

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by model type
        model_type = self.request.query_params.get('model_type')
        if model_type:
            queryset = queryset.filter(model_type=model_type)

        # Order by latest
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def deploy(self, request, pk=None):
        """Deploy model"""
        model = self.get_object()

        # Deactivate other models
        MLModel.objects.filter(
            model_type=model.model_type,
            is_active=True
        ).update(is_active=False)

        # Activate this model
        model.is_active = True
        model.status = 'DEPLOYED'
        model.deployed_at = datetime.now()
        model.save()

        serializer = self.get_serializer(model)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate model"""
        model = self.get_object()
        model.is_active = False
        model.save()

        serializer = self.get_serializer(model)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active model"""
        model_type = request.query_params.get('model_type', 'CLASSIFIER')

        try:
            model = MLModel.objects.get(
                model_type=model_type,
                is_active=True,
                status='DEPLOYED'
            )
            serializer = self.get_serializer(model)
            return Response(serializer.data)
        except MLModel.DoesNotExist:
            return Response(
                {'error': f'No active {model_type} model found'},
                status=status.HTTP_404_NOT_FOUND
            )


class PredictionViewSet(viewsets.ModelViewSet):
    """Prediction ViewSet"""

    queryset = Prediction.objects.select_related('model', 'symbol', 'evaluation').all()
    serializer_class = PredictionSerializer
    filterset_fields = ['model', 'symbol', 'predicted_direction', 'prediction_date']
    search_fields = ['symbol__ticker', 'symbol__name']

    def get_queryset(self):
        """Custom queryset"""
        queryset = super().get_queryset()

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(prediction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(prediction_date__lte=end_date)

        # Filter by confidence threshold
        min_confidence = self.request.query_params.get('min_confidence')
        if min_confidence:
            queryset = queryset.filter(confidence__gte=float(min_confidence))

        # Filter by correctness
        is_correct = self.request.query_params.get('is_correct')
        if is_correct in ['true', 'True', '1']:
            queryset = queryset.filter(is_correct=True)
        elif is_correct in ['false', 'False', '0']:
            queryset = queryset.filter(is_correct=False)

        return queryset.order_by('-prediction_date', '-confidence')

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest predictions for each symbol"""
        model_id = request.query_params.get('model_id')

        if not model_id:
            return Response(
                {'error': 'model_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get latest prediction for each symbol
        predictions = Prediction.objects.filter(model_id=model_id)\
            .order_by('symbol', '-prediction_date')\
            .distinct('symbol')

        serializer = self.get_serializer(predictions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def top_picks(self, request):
        """Get top picks (highest confidence)"""
        model_id = request.query_params.get('model_id')
        limit = int(request.query_params.get('limit', 20))
        direction = request.query_params.get('direction', 'UP')

        if not model_id:
            return Response(
                {'error': 'model_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        predictions = Prediction.objects.filter(
            model_id=model_id,
            predicted_direction=direction
        ).order_by('-confidence')[:limit]

        serializer = self.get_serializer(predictions, many=True)
        return Response(serializer.data)


class FeatureSetViewSet(viewsets.ModelViewSet):
    """Feature Set ViewSet"""

    queryset = FeatureSet.objects.all()
    serializer_class = FeatureSetSerializer
    filterset_fields = ['is_active']


class MLFeatureViewSet(viewsets.ReadOnlyModelViewSet):
    """ML Feature ViewSet (Read-only)"""

    queryset = MLFeature.objects.select_related('symbol', 'feature_set').all()
    serializer_class = MLFeatureSerializer
    filterset_fields = ['symbol', 'feature_set', 'date']


class BacktestResultViewSet(viewsets.ReadOnlyModelViewSet):
    """Backtest Result ViewSet (Read-only)"""

    queryset = BacktestResult.objects.select_related('model').all()
    serializer_class = BacktestResultSerializer
    filterset_fields = ['model']


class TrainModelView(APIView):
    """Train ML Model"""

    def post(self, request):
        """Train a new ML model"""
        serializer = TrainModelSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:
            # Get symbols
            symbols = Symbol.objects.filter(id__in=data['symbol_ids'])

            if not symbols.exists():
                return Response(
                    {'error': 'No valid symbols found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create predictor
            predictor = MLPredictor()

            # Train model
            if data['model_type'] == 'CLASSIFIER':
                ml_model = predictor.train_classifier(
                    symbols=list(symbols),
                    start_date=data['start_date'],
                    end_date=data['end_date'],
                    target_period=data['target_period'],
                    algorithm=data['algorithm']
                )
            else:  # REGRESSOR
                ml_model = predictor.train_regressor(
                    symbols=list(symbols),
                    start_date=data['start_date'],
                    end_date=data['end_date'],
                    target_period=data['target_period'],
                    algorithm=data['algorithm']
                )

            # Update model name if provided
            if 'name' in data:
                ml_model.name = data['name']
            if 'description' in data:
                ml_model.description = data['description']
            ml_model.save()

            # Serialize and return
            model_serializer = MLModelSerializer(ml_model)
            return Response(model_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Model training error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PredictView(APIView):
    """Make prediction for a single symbol"""

    def post(self, request):
        """Generate prediction"""
        serializer = PredictSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:
            # Get symbol
            symbol = Symbol.objects.get(id=data['symbol_id'])

            # Get prediction date
            prediction_date = data.get('prediction_date', date.today())

            # Get model
            if 'model_id' in data:
                ml_model = MLModel.objects.get(id=data['model_id'])
            else:
                # Get active model
                ml_model = MLModel.objects.filter(
                    is_active=True,
                    status='DEPLOYED'
                ).first()

                if not ml_model:
                    return Response(
                        {'error': 'No active model found. Please specify model_id'},
                        status=status.HTTP_404_NOT_FOUND
                    )

            # Load model and predict
            predictor = MLPredictor(model_id=ml_model.id)

            # Load model file
            import pickle
            model_path = os.path.join(settings.MEDIA_ROOT, ml_model.model_file.name)

            if not os.path.exists(model_path):
                return Response(
                    {'error': 'Model file not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
                predictor.model = model_data['model']
                predictor.scaler = model_data['scaler']
                predictor.features = model_data['features']

            # Make prediction
            prediction = predictor.predict(symbol, prediction_date)

            # Save prediction to database
            pred_obj = Prediction.objects.create(
                model=ml_model,
                symbol=symbol,
                prediction_date=prediction_date,
                target_date=prediction_date + timedelta(days=5),  # Default 5-day
                predicted_direction=prediction.get('direction'),
                predicted_return=prediction.get('predicted_return'),
                confidence=prediction.get('confidence', 0.5),
                probability=prediction.get('probability', {})
            )

            # Serialize and return
            pred_serializer = PredictionSerializer(pred_obj)
            return Response(pred_serializer.data)

        except Symbol.DoesNotExist:
            return Response(
                {'error': 'Symbol not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except MLModel.DoesNotExist:
            return Response(
                {'error': 'Model not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BatchPredictView(APIView):
    """Batch prediction for multiple symbols"""

    def post(self, request):
        """Generate predictions for multiple symbols"""
        serializer = BatchPredictSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:
            # Get symbols
            symbols = Symbol.objects.filter(id__in=data['symbol_ids'])

            if not symbols.exists():
                return Response(
                    {'error': 'No valid symbols found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get prediction date
            prediction_date = data.get('prediction_date', date.today())

            # Get model
            if 'model_id' in data:
                ml_model = MLModel.objects.get(id=data['model_id'])
            else:
                ml_model = MLModel.objects.filter(
                    is_active=True,
                    status='DEPLOYED'
                ).first()

                if not ml_model:
                    return Response(
                        {'error': 'No active model found'},
                        status=status.HTTP_404_NOT_FOUND
                    )

            # Load predictor
            predictor = MLPredictor(model_id=ml_model.id)

            import pickle
            model_path = os.path.join(settings.MEDIA_ROOT, ml_model.model_file.name)

            if not os.path.exists(model_path):
                return Response(
                    {'error': 'Model file not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
                predictor.model = model_data['model']
                predictor.scaler = model_data['scaler']
                predictor.features = model_data['features']

            # Batch predict
            results = predictor.batch_predict(list(symbols), prediction_date)

            # Save predictions to database
            predictions = []
            for result in results:
                try:
                    symbol = symbols.get(ticker=result['symbol'])
                    pred_obj = Prediction.objects.create(
                        model=ml_model,
                        symbol=symbol,
                        prediction_date=prediction_date,
                        target_date=prediction_date + timedelta(days=5),
                        predicted_direction=result.get('direction'),
                        predicted_return=result.get('predicted_return'),
                        confidence=result.get('confidence', 0.5)
                    )
                    predictions.append(pred_obj)
                except:
                    continue

            # Serialize and return
            pred_serializer = PredictionSerializer(predictions, many=True)
            return Response(pred_serializer.data)

        except Exception as e:
            logger.error(f"Batch prediction error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LSTMPredictView(APIView):
    """LSTM Prediction View"""

    def post(self, request):
        """Make LSTM prediction"""
        serializer = LSTMPredictSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:
            from .models.lstm_model import LSTMPredictor

            # Get symbol
            symbol = Symbol.objects.get(ticker=data['symbol'])

            # Get recent OHLCV data
            ohlcv = OHLCV.objects.filter(
                symbol=symbol
            ).order_by('-date')[:60]  # Last 60 days

            if ohlcv.count() < 60:
                return Response(
                    {'error': 'Insufficient data. Need at least 60 days of OHLCV data'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Convert to DataFrame
            import pandas as pd
            df = pd.DataFrame(list(ohlcv.values(
                'date', 'open', 'high', 'low', 'close', 'volume'
            )))

            # Get model path
            model_path = data.get('model_path', 'lstm_model.h5')

            if not os.path.exists(model_path):
                return Response(
                    {'error': 'LSTM model file not found. Train a model first.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Load model
            predictor = LSTMPredictor()
            predictor.load_model(model_path)

            # Prepare features (using basic technical indicators)
            from .services.feature_engineering import FeatureEngineer
            engineer = FeatureEngineer()

            # Create features
            df = engineer.create_features(df)

            # Get feature columns
            feature_cols = predictor.feature_names or [
                col for col in df.columns
                if col.startswith(('rsi_', 'macd_', 'ema_', 'sma_', 'bb_', 'ma_'))
            ]

            if len(feature_cols) != predictor.n_features:
                return Response(
                    {'error': f'Feature mismatch. Model expects {predictor.n_features} features, got {len(feature_cols)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Make prediction
            prediction = predictor.predict(df, feature_cols)

            return Response(prediction)

        except Symbol.DoesNotExist:
            return Response(
                {'error': 'Symbol not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"LSTM prediction error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TrainLSTMView(APIView):
    """Train LSTM Model View"""

    def post(self, request):
        """Train LSTM model"""
        serializer = TrainLSTMSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:
            from .models.lstm_model import train_lstm_model
            from .services.feature_engineering import FeatureEngineer

            # Train LSTM model
            predictor = train_lstm_model(
                symbols=data['symbols'],
                start_date=data['start_date'].strftime('%Y-%m-%d'),
                end_date=data['end_date'].strftime('%Y-%m-%d'),
                sequence_length=data['sequence_length'],
                prediction_horizons=data['prediction_horizons'],
                save_path=data['save_path']
            )

            # Create MLModel record
            ml_model = MLModel.objects.create(
                name=f"LSTM Predictor - {data['symbols'][0]}",
                description=f"LSTM time series prediction model ({data['sequence_length']} days sequence)",
                model_type='LSTM',
                algorithm='LSTM',
                version='1.0',
                train_start_date=data['start_date'],
                train_end_date=data['end_date'],
                status='TRAINED',
                features=predictor.feature_names,
                hyperparameters={
                    'sequence_length': data['sequence_length'],
                    'prediction_horizons': data['prediction_horizons'],
                    'lstm_units': predictor.lstm_units,
                    'dropout_rate': predictor.dropout_rate
                }
            )

            serializer = MLModelSerializer(ml_model)
            return Response({
                'model': serializer.data,
                'model_path': data['save_path'],
                'message': 'LSTM model trained successfully'
            })

        except Exception as e:
            logger.error(f"LSTM training error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




class MLBacktestView(APIView):
    """ML 신호 + 패턴 결합 백테스팅 API"""

    def post(self, request):
        from apps.market.models import Symbol
        from apps.ml.pipeline import MLPipeline

        ticker = request.data.get('ticker')
        strategy = request.data.get('strategy', 'P1')
        ml_threshold = float(request.data.get('ml_threshold', 0.55))
        model_id = request.data.get('model_id')

        try:
            start_date = date.fromisoformat(request.data['start_date'])
            end_date = date.fromisoformat(request.data['end_date'])
        except (KeyError, ValueError) as e:
            return Response({'error': f'Invalid date: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        symbol = Symbol.objects.filter(ticker=ticker).first()
        if not symbol:
            return Response({'error': f'Symbol not found: {ticker}'}, status=status.HTTP_404_NOT_FOUND)

        try:
            pipeline = MLPipeline()
            result = pipeline.run_backtest(
                symbol=symbol,
                start_date=start_date,
                end_date=end_date,
                strategy=strategy,
                ml_threshold=ml_threshold,
                model_id=int(model_id) if model_id else None,
            )
            return Response(result)
        except Exception as e:
            logger.error(f"ML backtest error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ModelRegistryView(APIView):
    """Model Registry 조회 / 활성화 / 롤백 API"""

    def get(self, request):
        from apps.ml.services.model_registry import ModelRegistry
        model_type = request.query_params.get('type', 'CLASSIFIER')
        registry = ModelRegistry()
        return Response({
            'versions': registry.list_versions(model_type),
            'active_id': registry.get_active_version(model_type),
        })

    def post(self, request):
        from apps.ml.services.model_registry import ModelRegistry
        action = request.data.get('action')
        registry = ModelRegistry()

        if action == 'activate':
            model_id = request.data.get('model_id')
            if not model_id:
                return Response({'error': 'model_id required'}, status=status.HTTP_400_BAD_REQUEST)
            registry.set_active(int(model_id))
            return Response({'activated': model_id})

        if action == 'rollback':
            model_type = request.data.get('type', 'CLASSIFIER')
            prev_id = registry.rollback(model_type)
            if prev_id is None:
                return Response({'error': 'No previous version'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'rolled_back_to': prev_id})

        return Response({'error': 'Unknown action'}, status=status.HTTP_400_BAD_REQUEST)
