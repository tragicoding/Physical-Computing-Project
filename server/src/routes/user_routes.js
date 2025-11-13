import { Router } from 'express';
import Joi from 'joi';
import { user_auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { 
  get_my_profile, 
  set_user_address, 
  add_user_alarm, 
  list_user_alarms 
} from '../controllers/user_ctrl.js';

const router = Router();

// 모든 사용자 관련 라우트에는 user_auth 미들웨어를 적용하여 인증된 사용자만 접근 가능
router.use(user_auth);

// 내 정보 조회
router.get('/me', get_my_profile);

// 주소(좌표) 설정
router.put('/address', validate('body', Joi.object({
  lat: Joi.number().precision(8).required(),
  lon: Joi.number().precision(8).required(),
})), set_user_address);

// 알람 추가
router.post('/alarms', validate('body', Joi.object({
  alarm_text: Joi.string().min(1).max(100).required(),
})), add_user_alarm);

// 알람 목록 조회
router.get('/alarms', list_user_alarms);

export default router;