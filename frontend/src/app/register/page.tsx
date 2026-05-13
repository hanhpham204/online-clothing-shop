'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName, form.phone);
      toast.success('Đăng ký thành công!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">
        <h1>Đăng Ký</h1>
        <p className="subtitle">Tạo tài khoản VogueStore</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Họ và tên</label>
            <input type="text" name="fullName" className="form-input" placeholder="Nguyễn Văn A"
              value={form.fullName} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-input" placeholder="your@email.com"
              value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input type="tel" name="phone" className="form-input" placeholder="0901234567"
              value={form.phone} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input type="password" name="password" className="form-input" placeholder="Ít nhất 6 ký tự"
              value={form.password} onChange={handleChange} required minLength={6} />
          </div>

          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu</label>
            <input type="password" name="confirmPassword" className="form-input" placeholder="Nhập lại mật khẩu"
              value={form.confirmPassword} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div className="auth-link">
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
