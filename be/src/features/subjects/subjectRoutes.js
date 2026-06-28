import express from 'express';
import * as subjectController from './subjectController.js';

const router = express.Router();

// Lấy danh sách các môn học chuyên môn (Công khai)
router.get('/', subjectController.getSubjects);

export default router;
