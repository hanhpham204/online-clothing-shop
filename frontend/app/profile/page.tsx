'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Address } from '@/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiMapPin, FiPlus, FiEdit2, FiTrash2, FiStar, FiCheck } from 'react-icons/fi';

type Tab = 'profile' | 'password' | 'addresses';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadUser, fetchProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '', phone: '', province: '', district: '', ward: '', streetAddress: '', isDefault: false,
  });

  useEffect(() => {
    loadUser();
    // Also fetch fresh profile from server
    if (typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
      fetchProfile();
    }
  }, []);

  useEffect(() => {
    if (isLoading) return; // Wait for loading to complete
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated]);

  // Handle hash navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#addresses') {
      setActiveTab('addresses');
    }
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.data || []);
    } catch { /* ignore */ }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/users/me', { fullName, phone });
      const updatedUser = res.data.data;
      // Update localStorage and store
      localStorage.setItem('user', JSON.stringify(updatedUser));
      loadUser();
      toast.success('Cập nhật thông tin thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({ fullName: '', phone: '', province: '', district: '', ward: '', streetAddress: '', isDefault: false });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, addressForm);
        toast.success('Cập nhật địa chỉ thành công!');
      } else {
        await api.post('/addresses', addressForm);
        toast.success('Thêm địa chỉ thành công!');
      }
      await fetchAddresses();
      resetAddressForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lưu địa chỉ thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Xóa địa chỉ thành công!');
      await fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      streetAddress: addr.streetAddress,
      isDefault: addr.isDefault,
    });
    setShowAddressForm(true);
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="profile-page"><div className="profile-container"><p>Đang tải...</p></div></div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" />
              ) : (
                <span>{user.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <div>
              <h1>{user.fullName}</h1>
              <p className="profile-email">{user.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <button className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
              <FiUser /> Thông tin
            </button>
            <button className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
              <FiLock /> Đổi mật khẩu
            </button>
            <button className={`profile-tab ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>
              <FiMapPin /> Địa chỉ
            </button>
          </div>

          {/* Tab Content */}
          <div className="profile-content">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <h2>Thông tin cá nhân</h2>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={user.email} disabled style={{ opacity: 0.6 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Họ và tên</label>
                  <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="profile-form">
                <h2>Đổi mật khẩu</h2>
                <div className="form-group">
                  <label className="form-label">Mật khẩu hiện tại</label>
                  <input className="form-input" type="password" value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input className="form-input" type="password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu mới</label>
                  <input className="form-input" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>Địa chỉ giao hàng</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => { resetAddressForm(); setShowAddressForm(true); }}>
                    <FiPlus /> Thêm địa chỉ
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="address-form">
                    <h3>{editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Họ tên người nhận</label>
                        <input className="form-input" value={addressForm.fullName}
                          onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Số điện thoại</label>
                        <input className="form-input" value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Tỉnh/Thành phố</label>
                        <input className="form-input" value={addressForm.province}
                          onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quận/Huyện</label>
                        <input className="form-input" value={addressForm.district}
                          onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Phường/Xã</label>
                        <input className="form-input" value={addressForm.ward}
                          onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Địa chỉ cụ thể</label>
                        <input className="form-input" value={addressForm.streetAddress}
                          onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
                        Đặt làm địa chỉ mặc định
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={resetAddressForm}>Hủy</button>
                    </div>
                  </form>
                )}

                {/* Address list */}
                <div className="address-list">
                  {addresses.length === 0 && !showAddressForm && (
                    <div className="empty-state">
                      <FiMapPin style={{ fontSize: '3rem', color: 'var(--color-text-muted)' }} />
                      <p>Chưa có địa chỉ nào. Thêm địa chỉ giao hàng để đặt hàng nhanh hơn.</p>
                    </div>
                  )}
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`address-card ${addr.isDefault ? 'address-default' : ''}`}>
                      <div className="address-card-body">
                        <div className="address-card-header">
                          <strong>{addr.fullName}</strong>
                          {addr.isDefault && <span className="default-badge"><FiCheck /> Mặc định</span>}
                        </div>
                        <p className="address-phone">{addr.phone}</p>
                        <p className="address-detail">
                          {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                      </div>
                      <div className="address-card-actions">
                        <button className="btn btn-sm btn-outline" onClick={() => handleEditAddress(addr)}>
                          <FiEdit2 /> Sửa
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => handleDeleteAddress(addr.id)}
                          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
                          <FiTrash2 /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
