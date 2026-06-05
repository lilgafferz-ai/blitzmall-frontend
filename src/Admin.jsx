import React, { useState, useEffect, useRef } from 'react';
import './Admin.css';

const API_URL = 'https://blitzmall-backend.onrender.com/api';
const BLANK = { name: '', category: '', barcode: '', buyingPrice: '', price: '', stock: '', description: '', image: null, expiryDate: '' };
const money = (n) => 'KES ' + (Math.round((n || 0) * 100) / 100).toLocaleString();
const stars = (n) => '★'.repeat(Math.max(0,n)) + '☆'.repeat(Math.max(0,5-n));
const fmt = (d) => d ? new Date(d).toLocaleDateString() : '';

function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState('sales');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [scan, setScan] = useState('');
  const [saleCart, setSaleCart] = useState([]);
  const [payMethod, setPayMethod] = useState('cash');
  const [amountGiven, setAmountGiven] = useState('');
  const [cashPart, setCashPart] = useState('');
  const [mpesaPart, setMpesaPart] = useState('');
  const [recentSales, setRecentSales] = useState([]);
  const [lastChange, setLastChange] = useState(null);
  const [custPhone, setCustPhone] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [stkCheckoutId, setStkCheckoutId] = useState(null);
  const [stkStatus, setStkStatus] = useState('idle'); // idle | waiting | confirmed | failed
  const [stkError, setStkError] = useState('');
  const scanRef = useRef(null);
  const [staffList, setStaffList] = useState([]);
  const [cashier, setCashier] = useState('Owner');
  const [newStaffName, setNewStaffName] = useState('');
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('today');
  const [expenses, setExpenses] = useState([]);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [credit, setCredit] = useState([]);
  const [crName, setCrName] = useState('');
  const [crPhone, setCrPhone] = useState('');
  const [crAmount, setCrAmount] = useState('');
  const [crNote, setCrNote] = useState('');
  const [crShowPaid, setCrShowPaid] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [alerts, setAlerts] = useState({ low: [], out: [], expiringSoon: [], expired: [] });
  const [muted, setMuted] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const prevOut = useRef(new Set());
  const audioCtx = useRef(null);
  const mutedRef = useRef(false);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Inject theme vars on <html> so admin UI stays visible even if WebView strips CSS classes
  useEffect(() => {
    if (!loggedIn) return;
    const vars = {
      '--bg': '#0a0a0c', '--card': '#16161b', '--bg-2': '#111114', '--line': '#26262e',
      '--text': '#f4f4f6', '--muted': '#8a8a96', '--gold': '#ffd24a', '--orange': '#ff7a1a',
      '--red': '#ff2d2d', '--green': '#36d399',
    };
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [loggedIn]);

  const playAlarm = () => {
    if (mutedRef.current) return;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      if (ctx.state === 'suspended') ctx.resume();
      [0, 0.32, 0.64].forEach(t => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'square'; osc.frequency.value = 880;
        osc.connect(gain); gain.connect(ctx.destination);
        const s = ctx.currentTime + t;
        gain.gain.setValueAtTime(0.0001, s);
        gain.gain.exponentialRampToValueAtTime(0.25, s + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, s + 0.22);
        osc.start(s); osc.stop(s + 0.24);
      });
    } catch (e) { console.error('alarm', e); }
  };

  const checkAlerts = async () => {
    try {
      const r = await fetch(API_URL + '/admin/summary');
      const d = await r.json();
      const out = d.out || [], low = d.low || [], expiringSoon = d.expiringSoon || [], expired = d.expired || [];
      setAlerts({ low, out, expiringSoon, expired });
      const newlyOut = out.map(p => p.name).filter(n => !prevOut.current.has(n));
      if (newlyOut.length > 0) { playAlarm(); setShowBanner(true); }
      prevOut.current = new Set(out.map(p => p.name));
    } catch (e) { console.error(e); }
  };

  const asArray = (d) => (Array.isArray(d) ? d : []);
  const loadProducts = async () => { try { const r = await fetch(API_URL + '/products'); setProducts(asArray(await r.json())); } catch (e) { console.error(e); setProducts([]); } };
  const loadOrders = async () => { try { const r = await fetch(API_URL + '/admin/orders'); setOrders(asArray(await r.json())); } catch (e) { console.error(e); setOrders([]); } };
  const loadSales = async () => { try { const r = await fetch(API_URL + '/admin/sales?limit=15'); setRecentSales(asArray(await r.json())); } catch (e) { console.error(e); setRecentSales([]); } };
  const loadSummary = async () => { try { const r = await fetch(API_URL + '/admin/summary'); setSummary(await r.json()); } catch (e) { console.error(e); } };
  const loadExpenses = async () => { try { const r = await fetch(API_URL + '/admin/expenses'); setExpenses(asArray(await r.json())); } catch (e) { console.error(e); setExpenses([]); } };
  const loadCredit = async () => { try { const r = await fetch(API_URL + '/admin/credit'); setCredit(asArray(await r.json())); } catch (e) { console.error(e); setCredit([]); } };
  const loadReviews = async () => { try { const r = await fetch(API_URL + '/admin/reviews'); setReviews(asArray(await r.json())); } catch (e) { console.error(e); setReviews([]); } };
  const loadStaff = async () => { try { const r = await fetch(API_URL + '/admin/staff'); setStaffList(asArray(await r.json())); } catch (e) { console.error(e); setStaffList([]); } };

  useEffect(() => {
    if (!loggedIn) return;
    checkAlerts();
    const id = setInterval(checkAlerts, 25000);
    return () => clearInterval(id);
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    if (tab === 'records') loadSummary();
    if (tab === 'expenses') { loadExpenses(); loadSummary(); }
    if (tab === 'credit') loadCredit();
    if (tab === 'reviews') loadReviews();
    if (tab === 'staff') loadStaff();
  }, [tab, loggedIn]);

  // Poll M-Pesa STK status after sending push
  useEffect(() => {
    if (!stkCheckoutId || stkStatus !== 'waiting') return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(API_URL + '/mpesa/status/' + stkCheckoutId);
        const d = await r.json();
        if (d.status === 'confirmed') {
          clearInterval(interval);
          setStkStatus('confirmed');
          // Now record the completed sale
          completeSaleRecord();
        } else if (d.status === 'failed') {
          clearInterval(interval);
          setStkStatus('failed');
          setStkError(d.resultDesc || 'Payment cancelled or failed.');
        }
      } catch (e) { console.error(e); }
    }, 3000);
    // Timeout after 90s
    const timeout = setTimeout(() => { clearInterval(interval); if (stkStatus === 'waiting') { setStkStatus('failed'); setStkError('Timed out waiting for PIN. Try again.'); } }, 90000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [stkCheckoutId, stkStatus]);

  // The actual backend sale recording (called after M-Pesa confirmed OR for cash/split)
  const completeSaleRecord = async () => {
    try {
      const r = await fetch(API_URL + '/admin/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: saleCart.length ? saleCart : window._pendingSaleCart, paymentMethod: payMethod, amountGiven, cashPart, mpesaPart, staff: cashier, customerPhone: custPhone }) });
      const d = await r.json();
      if (d.success) {
        setLastChange({ change: d.change, total: d.total });
        setReceipt({ items: window._pendingSaleCart || [...saleCart], total: d.total, change: d.change, paymentMethod: payMethod, cashier, date: new Date(), phone: custPhone });
        setSaleCart([]); setAmountGiven(''); setCashPart(''); setMpesaPart(''); setCustPhone('');
        setStkCheckoutId(null); setStkStatus('idle'); window._pendingSaleCart = null;
        loadProducts(); loadSales(); checkAlerts();
      }
    } catch (e) { console.error(e); }
  };

  const login = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(API_URL + '/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
      if ((await r.json()).success) { setLoggedIn(true); setPw(''); loadProducts(); loadOrders(); loadSales(); loadStaff(); }
      else alert('Wrong password!');
    } catch (e) { console.error(e); }
  };

  const onImage = (e) => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onloadend = () => setForm(s => ({ ...s, image: rd.result })); rd.readAsDataURL(f); };
  const resetForm = () => { setForm(BLANK); setEditingId(null); setShowForm(false); };
  const submitProduct = async (e) => {
    e.preventDefault();
    if (!form.name || form.price === '') { alert('Name and selling price required'); return; }
    try {
      const url = editingId ? API_URL + '/admin/products/' + editingId : API_URL + '/admin/products';
      const r = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if ((await r.json()).success) { resetForm(); loadProducts(); }
    } catch (e) { console.error(e); }
  };
  const editProduct = (p) => { setForm({ name: p.name||'', category: p.category||'', barcode: p.barcode||'', buyingPrice: p.buyingPrice??'', price: p.price??'', stock: p.stock??'', description: p.description||'', image: p.image||null, expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0,10) : '' }); setEditingId(p._id); setShowForm(true); window.scrollTo(0,0); };
  const delProduct = async (id) => { if (!window.confirm('Delete this item?')) return; try { const r = await fetch(API_URL + '/admin/products/' + id, { method: 'DELETE' }); if ((await r.json()).success) loadProducts(); } catch (e) { console.error(e); } };
  const setStatus = async (id, status) => { try { await fetch(API_URL + '/admin/orders/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); loadOrders(); } catch (e) { console.error(e); } };

  const stockTag = (s) => { if (s === undefined || s === null) return null; if (s <= 0) return React.createElement('span', {className:'tag out'}, 'Out'); if (s < 2) return React.createElement('span', {className:'tag low'}, 'Low: ' + s); return React.createElement('span', {className:'tag ok'}, s + ' left'); };
  const expiryTag = (d) => {
    if (!d) return null;
    const now = new Date(); const exp = new Date(d); const diff = exp - now;
    if (diff < 0) return React.createElement('span', {className:'tag out'}, 'Expired ' + fmt(d));
    if (diff < 7*86400000) return React.createElement('span', {className:'tag low'}, 'Exp soon ' + fmt(d));
    return React.createElement('span', {className:'tag ok'}, 'Exp ' + fmt(d));
  };

  const pid = (p) => p._id || p.id;
  const stockOf = (id) => { const p = products.find(x => pid(x) === id); return p ? (p.stock ?? null) : null; };
  const addToSale = (p) => { const id = pid(p); setSaleCart(c => { const ex = c.find(i => i.productId === id); if (ex) return c.map(i => i.productId === id ? { ...i, qty: i.qty+1 } : i); return [...c, { productId: id, name: p.name, price: p.price||0, buyingPrice: p.buyingPrice||0, qty: 1 }]; }); setScan(''); setLastChange(null); if (scanRef.current) scanRef.current.focus(); };
  const handleScanSubmit = (e) => { e.preventDefault(); const t = scan.trim(); if (!t) return; const byCode = products.find(p => p.barcode && p.barcode === t); if (byCode) { addToSale(byCode); return; } const byName = products.filter(p => p.name.toLowerCase().includes(t.toLowerCase())); if (byName.length === 1) addToSale(byName[0]); };
  const scanMatches = scan.trim() ? products.filter(p => p.name.toLowerCase().includes(scan.toLowerCase()) || (p.barcode||'').includes(scan)).slice(0,6) : [];
  const setSaleQty = (id, q) => { if (q <= 0) setSaleCart(c => c.filter(i => i.productId !== id)); else setSaleCart(c => c.map(i => i.productId === id ? { ...i, qty: q } : i)); };
  const saleTotal = saleCart.reduce((s, i) => s + i.price * i.qty, 0);
  const saleProfit = saleCart.reduce((s, i) => s + (i.price - i.buyingPrice) * i.qty, 0);
  const change = payMethod === 'cash' && parseFloat(amountGiven) > saleTotal ? (parseFloat(amountGiven) - saleTotal) : 0;
  const splitCovered = (parseFloat(cashPart)||0) + (parseFloat(mpesaPart)||0);

  const completeSale = async () => {
    if (!saleCart.length) return;
    if (payMethod === 'cash' && parseFloat(amountGiven||0) < saleTotal) { if (!window.confirm('Amount given is less than total. Record anyway?')) return; }
    if (payMethod === 'split' && splitCovered < saleTotal) { if (!window.confirm('Split amounts less than total. Record anyway?')) return; }

    // M-Pesa: send STK push first, then poll for confirmation before recording
    if (payMethod === 'mpesa') {
      if (!custPhone) { alert('Enter customer phone number to send M-Pesa prompt.'); return; }
      try {
        window._pendingSaleCart = [...saleCart];
        setStkStatus('waiting'); setStkError('');
        const r = await fetch(API_URL + '/mpesa/stk-push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: custPhone, amount: saleTotal }) });
        const d = await r.json();
        if (d.success) { setStkCheckoutId(d.checkoutRequestId); }
        else { setStkStatus('failed'); setStkError(d.error || 'M-Pesa request failed'); }
      } catch (e) { setStkStatus('failed'); setStkError('Network error sending M-Pesa request'); }
      return; // wait for polling to confirm
    }

    // Cash / split: record immediately
    await completeSaleRecord();
  };
  const voidSale = async (id) => { if (!window.confirm('Void this sale and restore stock?')) return; try { const r = await fetch(API_URL + '/admin/sales/' + id, { method: 'DELETE' }); if ((await r.json()).success) { loadProducts(); loadSales(); } } catch (e) { console.error(e); } };
  const addExpense = async (e) => { e.preventDefault(); if (!expDesc || expAmount === '') return; try { const r = await fetch(API_URL + '/admin/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: expDesc, amount: expAmount }) }); if ((await r.json()).success) { setExpDesc(''); setExpAmount(''); loadExpenses(); loadSummary(); } } catch (e) { console.error(e); } };
  const delExpense = async (id) => { try { const r = await fetch(API_URL + '/admin/expenses/' + id, { method: 'DELETE' }); if ((await r.json()).success) { loadExpenses(); loadSummary(); } } catch (e) { console.error(e); } };
  const waLink = (phone, msg) => { let p = (phone||'').replace(/[^0-9]/g,''); if (p.startsWith('0')) p = '254' + p.slice(1); return 'https://wa.me/' + p + '?text=' + encodeURIComponent(msg); };
  const addCredit = async (e) => { e.preventDefault(); if (!crName || crAmount === '') return; try { const r = await fetch(API_URL + '/admin/credit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName: crName, phone: crPhone, amount: crAmount, note: crNote }) }); if ((await r.json()).success) { setCrName(''); setCrPhone(''); setCrAmount(''); setCrNote(''); loadCredit(); } } catch (e) { console.error(e); } };
  const payCredit = async (id) => { try { const r = await fetch(API_URL + '/admin/credit/' + id + '/pay', { method: 'PUT' }); if ((await r.json()).success) loadCredit(); } catch (e) { console.error(e); } };
  const delCredit = async (id) => { if (!window.confirm('Delete this record?')) return; try { const r = await fetch(API_URL + '/admin/credit/' + id, { method: 'DELETE' }); if ((await r.json()).success) loadCredit(); } catch (e) { console.error(e); } };
  const delReview = async (id) => { if (!window.confirm('Delete this review?')) return; try { const r = await fetch(API_URL + '/admin/reviews/' + id, { method: 'DELETE' }); if ((await r.json()).success) loadReviews(); } catch (e) { console.error(e); } };
  const addStaff = async (e) => { e.preventDefault(); if (!newStaffName.trim()) return; try { const r = await fetch(API_URL + '/admin/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newStaffName }) }); if ((await r.json()).success) { setNewStaffName(''); loadStaff(); } } catch (e) { console.error(e); } };
  const delStaff = async (id) => { if (!window.confirm('Remove this cashier?')) return; try { const r = await fetch(API_URL + '/admin/staff/' + id, { method: 'DELETE' }); if ((await r.json()).success) loadStaff(); } catch (e) { console.error(e); } };
  const exportBackup = async () => { try { const r = await fetch(API_URL + '/admin/export'); const data = await r.json(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'blitz-admin-backup-' + new Date().toISOString().slice(0,10) + '.json'; a.click(); URL.revokeObjectURL(url); } catch (e) { alert('Export failed'); } };

  if (!loggedIn) return (
    <div className="blitz-admin-login"><div className="blitz-admin-login-card"><div className="blitz-admin-logo">⚡</div>
      <h1>Blitz Mall <span>Owner</span></h1><p className="blitz-admin-muted">Manage your store</p>
      <form onSubmit={login}><input className="owner-field" type="password" placeholder="Owner password" value={pw} onChange={e => setPw(e.target.value)} required /><button className="blitz-admin-btn" type="submit">Enter HQ</button></form>
    </div></div>
  );

  const productList = Array.isArray(products) ? products : [];
  const filtered = productList.filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode||'').includes(search) || (p.category||'').toLowerCase().includes(search.toLowerCase()));
  const P = summary ? summary.summary[period] : null;
  const periodLabel = { today: 'Today', week: 'This week', month: 'This month', year: 'This year', all: 'All time' };
  const totalAlerts = alerts.out.length + alerts.low.length + (alerts.expired||[]).length;
  const receiptWALink = receipt && receipt.phone ? waLink(receipt.phone, 'BLITZ MALL RECEIPT\n' + receipt.date.toLocaleString() + '\nCashier: ' + receipt.cashier + '\n' + receipt.items.map(i => i.name + ' x' + i.qty + ' = KES ' + (i.price*i.qty)).join('\n') + '\nTotal: KES ' + receipt.total + (receipt.change > 0 ? '\nChange: KES ' + receipt.change : '') + '\nPayment: ' + receipt.paymentMethod + '\nThank you for shopping at Brilliant!') : null;

  return (
    <div className="blitz-hq-shell" style={{ minHeight: '100vh', background: '#0a0a0c', color: '#f4f4f6' }}>
      <header className="blitz-admin-header">
        <div className="blitz-admin-brand"><span className="blitz-admin-logo sm">⚡</span> Blitz Mall <b>HQ</b></div>
        <div className="blitz-admin-head-right">
          <button className={"blitz-admin-bell" + (alerts.out.length ? " ring" : "")} onClick={() => setMuted(m => !m)}>
            {muted ? "🔕" : "🔔"}{totalAlerts > 0 && <i className="blitz-admin-bell-dot">{totalAlerts}</i>}
          </button>
          <button className="blitz-admin-exit" onClick={() => setLoggedIn(false)}>Exit</button>
        </div>
      </header>

      {showBanner && totalAlerts > 0 && (
        <div className={"blitz-hq-notice" + (alerts.out.length || (alerts.expired||[]).length ? " urgent" : "")}>
          <span className="blitz-hq-notice-text">
            {alerts.out.length > 0 && <b>🚨 Out of stock: {alerts.out.map(p => p.name).join(", ")}. </b>}
            {(alerts.expired||[]).length > 0 && <b>❌ Expired: {alerts.expired.map(p => p.name).join(", ")}. </b>}
            {(alerts.expiringSoon||[]).length > 0 && <span>⏰ Expiring soon: {alerts.expiringSoon.map(p => p.name).join(", ")}. </span>}
            {alerts.low.length > 0 && <span>⚠ Low: {alerts.low.map(p => p.name + "(" + p.stock + ")").join(", ")}.</span>}
          </span>
          <button onClick={() => setShowBanner(false)}>✕</button>
        </div>
      )}

      <div className="blitz-admin-tabs">
        <button className={tab==="sales"?"on":""} onClick={() => setTab("sales")}>🧾 Sell</button>
        <button className={tab==="inventory"?"on":""} onClick={() => setTab("inventory")}>📦 Inventory ({products.length})</button>
        <button className={tab==="orders"?"on":""} onClick={() => setTab("orders")}>🛒 Orders ({orders.length})</button>
        <button className={tab==="records"?"on":""} onClick={() => setTab("records")}>📊 Records</button>
        <button className={tab==="expenses"?"on":""} onClick={() => setTab("expenses")}>💸 Expenses</button>
        <button className={tab==="credit"?"on":""} onClick={() => setTab("credit")}>🧍 Credit</button>
        <button className={tab==="reviews"?"on":""} onClick={() => setTab("reviews")}>⭐ Reviews</button>
        <button className={tab==="staff"?"on":""} onClick={() => setTab("staff")}>👷 Staff</button>
      </div>

      {tab === "sales" && (
        <div className="blitz-admin-body pos-wrap">
          <div className="pos-left">
            <div className="pos-head-row">
              <h2>Sell</h2>
              <div className="pos-cashier-wrap">
                <span>Cashier:</span>
                <select className="pos-cashier-sel" value={cashier} onChange={e => setCashier(e.target.value)}>
                  <option value="Owner">Owner</option>
                  {staffList.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <form className="pos-scan" onSubmit={handleScanSubmit}>
              <span>📷</span>
              <input ref={scanRef} autoFocus value={scan} onChange={e => setScan(e.target.value)} placeholder="Scan barcode or type product name…" />
              <button className="blitz-admin-btn small" type="submit">Find</button>
            </form>
            {scanMatches.length > 0 && (
              <div className="pos-suggest">
                {scanMatches.map(p => (
                  <button key={pid(p)} onClick={() => addToSale(p)} disabled={(p.stock??1) <= 0}>
                    <span>{p.name}</span>
                    <span className="pos-suggest-meta">{money(p.price)} · {stockTag(p.stock)}</span>
                  </button>
                ))}
              </div>
            )}
            {lastChange && <div className="pos-change-notice">✅ Sale done · Total {money(lastChange.total)}{lastChange.change > 0 && <b> · Give change: {money(lastChange.change)}</b>}</div>}
            <div className="pos-cart">
              {saleCart.length === 0 ? <p className="blitz-admin-empty">Scan or search to add items.</p> : saleCart.map(i => {
                const left = stockOf(i.productId); const warn = left !== null && i.qty >= left;
                return (
                  <div className="pos-cart-row" key={i.productId}>
                    <div className="pos-cart-info">
                      <b>{i.name}</b>
                      <span className="pos-line">{money(i.price)} × {i.qty} = <b>{money(i.price * i.qty)}</b></span>
                      {warn && <span className="pos-warn">⚠ only {left} in stock</span>}
                    </div>
                    <div className="blitz-admin-qty"><button onClick={() => setSaleQty(i.productId, i.qty-1)}>−</button><b>{i.qty}</b><button onClick={() => setSaleQty(i.productId, i.qty+1)}>+</button></div>
                    <button className="pos-x" onClick={() => setSaleQty(i.productId, 0)}>✕</button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pos-right">
            {receipt ? (
              <div className="receipt-box">
                <div className="receipt-header">
                  <h3>⚡ BLITZ MALL</h3>
                  <p>Brilliant Shop</p>
                  <small>{receipt.date.toLocaleString()}</small>
                  <small>Cashier: {receipt.cashier}</small>
                </div>
                <div className="receipt-items">
                  {receipt.items.map((i,k) => <div key={k} className="receipt-line"><span>{i.name} ×{i.qty}</span><span>{money(i.price*i.qty)}</span></div>)}
                </div>
                <div className="receipt-total"><span>Total</span><b>{money(receipt.total)}</b></div>
                {receipt.change > 0 && <div className="receipt-change"><span>Change</span><b>{money(receipt.change)}</b></div>}
                <div className="receipt-pay">{receipt.paymentMethod}</div>
                <div className="receipt-actions">
                  <button className="blitz-admin-btn small" onClick={() => window.print()}>🖨 Print</button>
                  {receiptWALink && <a className="cr-remind" href={receiptWALink} target="_blank" rel="noreferrer">📱 WhatsApp</a>}
                  <button className="blitz-admin-btn small" onClick={() => setReceipt(null)}>New sale</button>
                </div>
              </div>
            ) : (
              <>
                <div className="pos-total-box"><span>Total</span><b>{money(saleTotal)}</b>{saleCart.length > 0 && <small>Profit: {money(saleProfit)}</small>}</div>
                <input className="pos-phone-input" type="tel" value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="Customer phone for receipt (optional)" />
                <div className="pos-pay">
                  <button className={payMethod==="cash"?"on":""} onClick={() => setPayMethod("cash")}>💵 Cash</button>
                  <button className={payMethod==="mpesa"?"on":""} onClick={() => setPayMethod("mpesa")}>📱 M-Pesa</button>
                  <button className={payMethod==="split"?"on":""} onClick={() => setPayMethod("split")}>🔀 Split</button>
                <button className={payMethod==="airtel"?"on":""} onClick={() => setPayMethod("airtel")}>📲 Airtel</button>
                </div>
                {payMethod === "cash" && <div className="pos-cash"><label>Amount given<input type="number" value={amountGiven} onChange={e => setAmountGiven(e.target.value)} placeholder="e.g. 500" /></label><div className={"pos-change" + (change > 0 ? " show" : "")}>Change to give: <b>{money(change)}</b></div></div>}
                {payMethod === "mpesa" && (
                  <div className="pos-cash">
                    <label>Customer phone *<input type="tel" value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="07xx xxx xxx" /></label>
                    {stkStatus === "waiting" && <div className="stk-waiting">📱 STK Push sent! Waiting for customer to enter PIN...</div>}
                    {stkStatus === "confirmed" && <div className="stk-ok">✅ Payment confirmed!</div>}
                    {stkStatus === "failed" && <div className="stk-fail">❌ {stkError || "Payment failed. Try again."}<button onClick={() => { setStkStatus("idle"); setStkError(""); }} style={{marginLeft:8,cursor:"pointer",background:"none",border:"none",color:"var(--orange)"}}>Retry</button></div>}
                  </div>
                )}
                {payMethod === "split" && <div className="pos-cash"><label>Cash part<input type="number" value={cashPart} onChange={e => setCashPart(e.target.value)} placeholder="KES" /></label><label>M-Pesa part<input type="number" value={mpesaPart} onChange={e => setMpesaPart(e.target.value)} placeholder="KES" /></label><div className="pos-change show">Covered: {money(splitCovered)} / {money(saleTotal)}</div></div>}
                {payMethod === "airtel" && <div className="pos-cash"><p style={{color:"var(--muted)",fontSize:".85rem"}}>Customer sends Airtel Money manually to your number. Confirm after you see it on your phone.</p></div>}
                <button className="blitz-admin-btn pos-complete" disabled={!saleCart.length} onClick={completeSale}>Complete sale</button>
              </>
            )}
            <div className="pos-recent">
              <h3>Recent sales</h3>
              {recentSales.length === 0 ? <p className="blitz-admin-empty sm">No sales yet.</p> : recentSales.map(s => (
                <div className="pos-recent-row" key={s._id}>
                  <div><b>{money(s.total)}</b><span className="blitz-admin-muted"> · {s.paymentMethod} · {s.staff||""} · {new Date(s.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span></div>
                  <button className="pos-void" onClick={() => voidSale(s._id)}>void</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div className="blitz-admin-body">
          <div className="blitz-admin-row-between"><h2>Inventory</h2><button className="blitz-admin-btn small" onClick={() => { showForm ? resetForm() : setShowForm(true); }}>{showForm ? "✕ Cancel" : "➕ Add stock"}</button></div>
          {showForm && (
            <form className="blitz-admin-form" onSubmit={submitProduct}>
              <h3>{editingId ? "Edit item" : "Add new stock"}</h3>
              <div className="blitz-admin-grid">
                <label>Product name *<input value={form.name} onChange={e => setForm(s=>({...s,name:e.target.value}))} placeholder="e.g. Cooking Oil 1L" required /></label>
                <label>Category<input value={form.category} onChange={e => setForm(s=>({...s,category:e.target.value}))} placeholder="e.g. Cooking, Drinks" list="cats" /><datalist id="cats">{[...new Set(products.map(p=>p.category).filter(Boolean))].map(c=><option key={c} value={c}/>)}</datalist></label>
                <label>Barcode<input value={form.barcode} onChange={e => setForm(s=>({...s,barcode:e.target.value}))} placeholder="Scan or type" /></label>
                <label>Qty in stock<input type="number" value={form.stock} onChange={e => setForm(s=>({...s,stock:e.target.value}))} placeholder="e.g. 50" /></label>
                <label>Buying price (KES)<input type="number" step="0.01" value={form.buyingPrice} onChange={e => setForm(s=>({...s,buyingPrice:e.target.value}))} placeholder="What you paid" /></label>
                <label>Selling price (KES) *<input type="number" step="0.01" value={form.price} onChange={e => setForm(s=>({...s,price:e.target.value}))} placeholder="What customer pays" required /></label>
                <label>Expiry date (if any)<input type="date" value={form.expiryDate} onChange={e => setForm(s=>({...s,expiryDate:e.target.value}))} /></label>
              </div>
              {form.buyingPrice !== "" && form.price !== "" && <div className="blitz-admin-margin">Profit per item: <b>{money(parseFloat(form.price)-parseFloat(form.buyingPrice))}</b></div>}
              <label className="blitz-admin-full">Description<textarea value={form.description} onChange={e => setForm(s=>({...s,description:e.target.value}))} placeholder="Optional notes for customers" /></label>
              <label className="blitz-admin-full">Image<input type="file" accept="image/*" onChange={onImage} /></label>
              {form.image && <div className="blitz-admin-preview"><img src={form.image} alt="preview" /></div>}
              <button className="blitz-admin-btn" type="submit">{editingId ? "Save changes" : "Add to inventory"}</button>
            </form>
          )}
          <div className="blitz-admin-search"><span>🔍</span><input placeholder="Search name, barcode or category…" value={search} onChange={e => setSearch(e.target.value)} /></div>
          {filtered.length === 0 ? <p className="blitz-admin-empty">No items yet.</p> : (
            <div className="blitz-admin-list">{filtered.map(p => {
              const margin = (p.price||0)-(p.buyingPrice||0);
              return (
                <div className="blitz-admin-item" key={p._id}>
                  <div className="blitz-admin-thumb">{p.image ? <img src={p.image} alt={p.name}/> : "🛍️"}</div>
                  <div className="blitz-admin-item-main">
                    <div className="blitz-admin-item-top"><b>{p.name}</b>{stockTag(p.stock)}{expiryTag(p.expiryDate)}</div>
                    <div className="blitz-admin-item-sub"><span className="blitz-admin-cat">{p.category||"Other"}</span>{p.barcode && <span className="blitz-admin-bc">#{p.barcode}</span>}</div>
                    <div className="blitz-admin-item-prices"><span>Buy {money(p.buyingPrice||0)}</span><span>Sell {money(p.price||0)}</span><span className={margin>=0?"profit":"loss"}>Margin {money(margin)}</span></div>
                  </div>
                  <div className="blitz-admin-item-actions"><button onClick={() => editProduct(p)}>✏️</button><button onClick={() => delProduct(p._id)}>🗑️</button></div>
                </div>
              );
            })}</div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="blitz-admin-body"><h2>Orders</h2>
          {orders.length === 0 ? <p className="blitz-admin-empty">No orders yet</p> : (
            <div className="blitz-admin-list">{orders.map(o => (
              <div className="blitz-admin-order" key={o._id}>
                <div className="blitz-admin-order-top"><b>{o.customerName}</b><span className="blitz-admin-phone">{o.customerId}</span></div>
                <div className="blitz-admin-order-items">{o.items.map((it,k) => <p key={k}>{it.name} ×{it.quantity} — {money(it.price*it.quantity)}</p>)}</div>
                <div className="blitz-admin-order-foot"><b>{money(o.totalPrice)}</b><span className="blitz-admin-muted">{new Date(o.createdAt).toLocaleString()}</span></div>
                <select value={o.status} onChange={e => setStatus(o._id, e.target.value)}>
                  <option value="pending">⏳ Pending</option><option value="packed">📦 Packed</option><option value="on_the_way">🚚 On the way</option><option value="delivered">✅ Delivered</option>
                </select>
              </div>
            ))}</div>
          )}
        </div>
      )}

      {tab === "records" && (
        <div className="blitz-admin-body">
          <div className="blitz-admin-row-between"><h2>Records</h2><div style={{display:"flex",gap:10}}><button className="blitz-admin-btn small" onClick={loadSummary}>↻ Refresh</button><button className="blitz-admin-btn small" onClick={exportBackup}>⬇ Backup</button></div></div>
          <div className="rec-periods">{Object.keys(periodLabel).map(k => <button key={k} className={period===k?"on":""} onClick={() => setPeriod(k)}>{periodLabel[k]}</button>)}</div>
          {!summary ? <p className="blitz-admin-empty">Loading…</p> : (
            <>
              <div className="rec-cards">
                <div className="rec-card"><span>Revenue</span><b>{money(P.revenue)}</b><small>{P.count} sales</small></div>
                <div className="rec-card"><span>Profit</span><b className="green">{money(P.profit)}</b><small>before expenses</small></div>
                <div className="rec-card"><span>Expenses</span><b className="red">{money(P.expenses)}</b><small>{periodLabel[period].toLowerCase()}</small></div>
                <div className="rec-card big"><span>Net profit</span><b className={P.net>=0?"green":"red"}>{money(P.net)}</b><small>profit − expenses</small></div>
              </div>
              <div className="rec-split"><h3>Cash vs M-Pesa</h3><div className="rec-bar"><div className="rec-bar-cash" style={{flex:P.cash||0.001}}/><div className="rec-bar-mpesa" style={{flex:P.mpesa||0.001}}/></div><div className="rec-split-legend"><span>💵 Cash {money(P.cash)}</span><span>📱 M-Pesa {money(P.mpesa)}</span></div></div>
              <div className="rec-two">
                <div className="rec-panel"><h3>🔥 Best sellers</h3>{summary.best.length === 0 ? <p className="blitz-admin-empty sm">No sales yet.</p> : summary.best.map(b => <div className="rec-line" key={b.name}><span>{b.name}</span><b>{b.qty} sold</b></div>)}</div>
                <div className="rec-panel"><h3>⚠ Alerts</h3>
                  {[...(summary.expired||[]),...summary.out,...(summary.expiringSoon||[]),...summary.low].length === 0 ? <p className="blitz-admin-empty sm">All good.</p> : (<>
                    {(summary.expired||[]).map(p => <div className="rec-line" key={p.name}><span>{p.name}</span><b className="red">Expired {fmt(p.expiryDate)}</b></div>)}
                    {summary.out.map(p => <div className="rec-line" key={p.name}><span>{p.name}</span><b className="red">Out of stock</b></div>)}
                    {(summary.expiringSoon||[]).map(p => <div className="rec-line" key={p.name}><span>{p.name}</span><b className="gold">Exp {fmt(p.expiryDate)}</b></div>)}
                    {summary.low.map(p => <div className="rec-line" key={p.name}><span>{p.name}</span><b className="gold">Low: {p.stock}</b></div>)}
                  </>)}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "expenses" && (
        <div className="blitz-admin-body"><h2>Expenses</h2>
          {summary && <div className="exp-summary">Today: <b className="red">{money(summary.summary.today.expenses)}</b> · This month: <b className="red">{money(summary.summary.month.expenses)}</b></div>}
          <form className="exp-form" onSubmit={addExpense}><input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="What for? e.g. Transport, Rent" required /><input type="number" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="Amount KES" required /><button className="blitz-admin-btn small" type="submit">Add</button></form>
          {expenses.length === 0 ? <p className="blitz-admin-empty">No expenses yet.</p> : <div className="blitz-admin-list">{expenses.map(x => <div className="exp-row" key={x._id}><div><b>{x.description}</b><span className="blitz-admin-muted"> · {new Date(x.createdAt).toLocaleDateString()}</span></div><div className="exp-right"><b className="red">{money(x.amount)}</b><button className="pos-void" onClick={() => delExpense(x._id)}>delete</button></div></div>)}</div>}
        </div>
      )}

      {tab === "credit" && (() => {
        const unpaid = credit.filter(c => !c.paid); const paid = credit.filter(c => c.paid);
        const owed = unpaid.reduce((s,c) => s + (c.amount||0), 0);
        return (
          <div className="blitz-admin-body">
            <div className="blitz-admin-row-between"><h2>Credit (Madeni)</h2><div className="cr-owed">Outstanding: <b>{money(owed)}</b></div></div>
            <form className="cr-form" onSubmit={addCredit}>
              <input value={crName} onChange={e => setCrName(e.target.value)} placeholder="Customer name" required />
              <input value={crPhone} onChange={e => setCrPhone(e.target.value)} placeholder="Phone (07…)" />
              <input type="number" step="0.01" value={crAmount} onChange={e => setCrAmount(e.target.value)} placeholder="Amount KES" required />
              <input value={crNote} onChange={e => setCrNote(e.target.value)} placeholder="For what? (optional)" />
              <button className="blitz-admin-btn small" type="submit">Add debt</button>
            </form>
            {unpaid.length === 0 ? <p className="blitz-admin-empty">No one owes you. 🎉</p> : <div className="blitz-admin-list">{unpaid.map(c => <div className="cr-row" key={c._id}><div className="cr-info"><b>{c.customerName}</b>{c.note && <span className="blitz-admin-muted">{c.note}</span>}<span className="cr-date">since {new Date(c.createdAt).toLocaleDateString()}{c.phone ? " · " + c.phone : ""}</span></div><div className="cr-amt">{money(c.amount)}</div><div className="cr-actions">{c.phone && <a className="cr-remind" href={waLink(c.phone,"Hi " + c.customerName + ", friendly reminder you have a balance of " + money(c.amount) + " at Brilliant. Asante!")} target="_blank" rel="noreferrer">Remind</a>}<button className="cr-paid" onClick={() => payCredit(c._id)}>Mark paid</button><button className="pos-void" onClick={() => delCredit(c._id)}>delete</button></div></div>)}</div>}
            {paid.length > 0 && <div className="cr-paidwrap"><button className="cr-toggle" onClick={() => setCrShowPaid(s=>!s)}>{crShowPaid?"Hide":"Show"} cleared ({paid.length})</button>{crShowPaid && <div className="blitz-admin-list">{paid.map(c => <div className="cr-row cleared" key={c._id}><div className="cr-info"><b>{c.customerName}</b><span className="cr-date">paid {c.paidAt ? new Date(c.paidAt).toLocaleDateString() : ""}</span></div><div className="cr-amt">{money(c.amount)}</div><div className="cr-actions"><button className="pos-void" onClick={() => delCredit(c._id)}>delete</button></div></div>)}</div>}</div>}
          </div>
        );
      })()}

      {tab === "reviews" && (() => {
        const count = reviews.length; const avg = count ? reviews.reduce((s,r) => s+(r.rating||0),0)/count : 0; const complaints = reviews.filter(r => r.rating<=2).length;
        return (
          <div className="blitz-admin-body"><h2>Reviews</h2>
            <div className="rv-head"><div className="rv-avg"><b>{avg.toFixed(1)}</b><span className="rv-stars">{stars(Math.round(avg))}</span><small>{count} review{count!==1?"s":""}</small></div>{complaints > 0 && <div className="rv-complaints">⚠ {complaints} complaint{complaints!==1?"s":""} (1–2 stars)</div>}</div>
            {count === 0 ? <p className="blitz-admin-empty">No reviews yet.</p> : <div className="blitz-admin-list">{reviews.map(r => <div className={"rv-row" + (r.rating<=2?" bad":"")} key={r._id}><div className="rv-info"><div className="rv-top"><span className="rv-stars">{stars(r.rating)}</span><b>{r.customerName}</b></div>{r.message && <p className="rv-msg">{r.message}</p>}<span className="cr-date">{new Date(r.createdAt).toLocaleDateString()}</span></div><button className="pos-void" onClick={() => delReview(r._id)}>delete</button></div>)}</div>}
          </div>
        );
      })()}

      {tab === "staff" && (
        <div className="blitz-admin-body"><h2>Staff & Cashiers</h2>
          <p className="blitz-admin-muted" style={{marginBottom:16}}>Add staff here. They appear in the cashier selector on the Sell tab so each sale is attributed correctly. Full secure staff logins come with the security/deployment phase.</p>
          <form className="exp-form" onSubmit={addStaff}><input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Staff name e.g. Jane" required /><button className="blitz-admin-btn small" type="submit">Add cashier</button></form>
          {staffList.length === 0 ? <p className="blitz-admin-empty">No staff added yet.</p> : <div className="blitz-admin-list">{staffList.map(s => <div className="exp-row" key={s._id}><div><b>{s.name}</b><span className="blitz-admin-muted"> · {s.role||"Cashier"} · Added {new Date(s.createdAt).toLocaleDateString()}</span></div><button className="pos-void" onClick={() => delStaff(s._id)}>remove</button></div>)}</div>}
        </div>
      )}
    </div>
  );
}

export default Admin;
