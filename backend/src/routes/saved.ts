import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getSaved, saveCollege, unsaveCollege, getSavedIds } from '../controllers/savedController';

const router = Router();

// All saved routes require auth
router.use(authenticateToken);

router.get('/', (req: Request, res: Response) => getSaved(req as AuthRequest, res));
router.get('/ids', (req: Request, res: Response) => getSavedIds(req as AuthRequest, res));
router.post('/:id', (req: Request, res: Response) => saveCollege(req as AuthRequest, res));
router.delete('/:id', (req: Request, res: Response) => unsaveCollege(req as AuthRequest, res));

export default router;
