import { Router } from 'express';
import { getCandidatesByPositionId } from '../presentation/controllers/positionController';

const router = Router();

// Endpoint para obtener todos los candidatos de una posición específica
router.get('/:id/candidates', getCandidatesByPositionId);

export default router; 