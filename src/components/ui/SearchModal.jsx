import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';

export default function SearchModal({ open, onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState({ trainees: [], trainers: [], memberships: [], payments: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ('');
      setResults({ trainees: [], trainers: [], memberships: [], payments: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!q.trim()) { setResults({ trainees: [], trainers: [], memberships: [], payments: [] }); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const term = q.trim();
      const [trainees, trainers, memberships, payments] = await Promise.all([
        supabase.from('trainees').select('id, profiles(name,email)').ilike('profiles.name', `%${term}%`).limit(5),
        supabase.from('trainers').select('id, profiles(name,email), specialization').ilike('profiles.name', `%${term}%`).limit(5),
        supabase.from('memberships').select('id, plan, trainees(profiles(name))').or(`plan.ilike.%${term}%,trainees.profiles.name.ilike.%${term}%`).limit(5),
        supabase.from('payments').select('id, amount, payment_status, trainees(profiles(name))').or(`trainees.profiles.name.ilike.%${term}%`).limit(5),
      ]);
      setResults({
        trainees: trainees.data ?? [],
        trainers: trainers.data ?? [],
        memberships: memberships.data ?? [],
        payments: payments.data ?? [],
      });
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const total = results.trainees.length + results.trainers.length + results.memberships.length + results.payments.length;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <div className="search-modal-input-wrap">
            <span className="search-modal-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search trainees, trainers, memberships, payments..."
              className="search-modal-input"
            />
            {q && (
              <button className="search-modal-clear" onClick={() => setQ('')}>✕</button>
            )}
          </div>
          <button className="search-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="search-modal-body">
          {loading ? (
            <div className="search-loading">Searching...</div>
          ) : !q.trim() ? (
            <div className="search-empty">
              <p>Type to search across the platform</p>
              <div className="search-hints">
                <span>👤 Trainees</span>
                <span>🏋️ Trainers</span>
                <span>🪪 Memberships</span>
                <span>💳 Payments</span>
              </div>
            </div>
          ) : total === 0 ? (
            <div className="search-empty">
              <p>No results found for "{q}"</p>
            </div>
          ) : (
            <div className="search-results">
              {results.trainees.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">Trainees</div>
                  {results.trainees.map(t => (
                    <button key={t.id} className="search-item" onClick={() => { navigate('/admin/trainees'); onClose(); }}>
                      <span className="search-item-icon">👤</span>
                      <div className="search-item-text">
                        <span className="search-item-primary">{t.profiles?.name}</span>
                        <span className="search-item-secondary">{t.profiles?.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.trainers.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">Trainers</div>
                  {results.trainers.map(t => (
                    <button key={t.id} className="search-item" onClick={() => { navigate('/admin/trainers'); onClose(); }}>
                      <span className="search-item-icon">🏋️</span>
                      <div className="search-item-text">
                        <span className="search-item-primary">{t.profiles?.name}</span>
                        <span className="search-item-secondary">{t.specialization ?? 'Trainer'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.memberships.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">Memberships</div>
                  {results.memberships.map(m => (
                    <button key={m.id} className="search-item" onClick={() => { navigate('/admin/memberships'); onClose(); }}>
                      <span className="search-item-icon">🪪</span>
                      <div className="search-item-text">
                        <span className="search-item-primary">{m.plan}</span>
                        <span className="search-item-secondary">{m.trainees?.profiles?.name ?? '—'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.payments.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">Payments</div>
                  {results.payments.map(p => (
                    <button key={p.id} className="search-item" onClick={() => { navigate('/admin/payments'); onClose(); }}>
                      <span className="search-item-icon">💳</span>
                      <div className="search-item-text">
                        <span className="search-item-primary">₹{Number(p.amount).toFixed(2)}</span>
                        <span className="search-item-secondary">{p.trainees?.profiles?.name ?? '—'} · <Badge status={p.payment_status} /></span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
