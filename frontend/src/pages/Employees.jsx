import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeApi } from '../api';
import {
  Button, Card, PageHeader, Badge, Input, Modal,
  ConfirmDialog, LoadingState, EmptyState, ErrorState
} from '../components/ui';

const DEPARTMENTS = [
  'Engineering', 'Marketing', 'Sales', 'HR', 'Finance',
  'Operations', 'Design', 'Legal', 'Product'
];

const EMPTY_FORM = { employeeId: '', fullName: '', email: '', department: '', customDepartment: '' };

function Avatar({ name }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-indigo-50 text-indigo-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600', 'bg-purple-50 text-purple-600', 'bg-sky-50 text-sky-600'];
  const i = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${colors[i]}`}>
      {initials}
    </div>
  );
}

export default function Employees() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');

  const isCustomDept = form.department === '__custom__';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: employeeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Employee added successfully');
      setShowAdd(false);
      setForm(EMPTY_FORM);
      setErrors({});
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: employeeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      toast.success('Employee deleted');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const validate = () => {
    const e = {};
    if (!form.employeeId.trim()) e.employeeId = 'Employee ID is required';
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.department) e.department = 'Department is required';
    if (isCustomDept && !form.customDepartment.trim()) e.customDepartment = 'Please enter a department name';
    if (isCustomDept && form.customDepartment.trim().length < 2) e.customDepartment = 'Department must be at least 2 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const finalDepartment = isCustomDept ? form.customDepartment.trim() : form.department;
    createMutation.mutate({ ...form, department: finalDepartment });
  };

  const employees = data?.data || [];
  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} total employee${employees.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => { setShowAdd(true); setForm(EMPTY_FORM); setErrors({}); }}>
            <UserPlus size={15} />
            Add Employee
          </Button>
        }
      />

      <Card>
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, email or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingState message="Loading employees..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'No results found' : 'No employees yet'}
            description={search ? 'Try a different search term.' : 'Add your first employee to get started.'}
            action={!search && (
              <Button onClick={() => setShowAdd(true)}>
                <UserPlus size={14} /> Add Employee
              </Button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Employee</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">ID</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Email</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Department</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Present Days</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="stagger">
                {filtered.map((emp) => (
                  <tr key={emp._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.fullName} />
                        <p className="text-sm font-semibold text-gray-800">{emp.fullName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{emp.employeeId}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{emp.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{emp.department}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-emerald-600">{emp.presentDays ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(emp)}
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

      {/* Add Employee Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Employee">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Employee ID"
              placeholder="e.g. EMP001"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              error={errors.employeeId}
            />
            <Input
              label="Full Name"
              placeholder="e.g. Jane Smith"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              error={errors.fullName}
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            placeholder="jane@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />

          {/* Department selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-500 text-gray-700">Department</label>
            <select
              value={form.department}
              onChange={(e) => {
                setForm({ ...form, department: e.target.value, customDepartment: '' });
                setErrors({ ...errors, department: '', customDepartment: '' });
              }}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none appearance-none bg-white transition-all
                ${errors.department
                  ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                }`}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              <option disabled>──────────</option>
              <option value="__custom__">Custom...</option>
            </select>
            {errors.department && <p className="text-xs text-red-500">{errors.department}</p>}
          </div>

          {/* Custom department input — only shown when Custom... is selected */}
          {isCustomDept && (
            <Input
              label="Custom Department Name"
              placeholder="e.g. Research, Compliance, Data Science..."
              value={form.customDepartment}
              onChange={(e) => setForm({ ...form, customDepartment: e.target.value })}
              error={errors.customDepartment}
            />
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending}>Add Employee</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?._id)}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This will also delete all their attendance records.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}