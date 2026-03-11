const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// GET /api/employees
exports.getAllEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });

    // Get present day count for each employee
    const employeesWithStats = await Promise.all(
      employees.map(async (emp) => {
        const presentCount = await Attendance.countDocuments({
          employee: emp._id,
          status: 'Present',
        });
        return { ...emp.toObject(), presentDays: presentCount };
      })
    );

    res.json({ success: true, count: employees.length, data: employeesWithStats });
  } catch (err) {
    next(err);
  }
};

// GET /api/employees/:id
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    const presentCount = await Attendance.countDocuments({ employee: employee._id, status: 'Present' });
    res.json({ success: true, data: { ...employee.toObject(), presentDays: presentCount } });
  } catch (err) {
    next(err);
  }
};

// POST /api/employees
exports.createEmployee = async (req, res, next) => {
  try {
    const { employeeId, fullName, email, department } = req.body;
    const employee = new Employee({ employeeId, fullName, email, department });
    await employee.save();
    res.status(201).json({ success: true, message: 'Employee created successfully', data: employee });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const label = field === 'employeeId' ? 'Employee ID' : 'Email';
      return res.status(409).json({ success: false, message: `${label} already exists` });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    next(err);
  }
};

// DELETE /api/employees/:id
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    // Also delete attendance records
    await Attendance.deleteMany({ employee: employee._id });
    await employee.deleteOne();
    res.json({ success: true, message: 'Employee and related attendance records deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/employees/stats/summary
exports.getSummary = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const today = new Date().toISOString().split('T')[0];
    const presentToday = await Attendance.countDocuments({ date: today, status: 'Present' });
    const absentToday = await Attendance.countDocuments({ date: today, status: 'Absent' });

    const departmentStats = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        absentToday,
        notMarkedToday: totalEmployees - presentToday - absentToday,
        departmentStats,
      },
    });
  } catch (err) {
    next(err);
  }
};