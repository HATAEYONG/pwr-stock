"""
체크리스트 엔진
- Pattern 평가 결과를 기반으로 점수화
- 100점 만점 체크리스트
"""
import pandas as pd
from apps.market.services.rules import rules_loader


class ChecklistEngine:
    """체크리스트 점수 계산 엔진"""
    
    def __init__(self):
        self.config = rules_loader.get_checklist_config()
        self.weights = self.config.get('weights', {})
        self.thresholds = self.config.get('thresholds', {})
    
    def evaluate(self, pattern1_result: dict, pattern2_result: dict, pattern3_result: dict,
                 df: pd.DataFrame, current_idx: int) -> dict:
        """
        체크리스트 점수 계산
        
        Args:
            pattern1_result: Pattern 1 평가 결과
            pattern2_result: Pattern 2 평가 결과
            pattern3_result: Pattern 3 평가 결과
            df: DataFrame
            current_idx: 현재 인덱스
        
        Returns:
            {
                'score': int (0-100),
                'checks': dict,
                'recommendation': str
            }
        """
        checks = {}
        score = 0
        
        # 1. 연중 최저 확인 (25점)
        # Pattern 3의 경우 IPO 최저점도 인정
        row = df.iloc[current_idx]
        yearly_low_ok = not pd.isna(row['yearly_low'])
        p3_bottom_ok = pattern3_result.get('bottom_formed', False)
        
        if yearly_low_ok or p3_bottom_ok:
            checks['yearly_low'] = True
            score += self.weights.get('yearly_low', 25)
        else:
            checks['yearly_low'] = False
        
        # 2. 페이크 상승 존재 (15점)
        # Pattern 3의 경우 방향 전환으로 대체
        fake_ok = pattern1_result.get('fake_breakout_ok', False)
        p3_reversal_ok = pattern3_result.get('trend_reversed', False)
        
        if fake_ok or p3_reversal_ok:
            checks['fake_breakout'] = True
            score += self.weights.get('fake_breakout', 15)
        else:
            checks['fake_breakout'] = False
        
        # 3. 저점 구조 유지 (25점)
        # Pattern 1의 매집, Pattern 2의 상승 추세, Pattern 3의 최저점 유지
        structure_ok = (
            pattern1_result.get('accumulation_ok', False) or 
            pattern2_result.get('above_low', False) or
            pattern3_result.get('bottom_hold', False)
        )
        
        if structure_ok:
            checks['structure_hold'] = True
            score += self.weights.get('structure_hold', 25)
        else:
            checks['structure_hold'] = False
        
        # 4. 이평선 정렬/수렴 (15점)
        ma_ok = (
            pattern1_result.get('ma_convergence_ok', False) or 
            pattern2_result.get('ma_cross', False) or
            pattern3_result.get('trend_reversed', False)  # Pattern 3도 MA 크로스 포함
        )
        
        if ma_ok:
            checks['ma_alignment'] = True
            score += self.weights.get('ma_alignment', 15)
        else:
            checks['ma_alignment'] = False
        
        # 5. 거래량 압축 (20점)
        # Pattern 3는 반등 시 거래량 증가가 특징이므로 다르게 처리
        volume_ok = (
            pattern1_result.get('volume_compression_ok', False) or 
            pattern2_result.get('vol_quiet', False) or
            pattern3_result.get('trend_reversed', False)  # Pattern 3의 거래량 증가 확인
        )
        
        if volume_ok:
            checks['volume_compression'] = True
            score += self.weights.get('volume_compression', 20)
        else:
            checks['volume_compression'] = False
        
        # 추천 등급
        watch_strong = self.thresholds.get('watch_strong', 80)
        watch_conditional = self.thresholds.get('watch_conditional', 60)
        
        if score >= watch_strong:
            recommendation = 'STRONG_WATCH'
        elif score >= watch_conditional:
            recommendation = 'CONDITIONAL_WATCH'
        else:
            recommendation = 'EXCLUDE'
        
        return {
            'score': score,
            'checks': checks,
            'recommendation': recommendation,
            'weights_used': self.weights,
            'thresholds_used': self.thresholds
        }
    
    def get_check_details(self, checks: dict) -> str:
        """체크리스트 상세 텍스트 생성"""
        details = []
        
        check_labels = {
            'yearly_low': '연중 최저 확인',
            'fake_breakout': '페이크 상승 존재',
            'structure_hold': '저점 구조 유지',
            'ma_alignment': '이평선 정렬/수렴',
            'volume_compression': '거래량 압축'
        }
        
        for key, label in check_labels.items():
            status = '✓' if checks.get(key, False) else '✗'
            weight = self.weights.get(key, 0)
            details.append(f"{status} {label} ({weight}점)")
        
        return '\n'.join(details)


# 전역 인스턴스
checklist_engine = ChecklistEngine()
