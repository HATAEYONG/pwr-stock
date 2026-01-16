"""
Alert Views
알림 설정 API
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import AlertSettings, AlertLog
from .serializers import (
    AlertSettingsSerializer,
    AlertLogSerializer,
    TelegramTestSerializer
)
from .tasks import test_telegram_connection
from .notifiers import TelegramNotifier


class AlertSettingsViewSet(viewsets.ModelViewSet):
    """알림 설정 ViewSet"""
    
    queryset = AlertSettings.objects.all()
    serializer_class = AlertSettingsSerializer
    
    @action(detail=False, methods=['post'])
    def test_telegram(self, request):
        """
        Telegram 연결 테스트
        
        POST /api/alerts/settings/test_telegram/
        {
            "chat_id": "123456789"
        }
        """
        serializer = TelegramTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        chat_id = serializer.validated_data['chat_id']
        
        try:
            # 직접 전송 (Celery 없이)
            notifier = TelegramNotifier()
            success = notifier.send_test_message(chat_id)
            
            if success:
                return Response({
                    'success': True,
                    'message': 'Telegram 테스트 메시지를 전송했습니다.',
                    'chat_id': chat_id
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': '메시지 전송에 실패했습니다.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def get_chat_id(self, request):
        """
        Telegram Chat ID 가져오기
        
        GET /api/alerts/settings/get_chat_id/
        """
        try:
            notifier = TelegramNotifier()
            chat_id = notifier.get_chat_id()
            
            if chat_id:
                return Response({
                    'success': True,
                    'chat_id': chat_id,
                    'message': 'Chat ID를 성공적으로 가져왔습니다.'
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Chat ID를 가져올 수 없습니다. Bot에게 메시지를 보낸 후 다시 시도하세요.'
                }, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """알림 활성화"""
        settings = self.get_object()
        settings.is_active = True
        settings.save()
        
        return Response({
            'success': True,
            'message': '알림이 활성화되었습니다.'
        })
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """알림 비활성화"""
        settings = self.get_object()
        settings.is_active = False
        settings.save()
        
        return Response({
            'success': True,
            'message': '알림이 비활성화되었습니다.'
        })


class AlertLogViewSet(viewsets.ReadOnlyModelViewSet):
    """알림 로그 ViewSet (읽기 전용)"""
    
    queryset = AlertLog.objects.select_related(
        'settings',
        'evaluation__symbol'
    ).all()
    serializer_class = AlertLogSerializer
    
    def get_queryset(self):
        """필터링"""
        queryset = super().get_queryset()
        
        settings_id = self.request.query_params.get('settings_id')
        if settings_id:
            queryset = queryset.filter(settings_id=settings_id)
        
        signal_type = self.request.query_params.get('signal_type')
        if signal_type:
            queryset = queryset.filter(signal_type=signal_type)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """최근 알림 (최대 50개)"""
        logs = self.get_queryset()[:50]
        serializer = self.get_serializer(logs, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """알림 통계"""
        from django.db.models import Count
        from datetime import datetime
        
        today = datetime.now().date()
        
        signal_counts = AlertLog.objects.filter(
            sent_at__date=today
        ).values('signal_type').annotate(count=Count('id'))
        
        stats_dict = {item['signal_type']: item['count'] for item in signal_counts}
        
        return Response({
            'today': today.isoformat(),
            'total': sum(stats_dict.values()),
            'start': stats_dict.get('START', 0),
            'risk': stats_dict.get('RISK', 0),
            'sell': stats_dict.get('SELL', 0),
            'summary': stats_dict.get('SUMMARY', 0)
        })
