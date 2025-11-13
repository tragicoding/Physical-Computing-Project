import { Router } from 'express';
import Joi from 'joi';
import { validate } from '../middleware/validate.js';
import { device_auth } from '../middleware/auth.js';
import { handle_door_sensor } from '../controllers/weather_ctrl.js';

const router = Router();

// 현관 센서 감지 이벤트를 처리하는 라우트
// device_auth 미들웨어를 통해 허가된 기기의 요청인지 확인합니다.
// Joi를 사용해 요청 본문과 쿼리 파라미터의 유효성을 검사합니다.
router.post(
  '/door-sensed',
  device_auth,
  validate('body', Joi.object({
    user_id: Joi.number().integer().required(),
    sensor_id: Joi.number().integer().required(),
    secret: Joi.string().required(),
  })),
  validate('query', Joi.object({ // 'test' 쿼리 파라미터 유효성 검사 추가
    test: Joi.string().valid('true', 'false').optional(),
  })),
  handle_door_sensor
);

export default router;