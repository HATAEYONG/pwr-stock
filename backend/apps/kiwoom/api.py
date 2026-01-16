"""
키움증권 OpenAPI 연동
Windows 환경에서만 동작합니다.

Requirements:
    pip install pyqt5
    키움증권 OpenAPI+ 설치 필요
"""
import sys
import time
from collections import defaultdict

# Windows에서만 import
try:
    from PyQt5.QtWidgets import QApplication
    from PyQt5.QAxContainer import QAxWidget
    from PyQt5.QtCore import QEventLoop
except ImportError:
    print("PyQt5가 설치되지 않았습니다. Windows 환경에서 pip install pyqt5 실행")


class KiwoomAPI:
    """키움증권 OpenAPI 래퍼 클래스"""
    
    def __init__(self):
        self.app = None
        self.ocx = None
        self.login_event_loop = None
        self.request_event_loop = None
        self.data = defaultdict(list)
        
    def connect(self):
        """OpenAPI 연결 및 로그인"""
        try:
            self.app = QApplication(sys.argv)
            self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
            
            # 이벤트 연결
            self.ocx.OnEventConnect.connect(self._on_event_connect)
            self.ocx.OnReceiveTrData.connect(self._on_receive_tr_data)
            
            # 로그인
            self.login_event_loop = QEventLoop()
            self.ocx.dynamicCall("CommConnect()")
            self.login_event_loop.exec_()
            
            return True
        except Exception as e:
            print(f"키움증권 API 연결 실패: {e}")
            return False
    
    def _on_event_connect(self, err_code):
        """로그인 이벤트"""
        if err_code == 0:
            print("키움증권 로그인 성공")
        else:
            print(f"키움증권 로그인 실패: {err_code}")
        
        if self.login_event_loop:
            self.login_event_loop.exit()
    
    def _on_receive_tr_data(self, screen_no, rqname, trcode, record_name, 
                            prev_next, data_len, err_code, msg, splm_msg):
        """TR 데이터 수신 이벤트"""
        if rqname == "종목코드요청":
            self._process_stock_list(trcode, rqname)
        
        if self.request_event_loop:
            self.request_event_loop.exit()
    
    def get_kosdaq_stocks(self):
        """코스닥 전체 종목 조회"""
        return self._get_code_list_by_market("10")  # 10: 코스닥
    
    def get_kospi_stocks(self):
        """코스피 전체 종목 조회"""
        return self._get_code_list_by_market("0")  # 0: 코스피
    
    def _get_code_list_by_market(self, market_code):
        """시장별 종목 코드 조회
        
        Args:
            market_code: 0(코스피), 10(코스닥), 3(ELW), 8(ETF), ...
        
        Returns:
            list: 종목 코드 리스트
        """
        code_list = self.ocx.dynamicCall("GetCodeListByMarket(QString)", market_code)
        codes = code_list.split(';')[:-1]  # 마지막 빈 값 제거
        return codes
    
    def get_stock_info(self, code):
        """종목 정보 조회
        
        Args:
            code: 종목 코드 (예: A005930)
        
        Returns:
            dict: 종목 정보
        """
        name = self.ocx.dynamicCall("GetMasterCodeName(QString)", code)
        market = self.ocx.dynamicCall("GetMasterConstruction(QString)", code)
        listed_stock_cnt = self.ocx.dynamicCall("GetMasterListedStockCnt(QString)", code)
        
        return {
            'code': code,
            'name': name,
            'market': '코스닥' if market == '10' else '코스피',
            'listed_stock_cnt': int(listed_stock_cnt) if listed_stock_cnt else 0
        }
    
    def get_all_stocks(self, market='kosdaq'):
        """전체 종목 정보 조회
        
        Args:
            market: 'kosdaq' 또는 'kospi'
        
        Returns:
            list: 종목 정보 리스트
        """
        if market.lower() == 'kosdaq':
            codes = self.get_kosdaq_stocks()
        else:
            codes = self.get_kospi_stocks()
        
        stocks = []
        for code in codes:
            try:
                info = self.get_stock_info(code)
                stocks.append(info)
                time.sleep(0.1)  # API 호출 제한 방지
            except Exception as e:
                print(f"종목 정보 조회 실패 ({code}): {e}")
                continue
        
        return stocks
    
    def disconnect(self):
        """연결 해제"""
        if self.app:
            self.app.quit()


class MockKiwoomAPI:
    """키움증권 API Mock (개발/테스트용)"""
    
    def connect(self):
        """Mock 연결"""
        print("Mock 키움증권 API 연결")
        return True
    
    def get_kosdaq_stocks(self):
        """Mock 코스닥 종목 코드"""
        return ['A000660', 'A005930', 'A035420', 'A051910', 'A068270']
    
    def get_kospi_stocks(self):
        """Mock 코스피 종목 코드"""
        return ['A005930', 'A000270', 'A035720', 'A051910']
    
    def get_stock_info(self, code):
        """Mock 종목 정보"""
        mock_data = {
            'A000660': {'code': 'A000660', 'name': 'SK하이닉스', 'market': '코스피', 'listed_stock_cnt': 728002365},
            'A005930': {'code': 'A005930', 'name': '삼성전자', 'market': '코스피', 'listed_stock_cnt': 5969782550},
            'A035420': {'code': 'A035420', 'name': 'NAVER', 'market': '코스피', 'listed_stock_cnt': 164263395},
            'A051910': {'code': 'A051910', 'name': 'LG화학', 'market': '코스피', 'listed_stock_cnt': 70592343},
            'A068270': {'code': 'A068270', 'name': '셀트리온', 'market': '코스닥', 'listed_stock_cnt': 206456891},
        }
        return mock_data.get(code, {'code': code, 'name': '알 수 없음', 'market': '코스닥', 'listed_stock_cnt': 0})
    
    def get_all_stocks(self, market='kosdaq'):
        """Mock 전체 종목"""
        if market.lower() == 'kosdaq':
            codes = self.get_kosdaq_stocks()
        else:
            codes = self.get_kospi_stocks()
        
        return [self.get_stock_info(code) for code in codes]
    
    def disconnect(self):
        """Mock 연결 해제"""
        print("Mock 키움증권 API 연결 해제")


def get_kiwoom_api(use_mock=True):
    """키움증권 API 인스턴스 반환
    
    Args:
        use_mock: Mock 사용 여부 (기본: True)
    
    Returns:
        KiwoomAPI 또는 MockKiwoomAPI
    """
    if use_mock or sys.platform != 'win32':
        return MockKiwoomAPI()
    else:
        return KiwoomAPI()
