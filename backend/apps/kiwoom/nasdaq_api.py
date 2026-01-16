"""
나스닥 종목 수집
yfinance 또는 NASDAQ API 사용

Requirements:
    pip install yfinance pandas
"""
import requests
import pandas as pd


class NasdaqAPI:
    """나스닥 종목 수집"""
    
    NASDAQ_SCREENER_URL = "https://api.nasdaq.com/api/screener/stocks"
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json'
        }
    
    def get_nasdaq_stocks(self, limit=None):
        """나스닥 전체 종목 조회
        
        Args:
            limit: 최대 종목 수 (None이면 전체)
        
        Returns:
            list: 종목 정보 리스트
        """
        try:
            params = {
                'tableonly': 'true',
                'limit': limit or 10000,
                'exchange': 'NASDAQ'
            }
            
            response = requests.get(
                self.NASDAQ_SCREENER_URL,
                params=params,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                stocks = data.get('data', {}).get('rows', [])
                return self._process_stocks(stocks)
            else:
                print(f"API 오류: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"나스닥 종목 조회 실패: {e}")
            return []
    
    def get_nyse_stocks(self, limit=None):
        """NYSE 전체 종목 조회"""
        try:
            params = {
                'tableonly': 'true',
                'limit': limit or 10000,
                'exchange': 'NYSE'
            }
            
            response = requests.get(
                self.NASDAQ_SCREENER_URL,
                params=params,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                stocks = data.get('data', {}).get('rows', [])
                return self._process_stocks(stocks)
            else:
                return []
                
        except Exception as e:
            print(f"NYSE 종목 조회 실패: {e}")
            return []
    
    def _process_stocks(self, stocks):
        """종목 데이터 가공"""
        result = []
        
        for stock in stocks:
            try:
                # marketCap을 숫자로 변환
                market_cap_str = stock.get('marketCap', '0')
                if isinstance(market_cap_str, str):
                    # Remove $ and commas, then convert
                    market_cap = float(market_cap_str.replace('$', '').replace(',', ''))
                else:
                    market_cap = float(market_cap_str or 0)
                
                result.append({
                    'symbol': stock.get('symbol', ''),
                    'name': stock.get('name', ''),
                    'sector': stock.get('sector', ''),
                    'industry': stock.get('industry', ''),
                    'market_cap': market_cap,
                    'ipo_year': stock.get('ipoyear', None)
                })
            except Exception as e:
                print(f"종목 처리 실패: {e}")
                continue
        
        return result


class MockNasdaqAPI:
    """나스닥 API Mock (개발/테스트용)"""
    
    def get_nasdaq_stocks(self, limit=None):
        """Mock 나스닥 종목"""
        stocks = [
            {
                'symbol': 'AAPL',
                'name': 'Apple Inc.',
                'sector': 'Technology',
                'industry': 'Consumer Electronics',
                'market_cap': 3000000000000,
                'ipo_year': 1980
            },
            {
                'symbol': 'MSFT',
                'name': 'Microsoft Corporation',
                'sector': 'Technology',
                'industry': 'Software',
                'market_cap': 2800000000000,
                'ipo_year': 1986
            },
            {
                'symbol': 'GOOGL',
                'name': 'Alphabet Inc.',
                'sector': 'Technology',
                'industry': 'Internet',
                'market_cap': 1700000000000,
                'ipo_year': 2004
            },
            {
                'symbol': 'TSLA',
                'name': 'Tesla Inc.',
                'sector': 'Automotive',
                'industry': 'Electric Vehicles',
                'market_cap': 800000000000,
                'ipo_year': 2010
            },
            {
                'symbol': 'NVDA',
                'name': 'NVIDIA Corporation',
                'sector': 'Technology',
                'industry': 'Semiconductors',
                'market_cap': 1500000000000,
                'ipo_year': 1999
            }
        ]
        
        if limit:
            return stocks[:limit]
        return stocks
    
    def get_nyse_stocks(self, limit=None):
        """Mock NYSE 종목"""
        stocks = [
            {
                'symbol': 'BRK.A',
                'name': 'Berkshire Hathaway Inc.',
                'sector': 'Finance',
                'industry': 'Insurance',
                'market_cap': 900000000000,
                'ipo_year': 1980
            },
            {
                'symbol': 'JPM',
                'name': 'JPMorgan Chase & Co.',
                'sector': 'Finance',
                'industry': 'Banking',
                'market_cap': 500000000000,
                'ipo_year': 1980
            }
        ]
        
        if limit:
            return stocks[:limit]
        return stocks


def get_nasdaq_api(use_mock=True):
    """나스닥 API 인스턴스 반환
    
    Args:
        use_mock: Mock 사용 여부
    
    Returns:
        NasdaqAPI 또는 MockNasdaqAPI
    """
    if use_mock:
        return MockNasdaqAPI()
    else:
        return NasdaqAPI()
