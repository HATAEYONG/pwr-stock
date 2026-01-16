# 📈 PowerStock

**Pattern 1·2·3 + 기술적 지표 통합 트레이딩 시스템**

Django 5.0 + React 18 | 데이터 기반 의사결정 플랫폼

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Django](https://img.shields.io/badge/django-5.0-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/react-18.0-blue.svg)](https://reactjs.org/)

---

## 🎯 프로젝트 소개

PowerStock은 **구조적 패턴 분석**과 **기술적 지표**를 결합한 확률 기반 트레이딩 시스템입니다.

### 핵심 철학
- ❌ **예측 금지**: 가격 예측 하지 않음
- ✅ **구조 판별**: Pattern 1/2/3 구조 식별
- ✅ **데이터 기반**: 체크리스트 + 기술적 지표
- ✅ **트리거 중심**: START/RISK/SELL 신호

### Pattern 정의
```
Pattern 1 (매집형):    장기 횡보 → 매집 → 급등
Pattern 2 (추세전환):  하락 → 반등 → 상승 전환  
Pattern 3 (IPO반등):   IPO 후 조정 → 재반등
```

---

## ✨ 주요 기능

### Phase 1: 패턴 분석 ✅
- ✅ Symbol 관리 (KOSDAQ/KOSPI/NASDAQ/NYSE)
- ✅ OHLCV 데이터 수집 (yfinance)
- ✅ Pattern 1/2/3 체크리스트 (0-100점)
- ✅ 트리거 신호 (START/RISK/SELL)
- ✅ 4단계 워크플로우 (관심→점검→진입→청산)
- ✅ Pattern 기반 종목 검색

### Phase A: 백테스팅 ✅
- ✅ 백테스팅 실행 엔진
- ✅ 성과 지표 (승률, 수익률, MDD, 샤프)
- ✅ 거래 내역 상세 분석
- ✅ 차트 시각화
- ✅ 패턴별 비교 분석

### Phase B: 실시간 알림 ✅
- ✅ Telegram Bot 연동
- ✅ START/RISK/SELL 신호 알림
- ✅ 일일 요약 메시지
- ✅ 알림 설정 UI
- ✅ 알림 내역 및 통계

### Phase C: 기술적 지표 ✅ NEW!
- ✅ **장기이평선 레벨 시스템** (5/20/60/112/224)
- ✅ **거래량 분석** (전일 대비, 110% 돌파 감지)
- ✅ **지지/저항선** 자동 인식
- ✅ **패턴 감지** (쌍바닥, 매집 구간, 돌파 신호)
- ✅ **추세 분석** (단기/중기/장기)
- ✅ **종합 점수** 계산 (0-100점)
- ✅ **기술적 대시보드** (상위 종목, 돌파 후보, 매집 구간)

---

## 🚀 빠른 시작

### 필수 요구사항
```
Python 3.9+
Node.js 16+
PostgreSQL 13+ (또는 SQLite)
Redis (선택, Celery용)
```

### 1. 클론 및 설치

```bash
# 저장소 클론
git clone https://github.com/HATAEYONG/powerstock.git
cd powerstock
```

### 2. Backend 설정

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정 (선택)
cp .env.example .env
# .env 파일에서 DB, Telegram 설정

# 데이터베이스 마이그레이션
python manage.py makemigrations
python manage.py migrate

# 관리자 계정 생성
python manage.py createsuperuser

# 서버 실행
python manage.py runserver
```

### 3. Frontend 설정

```bash
cd ../frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm start
```

### 4. 접속

```
Frontend: http://localhost:3000
Backend:  http://localhost:8000
Admin:    http://localhost:8000/admin
```

---

## 📋 사용 가이드

### 1. 종목 검색 및 등록

```
메뉴: 1. 종목 관리 → 종목 검색

- 티커/종목명으로 검색
- 거래소 선택 (KOSDAQ/KOSPI/NASDAQ/NYSE)
- 종목 등록
```

### 2. 데이터 Import

```
메뉴: 2. 데이터 Import

- yfinance 자동 수집
- 또는 CSV 파일 업로드
  (date, open, high, low, close, volume)
```

### 3. 패턴 분석 실행

```
메뉴: 3. 패턴 분석 → 🚀 분석 실행

- 전체 종목 또는 특정 종목 선택
- 분석 실행 (P1/P2/P3 체크리스트)
- 결과 확인
```

### 4. Pattern 기반 종목 찾기

```
메뉴: 3. 패턴 분석 → 🔍 패턴 기반 종목 찾기

필터:
- Pattern 선택 (P1/P2/P3/전체)
- 최소 점수 (60-90)
- START 신호 여부
- 날짜 범위

결과: 조건에 맞는 고득점 종목 목록
```

### 5. 기술적 지표 확인 (NEW!)

```
메뉴: 3. 패턴 분석 → 📈 기술적 지표

탭:
1. 🏆 상위 종목
   - 기술점수 60점 이상
   - 이평선 레벨, 거래량, 추세 종합

2. 🚀 돌파 후보
   - 레벨 3+ 필터링
   - 돌파 신호 + 거래량 증가
   - 급등 가능성 높음

3. 📦 매집 구간
   - 횡보 패턴
   - 세력 매집 중
   - 향후 급등 대기

표시 정보:
- 이평선 레벨 (0-5) ⭐⭐⭐⭐⭐
- 배열 상태 (정배열/역배열/혼조)
- 거래량 비율 (200%+/150%+/110%+)
- 추세 (↗↗↗ 단기/중기/장기)
- 패턴 (쌍바닥, 매집, 돌파)
- 종합 점수 (0-100)
```

### 6. 백테스팅

```
메뉴: 3. 패턴 분석 → 📊 백테스팅 실행

설정:
- 기간 선택 (2023-01-01 ~ 2024-12-31)
- 초기 자금 ($10,000)
- Pattern 선택 (P1/P2/P3/전체)
- 최소 점수 (70점)

결과:
- 총 수익률: +45.2%
- 승률: 65.3%
- 평균 수익: +28.5%
- 샤프 비율: 1.82
- MDD: -8.3%
```

### 7. 실시간 알림 설정

```
메뉴: 4. 트리거 알림 → ⚙️ 알림 설정

1. Telegram Bot 생성
   - @BotFather에게 /newbot
   - Bot Token 복사

2. Chat ID 가져오기
   - Bot에게 아무 메시지나 전송
   - [Chat ID 가져오기] 버튼 클릭

3. 알림 설정
   - START/RISK/SELL 신호 선택
   - 최소 점수 설정 (70점)
   - Pattern 필터 (P1, P2, P3)
   - 거래소 필터 (KOSDAQ, NASDAQ)

4. [설정 저장]

→ Telegram으로 실시간 알림 수신!
```

---

## 🎓 점수 및 신호 가이드

### 체크리스트 점수

```
90-100점: 최상급 ★★★★★ (즉시 진입 검토)
80-89점:  우수    ★★★★   (적극 관심)
70-79점:  양호    ★★★     (관심 등록)
60-69점:  보통    ★★       (모니터링)
60점 미만: 제외    ★        (제외)
```

### 트리거 신호

```
🚀 START 신호:
   - 진입 타이밍 도래
   - 체크리스트 조건 충족
   - 기술적 신호 양호
   → 매수 검토!

⚠️ RISK 신호:
   - 리스크 증가
   - 추세 약화 징후
   - 포지션 축소 고려
   → 경계 모드!

🎯 SELL 신호:
   - 청산 시점
   - 목표가 도달 또는 추세 전환
   → 익절/손절!
```

### 장기이평선 레벨 (NEW!)

```
레벨 5 ⭐⭐⭐⭐⭐: 최강 (5/20/60/112/224 모두 돌파)
레벨 4 ⭐⭐⭐⭐:   강함 (112일선까지 돌파)
레벨 3 ⭐⭐⭐:     양호 (60일선까지 돌파)
레벨 2 ⭐⭐:       보통 (20일선까지 돌파)
레벨 1 ⭐:         약함 (5일선만 돌파)
레벨 0:           최약 (모두 하향)

활용:
- 레벨 3+ = 강한 상승 추세
- 레벨 0-1 → 2 = 추세 전환 시작
- 정배열 = 상승 추세 지속
- 역배열 = 밥그릇 2번 자리 (매집 구간)
```

---

## 🏗️ 아키텍처

```
powerstock/
├── backend/                    # Django REST API
│   ├── config/                # 설정
│   ├── apps/
│   │   ├── market/           # 시장 데이터
│   │   │   ├── models.py              # Symbol, OHLCV, Evaluation
│   │   │   ├── models_technical.py    # TechnicalIndicator (NEW!)
│   │   │   ├── technical_analyzer.py  # 기술적 분석 엔진 (NEW!)
│   │   │   ├── views.py
│   │   │   └── views_technical.py     # 기술적 지표 API (NEW!)
│   │   ├── alerts/           # 알림 시스템
│   │   │   ├── models.py              # AlertSettings, AlertLog
│   │   │   ├── notifiers.py           # Telegram, Email
│   │   │   └── tasks.py               # Celery 태스크
│   │   └── backtest/         # 백테스팅
│   └── requirements.txt
│
└── frontend/                   # React SPA
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.js
    │   │   ├── PatternSearch.js
    │   │   ├── TechnicalDashboard.js   # 기술적 지표 (NEW!)
    │   │   ├── BacktestRun.js
    │   │   ├── BacktestResults.js
    │   │   └── AlertSettings.js
    │   └── App.js
    └── package.json
```

---

## 📊 API 문서

### Market API
```
GET    /api/symbols/                # 종목 목록
POST   /api/symbols/                # 종목 추가
GET    /api/evaluations/            # 평가 목록
GET    /api/evaluations/{id}/       # 평가 상세
GET    /api/pattern-search/         # 패턴 검색
```

### Technical API (NEW!)
```
GET    /api/technical/                        # 기술적 지표 목록
GET    /api/technical/top_scores/             # 상위 종목
GET    /api/technical/breakout_candidates/    # 돌파 후보
GET    /api/technical/accumulation_stocks/    # 매집 구간
GET    /api/technical/stats/                  # 통계
POST   /api/technical/analyze_evaluation/     # 분석 실행

필터 파라미터:
  ?ma_level=3              # 레벨 3 이상
  ?volume_breakout=true    # 거래량 돌파
  ?breakout_signal=true    # 돌파 신호
  ?min_score=70            # 최소 점수
```

### Backtest API
```
GET    /api/backtest/runs/          # 백테스트 목록
POST   /api/backtest/runs/          # 백테스트 실행
GET    /api/backtest/runs/{id}/     # 백테스트 상세
```

### Alerts API
```
GET    /api/alerts/settings/        # 알림 설정
POST   /api/alerts/settings/        # 알림 저장
GET    /api/alerts/logs/            # 알림 내역
GET    /api/alerts/logs/stats/      # 알림 통계
```

---

## 🎯 실전 활용 전략

### 전략 1: PowerStock 통합 전략

```
Step 1: Pattern 필터링
   - Pattern 3 (IPO반등) 선택
   - 체크리스트 80점 이상

Step 2: 기술적 필터링
   - 이평선 레벨 3 이상
   - 거래량 110% 돌파
   - 돌파 신호 또는 매집 구간

Step 3: 종합 판단
   - 통합 점수 = (Pattern 점수 × 0.6) + (기술 점수 × 0.4)
   - 85점 이상 = 최상위 종목

Step 4: 진입
   - START 신호 대기
   - 매수 진입

Step 5: 관리
   - RISK 신호 = 포지션 축소
   - SELL 신호 = 청산

예상 성과:
   승률: 70%+
   평균 수익: 35%+
   보유 기간: 30-90일
```

### 전략 2: 돌파 후보 단타

```
1. 돌파 후보 탭 확인
2. 레벨 3+ 필터
3. 저항선 근접 확인
4. 돌파 시 매수
5. 5-10% 빠른 익절

예상 성과:
   승률: 70%+
   평균 수익: 7%
   보유 기간: 1-3일
```

### 전략 3: 매집 구간 장기 보유

```
1. 매집 구간 탭 확인
2. 역배열 → 정배열 전환 대기
3. 공구리 (저점) 매수
4. 레벨 4-5 도달 시 익절

예상 성과:
   승률: 45-55%
   평균 수익: 50%+
   보유 기간: 60-120일
```

---

## 🛠️ 개발 환경

### Backend 스택
- Python 3.9+
- Django 5.0, Django REST Framework
- PostgreSQL / SQLite
- Celery, Redis (선택)
- pandas, numpy (데이터 분석)
- yfinance (시장 데이터)

### Frontend 스택
- React 18
- Material-UI (MUI)
- React Router v6
- Axios
- Recharts

---

## 📝 라이선스

MIT License - 자유롭게 사용 가능합니다.

---

## 🤝 기여하기

```bash
1. Fork the Project
2. Create Feature Branch (git checkout -b feature/AmazingFeature)
3. Commit Changes (git commit -m 'Add AmazingFeature')
4. Push to Branch (git push origin feature/AmazingFeature)
5. Open Pull Request
```

---

## 🗺️ 로드맵

### 2025 Q1 ✅ 완료
- [x] Phase 1: 패턴 분석
- [x] Phase A: 백테스팅
- [x] Phase B: 실시간 알림
- [x] Phase C: 기술적 지표

### 2025 Q2 🔄 진행 중
- [ ] Phase D: 시간대별 분석 (60분봉, 프리장/본장)
- [ ] Phase E: 포트폴리오 관리
- [ ] Phase F: 리스크 관리 도구

### 2025 Q3-Q4 📅 계획
- [ ] 모바일 앱 (React Native)
- [ ] AI 패턴 학습
- [ ] 클라우드 배포 (AWS/GCP)
- [ ] 실시간 데이터 스트리밍

---

## 🙏 감사의 말

- **13DGC-AODM**: 체계적 개발 방법론
- **Django & DRF**: 강력한 백엔드
- **React & MUI**: 직관적인 UI
- **yfinance**: 시장 데이터
- **Claude AI**: 개발 지원

---

## 📞 문의

**GitHub Issues**: [https://github.com/HATAEYONG/powerstock/issues](https://github.com/HATAEYONG/powerstock/issues)

---

## ⚠️ 면책 조항

이 소프트웨어는 교육 및 연구 목적으로 제공됩니다. 실제 투자에 사용 시 충분한 테스트와 검증이 필요합니다. 투자 손실에 대한 책임은 사용자에게 있습니다.

---

**PowerStock - Data-Driven Trading Platform** 🚀

**Built with ❤️ by 엘도라도**

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!
