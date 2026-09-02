import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { WebTransactionModal } from './WebTransactionModal';
import {
  ItemProduct,
  CustomerModel,
  CartItem,
  formatCurrency
} from '../../types/sales';
import './Sales.css';

interface WebNewSalePosViewProps {
  onSaleCompleted: () => void;
}

export const WebNewSalePosView: React.FC<WebNewSalePosViewProps> = ({ onSaleCompleted }) => {
  const [products, setProducts] = useState<ItemProduct[]>([]);
  const [customers, setCustomers] = useState<CustomerModel[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [completedTransaction, setCompletedTransaction] = useState<any | null>(null);

  // Add Item Modal State
  const [dbCategories, setDbCategories] = useState<string[]>(['Textiles', 'Hardware', 'Electronics', 'General']);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('General');
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);

  useEffect(() => {
    loadCatalogData();
  }, []);

  const loadCatalogData = async () => {
    try {
      const { data: dbProducts } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      const { data: dbCustomers } = await supabase.from('customers').select('*');
      const { data: dbCats } = await supabase.from('categories').select('name').order('name', { ascending: true });

      if (dbCats && dbCats.length > 0) {
        const catNames = dbCats.map((c: any) => c.name).filter(Boolean);
        if (catNames.length > 0) setDbCategories(catNames);
      }

      if (dbProducts) {
        setProducts(
          dbProducts.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category || 'General',
            price: Number(p.price || 0),
            stockQuantity: Number(p.stock_quantity || 0)
          }))
        );
      } else {
        setProducts([]);
      }

      if (dbCustomers && dbCustomers.length > 0) {
        const custs = dbCustomers.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          email: c.email || '',
          area: c.area || ''
        }));
        setCustomers(custs);
        setSelectedCustomerId(custs[0].id);
      } else {
        setCustomers([]);
        setSelectedCustomerId('');
      }
    } catch {
      setProducts([]);
      setCustomers([]);
      setSelectedCustomerId('');
    }
  };

  const categories = ['All', ...Array.from(new Set(dbCategories))];

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddItemError(null);

    const name = newItemName.trim();
    const price = parseFloat(newItemPrice);
    const stock = parseInt(newItemStock, 10);

    if (!name) {
      setAddItemError('Product Name is required.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setAddItemError('Price must be a valid number >= 0.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setAddItemError('Stock Quantity must be a valid integer >= 0.');
      return;
    }

    setIsSavingItem(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const sku = `SKU-${Date.now().toString().slice(-6)}`;
      const payload: any = {
        name,
        price,
        stock_quantity: stock,
        category: newItemCategory || 'General',
        sku,
        status: 'Active'
      };

      if (userId) {
        payload.user_id = userId;
      }

      const { error } = await supabase.from('items').insert(payload);
      if (error) throw error;

      setShowAddItemModal(false);
      setSuccessMessage(`Item "${name}" added successfully!`);
      loadCatalogData();
    } catch (err: any) {
      setAddItemError(err?.message || 'Failed to create item.');
    } finally {
      setIsSavingItem(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: ItemProduct) => {
    setStockWarning(null);
    if (product.stockQuantity <= 0) {
      setStockWarning(`"${product.name}" is out of stock.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          setStockWarning(`Insufficient stock for "${product.name}". Only ${product.stockQuantity} units available.`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setStockWarning(null);
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (delta > 0 && newQty > item.product.stockQuantity) {
              setStockWarning(`Insufficient stock for "${item.product.name}". Only ${item.product.stockQuantity} units available.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount + tax);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setStockWarning(null);

    const customer = customers.find(c => c.id === selectedCustomerId) || customers[0];

    try {
      const isCustUuid = /^[0-9a-fA-F-]{36}$/.test(customer.id);

      const rpcPayload = {
        p_customer_id: isCustUuid ? customer.id : null,
        p_customer_name: customer.name,
        p_subtotal: subtotal,
        p_discount: discount,
        p_tax: tax,
        p_total: total,
        p_payment_method: paymentMethod,
        p_items: cart.map(item => {
          const isItemUuid = /^[0-9a-fA-F-]{36}$/.test(item.product.id);
          return {
            item_id: isItemUuid ? item.product.id : null,
            item_name: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            unit_price: item.product.price,
            subtotal: item.product.price * item.quantity
          };
        })
      };

      const { data: rpcRes, error: rpcErr } = await supabase.rpc('complete_sale', rpcPayload);

      if (rpcErr) {
        setStockWarning(`Sale failed: ${rpcErr.message}`);
        setIsSubmitting(false);
        return;
      }

      const invoiceNo = rpcRes?.invoice_number || `INV-${Date.now().toString().slice(-6)}`;

      const transactionObj = {
        id: rpcRes?.id || `s_${Date.now()}`,
        invoiceNumber: invoiceNo,
        customerId: customer.id,
        customerName: customer.name,
        saleDate: 'Just now',
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        paymentMethod: paymentMethod,
        status: 'Completed',
        items: cart.map(item => ({
          id: `li_${item.product.id}`,
          itemId: item.product.id,
          itemName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          total: item.product.price * item.quantity
        }))
      };

      setCompletedTransaction(transactionObj);
      setCart([]);
      setDiscount(0);
      setTax(0);
      setSuccessMessage(`Sale completed! Invoice #${invoiceNo}`);
      onSaleCompleted();
      loadCatalogData();

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      setStockWarning(`Error completing sale: ${e?.message || 'Transaction error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pos-layout">
      {/* LEFT: CATALOG */}
      <div className="catalog-section">
        {/* HEADER ACTIONS */}
        <div className="catalog-header">
          <div className="search-input-wrapper">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="pos-search-input"
              placeholder="Search items by name or SKU..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="icon-btn-secondary" onClick={loadCatalogData} title="Refresh Inventory">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            className="btn-success-sm"
            onClick={() => {
              setNewItemName('');
              setNewItemPrice('');
              setNewItemStock('');
              setNewItemCategory(dbCategories[0] || 'General');
              setAddItemError(null);
              setShowAddItemModal(true);
            }}
            style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            + Add New Item
          </button>
        </div>

        {/* CATEGORIES */}
        <div className="category-chips">
          {categories.map(cat => (
            <button
              key={cat}
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* STOCK WARNING BANNER */}
        {stockWarning && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontWeight: 600, border: '1px solid #fca5a5' }}>
            ⚠️ {stockWarning}
          </div>
        )}

        {/* SUCCESS TOAST */}
        {successMessage && (
          <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: '10px', fontWeight: 600, border: '1px solid #bbf7d0' }}>
            ✓ {successMessage}
          </div>
        )}

        {/* PRODUCT GRID / EMPTY STATE */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', margin: '20px 0' }}>
            <svg width="48" height="48" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', display: 'block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#1e293b', fontWeight: 700 }}>No products found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>Add your first product to start making sales.</p>
            <button
              className="btn-success-sm"
              onClick={() => {
                setNewItemName('');
                setNewItemPrice('');
                setNewItemStock('');
                setNewItemCategory(dbCategories[0] || 'General');
                setAddItemError(null);
                setShowAddItemModal(true);
              }}
              style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              + Add New Item
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-card-top">
                  <div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-sku">SKU: {product.sku || 'N/A'}</div>
                  </div>

                  <span className={`stock-badge ${
                    product.stockQuantity <= 0 ? 'out-of-stock' : product.stockQuantity <= 5 ? 'low' : 'in-stock'
                  }`}>
                    {product.stockQuantity <= 0 ? 'Out of Stock' : product.stockQuantity <= 5 ? `Low Stock: ${product.stockQuantity}` : `Stock: ${product.stockQuantity}`}
                  </span>
                </div>

                <div className="product-card-bottom">
                  <div className="product-price">{formatCurrency(product.price)}</div>
                  <button
                    className="btn-add-product"
                    disabled={product.stockQuantity <= 0}
                    onClick={() => addToCart(product)}
                  >
                    {product.stockQuantity <= 0 ? 'Out of Stock' : '+ Add'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: CART PANEL */}
      <div className="cart-panel">
        <div className="cart-header">
          <span className="cart-title">Cart Summary</span>
          <span className="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)} Items</span>
        </div>

        {/* CART ITEMS LIST */}
        <div className="cart-items-list">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '13px' }}>
              Cart is empty. Add products from the left catalog.
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="cart-item-row">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.product.name}</span>
                  <span className="cart-item-unit-price">
                    {formatCurrency(item.product.price)} × {item.quantity} = {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>

                <div className="cart-qty-controls">
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.id, -1)}>-</button>
                  <span className="cart-qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.id, 1)}>+</button>
                  <button className="btn-remove-item" onClick={() => removeFromCart(item.product.id)}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CHECKOUT FORM */}
        <div className="checkout-form">
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.area ? `(${c.area})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sale Date</label>
            <input
              type="date"
              className="form-input"
              value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
            />
          </div>

          {/* PRICING BREAKDOWN */}
          <div className="pricing-summary">
            <div className="pricing-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="pricing-row">
              <span>Discount (₹)</span>
              <input
                type="number"
                style={{ width: '70px', padding: '2px 6px', fontSize: '12px' }}
                value={discount}
                onChange={e => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="pricing-row">
              <span>Tax / GST (₹)</span>
              <input
                type="number"
                style={{ width: '70px', padding: '2px 6px', fontSize: '12px' }}
                value={tax}
                onChange={e => setTax(Number(e.target.value) || 0)}
              />
            </div>
            <div className="pricing-row total">
              <span>Total Payable</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <div className="payment-method-selector">
              {(['Cash', 'Card', 'UPI'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  className={`payment-btn ${paymentMethod === mode ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-complete-sale"
            disabled={cart.length === 0 || isSubmitting}
            onClick={handleCompleteSale}
          >
            {isSubmitting ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>

      <WebTransactionModal
        transaction={completedTransaction}
        onClose={() => setCompletedTransaction(null)}
      />

      {showAddItemModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 700 }}>+ Add New Item</h3>

            {addItemError && (
              <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                ⚠️ {addItemError}
              </div>
            )}

            <form onSubmit={handleSaveNewItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Product Name *</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="e.g. Basmati Rice 5kg"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newItemPrice}
                    onChange={e => setNewItemPrice(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItemStock}
                    onChange={e => setNewItemStock(e.target.value)}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Category</label>
                <select
                  value={newItemCategory}
                  onChange={e => setNewItemCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}
                >
                  {dbCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  disabled={isSavingItem}
                  onClick={() => setShowAddItemModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingItem}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSavingItem ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
