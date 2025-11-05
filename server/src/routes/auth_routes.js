import { Router } from 'express';
import Joi from 'joi';
import { validate } from '../middleware/validate.js';
import { signup, login } from '../controllers/auth_ctrl.js';

const r = Router();

r.post('/signup', validate('body', Joi.object({
  email: Joi.string().email().required(),
  pw: Joi.string().min(6).required(),
})), signup);

r.post('/login', validate('body', Joi.object({
  email: Joi.string().email().required(),
  pw: Joi.string().required(),
})), login);

export default r;
