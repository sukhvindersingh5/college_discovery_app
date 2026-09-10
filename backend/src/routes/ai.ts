import { Router } from 'express';
import { chatWithAI, getSuggestedQuestions } from '../controllers/aiController';

const router = Router();

router.post('/chat', chatWithAI);
router.get('/suggested-questions', getSuggestedQuestions);

export default router;
