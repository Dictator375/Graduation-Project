import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { login } from '../utils/api.js';

export default function Login() {
  const { doLogin, toggleLang, lang, t } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      doLogin(res.data.token, res.data.user);
      navigate(res.data.user.role === 'manager' ? '/admin' : '/worker');
    } catch (err) {
      setError(err.response?.data?.error || t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ width: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>⛽</div>
          <h1 style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 4 }}>{t.appName}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {lang === 'ar' ? 'تسجيل الدخول للنظام' : 'Connexion au système'}
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t.username}</label>
              <input
                className="input"
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required autoFocus
              />
            </div>

            <div className="form-group">
              <label>{t.password}</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? <><div className="spinner" style={{ width:18,height:18,marginLeft:0,marginRight:8 }}/>{t.loading}</> : t.login}
            </button>
          </form>
        </div>

        {/* Language toggle */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={toggleLang} className="btn btn-ghost btn-sm">
            {lang === 'ar' ? '🇫🇷 Passer en Français' : '🇩🇿 التبديل للعربية'}
          </button>
        </div>
      </div>
    </div>
  );
}
