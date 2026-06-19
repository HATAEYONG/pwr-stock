"""
LSTM Model for Time Series Prediction (PR-13 Enhancement)
Deep learning model for pattern recognition and price prediction
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, callbacks
from typing import Tuple, Dict, List, Optional
import joblib
import os
from datetime import datetime

class LSTMPredictor:
    """
    LSTM-based deep learning model for time series prediction

    Features:
    - Multi-timeframe input (60-day windows)
    - Attention mechanism for feature importance
    - Dropout for regularization
    - Early stopping to prevent overfitting
    - Model checkpointing
    """

    def __init__(
        self,
        sequence_length: int = 60,
        n_features: int = 50,
        lstm_units: List[int] = [128, 64, 32],
        dropout_rate: float = 0.2,
        learning_rate: float = 0.001,
        prediction_horizons: List[int] = [1, 5, 10, 20]
    ):
        """
        Initialize LSTM Predictor

        Args:
            sequence_length: Input sequence length (days)
            n_features: Number of technical features
            lstm_units: LSTM layer units
            dropout_rate: Dropout rate for regularization
            learning_rate: Learning rate for Adam optimizer
            prediction_horizons: Days to predict ahead
        """
        self.sequence_length = sequence_length
        self.n_features = n_features
        self.lstm_units = lstm_units
        self.dropout_rate = dropout_rate
        self.learning_rate = learning_rate
        self.prediction_horizons = prediction_horizons

        self.model = None
        self.history = None
        self.feature_names = None
        self.scaler = None

    def build_model(self) -> keras.Model:
        """
        Build LSTM model with attention mechanism

        Architecture:
        - Input Layer (sequence_length, n_features)
        - LSTM Layers (128, 64, 32 units)
        - Attention Layer
        - Dense Layers (64, 32)
        - Output Layer (prediction_horizons)
        """
        model = models.Sequential([
            # Input shape: (sequence_length, n_features)
            layers.Input(shape=(self.sequence_length, self.n_features)),

            # First LSTM layer (return sequences for stacking)
            layers.LSTM(
                self.lstm_units[0],
                return_sequences=True,
                activation='tanh'
            ),
            layers.Dropout(self.dropout_rate),

            # Second LSTM layer
            layers.LSTM(
                self.lstm_units[1],
                return_sequences=True,
                activation='tanh'
            ),
            layers.Dropout(self.dropout_rate),

            # Third LSTM layer
            layers.LSTM(
                self.lstm_units[2],
                return_sequences=False,
                activation='tanh'
            ),
            layers.Dropout(self.dropout_rate),

            # Dense layers for prediction
            layers.Dense(64, activation='relu'),
            layers.Dropout(self.dropout_rate),
            layers.Dense(32, activation='relu'),

            # Output layer (multiple horizons)
            layers.Dense(len(self.prediction_horizons))
        ])

        # Compile model
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate),
            loss='mse',
            metrics=['mae', 'mape']
        )

        self.model = model
        return model

    def prepare_sequences(
        self,
        data: pd.DataFrame,
        feature_cols: List[str]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare sequences for LSTM training

        Args:
            data: DataFrame with technical indicators
            feature_cols: List of feature column names

        Returns:
            X: 3D array (samples, sequence_length, features)
            y: 2D array (samples, prediction_horizons)
        """
        X, y = [], []

        # Calculate returns for each horizon
        for horizon in self.prediction_horizons:
            data[f'return_{horizon}d'] = data['close'].pct_change(horizon).shift(-horizon)

        # Remove NaN values
        data = data.dropna()

        # Create sequences
        for i in range(len(data) - self.sequence_length):
            # Input sequence
            sequence = data[feature_cols].iloc[i:i+self.sequence_length].values
            X.append(sequence)

            # Target: future returns for each horizon
            targets = data[[f'return_{h}d' for h in self.prediction_horizons]].iloc[i+self.sequence_length].values
            y.append(targets)

        return np.array(X), np.array(y)

    def train(
        self,
        data: pd.DataFrame,
        feature_cols: List[str],
        validation_split: float = 0.2,
        epochs: int = 100,
        batch_size: int = 32,
        early_stopping_patience: int = 10
    ) -> Dict:
        """
        Train LSTM model

        Args:
            data: Training data with technical indicators
            feature_cols: List of feature columns
            validation_split: Validation data ratio
            epochs: Maximum training epochs
            batch_size: Training batch size
            early_stopping_patience: Patience for early stopping

        Returns:
            Training history dictionary
        """
        self.feature_names = feature_cols

        # Prepare sequences
        X, y = self.prepare_sequences(data, feature_cols)

        # Normalize features
        from sklearn.preprocessing import StandardScaler
        self.scaler = StandardScaler()

        # Reshape for scaling (samples * sequence, features)
        X_reshaped = X.reshape(-1, X.shape[-1])
        X_scaled = self.scaler.fit_transform(X_reshaped)
        X = X_scaled.reshape(X.shape)

        # Build model
        if self.model is None:
            self.build_model()

        # Callbacks
        early_stop = callbacks.EarlyStopping(
            monitor='val_loss',
            patience=early_stopping_patience,
            restore_best_weights=True
        )

        checkpoint = callbacks.ModelCheckpoint(
            'lstm_best_model.h5',
            monitor='val_loss',
            save_best_only=True
        )

        # Train model
        self.history = self.model.fit(
            X, y,
            validation_split=validation_split,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stop, checkpoint],
            verbose=1
        )

        return self.history.history

    def predict(
        self,
        recent_data: pd.DataFrame,
        feature_cols: List[str]
    ) -> Dict[str, float]:
        """
        Make prediction for next period

        Args:
            recent_data: Recent data (sequence_length days)
            feature_cols: Feature column names

        Returns:
            Dictionary with predictions for each horizon
        """
        if self.model is None or self.scaler is None:
            raise ValueError("Model not trained. Call train() first.")

        # Prepare last sequence
        sequence = recent_data[feature_cols].iloc[-self.sequence_length:].values

        # Normalize
        sequence_scaled = self.scaler.transform(sequence)

        # Reshape for prediction (1, sequence_length, features)
        X = sequence_scaled.reshape(1, self.sequence_length, self.n_features)

        # Predict
        predictions = self.model.predict(X)[0]

        # Format results
        result = {
            f'prediction_{h}d': pred
            for h, pred in zip(self.prediction_horizons, predictions)
        }

        # Add confidence metrics
        result['confidence'] = self._calculate_confidence(predictions)
        result['prediction_date'] = datetime.now().isoformat()

        return result

    def _calculate_confidence(self, predictions: np.ndarray) -> float:
        """
        Calculate prediction confidence based on prediction strength

        Args:
            predictions: Array of predictions

        Returns:
            Confidence score (0-100)
        """
        # Average prediction magnitude
        avg_magnitude = np.mean(np.abs(predictions))

        # Consistency across horizons (low std = high confidence)
        consistency = 1.0 / (1.0 + np.std(predictions))

        # Combined confidence
        confidence = (avg_magnitude * consistency) * 100
        return np.clip(confidence, 0, 100)

    def save_model(self, filepath: str = 'lstm_model.h5'):
        """Save trained model"""
        if self.model is None:
            raise ValueError("No model to save")

        self.model.save(filepath)

        # Save metadata
        metadata = {
            'sequence_length': self.sequence_length,
            'n_features': self.n_features,
            'lstm_units': self.lstm_units,
            'dropout_rate': self.dropout_rate,
            'learning_rate': self.learning_rate,
            'prediction_horizons': self.prediction_horizons,
            'feature_names': self.feature_names,
            'trained_at': datetime.now().isoformat()
        }

        joblib.dump(metadata, filepath.replace('.h5', '_metadata.pkl'))

    def load_model(self, filepath: str = 'lstm_model.h5'):
        """Load trained model"""
        from tensorflow.keras.models import load_model

        self.model = load_model(filepath)

        # Load metadata
        metadata = joblib.load(filepath.replace('.h5', '_metadata.pkl'))

        self.sequence_length = metadata['sequence_length']
        self.n_features = metadata['n_features']
        self.lstm_units = metadata['lstm_units']
        self.dropout_rate = metadata['dropout_rate']
        self.learning_rate = metadata['learning_rate']
        self.prediction_horizons = metadata['prediction_horizons']
        self.feature_names = metadata['feature_names']

        return self

    def evaluate(
        self,
        test_data: pd.DataFrame,
        feature_cols: List[str]
    ) -> Dict[str, float]:
        """
        Evaluate model on test data

        Returns:
            Evaluation metrics
        """
        # Prepare test sequences
        X, y_true = self.prepare_sequences(test_data, feature_cols)

        # Normalize
        X_reshaped = X.reshape(-1, X.shape[-1])
        X_scaled = self.scaler.transform(X_reshaped)
        X = X_scaled.reshape(X.shape)

        # Predict
        y_pred = self.model.predict(X)

        # Calculate metrics
        mse = np.mean(np.square(y_true - y_pred))
        mae = np.mean(np.abs(y_true - y_pred))

        # Directional accuracy
        direction_true = np.sign(y_true)
        direction_pred = np.sign(y_pred)
        directional_acc = np.mean(direction_true == direction_pred)

        return {
            'mse': float(mse),
            'mae': float(mae),
            'rmse': float(np.sqrt(mse)),
            'directional_accuracy': float(directional_acc),
            'evaluation_date': datetime.now().isoformat()
        }


class AttentionLSTMPredictor(LSTMPredictor):
    """
    Enhanced LSTM with Attention Mechanism
    Focuses on important time steps in the sequence
    """

    def build_model(self) -> keras.Model:
        """
        Build LSTM model with attention mechanism
        """
        # Input layer
        inputs = layers.Input(shape=(self.sequence_length, self.n_features))

        # LSTM layers (return sequences for attention)
        lstm1 = layers.LSTM(
            self.lstm_units[0],
            return_sequences=True,
            activation='tanh'
        )(inputs)
        lstm1 = layers.Dropout(self.dropout_rate)(lstm1)

        lstm2 = layers.LSTM(
            self.lstm_units[1],
            return_sequences=True,
            activation='tanh'
        )(lstm1)
        lstm2 = layers.Dropout(self.dropout_rate)(lstm2)

        # Attention mechanism
        attention = layers.Dense(1, activation='tanh')(lstm2)
        attention = layers.Flatten()(attention)
        attention = layers.Activation('softmax')(attention)
        attention = layers.RepeatVector(self.lstm_units[1])(attention)
        attention = layers.Permute([2, 1])(attention)

        # Apply attention to LSTM output
        sent_representation = layers.Multiply()([lstm2, attention])
        sent_representation = layers.Lambda(
            lambda x: tf.reduce_sum(x, axis=1)
        )(sent_representation)

        # Dense layers
        dense1 = layers.Dense(64, activation='relu')(sent_representation)
        dense1 = layers.Dropout(self.dropout_rate)(dense1)

        dense2 = layers.Dense(32, activation='relu')(dense1)

        # Output
        outputs = layers.Dense(len(self.prediction_horizons))(dense2)

        # Create model
        model = models.Model(inputs=inputs, outputs=outputs)

        # Compile
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate),
            loss='mse',
            metrics=['mae', 'mape']
        )

        self.model = model
        return model


def train_lstm_model(
    symbols: List[str],
    start_date: str,
    end_date: str,
    sequence_length: int = 60,
    prediction_horizons: List[int] = [1, 5, 10, 20],
    save_path: str = 'lstm_model.h5'
) -> LSTMPredictor:
    """
    Convenience function to train LSTM model on multiple symbols

    Args:
        symbols: List of symbol codes
        start_date: Training start date
        end_date: Training end date
        sequence_length: Input sequence length
        prediction_horizons: Days to predict
        save_path: Model save path

    Returns:
        Trained LSTM predictor
    """
    from apps.ml.services.feature_engineering import FeatureEngineer
    from apps.market.models import Symbol, OHLCV

    # Collect data
    engineer = FeatureEngineer()
    all_data = []

    for symbol in symbols:
        # Get OHLCV data
        ohlcv = OHLCV.objects.filter(
            symbol__symbol_code=symbol,
            date__range=[start_date, end_date]
        ).order_by('date')

        if ohlcv.count() < sequence_length + max(prediction_horizons):
            continue

        # Convert to DataFrame
        df = pd.DataFrame(list(ohlcv.values(
            'date', 'open', 'high', 'low', 'close', 'volume'
        )))

        # Create features
        features_df = engineer.create_features(df)
        all_data.append(features_df)

    # Combine all data
    combined_data = pd.concat(all_data, ignore_index=True)

    # Get feature columns
    feature_cols = [
        col for col in combined_data.columns
        if col.startswith(('rsi_', 'macd_', 'ema_', 'sma_', 'bb_'))
    ]

    # Train model
    predictor = LSTMPredictor(
        sequence_length=sequence_length,
        n_features=len(feature_cols),
        prediction_horizons=prediction_horizons
    )

    predictor.train(
        data=combined_data,
        feature_cols=feature_cols,
        epochs=100,
        batch_size=32
    )

    # Save model
    predictor.save_model(save_path)

    return predictor
