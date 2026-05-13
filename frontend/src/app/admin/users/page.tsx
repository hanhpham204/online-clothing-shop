'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${id}/status`, { isActive: !isActive });
      toast.success('Đã cập nhật trạng thái');
      fetchUsers();
    } catch {}
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '2rem' }}>Quản Lý Người Dùng</h1>

      {loading ? <div>Đang tải...</div> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td style={{ fontWeight: 600 }}>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.phone || '—'}</td>
                <td>
                  <span className="status-badge" style={{
                    background: user.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: user.role === 'ADMIN' ? '#8b5cf6' : '#3b82f6'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className="status-badge" style={{
                    background: user.isActive ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: user.isActive ? '#059669' : '#ef4444'
                  }}>
                    {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline btn-sm"
                    onClick={() => toggleStatus(user.id, user.isActive)}>
                    {user.isActive ? 'Khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
