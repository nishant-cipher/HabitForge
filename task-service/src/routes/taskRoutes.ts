import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as taskController from '../controllers/taskController';

const router = Router();
router.use(authenticate);

// Stats (must be before /:taskId)
router.get('/stats', taskController.getTaskStats);

// Task CRUD + complete
router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.delete('/completed', taskController.clearCompletedTasks);  // must be before /:taskId
router.post('/:taskId/complete', taskController.completeTask);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

export default router;

