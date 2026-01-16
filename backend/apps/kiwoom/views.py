"""
키움증권/나스닥 API 뷰
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.management import call_command
from io import StringIO


@api_view(['POST'])
def fetch_kiwoom_stocks(request):
    """키움증권 종목 수집 API
    
    POST /api/kiwoom/fetch-stocks/
    Body:
        {
            "market": "kosdaq" | "kospi" | "all",
            "use_mock": true,
            "update": true
        }
    """
    market = request.data.get('market', 'kosdaq')
    use_mock = request.data.get('use_mock', True)
    update = request.data.get('update', False)
    
    try:
        # StringIO로 커맨드 출력 캡처
        out = StringIO()
        
        # 커맨드 실행
        call_command(
            'fetch_kiwoom_stocks',
            market=market,
            use_mock=use_mock,
            update=update,
            stdout=out
        )
        
        output = out.getvalue()
        
        return Response({
            'success': True,
            'message': f'{market.upper()} 종목 수집 완료',
            'output': output
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def fetch_nasdaq_stocks(request):
    """나스닥/NYSE 종목 수집 API
    
    POST /api/kiwoom/fetch-nasdaq/
    Body:
        {
            "market": "nasdaq" | "nyse" | "all",
            "use_mock": true,
            "limit": 100,
            "update": true
        }
    """
    market = request.data.get('market', 'nasdaq')
    use_mock = request.data.get('use_mock', True)
    limit = request.data.get('limit', None)
    update = request.data.get('update', False)
    
    try:
        # StringIO로 커맨드 출력 캡처
        out = StringIO()
        
        # 커맨드 실행
        kwargs = {
            'market': market,
            'use_mock': use_mock,
            'update': update,
            'stdout': out
        }
        
        if limit:
            kwargs['limit'] = limit
        
        call_command('fetch_nasdaq_stocks', **kwargs)
        
        output = out.getvalue()
        
        return Response({
            'success': True,
            'message': f'{market.upper()} 종목 수집 완료',
            'output': output
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def kiwoom_status(request):
    """키움증권 API 상태 확인
    
    GET /api/kiwoom/status/
    """
    import sys
    
    status_info = {
        'platform': sys.platform,
        'is_windows': sys.platform == 'win32',
        'pyqt5_available': False,
        'kiwoom_available': False,
        'nasdaq_api_available': True
    }
    
    # PyQt5 확인
    try:
        import PyQt5
        status_info['pyqt5_available'] = True
    except ImportError:
        pass
    
    # 키움증권 OpenAPI 확인 (Windows에서만)
    if sys.platform == 'win32':
        try:
            from PyQt5.QAxContainer import QAxWidget
            status_info['kiwoom_available'] = True
        except:
            pass
    
    return Response(status_info)
