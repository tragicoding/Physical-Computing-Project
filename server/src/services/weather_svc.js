
// 기상청 API 연동 또는 목업 데이터를 이용해 강수 정보를 제공하는 서비스 모듈
// [의존] logger, axios

import { logger } from '../utils/logger.js';
import axios from 'axios';

/**
 * 특정 위경도와 시간에 대한 강수 예보를 반환함.
 * openweathermap의 onecall API를 사용하며, 현재 시간 기준 12시간 내의 예보를 확인.
 *
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @param {boolean} is_test - 테스트 모드 활성화 여부
 * @returns {Promise<string|null>} 강수 시작 시각 (HH:MM 형식) 또는 null
 */
export async function get_rain_info(lat, lon, is_test = false) {
  // 테스트 모드가 활성화된 경우, 항상 18시에 비가 오는 것으로 가정함
  if (is_test) {
    logger.info('테스트 모드: 18:00 비 상황 시뮬레이션.');
    const now = new Date();
    const current_hour = now.getHours();
    return current_hour < 18 ? '18:00' : null;
  }

  // 실제 API를 호출하여 날씨 정보 가져오기
  try {
    logger.info(`날씨 정보 조회 시작: lat=${lat}, lon=${lon}`);
    
    // openweathermap API Key. 이후에 설정 예정 - .env의 OPENWEATHER_API_KEY와 동일해야 함
    const api_key = process.env.OPENWEATHER_API_KEY;
    if (!api_key) {
      throw new Error('OPENWEATHER_API_KEY가 설정되지 않음.');
    }
    
    const exclude = 'current,minutely,daily,alerts';
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${exclude}&appid=${api_key}&units=metric`;

    const response = await axios.get(url);
    const hourly_forecasts = response.data.hourly;

    // 현재 시간으로부터 12시간 이내의 예보만 확인
    const twelve_hours_later = new Date();
    twelve_hours_later.setHours(twelve_hours_later.getHours() + 12);

    // 12시간 내 'Rain' 예보 확인
    for (const forecast of hourly_forecasts) {
      const forecast_time = new Date(forecast.dt * 1000);
      if (forecast_time > twelve_hours_later) {
        break; // 12시간 범위 초과 시 중단
      }

      if (forecast.weather[0].main === 'Rain') {
        const hours = forecast_time.getHours().toString().padStart(2, '0');
        const minutes = forecast_time.getMinutes().toString().padStart(2, '0');
        const rain_time = `${hours}:${minutes}`;
        logger.info(`비 예보 확인: ${rain_time}`);
        return rain_time;
      }
    }

    logger.info('12시간 내 비 예보 없음.');
    return null;

  } catch (error) {
    logger.error('날씨 정보 조회 중 오류 발생:', error.message);
    return null; // API 실패 시 null 반환하여 서비스 중단 방지
  }
}
