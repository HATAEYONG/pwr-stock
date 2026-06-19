#!/bin/bash
# PowerStock Git Push Script

echo "🚀 PowerStock GitHub Push 시작..."

cd /home/claude/trading-platform

# Git 설정
echo "📝 Git 설정..."
git config user.name "엘도라도"
git config user.email "hataeyong@example.com"

# 모든 파일 추가
echo "📦 파일 추가..."
git add .

# 커밋
echo "💾 커밋 생성..."
git commit -m "🎉 Initial commit: PowerStock v1.0

✨ Features:
- Phase 1: Pattern 1/2/3 분석 시스템
- Phase A: 백테스팅 엔진
- Phase B: 실시간 알림 (Telegram)
- Phase C: 기술적 지표 분석 (NEW!)

🏗️ Tech Stack:
- Backend: Django 5.0 + DRF
- Frontend: React 18 + Material-UI
- Database: PostgreSQL/SQLite
- Task Queue: Celery + Redis

📊 Core Features:
- Pattern-based stock screening
- 4-stage workflow (관심→점검→진입→청산)
- Technical indicators (MA levels, volume, patterns)
- Backtest engine with performance metrics
- Real-time Telegram notifications
- Alert settings & logs

🎯 Market Support:
- KOSDAQ, KOSPI
- NASDAQ, NYSE

📈 New in Phase C:
- Long-term MA level system (5/20/60/112/224)
- Volume analysis (110% breakout detection)
- Support/Resistance auto-detection
- Pattern detection (double bottom, accumulation, breakout)
- Trend analysis (short/mid/long term)
- Comprehensive technical score (0-100)
- Technical dashboard with 3 tabs

Built with 13DGC-AODM methodology"

# 브랜치 확인/생성
echo "🌿 브랜치 설정..."
git branch -M main

# GitHub 원격 저장소 추가
echo "🔗 GitHub 연결..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/HATAEYONG/powerstock.git

echo ""
echo "✅ 로컬 커밋 완료!"
echo ""
echo "📤 다음 명령어로 GitHub에 Push하세요:"
echo ""
echo "cd /home/claude/trading-platform"
echo "git push -u origin main --force"
echo ""
echo "⚠️  주의: GitHub Personal Access Token이 필요합니다."
echo "   Settings → Developer settings → Personal access tokens"
echo ""
