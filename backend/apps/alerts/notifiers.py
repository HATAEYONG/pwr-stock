"""
Telegram Bot 알림 시스템
실시간 트리거 신호를 Telegram으로 전송
"""
import os
import requests
from typing import List, Dict, Optional
from datetime import datetime


class TelegramNotifier:
    """Telegram Bot 알림 전송"""
    
    def __init__(self, bot_token: Optional[str] = None):
        """
        Args:
            bot_token: Telegram Bot Token (없으면 환경변수에서 가져옴)
        """
        self.bot_token = bot_token or os.getenv('TELEGRAM_BOT_TOKEN')
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}"
        
        if not self.bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.")
    
    def send_message(
        self,
        chat_id: str,
        message: str,
        parse_mode: str = 'HTML'
    ) -> bool:
        """
        메시지 전송
        
        Args:
            chat_id: Telegram Chat ID
            message: 전송할 메시지
            parse_mode: 파싱 모드 (HTML, Markdown)
        
        Returns:
            성공 여부
        """
        try:
            url = f"{self.api_url}/sendMessage"
            payload = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': parse_mode
            }
            
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            
            return True
        
        except Exception as e:
            print(f"Telegram 메시지 전송 실패: {str(e)}")
            return False
    
    def send_start_signal(
        self,
        chat_id: str,
        symbol_ticker: str,
        symbol_name: str,
        pattern_type: str,
        score: int,
        exchange: str,
        current_price: float
    ) -> bool:
        """
        START 신호 알림
        
        Args:
            chat_id: Telegram Chat ID
            symbol_ticker: 종목 티커
            symbol_name: 종목명
            pattern_type: Pattern 타입
            score: 체크리스트 점수
            exchange: 거래소
            current_price: 현재가
        """
        message = f"""
🚀 <b>START 신호 발생!</b>

<b>종목:</b> [{symbol_ticker}] {symbol_name}
<b>거래소:</b> {exchange}
<b>Pattern:</b> {pattern_type}
<b>점수:</b> {score}점

<b>현재가:</b> {current_price:,.0f}원

<i>✅ 진입 검토를 시작하세요!</i>
<i>⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>
"""
        
        return self.send_message(chat_id, message.strip())
    
    def send_risk_signal(
        self,
        chat_id: str,
        symbol_ticker: str,
        symbol_name: str,
        pattern_type: str,
        exchange: str,
        current_price: float,
        entry_price: Optional[float] = None
    ) -> bool:
        """
        RISK 신호 알림
        
        Args:
            chat_id: Telegram Chat ID
            symbol_ticker: 종목 티커
            symbol_name: 종목명
            pattern_type: Pattern 타입
            exchange: 거래소
            current_price: 현재가
            entry_price: 진입가 (있을 경우)
        """
        profit_loss = ""
        if entry_price:
            pct = ((current_price - entry_price) / entry_price) * 100
            profit_loss = f"\n<b>수익률:</b> {pct:+.2f}%"
        
        message = f"""
⚠️ <b>RISK 신호 발생!</b>

<b>종목:</b> [{symbol_ticker}] {symbol_name}
<b>거래소:</b> {exchange}
<b>Pattern:</b> {pattern_type}

<b>현재가:</b> {current_price:,.0f}원{profit_loss}

<i>⚠️ 리스크가 증가했습니다!</i>
<i>💡 포지션 축소 또는 청산을 고려하세요.</i>
<i>⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>
"""
        
        return self.send_message(chat_id, message.strip())
    
    def send_sell_signal(
        self,
        chat_id: str,
        symbol_ticker: str,
        symbol_name: str,
        pattern_type: str,
        exchange: str,
        current_price: float,
        entry_price: Optional[float] = None
    ) -> bool:
        """
        SELL 신호 알림
        
        Args:
            chat_id: Telegram Chat ID
            symbol_ticker: 종목 티커
            symbol_name: 종목명
            pattern_type: Pattern 타입
            exchange: 거래소
            current_price: 현재가
            entry_price: 진입가 (있을 경우)
        """
        profit_loss = ""
        if entry_price:
            pct = ((current_price - entry_price) / entry_price) * 100
            emoji = "📈" if pct > 0 else "📉"
            profit_loss = f"\n<b>수익률:</b> {emoji} {pct:+.2f}%"
        
        message = f"""
🎯 <b>SELL 신호 발생!</b>

<b>종목:</b> [{symbol_ticker}] {symbol_name}
<b>거래소:</b> {exchange}
<b>Pattern:</b> {pattern_type}

<b>현재가:</b> {current_price:,.0f}원{profit_loss}

<i>✅ 청산 시점입니다!</i>
<i>💰 수익을 확정하세요.</i>
<i>⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>
"""
        
        return self.send_message(chat_id, message.strip())
    
    def send_daily_summary(
        self,
        chat_id: str,
        total_signals: int,
        start_signals: int,
        risk_signals: int,
        sell_signals: int,
        top_stocks: List[Dict]
    ) -> bool:
        """
        일일 요약 알림
        
        Args:
            chat_id: Telegram Chat ID
            total_signals: 총 신호 수
            start_signals: START 신호 수
            risk_signals: RISK 신호 수
            sell_signals: SELL 신호 수
            top_stocks: 최상위 종목 리스트
        """
        top_list = "\n".join([
            f"{i+1}. [{stock['ticker']}] {stock['name']} ({stock['score']}점)"
            for i, stock in enumerate(top_stocks[:5])
        ])
        
        message = f"""
📊 <b>일일 시장 요약</b>

<b>오늘의 신호:</b>
• 🚀 START: {start_signals}건
• ⚠️ RISK: {risk_signals}건
• 🎯 SELL: {sell_signals}건
• 📈 총계: {total_signals}건

<b>Top 5 고득점 종목:</b>
{top_list}

<i>⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>
"""
        
        return self.send_message(chat_id, message.strip())
    
    def send_test_message(self, chat_id: str) -> bool:
        """
        테스트 메시지
        
        Args:
            chat_id: Telegram Chat ID
        """
        message = """
✅ <b>PowerStock 알림 테스트</b>

Telegram Bot이 정상적으로 연결되었습니다!

이제 실시간 트리거 알림을 받을 수 있습니다:
• 🚀 START 신호
• ⚠️ RISK 신호
• 🎯 SELL 신호

<i>PowerStock Pattern Trading System</i>
"""
        
        return self.send_message(chat_id, message.strip())
    
    def get_chat_id(self) -> Optional[str]:
        """
        최근 메시지에서 Chat ID 가져오기
        (Bot에게 메시지를 보낸 후 이 메서드를 실행)
        
        Returns:
            Chat ID 또는 None
        """
        try:
            url = f"{self.api_url}/getUpdates"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data['ok'] and data['result']:
                # 가장 최근 메시지의 Chat ID 반환
                latest_message = data['result'][-1]
                chat_id = latest_message['message']['chat']['id']
                return str(chat_id)
            
            return None
        
        except Exception as e:
            print(f"Chat ID 가져오기 실패: {str(e)}")
            return None


class EmailNotifier:
    """Email 알림 (선택적)"""
    
    def __init__(self, smtp_host: str = None, smtp_port: int = 587):
        """
        Args:
            smtp_host: SMTP 서버 (예: smtp.gmail.com)
            smtp_port: SMTP 포트
        """
        self.smtp_host = smtp_host or os.getenv('SMTP_HOST')
        self.smtp_port = smtp_port
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str
    ) -> bool:
        """
        이메일 전송
        
        Args:
            to_email: 수신 이메일
            subject: 제목
            body: 본문
        """
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            return True
        
        except Exception as e:
            print(f"이메일 전송 실패: {str(e)}")
            return False
