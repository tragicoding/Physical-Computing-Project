
// 센서 이벤트 수신 시 날씨, 우산, 알람 정보를 종합하여 음성 안내를 제공하는 컨트롤러
// [의존] prisma, weather_svc, tts_svc

import { prisma } from '../config/prisma.js';
import { get_rain_info } from '../services/weather_svc.js';
import { send_tts } from '../services/tts_svc.js';

/**
 * 현관 센서 감지 시 호출되는 API 핸들러.
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @param {function} next - Express next 미들웨어
 */
export async function handle_door_sensor(req, res, next) {
  try {
    const { user_id } = req.body;
    const is_test = req.query.test === 'true';

    // 1. 사용자 정보 및 위치 좌표 확인
    const user = await prisma.user.findUnique({ where: { id: Number(user_id) } });
    if (!user || user.lat == null || user.lon == null) {
      return res.status(400).json({ message: '사용자 위치가 설정되지 않음.' });
    }

    // 2. 날씨 서비스로부터 강수 정보 조회
    const rain_time = await get_rain_info(user.lat, user.lon, is_test);

    // 3. 사용자의 우산함 상태 조회
    const bin_device = await prisma.device.findFirst({ 
      where: { user_id: Number(user_id), type: 'UMBRELLA_BIN' } 
    });
    const umbrella_bin = bin_device 
      ? await prisma.umbrellaBin.findUnique({ where: { device_id: bin_device.id } }) 
      : null;

    // 4. 사용자의 개인화 알람 목록 조회
    const user_alarms = await prisma.alarm.findMany({ where: { user_id: Number(user_id) } });
    const alarm_texts = user_alarms.map(alarm => alarm.text).join(', ');

    // 5. 상황별 음성 안내 메시지 생성
    let voice_message = '';
    if (rain_time) {
      voice_message = `오늘 ${rain_time}부터 비가 올 예정입니다. 우산을 꼭 챙기세요.`;
      if (umbrella_bin && umbrella_bin.remain === 0) {
        voice_message += ' 우산 보관함이 비어있습니다.';
      }
    } else {
      voice_message = '오늘 비 소식은 없습니다. 좋은 하루 되세요.';
    }
    if (alarm_texts) {
      voice_message += ` 외출 전 ${alarm_texts} 챙기는 것 잊지 마세요.`;
    }

    // 6. 스피커로 TTS(Text-to-Speech) 명령 전송
    const speaker = await prisma.device.findFirst({ 
      where: { user_id: Number(user_id), type: 'SPEAKER' } 
    });
    if (speaker) {
      await send_tts(speaker.id, voice_message);
    }

    // 7. API 응답 반환
    res.json({
      ok: true,
      rain_time: rain_time,
      umbrella_bin_status: umbrella_bin,
      voice_message: voice_message,
    });

  } catch (error) {
    next(error);
  }
}
