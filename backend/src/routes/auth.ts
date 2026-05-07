import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, (req: Request, res: Response) => getMe(req as AuthRequest, res));

export default router;
