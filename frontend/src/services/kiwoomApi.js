/**
 * Kiwoom REST API Service
 *
 * 키움 REST API를 호출하여 실제 주식 데이터를 가져옵니다.
 * 현재 PC에서 작동하며, AWS 배포 시 환경변수만 변경하면 됩니다.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const KIWOOM_API_BASE = `${API_BASE_URL}/kiwoom/api/v2`;

/**
 * Axios 인스턴스 생성
 */
const apiClient = axios.create({
  baseURL: KIWOOM_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
});

/**
 * 요청 인터셉터 - 로깅
 */
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[Kiwoom API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[Kiwoom API] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 - 에러 처리
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('[Kiwoom API] Response error:', error.response?.data || error.message);

    // 에러 메시지 추출
    const errorMessage = error.response?.data?.error || error.message || '요청 실패';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

/**
 * 키움 REST API 서비스
 */
export const kiwoomApi = {
  /**
   * 연결 상태 확인
   * @returns {Promise<{success: boolean, data: object}>}
   */
  checkConnection: async () => {
    try {
      const response = await apiClient.get('/connection/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 종목 기본정보 조회
   * @param {string} symbol - 종목코드 (예: "005930")
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getStockInfo: async (symbol) => {
    try {
      const response = await apiClient.get(`/stock/${symbol}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 현재가 조회
   * @param {string} symbol - 종목코드
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getCurrentPrice: async (symbol) => {
    try {
      const response = await apiClient.get(`/price/${symbol}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 여러 종목 일괄 조회
   * @param {string[]} symbols - 종목코드 리스트
   * @returns {Promise<{success: boolean, data: array, count: number}>}
   */
  getMultipleStocks: async (symbols) => {
    try {
      const response = await apiClient.post('/stocks/', {
        symbols,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 실시간 데이터 구독 시작
   * @param {string} symbol - 종목코드
   * @returns {Promise<{success: boolean, message: string}>}
   */
  subscribe: async (symbol) => {
    try {
      const response = await apiClient.post('/subscribe/', {
        symbol,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 실시간 데이터 구독 해제
   * @param {string} symbol - 종목코드
   * @returns {Promise<{success: boolean, message: string}>}
   */
  unsubscribe: async (symbol) => {
    try {
      const response = await apiClient.delete(`/subscribe/${symbol}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 구독 중인 종목 목록 조회
   * @returns {Promise<{success: boolean, data: array, count: number}>}
   */
  getSubscribed: async () => {
    try {
      const response = await apiClient.get('/subscribe/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 실시간 데이터 폴링 (구독 중인 모든 종목의 현재가)
   * @returns {Promise<{success: boolean, data: array, count: number}>}
   */
  pollRealtime: async () => {
    try {
      const response = await apiClient.get('/poll/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 종목 기본정보 DB 동기화
   * @param {string} symbol - 종목코드
   * @returns {Promise<{success: boolean, message: string}>}
   */
  syncToDb: async (symbol) => {
    try {
      const response = await apiClient.post(`/sync/${symbol}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * React Hook 형태의 키움 API
 *
 * 사용 예시:
 * const { data, loading, error, refetch } = useKiwoomStockInfo('005930');
 */
export const useKiwoomApi = () => {
  return {
    /**
     * 종목 기본정보 조회 Hook
     */
    useStockInfo: (symbol) => {
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState(null);

      const fetch = async () => {
        setLoading(true);
        setError(null);

        try {
          const result = await kiwoomApi.getStockInfo(symbol);
          if (result.success) {
            setData(result.data);
          } else {
            setError(result.error || '조회 실패');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      React.useEffect(() => {
        if (symbol) {
          fetch();
        }
      }, [symbol]);

      return { data, loading, error, refetch: fetch };
    },

    /**
     * 현재가 조회 Hook
     */
    useCurrentPrice: (symbol) => {
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState(null);

      const fetch = async () => {
        setLoading(true);
        setError(null);

        try {
          const result = await kiwoomApi.getCurrentPrice(symbol);
          if (result.success) {
            setData(result.data);
          } else {
            setError(result.error || '조회 실패');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      React.useEffect(() => {
        if (symbol) {
          fetch();
        }
      }, [symbol]);

      return { data, loading, error, refetch: fetch };
    },

    /**
     * 연결 상태 확인 Hook
     */
    useConnection: () => {
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(null);

      const check = async () => {
        try {
          const result = await kiwoomApi.checkConnection();
          setData(result.data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      React.useEffect(() => {
        check();
      }, []);

      return { data, loading, error, refetch: check };
    },
  };
};

export default kiwoomApi;
