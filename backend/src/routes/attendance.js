const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const {
  getAttendance,
  getEmployeeAttendance,
  markAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');

// GET /api/attendance
router.get('/', getAttendance);

// GET /api/attendance/employee/:employeeId
router.get(
  '/employee/:employeeId',
  [param('employeeId').isMongoId().withMessage('Invalid employee ID')],
  validate,
  getEmployeeAttendance
);

// POST /api/attendance
router.post(
  '/',
  [
    body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
    body('date')
      .notEmpty().withMessage('Date is required')
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['Present', 'Absent']).withMessage('Status must be Present or Absent'),
  ],
  validate,
  markAttendance
);

// DELETE /api/attendance/:id
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid attendance record ID')],
  validate,
  deleteAttendance
);

module.exports = router;