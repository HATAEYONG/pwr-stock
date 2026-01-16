"""
키움증권 API로 종목 수집

Usage:
    python manage.py fetch_kiwoom_stocks --market kosdaq
    python manage.py fetch_kiwoom_stocks --market kospi
    python manage.py fetch_kiwoom_stocks --market all
"""
from django.core.management.base import BaseCommand
from apps.market.models import Symbol
from apps.kiwoom.api import get_kiwoom_api


class Command(BaseCommand):
    help = '키움증권 API로 종목 수집'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--market',
            type=str,
            default='kosdaq',
            choices=['kosdaq', 'kospi', 'all'],
            help='수집할 시장 (kosdaq, kospi, all)'
        )
        parser.add_argument(
            '--use-mock',
            action='store_true',
            help='Mock API 사용 (개발/테스트용)'
        )
        parser.add_argument(
            '--update',
            action='store_true',
            help='기존 종목 업데이트'
        )
    
    def handle(self, *args, **options):
        market = options['market']
        use_mock = options['use_mock']
        update_existing = options['update']
        
        self.stdout.write(f"키움증권 API로 {market} 종목 수집 시작...")
        
        # API 연결
        api = get_kiwoom_api(use_mock=use_mock)
        
        if not api.connect():
            self.stdout.write(self.style.ERROR("API 연결 실패"))
            return
        
        try:
            # 종목 수집
            if market == 'all':
                stocks = []
                stocks.extend(api.get_all_stocks('kosdaq'))
                stocks.extend(api.get_all_stocks('kospi'))
            else:
                stocks = api.get_all_stocks(market)
            
            # DB 저장
            created_count = 0
            updated_count = 0
            
            for stock in stocks:
                # 종목 코드에서 'A' 제거 (예: A005930 -> 005930)
                ticker = stock['code'].replace('A', '')
                
                # 거래소 설정
                exchange = 'KOSDAQ' if stock['market'] == '코스닥' else 'KOSPI'
                
                # 종목 조회 또는 생성
                symbol, created = Symbol.objects.get_or_create(
                    ticker=ticker,
                    defaults={
                        'name': stock['name'],
                        'exchange': exchange,
                        'shares_outstanding': stock.get('listed_stock_cnt', 0),
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
                    symbol.exchange = exchange
                    symbol.shares_outstanding = stock.get('listed_stock_cnt', 0)
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
        finally:
            api.disconnect()
