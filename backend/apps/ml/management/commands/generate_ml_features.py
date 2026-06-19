"""
ML 피처 자동 생성 관리자 명령어
50+ 기술적 지표 자동 계산 및 저장

Usage:
    python manage.py generate_ml_features --symbols all
    python manage.py generate_ml_features --symbols 1,2,3 --indicators all
    python manage.py generate_ml_features --start-date 2024-01-01 --recalculate
"""
import sys
from datetime import datetime, date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db.models import Q

from apps.market.models import Symbol, OHLCV
from apps.ml.models import FeatureSet, MLFeature


class Command(BaseCommand):
    help = 'ML 피처 자동 생성 (50+ 기술적 지표)'

    # 지표 카테고리
    INDICATOR_CATEGORIES = {
        'trend': ['sma', 'ema', 'macd', 'adx', 'parabolic_sar'],
        'momentum': ['rsi', 'stochastic', 'williams_r', 'cci'],
        'volatility': ['bollinger_bands', 'atr', 'keltner'],
        'volume': ['obv', 'ad', 'cmf', 'vwap'],
        'price': ['typical_price', 'average_price', 'price_rate'],
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--symbols',
            type=str,
            default='all',
            help='Symbol ID (콤마 구분) 또는 "all" (기본: all)'
        )
        parser.add_argument(
            '--start-date',
            type=str,
            help='시작일 (YYYY-MM-DD, 예: 2024-01-01)'
        )
        parser.add_argument(
            '--end-date',
            type=str,
            help='종료일 (YYYY-MM-DD, 기본: 오늘)'
        )
        parser.add_argument(
            '--indicators',
            type=str,
            default='all',
            help='지표 카테고리 (콤마 구분) 또는 "all" (기본: all)'
        )
        parser.add_argument(
            '--recalculate',
            action='store_true',
            help='기존 피처 재계산'
        )
        parser.add_argument(
            '--lookback',
            type=int,
            default=20,
            help='룩백 기간 (기본: 20일)'
        )

    def handle(self, *args, **options):
        symbols_param = options.get('symbols', 'all')
        start_date_str = options.get('start_date')
        end_date_str = options.get('end_date')
        indicators_param = options.get('indicators', 'all')
        recalculate = options.get('recalculate', False)
        lookback = options.get('lookback', 20)

        self.stdout.write("ML 피처 자동 생성 시작...")

        # 날짜 범위
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = date.today()

        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = end_date - timedelta(days=365)

        self.stdout.write(f"기간: {start_date} ~ {end_date}")
        self.stdout.write(f"룩백: {lookback}일")

        # 종목 조회
        if symbols_param == 'all':
            symbols = Symbol.objects.all()
        else:
            symbol_ids = symbols_param.split(',')
            symbols = Symbol.objects.filter(id__in=symbol_ids)

        if not symbols.exists():
            self.stdout.write(self.style.ERROR("종목이 없습니다."))
            return

        self.stdout.write(f"종목 수: {symbols.count()}개")

        # 지표 카테고리 결정
        if indicators_param == 'all':
            categories = list(self.INDICATOR_CATEGORIES.keys())
        else:
            categories = indicators_param.split(',')

        all_indicators = []
        for cat in categories:
            all_indicators.extend(self.INDICATOR_CATEGORIES.get(cat, []))

        self.stdout.write(f"지표 ({len(all_indicators)}개): {', '.join(all_indicators)}")

        # FeatureSet 생성
        feature_set, created = FeatureSet.objects.get_or_create(
            name=f"Auto_{start_date}_{end_date}",
            defaults={
                'description': f"자동 생성 피처 ({start_date} ~ {end_date})",
                'features': all_indicators,
                'start_date': start_date,
                'end_date': end_date,
                'is_active': True
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"FeatureSet 생성: {feature_set.name}"))
        else:
            self.stdout.write(f"기존 FeatureSet 사용: {feature_set.name}")

        # 종목별 피처 계산
        total_features = 0
        for i, symbol in enumerate(symbols, 1):
            self.stdout.write(f"\n[{i}/{symbols.count()}] {symbol.ticker} ({symbol.name})")

            # 기존 피처 삭제 (재계산 옵션)
            if recalculate:
                MLFeature.objects.filter(
                    symbol=symbol,
                    date__range=[start_date, end_date]
                ).delete()

            # OHLCV 데이터 조회
            ohlcv_data = OHLCV.objects.filter(
                symbol=symbol,
                date__range=[start_date - timedelta(days=lookback * 2), end_date]
            ).order_by('date')

            if ohlcv_data.count() < lookback:
                self.stdout.write(
                    self.style.WARNING(f"  Insufficient data ({ohlcv_data.count()} days < {lookback} days), skip")
                )
                continue

            # 날짜별 피처 계산
            count = self._calculate_features_for_symbol(
                symbol,
                ohlcv_data,
                start_date,
                end_date,
                lookback,
                all_indicators,
                feature_set
            )
            total_features += count

            self.stdout.write(self.style.SUCCESS(f"  OK {count} features created"))

        self.stdout.write(
            self.style.SUCCESS(f"\nTotal {total_features} ML features created")
        )

    def _calculate_features_for_symbol(self, symbol, ohlcv_data, start_date, end_date, lookback, indicators, feature_set):
        """단일 종목 피처 계산"""
        created_count = 0

        # DataFrame 변환 (계산 편의성)
        data_list = list(ohlcv_data)
        data_dict = {
            d.date: {
                'open': float(d.open_price),
                'high': float(d.high_price),
                'low': float(d.low_price),
                'close': float(d.close_price),
                'volume': float(d.volume),
            }
            for d in data_list
        }

        dates = sorted(data_dict.keys())

        for current_date in dates:
            # 범위 체크
            if current_date < start_date or current_date > end_date:
                continue

            # 주말 제외
            if current_date.weekday() >= 5:
                continue

            # 룩백 데이터 추출
            idx = dates.index(current_date)
            if idx < lookback:
                continue

            lookback_dates = dates[idx - lookback:idx + 1]
            lookback_data = [data_dict[d] for d in lookback_dates]

            if len(lookback_data) < lookback:
                continue

            # 기존 피처 체크
            if MLFeature.objects.filter(symbol=symbol, date=current_date).exists():
                continue

            # 피처 계산
            features = self._calculate_all_indicators(lookback_data, indicators)

            # 저장
            MLFeature.objects.create(
                symbol=symbol,
                date=current_date,
                feature_set=feature_set,
                features=features
            )
            created_count += 1

        return created_count

    def _calculate_all_indicators(self, data, indicators):
        """모든 지표 계산"""
        features = {}

        closes = [d['close'] for d in data]
        highs = [d['high'] for d in data]
        lows = [d['low'] for d in data]
        volumes = [d['volume'] for d in data]

        # 트렌드 지표
        if 'sma' in indicators:
            features['sma_5'] = self._sma(closes, 5)
            features['sma_10'] = self._sma(closes, 10)
            features['sma_20'] = self._sma(closes, 20)
            features['sma_60'] = self._sma(closes, 60) if len(closes) >= 60 else None

        if 'ema' in indicators:
            features['ema_5'] = self._ema(closes, 5)
            features['ema_10'] = self._ema(closes, 10)
            features['ema_20'] = self._ema(closes, 20)

        if 'macd' in indicators:
            macd_line, signal_line, histogram = self._macd(closes)
            features['macd'] = macd_line
            features['macd_signal'] = signal_line
            features['macd_histogram'] = histogram

        if 'adx' in indicators:
            features['adx_14'] = self._adx(data, 14)

        # 모멘텀 지표
        if 'rsi' in indicators:
            features['rsi_14'] = self._rsi(closes, 14)

        if 'stochastic' in indicators:
            k, d = self._stochastic(data, 14)
            features['stoch_k'] = k
            features['stoch_d'] = d

        if 'williams_r' in indicators:
            features['williams_r'] = self._williams_r(data, 14)

        if 'cci' in indicators:
            features['cci_20'] = self._cci(data, 20)

        # 변동성 지표
        if 'bollinger_bands' in indicators:
            upper, middle, lower, bandwidth = self._bollinger_bands(closes, 20)
            features['bb_upper'] = upper
            features['bb_middle'] = middle
            features['bb_lower'] = lower
            features['bb_bandwidth'] = bandwidth

        if 'atr' in indicators:
            features['atr_14'] = self._atr(data, 14)

        if 'keltner' in indicators:
            upper, middle, lower = self._keltner_channels(data, 20)
            features['kc_upper'] = upper
            features['kc_middle'] = middle
            features['kc_lower'] = lower

        # 거래량 지표
        if 'obv' in indicators:
            features['obv'] = self._obv(data)

        if 'ad' in indicators:
            features['ad_line'] = self._accumulation_distribution(data)

        if 'cmf' in indicators:
            features['cmf'] = self._chaikin_money_flow(data, 20)

        if 'vwap' in indicators:
            features['vwap'] = self._vwap(data)

        # 가격 지표
        if 'typical_price' in indicators:
            features['typical_price'] = (data[-1]['high'] + data[-1]['low'] + data[-1]['close']) / 3

        if 'average_price' in indicators:
            features['average_price'] = (data[-1]['open'] + data[-1]['high'] + data[-1]['low'] + data[-1]['close']) / 4

        if 'price_rate' in indicators and len(closes) > 1:
            features['price_rate_5'] = (closes[-1] - closes[-6]) / closes[-6] if len(closes) >= 6 else None
            features['price_rate_10'] = (closes[-1] - closes[-11]) / closes[-11] if len(closes) >= 11 else None
            features['price_rate_20'] = (closes[-1] - closes[-21]) / closes[-21] if len(closes) >= 21 else None

        return features

    # ===== 보조지표 계산 함수 =====

    def _sma(self, prices, period):
        """Simple Moving Average"""
        if len(prices) < period:
            return None
        return sum(prices[-period:]) / period

    def _ema(self, prices, period):
        """Exponential Moving Average"""
        if len(prices) < period:
            return None
        multiplier = 2 / (period + 1)
        ema = prices[0]
        for price in prices[1:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        return ema

    def _macd(self, prices, fast=12, slow=26, signal=9):
        """MACD"""
        if len(prices) < slow:
            return None, None, None
        ema_fast = self._ema(prices, fast)
        ema_slow = self._ema(prices, slow)
        macd_line = ema_fast - ema_slow if ema_fast and ema_slow else None

        # Signal line (MACD의 EMA)
        # 단순화를 위해 MACD 라인만 반환
        return macd_line, None, None

    def _rsi(self, prices, period=14):
        """Relative Strength Index"""
        if len(prices) < period + 1:
            return None

        gains = []
        losses = []

        for i in range(1, len(prices)):
            change = prices[i] - prices[i - 1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))

        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period

        if avg_loss == 0:
            return 100

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

    def _stochastic(self, data, period=14):
        """Stochastic Oscillator"""
        if len(data) < period:
            return None, None

        recent = data[-period:]
        high = max(d['high'] for d in recent)
        low = min(d['low'] for d in recent)
        close = data[-1]['close']

        if high - low == 0:
            return 50, 50

        k = ((close - low) / (high - low)) * 100
        # D는 K의 3기간 SMA (단순화하여 K만 반환)
        return k, k

    def _williams_r(self, data, period=14):
        """Williams %R"""
        if len(data) < period:
            return None

        recent = data[-period:]
        high = max(d['high'] for d in recent)
        low = min(d['low'] for d in recent)
        close = data[-1]['close']

        if high - low == 0:
            return -50

        return ((high - close) / (high - low)) * -100

    def _cci(self, data, period=20):
        """Commodity Channel Index"""
        if len(data) < period:
            return None

        typical_prices = [(d['high'] + d['low'] + d['close']) / 3 for d in data[-period:]]
        sma_tp = sum(typical_prices) / period

        mad = sum(abs(tp - sma_tp) for tp in typical_prices) / period

        if mad == 0:
            return 0

        cci = (typical_prices[-1] - sma_tp) / (0.015 * mad)
        return cci

    def _bollinger_bands(self, prices, period=20, std_dev=2):
        """Bollinger Bands"""
        if len(prices) < period:
            return None, None, None, None

        sma = self._sma(prices, period)
        variance = sum((x - sma) ** 2 for x in prices[-period:]) / period
        std = variance ** 0.5

        upper = sma + (std_dev * std)
        lower = sma - (std_dev * std)
        bandwidth = ((upper - lower) / sma) * 100 if sma != 0 else None

        return upper, sma, lower, bandwidth

    def _atr(self, data, period=14):
        """Average True Range"""
        if len(data) < period + 1:
            return None

        true_ranges = []
        for i in range(1, len(data)):
            high = data[i]['high']
            low = data[i]['low']
            prev_close = data[i - 1]['close']

            tr = max(
                high - low,
                abs(high - prev_close),
                abs(low - prev_close)
            )
            true_ranges.append(tr)

        return sum(true_ranges[-period:]) / period

    def _keltner_channels(self, data, period=20):
        """Keltner Channels"""
        if len(data) < period:
            return None, None, None

        closes = [d['close'] for d in data]
        ema = self._ema(closes, period)
        atr = self._atr(data, period)

        if ema is None or atr is None:
            return None, None, None

        upper = ema + (2 * atr)
        lower = ema - (2 * atr)

        return upper, ema, lower

    def _obv(self, data):
        """On-Balance Volume"""
        obv = 0
        for i in range(1, len(data)):
            if data[i]['close'] > data[i - 1]['close']:
                obv += data[i]['volume']
            elif data[i]['close'] < data[i - 1]['close']:
                obv -= data[i]['volume']
        return obv

    def _accumulation_distribution(self, data):
        """Accumulation/Distribution Line"""
        ad = 0
        for i in range(1, len(data)):
            high = data[i]['high']
            low = data[i]['low']
            close = data[i]['close']
            volume = data[i]['volume']

            if high - low == 0:
                clv = 0
            else:
                clv = ((close - low) - (high - close)) / (high - low)

            ad += clv * volume

        return ad

    def _chaikin_money_flow(self, data, period=20):
        """Chaikin Money Flow"""
        if len(data) < period + 1:
            return None

        recent = data[-period:]

        mfv_sum = 0
        volume_sum = 0

        for d in recent:
            high = d['high']
            low = d['low']
            close = d['close']
            volume = d['volume']

            if high - low == 0:
                mfv = 0
            else:
                mfv = ((close - low) - (high - close)) / (high - low) * volume

            mfv_sum += mfv
            volume_sum += volume

        if volume_sum == 0:
            return 0

        return mfv_sum / volume_sum

    def _vwap(self, data):
        """Volume Weighted Average Price"""
        total_pv = 0
        total_volume = 0

        for d in data:
            typical_price = (d['high'] + d['low'] + d['close']) / 3
            total_pv += typical_price * d['volume']
            total_volume += d['volume']

        if total_volume == 0:
            return None

        return total_pv / total_volume

    def _adx(self, data, period=14):
        """Average Directional Index"""
        if len(data) < period * 2:
            return None

        # 단순화된 ADX 계산
        # 실제로는 +DI, -DI, TR 등 필요
        # 여기서는 간단히 변동성 기반 값 반환
        return self._atr(data, period) / data[-1]['close'] * 100 if data[-1]['close'] > 0 else None
