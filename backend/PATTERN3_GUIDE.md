# Pattern 3: 신규상장 저점 반등형 - 사용 가이드

## 🎯 Pattern 3 개요

**1년 이내 신규 상장한 소형주 중에서 바닥을 찍고 반등하는 종목**

### 핵심 특징
1. **신규 IPO**: 상장 후 1년 이내
2. **소형주**: 상장주식수 1,000만주 이하
3. **바닥 형성**: 상장 후 고점 대비 20% 이상 하락
4. **저점 방어**: 최저점 깨지 않고 10일 이상 유지
5. **방향 전환**: 최저점 대비 10% 이상 회복

---

## 📊 투자 로직

### Why IPO?
- 신규 상장 = 과대 평가 후 조정
- 거품 빠진 저점 = 진짜 가치 발견
- 소형주 = 급등 가능성 높음

### Why 저점 방어?
- 최저점 유지 = 세력 매집 신호
- 하락 멈춤 = 악재 소화 완료
- 소형주 특성상 개인 vs 세력 구도

### 목표 수익
- 평균 수익: **+30~50%**
- 손절: 상장 후 최저점 이탈 시

---

## 🔧 설정 (rules.yaml)

```yaml
pattern3:
  # IPO 조건
  ipo:
    max_days_since_listing: 365      # 상장 후 최대 365일
    max_shares_outstanding: 10000000  # 1천만주 이하
  
  # 최저점 형성 및 방어
  bottom_formation:
    min_decline_from_high_pct: 0.20  # 고점 대비 최소 20% 하락
    bottom_hold_days: 10              # 최저점 유지 10일
    max_drawdown_from_bottom: 0.05   # 최저점 대비 5% 하락 허용
  
  # 방향 전환 확인
  trend_reversal:
    min_recovery_pct: 0.10           # 최저점 대비 10% 회복
    ma_cross_required: true          # MA5 > MA10 필요
    volume_increase_ratio: 1.5       # 거래량 1.5배 증가
  
  # 손절/익절
  risk:
    stop_loss:
      type: listing_low_break        # 상장 후 최저점 이탈
    target_profit_pct: 0.30          # 목표 +30%
    sell_on_volume_climax_ratio: 3.0
```

---

## 💻 사용 방법

### 1. CSV 데이터 준비

```csv
date,open,high,low,close,volume
2024-06-01,50000,52000,49000,51000,5000000
2024-06-02,51000,51500,48000,48500,4500000
2024-06-03,48500,49000,47000,47500,4000000
...
```

### 2. 데이터 import (Pattern 3용 정보 포함)

```bash
python manage.py import_ohlcv ipo_stock.csv \
  --ticker IPO001 \
  --name "신규상장종목" \
  --listing-date 2024-01-15 \
  --shares-outstanding 8000000
```

**필수 파라미터 (Pattern 3):**
- `--listing-date`: 상장일 (YYYY-MM-DD)
- `--shares-outstanding`: 상장주식수

### 3. Pattern 평가 실행

```bash
# 전체 평가
python manage.py evaluate_patterns

# Pattern 3만 필터링 (고득점)
python manage.py evaluate_patterns --min-score 80
```

### 4. 결과 확인

```bash
python manage.py runserver
# → http://localhost:8000/admin/market/evaluation/
# → Filter by Pattern Type = P3
```

---

## 📋 체크리스트 (100점)

Pattern 3의 경우 기존 체크리스트를 다음과 같이 적용:

| 항목 | Pattern 3 해석 | 배점 |
|------|----------------|------|
| 연중 최저 확인 | IPO 후 최저점 | 25점 |
| 페이크 상승 | 방향 전환 확인 | 15점 |
| 저점 구조 유지 | 최저점 10일 방어 | 25점 |
| 이평선 정렬 | MA5 > MA10 | 15점 |
| 거래량 | 반등 시 증가 | 20점 |

---

## 🎯 실전 예시

### Case 1: 성공 사례

```
종목: ABC 바이오텍
상장일: 2024-03-01
상장주식수: 800만주

타임라인:
- 3/01: 상장가 50,000원 (IPO)
- 3/15: 최고가 60,000원 (+20%)
- 4/30: 최저점 35,000원 (-41.7%)  ← 바닥 형성
- 5/01~5/15: 35,000~37,000원 횡보  ← 저점 방어
- 5/20: 40,000원 (+14.3% 반등)    ← 방향 전환
- 6/15: 55,000원 (+57% 익절)      ← 성공!

Pattern 3 점수: 85점
결과: +57% 수익
```

### Case 2: 손절 사례

```
종목: XYZ 테크
상장일: 2024-02-01
상장주식수: 900만주

타임라인:
- 2/01: 상장가 30,000원
- 3/15: 최저점 18,000원 (-40%)
- 3/20: 반등 22,000원 (+22%)
- 4/05: 16,000원 (최저점 이탈!)  ← 손절

Pattern 3 점수: 70점
결과: -11% 손절
```

---

## ⚠️ 주의사항

### 1. IPO 정보 필수
```bash
# ❌ 잘못된 사용
python manage.py import_ohlcv data.csv --ticker IPO001

# ✅ 올바른 사용
python manage.py import_ohlcv data.csv --ticker IPO001 \
  --listing-date 2024-01-15 \
  --shares-outstanding 8000000
```

### 2. 소형주만 해당
- 상장주식수 > 1,000만주 = Pattern 3 부적격
- 대형주는 Pattern 1, 2 사용

### 3. 1년 제한
- 상장 후 365일 초과 = Pattern 3 부적격
- 오래된 종목은 Pattern 1, 2 사용

---

## 🔍 Django Admin 필터

### Evaluation 화면에서

**Filter by Pattern Type:**
- P3 선택

**Filter by Score:**
- 80점 이상 = 적극 관찰
- 60-79점 = 조건부 관찰

**추가 확인 사항:**
- `pattern_evidence_json` 확인
  - `ipo_check`: 상장일, 경과일
  - `small_cap_check`: 상장주식수
  - `bottom_check`: 최저점 정보
  - `hold_check`: 방어 일수
  - `reversal_check`: 회복률, MA 크로스

---

## 📈 백테스팅 (추후 구현 예정)

```bash
python manage.py run_backtest \
  --ticker IPO001 \
  --from 2024-01-01 \
  --to 2024-12-31 \
  --pattern P3
```

**예상 성과:**
- 승률: 55~65%
- 평균 수익: +35%
- 평균 손실: -8%
- Profit Factor: 2.5+

---

## 🎓 학습 포인트

### Pattern 3 vs Pattern 1 차이

| 항목 | Pattern 1 | Pattern 3 |
|------|-----------|-----------|
| 대상 | 모든 종목 | IPO 1년 이내 |
| 시장 검증 | 완료 | 미완료 |
| 매집 기간 | 길다 | 짧다 |
| 변동성 | 보통 | 매우 높음 |
| 목표 수익 | +35% | +30~50% |

### 리스크 관리

1. **소형주 특성**
   - 유동성 낮음 → 분할 매수/매도
   - 변동성 높음 → 손절 엄격히

2. **IPO 특성**
   - 공모가 대비 위치 확인
   - 상장 후 거래량 추이 확인
   - 공모주 물량 소화 여부

3. **세력주 가능성**
   - 소형주 + 거래량 증가 = 세력 개입
   - 최저점 방어 = 매집 완료
   - 급등 전 징후

---

## 🚀 다음 단계

1. Pattern 3 데이터 수집
2. 백테스팅 실행
3. 성과 분석
4. 파라미터 최적화

---

**"신규상장 소형주는 변동성이 크지만, 제대로 된 저점에서 잡으면 큰 수익을 낼 수 있다."**

**"하지만 손절은 더욱 엄격하게!"**
