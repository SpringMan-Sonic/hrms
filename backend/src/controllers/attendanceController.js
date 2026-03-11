const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// GET /api/attendance?employeeId=&date=&startDate=&endDate=
exports.getAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, startDate, endDate } = req.query;
    const filter = {};

    if (employeeId) filter.employee = employeeId;
    if (date) filter.date = date;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'fullName employeeId department')
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/employee/:employeeId
exports.getEmployeeAttendance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const filter = { employee: employeeId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const records = await Attendance.find(filter).sort({ date: -1 });
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const absentCount = records.filter((r) => r.status === 'Absent').length;

    res.json({
      success: true,
      data: {
        employee,
        records,
        stats: { present: presentCount, absent: absentCount, total: records.length },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/attendance
exports.markAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, status } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Upsert - update if exists, create if not
    const attendance = await Attendance.findOneAndUpdate(
      { employee: employeeId, date },
      { employee: employeeId, date, status },
      { upsert: true, new: true, runValidators: true }
    );

    await attendance.populate('employee', 'fullName employeeId department');

    res.status(201).json({
      success: true,
      message: `Attendance marked as ${status} for ${employee.fullName}`,
      data: attendance,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    next(err);
  }
};

// DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    await record.deleteOne();
    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (err) {
    next(err);
  }
};