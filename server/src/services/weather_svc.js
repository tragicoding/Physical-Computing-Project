// 기상청 단기 예보 API를 이용해 강수 정보를 제공하는 서비스 모듈
// [의존] logger, axios
import { logger } from '../utils/logger.js';
import axios from 'axios';

// 환경 변수에서 API 설정 가져오기
const API_KEY = process.env.WEATHER_API_KEY; // .env의 WEATHER_API_KEY 사용
const API_URL = process.env.WEATHER_API_URL; // .env의 기상청 API URL 사용

/**
 * 위경도를 기상청 단기예보 격자 좌표 (X, Y)로 변환
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @returns {{nx: number, ny: number}} 격자 좌표
 */
function convertToGrid(lat, lon) {
    // 기상청 격자 변환 로직 (예시로 서울 인근의 단순 좌표 반환)
    // 실제 서비스에서는 복잡한 Lambert Conformal Conic Projection 변환 공식 사용 필요
    
    // 이 프로젝트의 예시 코드에서는 단순 매핑 사용
    // 실제 연동 시에는 정확한 변환 로직을 사용해야 합니다.
    const nx = 69; // 안성 기준 격자 X
    const ny = 109; // 안성 기준 격자 Y
    
    // logger.info(`[Grid] Lat: ${lat}, Lon: ${lon} -> NX: ${nx}, NY: ${ny}`);
    return { nx, ny };
}


/**
 * 특정 위경도와 시간에 대한 강수 예보를 반환함.
 * 기상청 단기예보(VilageFcstInfoService)를 사용하며, 오늘 중 비 예보를 확인.
 *
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @param {boolean} is_test - 테스트 모드 활성화 여부
 * @returns {Promise<string|null>} 강수 시작 시각 (HH:MM 형식) 또는 null
 */
export async function get_rain_info(lat, lon, is_test = false) {
    if (!API_KEY || !API_URL) {
        logger.error('기상청 API 환경 변수(WEATHER_API_KEY 또는 WEATHER_API_URL)가 설정되지 않음.');
        return null;
    }

    // 테스트 모드 처리 (기존 로직 유지)
    if (is_test) {
        logger.info('테스트 모드: 18:00 비 상황 시뮬레이션.');
        const now = new Date();
        const current_hour = now.getHours();
        return current_hour < 18 ? '18:00' : null;
    }

    try {
        logger.info(`기상청 API 조회 시작: lat=${lat}, lon=${lon}`);
        
        // 1. 현재 날짜와 시간을 기상청 요청 형식에 맞게 설정
        const now = new Date();
        const base_date = now.getFullYear().toString() + 
                          (now.getMonth() + 1).toString().padStart(2, '0') + 
                          now.getDate().toString().padStart(2, '0');
        
        // 기상청 단기 예보는 1일 8회(02, 05, 08, 11, 14, 17, 20, 23시) 발표
        // 발표 시각 10분 후부터 조회가 가능하므로, 이전 발표 시각을 기준으로 설정
        let base_time;
        const current_hour = now.getHours();
        if (current_hour >= 23 || current_hour < 2) base_time = '2300';
        else if (current_hour >= 20) base_time = '2000';
        else if (current_hour >= 17) base_time = '1700';
        else if (current_hour >= 14) base_time = '1400';
        else if (current_hour >= 11) base_time = '1100';
        else if (current_hour >= 8) base_time = '0800';
        else if (current_hour >= 5) base_time = '0500';
        else if (current_hour >= 2) base_time = '0200';
        else base_time = '2300'; // 자정 전후
        
        // 2. 위경도를 기상청 격자 좌표로 변환
        const { nx, ny } = convertToGrid(lat, lon);

        // 3. API 호출 URL 구성
        const url = `${API_URL}?serviceKey=${API_KEY}&pageNo=1&numOfRows=100&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;

        const response = await axios.get(url);
        
        // 응답 데이터 구조 확인 및 추출
        const items = response.data.response?.body?.items?.item;

        if (!items || items.length === 0) {
            logger.warn('기상청 API 응답에 유효한 예보 데이터가 없습니다.');
            return null;
        }

        // 4. 강수 예보 (POP: 강수확률) 및 시간 확인
        let rain_time = null;
        let min_pop = 100; // 최소 강수 확률 (여기서는 강수 확률이 가장 낮은 시각을 찾는 것이 아님)
        
        // 예보 시간 순으로 순회하며 강수 확률(POP) 60% 이상인 가장 빠른 시각 찾기
        // VILAGE FCST는 발표 시간 기준 10분 후부터 60시간 후까지 예보를 제공
        for (const item of items) {
            // 강수 확률 (POP)과 예보 시각 (fcstTime) 파라미터만 확인
            if (item.category === 'POP' && item.fcstValue >= 60) { // 강수확률 60% 이상일 때
                const fcst_time = item.fcstTime; // HHMM 형식
                const hour = fcst_time.substring(0, 2);
                const minute = fcst_time.substring(2, 4);
                
                // POP이 60% 이상인 최초 시각 저장 후 반복문 종료
                rain_time = `${hour}:${minute}`;
                logger.info(`기상청 비 예보 확인 (POP: ${item.fcstValue}%): ${rain_time}`);
                return rain_time; 
            }
        }
        
        logger.info('오늘 중 강수 확률 60% 이상의 비 예보 없음.');
        return null;

    } catch (error) {
        // HTTP 통신 실패, 데이터 파싱 오류 등 모든 예외 처리
        logger.error('기상청 API 조회 중 오류 발생:', error.message);
        return null; 
    }
}