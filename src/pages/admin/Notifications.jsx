import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card       from '../../components/ui/Card';
import Modal      from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminNotifications() {
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({ profile_id: '', message: '' });
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');

  const { data, loading, refetch } = useSupabaseQuery(() =>
    supabase
      .from('notifications')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(50),
  []);

  const { data: profiles } = useSupabaseQuery(() =>
    supabase.from('profiles').select('id, name, email').neq('role', 'admin'), []);

  /* Realtime subscription */
  useEffect(() => {
    const channel = supabase
      .channel('notifications-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refetch())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refetch]);

  async function handleSend(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('notifications').insert({
      profile_id: form.profile_id,
      message:    form.message,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(false); setForm({ profile_id: '', message: '' }); refetch();
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    refetch();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Notifications</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={markAllRead}>Mark all read</button>
          <button className="btn btn-primary" onClick={() => { setError(''); setModal(true); }}>+ Send Notification</button>
        </div>
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="spinner" style={{ margin: '2rem auto' }} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState icon="🔔" title="No notifications" message="Send a notification to a trainer or trainee." />
        ) : (
          <ul className="notif-list">
            {(data ?? []).map(n => (
              <li key={n.id} className={`notif-item${n.is_read ? '' : ' notif-item--unread'}`}>
                <div className="notif-meta">
                  <span className="notif-name">{n.profiles?.name ?? 'Unknown'}</span>
                  <span className="notif-time">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="notif-message">{n.message}</p>
                {!n.is_read && <span className="badge badge--blue" style={{ fontSize: '0.7rem' }}>Unread</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Send Notification" size="sm">
        <form onSubmit={handleSend} className="auth-form">
          <div className="form-group">
            <label>Recipient *</label>
            <select required value={form.profile_id} onChange={e=>setForm(f=>({...f,profile_id:e.target.value}))}>
              <option value="">— Select user —</option>
              {(profiles ?? []).map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Message *</label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={e=>setForm(f=>({...f,message:e.target.value}))}
              style={{ resize: 'vertical' }}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
