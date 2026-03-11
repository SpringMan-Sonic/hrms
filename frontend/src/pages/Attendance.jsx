import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Plus, CalendarDays, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { employeeApi, attendanceApi } from '../api';
import {
  Button, Card, PageHeader, Badge, Modal,
  ConfirmDialog, LoadingState, EmptyState, ErrorState
} from '../components/ui';

function Avatar({ name }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-indigo-50 text-indigo-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600'];
  const i = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${colors[i]}`}>
      {initials}
    </div>
  );
}

export default function Attendance() {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [showMark, setShowMark] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ employeeId: '', date: today, status: 'Present' });
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({ date: '', employeeId: '' });

  const { data: empData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.getAll(),
  });

  const queryParams = {};
  if (filters.date) queryParams.date = filters.date;
  if (filters.employeeId) queryParams.employeeId = filters.employeeId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['attendance', queryParams],
    queryFn: () => attendanceApi.getAll(queryParams),
  });

  const markMutation = useMutation({
    mutationFn: attendanceApi.mark,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success(res.message || 'Attendance marked');
      setShowMark(false);
      setForm({ employeeId: '', date: today, status: 'Present' });
      setErrors({});
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: attendanceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Record deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const e = {};
    if (!form.employeeId) e.employeeId = 'Please select an employee';
    if (!form.date) e.date = 'Date is required';
    if (!form.status) e.status = 'Status is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    markMutation.mutate(form);
  };

  const employees = empData?.data || [];
  const records = data?.data || [];
  const hasFilters = filters.date || filters.employeeId;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Attendance"
        subtitle={`${records.length} record${records.length !== 1 ? 's' : ''}${hasFilters ? ' (filtered)' : ''}`}
        action={
          <Button onClick={() => { setShowMark(true); setErrors({}); }}>
            <Plus size={15} /> Mark Attendance
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <p className="text-sm font-semibold text-gray-500 shrink-0">Filters:</p>
          <div className="flex items-center gap-3 flex-1">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition-all"
            />
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition-all appearance-none min-w-48"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.fullName}</option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={() => setFilters({ date: '', employeeId: '' })}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Records table */}
      <Card>
        {isLoading ? (
          <LoadingState message="Loading attendance records..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No attendance records"
            description={hasFilters ? 'No records match your filters. Try adjusting them.' : 'Start marking attendance for your employees.'}
            action={!hasFilters && (
              <Button onClick={() => setShowMark(true)}>
                <Plus size={14} /> Mark Attendance
              </Button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Employee</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Employee ID</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Department</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Date</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="stagger">
                {records.map((rec) => (
                  <tr key={rec._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={rec.employee?.fullName || '?'} />
                        <p className="text-sm font-semibold text-gray-800">{rec.employee?.fullName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {rec.employee?.employeeId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{rec.employee?.department}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                        <CalendarDays size={13} className="text-gray-300" />
                        {rec.date ? format(new Date(rec.date), 'MMM d, yyyy') : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={rec.status === 'Present' ? 'present' : 'absent'}>{rec.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(rec)}
                        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Mark Attendance Modal */}
      <Modal isOpen={showMark} onClose={() => setShowMark(false)} title="Mark Attendance">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Employee</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none appearance-none bg-white transition-all
                ${errors.employeeId ? 'border-red-300' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}`}
            >
              <option value="">Select an employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullName} ({emp.employeeId})
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="text-xs text-red-500">{errors.employeeId}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Date</label>
            <input
              type="date"
              value={form.date}
              max={today}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none bg-white transition-all
                ${errors.date ? 'border-red-300' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}`}
            />
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {['Present', 'Absent'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    form.status === s
                      ? s === 'Present'
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {s === 'Present' ? '✓ Present' : '✗ Absent'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" onClick={() => setShowMark(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={markMutation.isPending}>Save Attendance</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?._id)}
        title="Delete Record"
        message="Are you sure you want to delete this attendance record?"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}