import { Router } from 'express';
import { getColleges, getCollegeById, compareColleges, getFilters } from '../controllers/collegeController';

const router = Router();

router.get('/filters', getFilters);
router.get('/compare', compareColleges);
router.get('/', getColleges);
router.get('/:id', getCollegeById);

export default router;
