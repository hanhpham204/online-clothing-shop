'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Product, Category } from '@/types';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiTrash2, FiEdit, FiPlus, FiX, FiImage, FiUpload } from 'react-icons/fi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface VariantForm {
  size: string;
  color: string;
  colorCode: string;
  sku: string;
  stockQuantity: number;
  additionalPrice: number;
}

interface ProductForm {
  name: string;
  description: string;
  material: string;
  brand: string;
  categoryId: number | null;
  basePrice: number;
  salePrice: number | null;
  isFeatured: boolean;
  variants: VariantForm[];
}

const emptyVariant: VariantForm = {
  size: '', color: '', colorCode: '#000000', sku: '', stockQuantity: 0, additionalPrice: 0,
};

const emptyForm: ProductForm = {
  name: '', description: '', material: '', brand: '',
  categoryId: null, basePrice: 0, salePrice: null,
  isFeatured: false, variants: [{ ...emptyVariant }],
};

// Resolve image URL — handles both relative API paths and absolute URLs
function resolveImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  // Relative path like /api/products/images/123
  return API_BASE.replace('/api', '') + imageUrl;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?page=0&size=100');
      setProducts(res.data.data.content || []);
    } catch {} finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || []);
    } catch {}
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Đã xóa sản phẩm');
      fetchProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm, variants: [{ ...emptyVariant }] });
    setPendingFiles([]);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      material: product.material || '',
      brand: product.brand || '',
      categoryId: product.categoryId || null,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      isFeatured: product.isFeatured,
      variants: product.variants.length > 0
        ? product.variants.map(v => ({
            size: v.size, color: v.color, colorCode: v.colorCode || '#000000',
            sku: v.sku || '', stockQuantity: v.stockQuantity, additionalPrice: v.additionalPrice,
          }))
        : [{ ...emptyVariant }],
    });
    setPendingFiles([]);
    setShowModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: vượt quá 5MB`);
        return false;
      }
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name}: không phải file ảnh`);
        return false;
      }
      return true;
    });
    setPendingFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToProduct = async (productId: number) => {
    if (pendingFiles.length === 0) return;
    setUploadingImages(true);
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const formData = new FormData();
        formData.append('file', pendingFiles[i]);
        formData.append('isPrimary', i === 0 ? 'true' : 'false');
        await api.post(`/admin/products/${productId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(`${pendingFiles.length} ảnh đã được tải lên`);
      setPendingFiles([]);
    } catch (e: any) {
      toast.error('Lỗi upload ảnh: ' + (e.response?.data?.message || e.message));
    } finally {
      setUploadingImages(false);
    }
  };

  const deleteImage = async (imageId: number) => {
    if (!confirm('Xóa ảnh này?')) return;
    try {
      await api.delete(`/admin/products/images/${imageId}`);
      toast.success('Đã xóa ảnh');
      fetchProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi xóa ảnh');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Tên sản phẩm không được trống'); return; }
    if (form.basePrice <= 0) { toast.error('Giá gốc phải lớn hơn 0'); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        material: form.material.trim() || null,
        brand: form.brand.trim() || null,
        categoryId: form.categoryId,
        basePrice: form.basePrice,
        salePrice: form.salePrice && form.salePrice > 0 ? form.salePrice : null,
        isFeatured: form.isFeatured,
        variants: form.variants.filter(v => v.size.trim() && v.color.trim()).map(v => ({
          size: v.size.trim(),
          color: v.color.trim(),
          colorCode: v.colorCode || null,
          sku: v.sku.trim() || null,
          stockQuantity: v.stockQuantity || 0,
          additionalPrice: v.additionalPrice || 0,
        })),
        imageUrls: [], // Images are now uploaded separately via multipart
      };

      let productId: number;
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload);
        productId = editingId;
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        const res = await api.post('/admin/products', payload);
        productId = res.data.data.id;
        toast.success('Thêm sản phẩm thành công');
      }

      // Upload pending images
      if (pendingFiles.length > 0) {
        await uploadImagesToProduct(productId);
      }

      setShowModal(false);
      fetchProducts();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.data || 'Lỗi';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  // Variant helpers
  const addVariant = () => setForm({ ...form, variants: [...form.variants, { ...emptyVariant }] });
  const removeVariant = (i: number) => setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) });
  const updateVariant = (i: number, field: keyof VariantForm, value: any) => {
    const variants = [...form.variants];
    variants[i] = { ...variants[i], [field]: value };
    setForm({ ...form, variants });
  };

  // Find the product being edited
  const editingProduct = editingId ? products.find(p => p.id === editingId) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>Quản Lý Sản Phẩm</h1>
        <button className="btn btn-primary" onClick={openCreateModal}><FiPlus /> Thêm sản phẩm</button>
      </div>

      {loading ? <div>Đang tải...</div> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá gốc</th>
              <th>Giá bán</th>
              <th>Lượt xem</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
                      {product.images?.[0]?.imageUrl && (
                        <img src={resolveImageUrl(product.images[0].imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{product.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{product.slug}</div>
                    </div>
                  </div>
                </td>
                <td>{product.categoryName}</td>
                <td>{formatPrice(product.basePrice)}</td>
                <td style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{formatPrice(product.effectivePrice)}</td>
                <td>{product.viewCount}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEditModal(product)}><FiEdit /></button>
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--color-error)' }}
                      onClick={() => deleteProduct(product.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
            padding: '2rem', width: '90%', maxWidth: 720,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
                {editingId ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}><FiX /></button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Tên sản phẩm *</label>
                  <input className="form-input" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá gốc (VND) *</label>
                  <input className="form-input" type="number" min="1" value={form.basePrice}
                    onChange={e => setForm({ ...form, basePrice: Number(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá khuyến mãi (VND)</label>
                  <input className="form-input" type="number" min="0" value={form.salePrice ?? ''}
                    onChange={e => setForm({ ...form, salePrice: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Thương hiệu</label>
                  <input className="form-input" value={form.brand}
                    onChange={e => setForm({ ...form, brand: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Chất liệu</label>
                  <input className="form-input" value={form.material}
                    onChange={e => setForm({ ...form, material: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select className="form-input" value={form.categoryId ?? ''}
                    onChange={e => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'end' }}>
                  <input type="checkbox" id="isFeatured" checked={form.isFeatured}
                    onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                  <label htmlFor="isFeatured">Sản phẩm nổi bật</label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-input" rows={3} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>

              {/* Image Upload Section */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ margin: 0 }}><FiImage style={{ marginRight: 4 }} /> Ảnh sản phẩm</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                    <FiUpload /> Chọn ảnh
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFileSelect} />
                </div>

                {/* Existing images (when editing) */}
                {editingProduct && editingProduct.images.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Ảnh hiện tại:</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {editingProduct.images.map(img => (
                        <div key={img.id} style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: img.isPrimary ? '2px solid var(--color-accent)' : '1px solid var(--color-border-light)' }}>
                          <img src={resolveImageUrl(img.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => deleteImage(img.id)}
                            style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%',
                              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                            <FiX />
                          </button>
                          {img.isPrimary && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'var(--color-accent)', color: '#fff', fontSize: '8px',
                            textAlign: 'center', padding: '1px' }}>Chính</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending files to upload */}
                {pendingFiles.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                      Ảnh mới ({pendingFiles.length} file):
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {pendingFiles.map((file, i) => (
                        <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden', border: '2px dashed var(--color-accent)' }}>
                          <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removePendingFile(i)}
                            style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%',
                              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                            <FiX />
                          </button>
                          <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)',
                            color: '#fff', fontSize: '8px', textAlign: 'center', padding: '1px', whiteSpace: 'nowrap',
                            overflow: 'hidden', textOverflow: 'ellipsis' }}>{(file.size / 1024).toFixed(0)}KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                  Chấp nhận: JPEG, PNG, GIF, WebP. Tối đa 5MB/ảnh.
                </div>
              </div>

              {/* Variants */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Biến thể (Size / Màu)</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addVariant}>+ Thêm biến thể</button>
                </div>
                {form.variants.map((v, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr 80px 100px 32px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input className="form-input" placeholder="Size (S,M,L...)" value={v.size}
                      onChange={e => updateVariant(i, 'size', e.target.value)} />
                    <input className="form-input" placeholder="Màu sắc" value={v.color}
                      onChange={e => updateVariant(i, 'color', e.target.value)} />
                    <input type="color" value={v.colorCode} style={{ width: 40, height: 36, border: 'none', cursor: 'pointer' }}
                      onChange={e => updateVariant(i, 'colorCode', e.target.value)} />
                    <input className="form-input" placeholder="SKU" value={v.sku}
                      onChange={e => updateVariant(i, 'sku', e.target.value)} />
                    <input className="form-input" type="number" min="0" placeholder="Tồn kho" value={v.stockQuantity}
                      onChange={e => updateVariant(i, 'stockQuantity', Number(e.target.value))} />
                    <input className="form-input" type="number" min="0" placeholder="Giá thêm" value={v.additionalPrice}
                      onChange={e => updateVariant(i, 'additionalPrice', Number(e.target.value))} />
                    {form.variants.length > 1 && (
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                        onClick={() => removeVariant(i)}><FiX /></button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || uploadingImages}>
                  {submitting ? 'Đang lưu...' : uploadingImages ? 'Đang tải ảnh...' : (editingId ? 'Cập nhật' : 'Thêm sản phẩm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
