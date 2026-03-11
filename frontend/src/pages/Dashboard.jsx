import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';
import { employeeApi } from '../api';
import { StatCard, Card, LoadingState, ErrorState, Badge } from '../components/ui';
import { format } from 'date-fns';

function DepartmentBar({ name, count, max }) {
  const pct = Math.round((count / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-gray-600 w-28 shrink-0 truncate">{name}</p>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className="bg-indigo-500 rounded-full h-2 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-600 text-gray-700 w-5 text-right">{count}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['summary'],
    queryFn: () => employeeApi.getSummary(),
    refetchInterval: 60000,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.getAll(),
  });

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  if (isLoading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const d = summary?.data || {};
  const maxDept = Math.max(...(d.departmentStats || []).map((x) => x.count), 1);

  const recentEmployees = (employees?.data || []).slice(0, 5);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-sm text-gray-400">{today}</p>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>

        <p className="text-sm text-gray-500 mt-1">Welcome back. Here's today's overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 stagger">
        <StatCard label="Total Employees" value={d.totalEmployees ?? '—'} icon={Users} color="indigo" />
        <StatCard label="Present Today" value={d.presentToday ?? '—'} icon={UserCheck} color="emerald"
          trend={d.totalEmployees ? `${Math.round((d.presentToday / d.totalEmployees) * 100)}% attendance rate` : undefined} />
        <StatCard label="Absent Today" value={d.absentToday ?? '—'} icon={UserX} color="red" />
        <StatCard label="Not Yet Marked" value={d.notMarkedToday ?? '—'} icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Department breakdown */}
        <Card className="col-span-2 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-indigo-500" />
            <h2 className="text-sm font-600 text-gray-700">By Department</h2>
          </div>
          {d.departmentStats?.length > 0 ? (
            <div className="space-y-3">
              {d.departmentStats.map((dept) => (
                <DepartmentBar key={dept._id} name={dept._id} count={dept.count} max={maxDept} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
          )}
        </Card>

        {/* Recent employees */}
        <Card className="col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              <h2 className="text-sm font-600 text-gray-700">Recent Employees</h2>
            </div>
          </div>
          {recentEmployees.length > 0 ? (
            <div className="space-y-2">
              {recentEmployees.map((emp) => (
                <div key={emp._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <span className="text-xs font-700 text-indigo-600">
                        {emp.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-500 text-gray-800">{emp.fullName}</p>
                      <p className="text-xs text-gray-400">{emp.employeeId}</p>
                    </div>
                  </div>
                  <Badge variant="info">{emp.department}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No employees added yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}