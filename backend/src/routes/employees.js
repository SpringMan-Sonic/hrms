const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const {
  getAllEmployees,
  getEmployee,
  createEmployee,
  deleteEmployee,
  getSummary,
} = require('../controllers/employeeController');

// GET /api/employees/stats/summary - must come before /:id
router.get('/stats/summary', getSummary);

// GET /api/employees
router.get('/', getAllEmployees);

// GET /api/employees/:id
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid employee ID')],
  validate,
  getEmployee
);

// POST /api/employees
router.post(
  '/',
  [
    body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
    body('fullName')
      .trim()
      .notEmpty().withMessage('Full name is required')
      .isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
   body('department')
  .trim()
  .notEmpty().withMessage('Department is required')
  .isLength({ min: 2 }).withMessage('Department must be at least 2 characters'),
  ],
  validate,
  createEmployee
);

// DELETE /api/employees/:id
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid employee ID')],
  validate,
  deleteEmployee
);

module.exports = router;