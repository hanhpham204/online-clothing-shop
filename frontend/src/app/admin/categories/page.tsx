'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Category } from '@/types';
import toast from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/all');
      setCategories(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/categories', form);
      toast.success('Đã tạo danh mục');
      setShowForm(false);
      setForm({ name: '', slug: '', description: '' });
      fetchCategories();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>Quản Lý Danh Mục</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> Thêm danh mục
        </button>
      </div>

      {showForm && (
        <form onSubmit={createCategory} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tên</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Slug</label>
              <input className="form-input" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mô tả</label>
              <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary">Tạo</button>
          </div>
        </form>
      )}

      {loading ? <div>Đang tải...</div> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên danh mục</th>
              <th>Slug</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td style={{ fontWeight: 600 }}>{cat.name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{cat.slug}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>{cat.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
