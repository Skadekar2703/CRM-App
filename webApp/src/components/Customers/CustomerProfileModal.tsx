import React from 'react';
import { WebCustomer } from '../../types/customers';
import { getSignedPhotoUrl } from '../../utils/photoUtils';

interface CustomerProfileModalProps {
  customer: WebCustomer;
  onClose: () => void;
  onEdit: () => void;
  onOpenHistory?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customer,
  onClose,
  onEdit,
  onOpenHistory
}) => {
  const cleanMobile = customer.mobile.replace(/[^0-9]/g, '');
  const hasValidMobile = cleanMobile.length === 10;

  const [signedUrl, setSignedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (customer.photoUrl) {
      getSignedPhotoUrl(customer.photoUrl).then(url => setSignedUrl(url));
    } else {
      setSignedUrl(null);
    }
  }, [customer.photoUrl]);

  // CIBIL Dot Color
  const getCibilColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'bad': return '#EF4444';
      case 'low': return '#F97316';
      case 'medium': case 'average': return '#EAB308';
      default: return '#22C55E';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrPayload = `CRM-CUST-REF:${customer.id}:${customer.customerCode}`;
    const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Profile - ${customer.name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #0F172A; background: #FFF; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563EB; padding-bottom: 16px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: 800; color: #0F172A; margin: 0; }
            .subtitle { font-size: 14px; color: #64748B; margin-top: 4px; }
            .financial-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
            .fin-card { padding: 12px; border-radius: 8px; border: 1px solid #CBD5E1; text-align: center; }
            .fin-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; }
            .fin-val { font-size: 20px; font-weight: 800; margin-top: 4px; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .info-table td { padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
            .info-table td.label { font-weight: 700; color: #475569; width: 35%; background: #F8FAFC; }
            .qr-section { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; padding: 16px; border: 1px solid #E2E8F0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${customer.name}</div>
              <div class="subtitle">ID: ${customer.customerId} | Code: ${customer.customerCode} | Mobile: ${customer.mobile}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; color: #2563EB; font-size: 18px;">CRM CUSTOMER PROFILE</div>
              <div style="font-size: 12px; color: #64748B;">Date: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="financial-grid">
            <div class="fin-card">
              <div class="fin-label">Total Baki</div>
              <div class="fin-val" style="color: #DC2626;">₹${customer.baki.toLocaleString()}</div>
            </div>
            <div class="fin-card">
              <div class="fin-label">Total Jama</div>
              <div class="fin-val" style="color: #16A34A;">₹${customer.jama.toLocaleString()}</div>
            </div>
            <div class="fin-card">
              <div class="fin-label">Credit Limit</div>
              <div class="fin-val" style="color: #2563EB;">₹${(customer.creditLimit || 50000).toLocaleString()}</div>
            </div>
          </div>

          <table class="info-table">
            <tr><td class="label">Customer Full Name</td><td>${customer.name}</td></tr>
            <tr><td class="label">Customer ID / UID</td><td>${customer.customerId}</td></tr>
            <tr><td class="label">CD Code</td><td>${customer.customerCode}</td></tr>
            <tr><td class="label">Mobile Number</td><td>${customer.mobile}</td></tr>
            <tr><td class="label">Alternate Mobile</td><td>${customer.alternateMobile || 'N/A'}</td></tr>
            <tr><td class="label">Email Address</td><td>${customer.email || 'N/A'}</td></tr>
            <tr><td class="label">ID / CNC No.</td><td>${customer.idCncNo || 'N/A'}</td></tr>
            <tr><td class="label">CIBIL Status</td><td>${customer.cibilStatus} (Score: ${customer.cibilScore || 750})</td></tr>
            <tr><td class="label">Category</td><td>${customer.category || 'Customer'}</td></tr>
            <tr><td class="label">Credit Limit</td><td>₹${(customer.creditLimit || 50000).toLocaleString()}</td></tr>
            <tr><td class="label">Opening Balance</td><td>₹${(customer.openingBalance || 0).toLocaleString()}</td></tr>
            <tr><td class="label">Tax Number</td><td>${customer.taxNo || 'N/A'}</td></tr>
            <tr><td class="label">Udhar Wapisi Din</td><td>${customer.udharWapisiDin || 30} Days</td></tr>
            <tr><td class="label">Area / Location</td><td>${customer.area || 'Local Market'}</td></tr>
            <tr><td class="label">Full Address</td><td>${customer.address || 'N/A'}</td></tr>
            <tr><td class="label">Guarantor Name</td><td>${customer.guarantorName || 'N/A'}</td></tr>
            <tr><td class="label">Guarantor Mobile</td><td>${customer.guarantorMobile || 'N/A'}</td></tr>
            <tr><td class="label">Account Status</td><td>${customer.status}</td></tr>
            <tr><td class="label">Credit Blocked Status</td><td>${customer.creditBlocked ? 'BLOCKED' : 'Allowed'}</td></tr>
            <tr><td class="label">Remark / Description</td><td>${customer.remark || 'None'}</td></tr>
          </table>

          <div class="qr-section">
            <div>
              <div style="font-weight: 700;">Customer Verification QR</div>
              <div style="font-size: 12px; color: #64748B;">Contains secure reference identifier for fast lookup.</div>
            </div>
            <img src="${qrSvgUrl}" alt="Customer QR" style="width: 90px; height: 90px;" />
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const qrPayload = `CRM-CUST-REF:${customer.id}:${customer.customerCode}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrPayload)}`;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '720px', borderRadius: '16px', padding: '0', overflow: 'hidden', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
        {/* HEADER */}
        <div style={{ backgroundColor: 'var(--bg-app)', padding: '24px', position: 'relative', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={onClose} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>
            &times;
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {signedUrl ? (
              <img src={signedUrl} alt={customer.name} style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }} />
            ) : (
              <div style={{ width: '76px', height: '76px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--color-primary)' }}>
                {customer.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{customer.name}</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: 'var(--bg-card)', padding: '3px 8px', borderRadius: '6px', color: 'var(--color-primary)', fontWeight: 700, border: '1px solid var(--border-color)' }}>
                  ID: {customer.customerId}
                </span>
                <span>• {customer.customerCode}</span>
                <span>• {customer.area}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: getCibilColor(customer.cibilStatus) }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getCibilColor(customer.cibilStatus) }}></span>
                  CIBIL: {customer.cibilStatus}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            {hasValidMobile && (
              <>
                <a href={`tel:${cleanMobile}`} style={{ padding: '8px 14px', backgroundColor: '#16A34A', color: '#FFFFFF', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '12px' }}>
                  📞 Call
                </a>
                <a href={`https://wa.me/91${cleanMobile}`} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 14px', backgroundColor: '#25D366', color: '#FFFFFF', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '12px' }}>
                  📱 WhatsApp
                </a>
              </>
            )}
            {onOpenHistory && (
              <button type="button" onClick={onOpenHistory} style={{ padding: '8px 14px', backgroundColor: '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
                📜 History
              </button>
            )}
            <button type="button" onClick={onEdit} style={{ padding: '8px 14px', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>
              ✏️ Edit
            </button>
            <button type="button" onClick={handlePrint} style={{ padding: '8px 14px', backgroundColor: 'var(--bg-card)', color: 'var(--color-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', marginLeft: 'auto' }}>
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: '24px', maxHeight: '64vh', overflowY: 'auto' }}>
          {/* FINANCIAL SUMMARY */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-baki)', fontWeight: 700, textTransform: 'uppercase' }}>Total Baki</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-baki)', marginTop: '4px' }}>₹{customer.baki.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-jama)', fontWeight: 700, textTransform: 'uppercase' }}>Total Jama</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-jama)', marginTop: '4px' }}>₹{customer.jama.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Credit Limit</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>₹{(customer.creditLimit || 50000).toLocaleString()}</div>
            </div>
          </div>

          {/* GRID DETAILS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', backgroundColor: 'var(--bg-app)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>MOBILE NUMBER</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.mobile || 'N/A'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>ALTERNATE MOBILE</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.alternateMobile || 'N/A'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>EMAIL ADDRESS</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.email || 'N/A'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>ID / CNC NUMBER</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.idCncNo || 'N/A'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>CREDIT LIMIT</span>
              <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>₹{(customer.creditLimit || 50000).toLocaleString()}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>CATEGORY</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.category || 'Customer'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>OPENING BALANCE</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{(customer.openingBalance || 0).toLocaleString()}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>TAX NUMBER</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.taxNo || 'N/A'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>UDHAR WAPISI DIN</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.udharWapisiDin || 30} Days</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>AREA / LOCATION</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.area || 'Local Market'}</span>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>FULL ADDRESS</span>
              <span style={{ color: 'var(--text-secondary)' }}>{customer.address || 'N/A'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>GUARANTOR NAME</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.guarantorName || 'N/A'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>GUARANTOR MOBILE</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.guarantorMobile || 'N/A'}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>STATUS</span>
              <span style={{ fontWeight: 800, color: customer.status === 'Active' ? 'var(--color-jama)' : 'var(--text-muted)' }}>● {customer.status}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>CREDIT BLOCKED</span>
              <span style={{ fontWeight: 800, color: customer.creditBlocked ? 'var(--color-baki)' : 'var(--color-jama)' }}>{customer.creditBlocked ? 'YES (BLOCKED)' : 'NO (ALLOWED)'}</span>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, display: 'block' }}>REMARK</span>
              <span style={{ color: 'var(--text-secondary)' }}>{customer.remark || 'None'}</span>
            </div>
          </div>

          {/* QR VISUAL SECTION */}
          <div style={{ marginTop: '20px', backgroundColor: 'var(--bg-app)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary)' }}>CUSTOMER REFERENCE QR</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Contains unique encrypted customer reference token for POS scanning.</div>
            </div>
            <img src={qrSvgUrl} alt="Customer QR" style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: '#FFFFFF', padding: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
