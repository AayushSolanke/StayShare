import express from 'express';
import {
  getConversations,
  getConversationMessages,
  startConversation,
  sendConversationMessage,
  markConversationRead,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.post('/', startConversation);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/messages', sendConversationMessage);
router.post('/:id/read', markConversationRead);

export default router;
