import React, { useState, useMemo, useEffect } from 'react';
import { WebCustomer, CIBIL_OPTIONS } from '../../types/customers';
import { CustomerModal } from './CustomerModal';
import { CustomerProfileModal } from './CustomerProfileModal';
import { CustomerHistoryModal } from './CustomerHistoryModal';
import { CustomerDeleteModal } from './CustomerDeleteModal';
import { supabase } from '../../lib/supabase';
import { getSignedPhotoUrl } from '../../utils/photoUtils';

const CustomerCardAvatar: React.FC<{ photoUrl?: string | null; name: string }> = ({ photoUrl, name }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (photoUrl) {
      getSignedPhotoUrl(photoUrl).then(url => setSignedUrl(url));
    } else {
      setSignedUrl(null);
    }
  }, [photoUrl]);

  if (signedUrl) {
    return <img src={signedUrl} alt={name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38BDF8' }} />;
  }

  const initials = name ? name.trim().substring(0, 2).toUpperCase() : 'CU';

  return (
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      border: '2px solid #38BDF8'
    }}>
      {initials}
    </div>
  );
};

export const WebCustomersScreen: React.FC = () => {
  const [customers, setCustomers] = useState<WebCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  // FILTERS
  const [areaFilter, setAreaFilter] = useState('All');
  const [cibilFilter, setCibilFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dbCategoryOptions, setDbCategoryOptions] = useState<string[]>([]);
  const [dbAreaOptions, setDbAreaOptions] = useState<string[]>([]);

  const availableAreas = useMemo(() => {
    const areasSet = new Set<string>(dbAreaOptions);
    customers.forEach(c => {
      if (c.area && c.area.trim()) {
        areasSet.add(c.area.trim());
      }
    });
    return ['All', ...Array.from(areasSet).sort()];
  }, [dbAreaOptions, customers]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // MODALS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<WebCustomer | null>(null);
  const [profileCustomer, setProfileCustomer] = useState<WebCustomer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<WebCustomer | null>(null);
  const [deleteTargetCustomer, setDeleteTargetCustomer] = useState<WebCustomer | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // FETCH SUPABASE CUSTOMERS FOR AUTHENTICATED BUSINESS
  const fetchCustomersFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: WebCustomer[] = data.map((item: any, idx: number) => {
          const rawBaki = Number(item.baki || 0);
          const rawJama = Number(item.jama || 0);
          const currentBaki = rawBaki - rawJama;
          const cid = item.customer_id || String(100001 + idx);
          const ccode = item.customer_code || `Cd${cid.padStart(12, '0')}`;

          return {
            id: item.id,
            customerId: cid,
            customerCode: ccode,
            name: item.name || 'Customer',
            mobile: item.phone || item.mobile || '',
            alternateMobile: item.alternate_mobile || '',
            email: item.email || '',
            idCncNo: item.id_cnc_no || '',
            photoUrl: item.photo_url || null,
            cibilStatus: (item.cibil_status || 'Good') as any,
            cibilScore: Number(item.cibil_score || 750),
            category: item.category || 'Customer',
            categoryId: item.category_id || null,
            creditLimit: Number(item.credit_limit || 50000),
            openingBalance: Number(item.opening_balance || 0),
            taxNo: item.tax_no || '',
            udharWapisiDin: Number(item.udhar_wapisi_din || 30),
            address: item.address || '',
            area: item.area || '',
            areaId: item.area_id || null,
            remark: item.remark || '',
            guarantorName: item.guarantor_name || '',
            guarantorMobile: item.guarantor_mobile || '',
            baki: currentBaki,
            jama: rawJama,
            outstanding: currentBaki,
            lastTxnDate: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Recent',
            status: (item.status || 'Active') as any,
            creditBlocked: Boolean(item.credit_blocked)
          };
        });
        setCustomers(mapped);
      } else {
        setCustomers([]);
      }
    } catch (e) {
      console.error('Supabase read error', e);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const [businessId, setBusinessId] = useState<string>('00000000-0000-0000-0000-000000000001');

  useEffect(() => {
    fetchCustomersFromSupabase();

    const fetchRoleAndBusiness = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: member } = await supabase
            .from('business_members')
            .select('role, business_id')
            .eq('id', user.id)
            .maybeSingle();

          if (member?.business_id) {
            setBusinessId(member.business_id);
          }
          if (member?.role && String(member.role).toUpperCase() === 'ADMIN') {
            setUserRole('ADMIN');
          } else {
            setUserRole('STAFF');
          }
        }
      } catch (e) {
        setUserRole('STAFF');
      }
    };
    fetchRoleAndBusiness();
  }, []);

  const handleConfirmDeleteCustomer = async (cust: WebCustomer) => {
    if (userRole !== 'ADMIN') {
      showToast('⚠️ Only Admin can delete customer details.');
      return;
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', cust.id);

    if (error) throw error;

    showToast(`Customer "${cust.name}" deleted permanently.`);
    fetchCustomersFromSupabase();
  };

  const handleSaveCustomer = async (data: Partial<WebCustomer>) => {
    const activeBusinessId = businessId || '00000000-0000-0000-0000-000000000001';

    if (editingCustomer) {
      if (userRole !== 'ADMIN') {
        showToast('⚠️ Only Admin can edit customer details.');
        return;
      }

      const { error } = await supabase
        .from('customers')
        .update({
          name: data.name,
          phone: data.mobile,
          alternate_mobile: data.alternateMobile,
          email: data.email,
          id_cnc_no: data.idCncNo,
          customer_code: data.customerCode,
          photo_url: data.photoUrl,
          cibil_status: data.cibilStatus,
          cibil_score: data.cibilScore,
          category: data.category,
          category_id: data.categoryId || null,
          credit_limit: data.creditLimit,
          opening_balance: data.openingBalance,
          tax_no: data.taxNo,
          udhar_wapisi_din: data.udharWapisiDin,
          address: data.address,
          area: data.area,
          area_id: data.areaId || null,
          remark: data.remark,
          guarantor_name: data.guarantorName,
          guarantor_mobile: data.guarantorMobile,
          status: data.status,
          credit_blocked: data.creditBlocked,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;
      showToast(`Customer "${data.name}" updated successfully.`);
    } else {
      const { error } = await supabase.rpc('create_customer_v2', {
        p_business_id: activeBusinessId,
        p_customer_code: data.customerCode,
        p_name: data.name,
        p_phone: data.mobile,
        p_alternate_mobile: data.alternateMobile || '',
        p_email: data.email || '',
        p_id_cnc_no: data.idCncNo || '',
        p_photo_url: data.photoUrl || null,
        p_cibil_status: data.cibilStatus || 'Good',
        p_cibil_score: data.cibilScore || 750,
        p_category: data.category || 'Customer',
        p_credit_limit: data.creditLimit || 50000,
        p_opening_balance: data.openingBalance || 0,
        p_tax_no: data.taxNo || '',
        p_udhar_wapisi_din: data.udharWapisiDin || 30,
        p_address: data.address || '',
        p_area: data.area || 'Local Market',
        p_remark: data.remark || '',
        p_guarantor_name: data.guarantorName || '',
        p_guarantor_mobile: data.guarantorMobile || '',
        p_status: data.status || 'Active',
        p_credit_blocked: Boolean(data.creditBlocked)
      });

      if (error) throw error;
      showToast(`New customer "${data.name}" created successfully.`);
    }

    fetchCustomersFromSupabase();
  };

  useEffect(() => {
    supabase
      .from('categories')
      .select('name')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          const names = Array.from(new Set(data.map((c: any) => c.name).filter(Boolean)));
          setDbCategoryOptions(names);
        }
      });

    supabase
      .from('areas')
      .select('name')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          const names = Array.from(new Set(data.map((a: any) => a.name).filter(Boolean)));
          setDbAreaOptions(names);
        }
      });
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q);

      const matchesArea = areaFilter === 'All' || c.area === areaFilter;
      const matchesCibil = cibilFilter === 'All' || c.cibilStatus === cibilFilter;
      const matchesCategory = categoryFilter === 'All' || c.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

      return matchesSearch && matchesArea && matchesCibil && matchesCategory && matchesStatus;
    });
  }, [customers, searchQuery, areaFilter, cibilFilter, categoryFilter, statusFilter]);

  // TOP SUMMARY CARDS (EXACTLY 3)
  const totalBaki = useMemo(() => customers.reduce((sum, c) => sum + (c.baki || 0), 0), [customers]);
  const activeCount = useMemo(() => customers.filter((c) => (c.status || 'Active').toLowerCase() === 'active').length, [customers]);

  const getCibilColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'bad': return '#EF4444';
      case 'low': return '#F97316';
      case 'medium': case 'average': return '#EAB308';
      default: return '#22C55E';
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-app)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {toastMsg && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: 'var(--bg-card)', color: 'var(--color-primary)', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 10px 25px var(--shadow-color)', zIndex: 9999, fontWeight: 700, border: '1px solid var(--border-color)' }}>
          ✅ {toastMsg}
        </div>
      )}

      {/* HEADER SECTION */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Customer Directory</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Manage customer cards, credit limits, account statuses, and native history statements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 800,
            borderRadius: '10px',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span> Add Customer
        </button>
      </div>

      {/* TOP SUMMARY CARDS (EXACTLY THREE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* CARD 1: TOTAL CUSTOMERS */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px var(--shadow-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>TOTAL CUSTOMERS</span>
            <span style={{ fontSize: '20px' }}>👥</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{customers.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700, marginTop: '4px' }}>Registered Accounts</div>
        </div>

        {/* CARD 2: ACTIVE CUSTOMERS */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px var(--shadow-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ACTIVE CUSTOMERS</span>
            <span style={{ fontSize: '20px' }}>🟢</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-jama)' }}>{activeCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-jama)', fontWeight: 700, marginTop: '4px' }}>In Good Standing</div>
        </div>

        {/* CARD 3: TOTAL BAKI */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px var(--shadow-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>TOTAL BAKI</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-baki)' }}>₹</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-baki)' }}>₹{totalBaki.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-baki)', fontWeight: 700, marginTop: '4px' }}>Total Receivable Due</div>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
        backgroundColor: 'var(--bg-card)',
        padding: '16px',
        borderRadius: '14px',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', gridColumn: 'span 2' }}>
          <input
            type="text"
            placeholder="Search by name, ID (100003), CD Code (Cd...), mobile, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', width: '100%', fontSize: '13px' }}
          />
          <svg width="18" height="18" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ position: 'absolute', left: '12px', top: '12px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Area Filter */}
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} style={{ height: '42px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', padding: '0 10px' }}>
          <option value="All">Area: All Areas</option>
          {availableAreas.filter(a => a !== 'All').map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* CIBIL Filter */}
        <select value={cibilFilter} onChange={(e) => setCibilFilter(e.target.value)} style={{ height: '42px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', padding: '0 10px' }}>
          <option value="All">CIBIL: All Statuses</option>
          {CIBIL_OPTIONS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ height: '42px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', padding: '0 10px' }}>
          <option value="All">Category: All Categories</option>
          {dbCategoryOptions.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: '42px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', padding: '0 10px' }}>
          <option value="All">Status: All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* CUSTOMER CARDS GRID */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-primary)', fontWeight: 700, fontSize: '16px' }}>
          Loading customer accounts from Supabase...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>No customers found</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>Try adjusting your search criteria or add a new customer card.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredCustomers.map((cust) => {
            const cibilColor = getCibilColor(cust.cibilStatus);

            return (
              <div
                key={cust.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px var(--shadow-color)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div>
                  {/* CARD HEADER: PHOTO + NAME + ID + MOBILE + AREA + CATEGORY */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                    <CustomerCardAvatar photoUrl={cust.photoUrl} name={cust.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cust.name}
                        </h3>
                        <span style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                          {cust.category || 'Customer'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700, marginTop: '2px' }}>
                        ID: {cust.customerId}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        Mobile: {cust.mobile || 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        Area: {cust.area || 'Local Market'}
                      </div>
                    </div>
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', marginBottom: '14px' }}></div>

                  {/* CIBIL SCORE & CREDIT LIMIT */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    {/* CIBIL ON SINGLE LINE */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cibilColor, display: 'inline-block' }}></span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: cibilColor, textTransform: 'uppercase' }}>
                        CIBIL: {cust.cibilStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Limit: <strong style={{ color: 'var(--text-primary)' }}>₹{cust.creditLimit.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {/* BAKI & JAMA BALANCES */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-baki)' }}>BAKI</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-baki)', marginTop: '2px' }}>
                        ₹{cust.baki.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-jama)' }}>JAMA</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-jama)', marginTop: '2px' }}>
                        ₹{cust.jama.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* STATUS DOT & CREDIT BLOCK BADGE */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: cust.status === 'Active' ? 'var(--color-jama)' : 'var(--text-muted)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cust.status === 'Active' ? 'var(--color-jama)' : 'var(--text-muted)' }}></span>
                      Status: {cust.status}
                    </div>

                    {cust.creditBlocked && (
                      <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-baki)', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--color-baki)' }}>
                        🔒 CREDIT BLOCKED
                      </span>
                    )}
                  </div>
                </div>

                {/* FOUR ACTION BUTTONS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setProfileCustomer(cust)}
                    style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 800, borderRadius: '8px', backgroundColor: 'var(--bg-surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistoryCustomer(cust)}
                    style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 800, borderRadius: '8px', backgroundColor: '#7C3AED', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                  >
                    History
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (userRole !== 'ADMIN') {
                        showToast('⚠️ Only Admin can edit customer details.');
                        return;
                      }
                      setEditingCustomer(cust);
                      setIsModalOpen(true);
                    }}
                    style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 800, borderRadius: '8px', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (userRole !== 'ADMIN') {
                        showToast('⚠️ Only Admin can delete customer details.');
                        return;
                      }
                      setDeleteTargetCustomer(cust);
                    }}
                    style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 800, borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-baki)', border: '1px solid var(--color-baki)', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      <CustomerModal
        isOpen={isModalOpen}
        editingCustomer={editingCustomer}
        availableAreas={availableAreas}
        userRole={userRole}
        businessId={businessId}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
      />

      {profileCustomer && (
        <CustomerProfileModal
          customer={profileCustomer}
          onClose={() => setProfileCustomer(null)}
          onEdit={() => {
            if (userRole !== 'ADMIN') {
              showToast('⚠️ Only Admin can edit customer details.');
              return;
            }
            setEditingCustomer(profileCustomer);
            setProfileCustomer(null);
            setIsModalOpen(true);
          }}
          onOpenHistory={() => {
            setHistoryCustomer(profileCustomer);
            setProfileCustomer(null);
          }}
        />
      )}

      {historyCustomer && (
        <CustomerHistoryModal
          isOpen={Boolean(historyCustomer)}
          customer={historyCustomer}
          onClose={() => setHistoryCustomer(null)}
        />
      )}

      {deleteTargetCustomer && (
        <CustomerDeleteModal
          isOpen={Boolean(deleteTargetCustomer)}
          customer={deleteTargetCustomer}
          userRole={userRole}
          onClose={() => setDeleteTargetCustomer(null)}
          onConfirmDelete={handleConfirmDeleteCustomer}
        />
      )}
    </div>
  );
};
