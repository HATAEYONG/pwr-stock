"""
rules.yaml 설정 로더
모든 판단 기준을 파일에서 로드하여 블랙박스 방지
"""
import yaml
import hashlib
from pathlib import Path
from django.conf import settings


class RulesLoader:
    """rules.yaml 파일 로더"""
    
    _instance = None
    _rules = None
    _version = None
    
    def __new__(cls):
        """싱글톤 패턴"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._rules is None:
            self._load_rules()
    
    def _load_rules(self):
        """rules.yaml 파일 로드"""
        rules_path = Path(settings.BASE_DIR) / 'rules.yaml'
        
        if not rules_path.exists():
            raise FileNotFoundError(f"rules.yaml not found at {rules_path}")
        
        with open(rules_path, 'r', encoding='utf-8') as f:
            self._rules = yaml.safe_load(f)
        
        # 버전 계산 (SHA256 해시)
        with open(rules_path, 'rb') as f:
            self._version = hashlib.sha256(f.read()).hexdigest()[:16]
    
    @property
    def rules(self):
        """전체 규칙 반환"""
        return self._rules
    
    @property
    def version(self):
        """rules.yaml 버전 반환"""
        return self._version
    
    def get_system_config(self):
        """시스템 설정 반환"""
        return self._rules.get('system', {})
    
    def get_indicators_config(self):
        """지표 설정 반환"""
        return self._rules.get('indicators', {})
    
    def get_pattern1_config(self):
        """Pattern 1 설정 반환"""
        return self._rules.get('pattern1', {})
    
    def get_pattern2_config(self):
        """Pattern 2 설정 반환"""
        return self._rules.get('pattern2', {})
    
    def get_pattern3_config(self):
        """Pattern 3 설정 반환"""
        return self._rules.get('pattern3', {})
    
    def get_volume_triggers_config(self):
        """거래량 트리거 설정 반환"""
        return self._rules.get('volume_triggers', {})
    
    def get_checklist_config(self):
        """체크리스트 설정 반환"""
        return self._rules.get('checklist', {})
    
    def get_backtest_config(self):
        """백테스트 설정 반환"""
        return self._rules.get('backtest', {})
    
    def reload(self):
        """rules.yaml 재로드"""
        self._rules = None
        self._version = None
        self._load_rules()


# 전역 인스턴스
rules_loader = RulesLoader()
