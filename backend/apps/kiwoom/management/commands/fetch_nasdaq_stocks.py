"""
나스닥/NYSE 종목 수집

Usage:
    python manage.py fetch_nasdaq_stocks --market nasdaq
    python manage.py fetch_nasdaq_stocks --market nyse
    python manage.py fetch_nasdaq_stocks --market all
"""
from django.core.management.base import BaseCommand
from apps.market.models import Symbol
from apps.kiwoom.nasdaq_api import get_nasdaq_api


class Command(BaseCommand):
    help = '나스닥/NYSE 종목 수집'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--market',
            type=str,
            default='nasdaq',
            choices=['nasdaq', 'nyse', 'all'],
            help='수집할 시장 (nasdaq, nyse, all)'
        )
        parser.add_argument(
            '--use-mock',
            action='store_true',
            help='Mock API 사용 (개발/테스트용)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='최대 수집 종목 수'
        )
        parser.add_argument(
            '--update',
            action='store_true',
            help='기존 종목 업데이트'
        )
    
    def handle(self, *args, **options):
        market = options['market']
        use_mock = options['use_mock']
        limit = options['limit']
        update_existing = options['update']
        
        self.stdout.write(f"{market.upper()} 종목 수집 시작...")
        
        # API 연결
        api = get_nasdaq_api(use_mock=use_mock)
        
        try:
            # 종목 수집
            if market == 'all':
                stocks = []
                nasdaq_stocks = api.get_nasdaq_stocks(limit=limit)
                nyse_stocks = api.get_nyse_stocks(limit=limit)
                
                # Exchange 정보 추가
                for stock in nasdaq_stocks:
                    stock['exchange'] = 'NASDAQ'
                for stock in nyse_stocks:
                    stock['exchange'] = 'NYSE'
                
                stocks.extend(nasdaq_stocks)
                stocks.extend(nyse_stocks)
            elif market == 'nasdaq':
                stocks = api.get_nasdaq_stocks(limit=limit)
                for stock in stocks:
                    stock['exchange'] = 'NASDAQ'
            else:  # nyse
                stocks = api.get_nyse_stocks(limit=limit)
                for stock in stocks:
                    stock['exchange'] = 'NYSE'
            
            # DB 저장
            created_count = 0
            updated_count = 0
            
            for stock in stocks:
                ticker = stock['symbol']
                
                # 종목 조회 또는 생성
                symbol, created = Symbol.objects.get_or_create(
                    ticker=ticker,
                    defaults={
                        'name': stock['name'],
                        'exchange': stock['exchange'],
                        'sector': stock.get('sector', ''),
                        'industry': stock.get('industry', ''),
                        'is_active': True
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"✓ 새 종목: {ticker} - {stock['name']}")
                    )
                elif update_existing:
                    # 기존 종목 업데이트
                    symbol.name = stock['name']
                    symbol.exchange = stock['exchange']
                    symbol.sector = stock.get('sector', '')
                    symbol.industry = stock.get('industry', '')
                    symbol.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f"↻ 업데이트: {ticker} - {stock['name']}")
                    )
            
            # 결과 출력
            self.stdout.write(self.style.SUCCESS(f"\n총 {len(stocks)}개 종목 수집"))
            self.stdout.write(self.style.SUCCESS(f"신규 등록: {created_count}개"))
            if update_existing:
                self.stdout.write(self.style.SUCCESS(f"업데이트: {updated_count}개"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"종목 수집 실패: {e}"))
            import traceback
            traceback.print_exc()
