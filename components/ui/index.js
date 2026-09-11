import { useState } from 'react';
import { CheckCircle2, XCircle, Info, TrendingUp, Check } from 'lucide-react';

// ─── Logo ─────────────────────────────────────────────────────
export function JobSnapLogo({ size = 32, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="/logo-icon.png" alt="JobSnap" width={size} height={size} style={{ width: size, height: size, borderRadius: size * 0.22, flexShrink: 0 }} />
      {showText && (
        <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: size * 0.55, color: '#1e3a5f', letterSpacing: '-0.5px' }}>
          Job<span style={{ color: '#2563eb' }}>Snap</span>
        </span>
      )}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', fullWidth, disabled, loading, style = {}, type = 'button' }) {
  const [pressed, setPressed] = useState(false);
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13, borderRadius: 10 },
    md: { padding: '13px 22px', fontSize: 15, borderRadius: 12 },
    lg: { padding: '16px 28px', fontSize: 16, borderRadius: 14 },
  };
  const variants = {
    primary: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', border: 'none' },
    secondary: { background: '#f1f5f9', color: '#1e3a5f', border: '1.5px solid #e2e8f0', boxShadow: 'none' },
    outline: { background: 'transparent', color: '#2563eb', border: '1.5px solid #2563eb', boxShadow: 'none' },
    ghost: { background: 'transparent', color: '#64748b', border: 'none', boxShadow: 'none' },
    danger: { background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', boxShadow: 'none' },
    success: { background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0', boxShadow: 'none' },
    orange: { background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', boxShadow: '0 4px 14px rgba(249,115,22,0.3)', border: 'none' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontWeight: 700, cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
        width: fullWidth ? '100%' : undefined,
        transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        opacity: disabled ? 0.5 : 1,
        ...sizes[size], ...variants[variant], ...style,
      }}
    >
      {loading ? <Spinner size={16} color={variant === 'primary' || variant === 'orange' ? '#fff' : '#2563eb'} /> : children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type = 'text', multiline, required, error, hint, style = {}, inputStyle = {}, rows = 3, name, autoComplete }) {
  return (
    <div style={{ marginBottom: 16, minWidth: 0, maxWidth: '100%', ...style }}>
      {label && (
        <label style={{ display: 'block', color: '#475569', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}{required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', background: '#f1f5f9', border: `1.5px solid ${error ? '#fecaca' : '#e2e8f0'}`, borderRadius: 12, padding: '12px 14px', color: '#0f172a', fontSize: 15, outline: 'none', resize: 'vertical', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", ...inputStyle }}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', background: '#f1f5f9', border: `1.5px solid ${error ? '#fecaca' : '#e2e8f0'}`, borderRadius: 12, padding: '12px 14px', color: '#0f172a', fontSize: 15, outline: 'none', fontFamily: "'DM Sans', sans-serif", ...inputStyle }}
        />
      )}
      {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{error}</p>}
      {hint && !error && <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick, padding = '18px 20px' }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff', borderRadius: 16, padding,
        border: '1px solid #e2e8f0', cursor: onClick ? 'pointer' : undefined,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.15s',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────
export function Badge({ status, size = 'sm' }) {
  const map = {
    Approved: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    Sent: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    Draft: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    Rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    pro: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    premium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    free: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  };
  const s = map[status] || map.Draft;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: size === 'sm' ? '3px 10px' : '5px 14px', borderRadius: 20, fontSize: size === 'sm' ? 11 : 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 24, color = '#2563eb' }) {
  return (
    <div style={{ width: size, height: size, border: `2.5px solid ${color}22`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
  );
}

// ─── Page header ──────────────────────────────────────────────
export function PageHeader({ title, subtitle, back, onBack, action, border = true }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: '#fff', borderBottom: border ? '1px solid #e2e8f0' : 'none' }}>
      {onBack && (
        <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', color: '#1e3a5f', cursor: 'pointer', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          ‹
        </button>
      )}
      <div style={{ flex: 1 }}>
        <h2 style={{ color: '#0f172a', fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: '#94a3b8' }}>{icon}</div>
      <p style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{title}</p>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>{sub}</p>
      {action}
    </div>
  );
}

// ─── Bottom sheet ──────────────────────────────────────────────
export function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: '24px 24px 0 0', padding: '0 0 env(safe-area-inset-bottom)', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden', animation: 'slideUp 0.25s ease', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 36, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '14px auto 0' }} />
        {title && <h3 style={{ color: '#0f172a', fontSize: 17, fontWeight: 800, margin: '16px 20px 0', fontFamily: "'Sora', sans-serif" }}>{title}</h3>}
        <div style={{ padding: '16px 20px 24px', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Toast notification ────────────────────────────────────────
export function Toast({ message, type = 'success', onDismiss }) {
  const colors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', Icon: CheckCircle2 },
    error: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', Icon: XCircle },
    info: { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', Icon: Info },
  };
  const c = colors[type];
  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', animation: 'fadeIn 0.3s ease', minWidth: 280 }}>
      <c.Icon size={18} color={c.color} strokeWidth={2.25} />
      <span style={{ color: c.color, fontSize: 14, fontWeight: 600, flex: 1 }}>{message}</span>
      {onDismiss && <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: c.color, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>}
    </div>
  );
}

// ─── Upgrade wall ──────────────────────────────────────────────
export function UpgradeWall({ plan, quotesUsed, onUpgrade, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '32px 24px 48px', width: '100%', maxWidth: 480, animation: 'slideUp 0.3s ease', position: 'relative' }}>
        {onClose && (
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, border: 'none', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
            ✕
          </button>
        )}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><TrendingUp size={44} color="#2563eb" strokeWidth={2} /></div>
          <h2 style={{ color: '#0f172a', fontSize: 22, fontWeight: 800, margin: '0 0 8px', fontFamily: "'Sora', sans-serif" }}>You've used all 3 free quotes</h2>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>Upgrade to Pro for unlimited quotes and full branding on every estimate.</p>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#1e3a5f', fontSize: 18, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>Pro Plan</span>
            <span style={{ color: '#2563eb', fontSize: 22, fontWeight: 900 }}>$79<span style={{ fontSize: 14, fontWeight: 600 }}>/mo</span></span>
          </div>
          {['Unlimited quotes', 'Full company branding', 'PDF exports', 'Shareable quote links', 'Customer CRM'].map(f => (
            <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <Check size={16} color="#2563eb" strokeWidth={3} />
              <span style={{ color: '#374151', fontSize: 14 }}>{f}</span>
            </div>
          ))}
        </div>

        <Btn onClick={() => onUpgrade('pro')} fullWidth size="lg">Upgrade to Pro — $79/month</Btn>
        <Btn onClick={() => onUpgrade('premium')} fullWidth variant="ghost" size="md" style={{ marginTop: 8 }}>
          Premium ($129/mo) — includes automated follow-ups
        </Btn>
      </div>
    </div>
  );
}
