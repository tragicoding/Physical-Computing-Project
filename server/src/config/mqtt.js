
// MQTT 브로커 연결 및 디바이스 메시지 수신/처리를 담당하는 모듈
// [의존] mqtt, prisma, tts_svc, logger

import mqtt from 'mqtt';
import { prisma } from './prisma.js';
import { send_tts } from '../services/tts_svc.js';
import { logger } from '../utils/logger.js';

// MQTT 브로커 주소. 이후에 설정 예정 - .env의 MQTT_HOST와 동일해야 함
const mqtt_broker_url = process.env.MQTT_HOST || 'mqtt://localhost:1883';
export const mqtt_client = mqtt.connect(mqtt_broker_url);

// 구독할 토픽 정의
const TOPIC_DOOR_SENSED = 'door/+/sensed';   // 현관 센서 감지 이벤트
const TOPIC_BIN_STATUS  = 'bin/+/status';    // 우산 보관함 상태 보고

// MQTT 브로커 연결 성공 시
mqtt_client.on('connect', () => {
  logger.info(`MQTT 브로커 연결 성공: ${mqtt_broker_url}`);
  // 토픽 구독 시작
  mqtt_client.subscribe([TOPIC_DOOR_SENSED, TOPIC_BIN_STATUS], (err) => {
    if (err) {
      logger.error('MQTT 토픽 구독 실패:', err);
    }
  });
});

// 메시지 핸들러: 구독 중인 토픽에 메시지 도착 시 호출됨
mqtt_client.on('message', async (topic, payload) => {
  try {
    const message = JSON.parse(payload.toString());
    logger.info(`MQTT 메시지 수신 - 토픽: ${topic}`);

    // 토픽 파싱 (예: "door/123/sensed" -> ['door', '123', 'sensed'])
    const topic_parts = topic.split('/');
    const domain = topic_parts[0];
    const device_id = Number(topic_parts[1]);
    const action = topic_parts[2];

    // 1. 현관 센서 감지 이벤트 처리
    if (domain === 'door' && action === 'sensed') {
      const user_id = message.user_id;
      if (!user_id) return;

      // 간단한 TTS 메시지 전송. (상세 로직은 weather_ctrl에서 처리)
      const speaker = await prisma.device.findFirst({
        where: { user_id: user_id, type: 'SPEAKER' }
      });
      if (speaker) {
        await send_tts(speaker.id, '문 열림 감지');
      }
    }

    // 2. 우산 보관함 상태 보고 처리
    if (domain === 'bin' && action === 'status') {
      await prisma.umbrellaBin.upsert({
        where: { device_id: device_id },
        update: { remain: message.remain, cap: message.cap, is_open: message.is_open },
        create: { device_id: device_id, remain: message.remain, cap: message.cap, is_open: message.is_open },
      });
    }

  } catch (e) {
    logger.error('MQTT 메시지 처리 오류:', e);
  }
});

// 연결 오류 발생 시
mqtt_client.on('error', (err) => {
  logger.error('MQTT 연결 오류:', err);
});
