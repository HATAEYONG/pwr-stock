"""
import_ohlcv 관리 커맨드
CSV 파일에서 OHLCV 데이터를 import
"""
from django.core.management.base import BaseCommand
from django.db import transaction
import pandas as pd
from decimal import Decimal
from datetime import datetime

from apps.market.models import Symbol, OHLCV


class Command(BaseCommand):
    help = 'CSV 파일에서 OHLCV 데이터 import'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='CSV 파일 경로'
        )
        parser.add_argument(
            '--ticker',
            type=str,
            required=True,
            help='종목 티커 (예: 005930)'
        )
        parser.add_argument(
            '--name',
            type=str,
            default='',
            help='종목명 (예: 삼성전자)'
        )
        parser.add_argument(
            '--exchange',
            type=str,
            default='KRX',
            help='거래소 (기본값: KRX)'
        )
        parser.add_argument(
            '--listing-date',
            type=str,
            default=None,
            help='상장일 (YYYY-MM-DD) - Pattern 3용'
        )
        parser.add_argument(
            '--shares-outstanding',
            type=int,
            default=None,
            help='상장주식수 - Pattern 3용'
        )
    
    def handle(self, *args, **options):
        csv_file = options['csv_file']
        ticker = options['ticker']
        name = options.get('name', ticker)
        exchange = options.get('exchange', 'KRX')
        listing_date_str = options.get('listing_date')
        shares_outstanding = options.get('shares_outstanding')
        
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS(f'OHLCV 데이터 Import: {ticker}'))
        self.stdout.write(self.style.SUCCESS('='*70))
        
        try:
            # CSV 파일 읽기
            df = pd.read_csv(csv_file)
            self.stdout.write(f'CSV 파일 로드 완료: {len(df)}행')
            
            # 컬럼 확인
            required_cols = ['date', 'open', 'high', 'low', 'close', 'volume']
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                self.stdout.write(self.style.ERROR(f'필수 컬럼 누락: {missing_cols}'))
                self.stdout.write(f'CSV 컬럼: {list(df.columns)}')
                return
            
            # 상장일 파싱
            listing_date = None
            if listing_date_str:
                try:
                    listing_date = datetime.strptime(listing_date_str, '%Y-%m-%d').date()
                except:
                    self.stdout.write(self.style.WARNING(f'상장일 파싱 실패: {listing_date_str}'))
            
            # Symbol 생성 또는 가져오기
            defaults_data = {
                'name': name,
                'exchange': exchange,
                'is_active': True
            }
            
            if listing_date:
                defaults_data['listing_date'] = listing_date
            if shares_outstanding:
                defaults_data['shares_outstanding'] = shares_outstanding
            
            symbol, created = Symbol.objects.get_or_create(
                ticker=ticker,
                defaults=defaults_data
            )
            
            # 기존 종목 업데이트
            if not created:
                if listing_date and not symbol.listing_date:
                    symbol.listing_date = listing_date
                    symbol.save()
                if shares_outstanding and not symbol.shares_outstanding:
                    symbol.shares_outstanding = shares_outstanding
                    symbol.save()
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'새 종목 생성: {symbol.ticker} - {symbol.name}'))
            else:
                self.stdout.write(f'기존 종목 사용: {symbol.ticker} - {symbol.name}')
            
            # OHLCV 데이터 import
            imported_count = 0
            skipped_count = 0
            error_count = 0
            
            with transaction.atomic():
                for idx, row in df.iterrows():
                    try:
                        # 날짜 파싱
                        date_str = str(row['date'])
                        try:
                            date_obj = pd.to_datetime(date_str).date()
                        except:
                            # 다양한 날짜 형식 시도
                            for fmt in ['%Y-%m-%d', '%Y%m%d', '%Y/%m/%d']:
                                try:
                                    date_obj = datetime.strptime(date_str, fmt).date()
                                    break
                                except:
                                    continue
                            else:
                                raise ValueError(f'날짜 파싱 실패: {date_str}')
                        
                        # OHLCV 데이터 생성
                        ohlcv, created = OHLCV.objects.update_or_create(
                            symbol=symbol,
                            date=date_obj,
                            defaults={
                                'open_price': Decimal(str(row['open'])),
                                'high_price': Decimal(str(row['high'])),
                                'low_price': Decimal(str(row['low'])),
                                'close_price': Decimal(str(row['close'])),
                                'volume': int(row['volume'])
                            }
                        )
                        
                        if created:
                            imported_count += 1
                        else:
                            skipped_count += 1
                        
                        if (idx + 1) % 100 == 0:
                            self.stdout.write(f'  진행 중... {idx + 1}/{len(df)}행')
                    
                    except Exception as e:
                        error_count += 1
                        if error_count <= 5:  # 처음 5개 에러만 출력
                            self.stdout.write(self.style.ERROR(f'  행 {idx} 에러: {str(e)}'))
            
            # 결과 출력
            self.stdout.write(self.style.SUCCESS('\n' + '='*70))
            self.stdout.write(self.style.SUCCESS('Import 완료'))
            self.stdout.write(self.style.SUCCESS('='*70))
            self.stdout.write(f'새로 import: {imported_count}건')
            self.stdout.write(f'중복 skip: {skipped_count}건')
            if error_count > 0:
                self.stdout.write(self.style.ERROR(f'에러: {error_count}건'))
            self.stdout.write(self.style.SUCCESS('='*70))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Import 실패: {str(e)}'))
            import traceback
            traceback.print_exc()
