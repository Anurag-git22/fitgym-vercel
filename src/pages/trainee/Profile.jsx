import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import { User, Calendar, CreditCard, Dumbbell, TrendingUp } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'attendance', label: 'Attendance', icon: Calendar },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'workout', label: 'Workout', icon: Dumbbell },
  { key: 'progress', label: 'Progress', icon: TrendingUp },
];

export default function TraineeProfile() {
  const { profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState('overview');

  const [form, setForm] = useState({ name: profile?.name ?? '', phone: profile?.phone ?? '' });
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useState(null)[1];

  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id, trainer_id, date_of_birth, trainers(profiles(name, specialization))').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;

  const { data: membership } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: null, error: null });
    return supabase.from('memberships').select('*').eq('trainee_id', traineeId).eq('status', 'active').order('end_date', { ascending: false }).limit(1).maybeSingle();
  }, [traineeId]);

  const { data: attendanceSummary } = useSupabaseQuery(async () => {
    if (!traineeId) return { data: null, error: null };
    const { data, error } = await supabase.from('attendance').select('status').eq('trainee_id', traineeId);
    if (error) return { data: null, error };
    const present = data.filter(a => a.status === 'present').length;
    const total = data.length;
    return { data: { present, total, pct: total ? Math.round((present / total) * 100) : 0 }, error: null };
  }, [traineeId]);

  const { data: payments, loading: payLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase.from('payments').select('*, memberships(plan)').eq('trainee_id', traineeId).order('payment_date', { ascending: false });
  }, [traineeId]);

  const { data: workouts, loading: wkLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase.from('workouts').select('*').eq('trainee_id', traineeId).order('created_at', { ascending: false });
  }, [traineeId]);

  const { data: progress, loading: progLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase.from('progress').select('*').eq('trainee_id', traineeId).order('recorded_date', { ascending: false }).limit(20);
  }, [traineeId]);

  const daysLeft = membership?.end_date ? Math.max(0, Math.ceil((new Date(membership.end_date) - new Date()) / 86400000)) : null;

  async function saveProfile(e) {
    e.preventDefault(); setBusy(true); setProfileErr(''); setProfileMsg('');
    const { error } = await supabase.from('profiles').update({ name: form.name, phone: form.phone || null }).eq('id', profile.id);
    setBusy(false);
    if (error) { setProfileErr(error.message); return; }
    setProfileMsg('Profile updated.'); refreshProfile();
  }

  async function changePassword(e) {
    e.preventDefault(); setBusy(true); setPwErr(''); setPwMsg('');
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match.'); setBusy(false); return; }
    if (pwForm.next.length < 6) { setPwErr('Password must be at least 6 characters.'); setBusy(false); return; }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setBusy(false);
    if (error) { setPwErr(error.message); return; }
    setPwMsg('Password updated.'); setPwForm({ next: '', confirm: '' });
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { setProfileErr(upErr.message); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', profile.id);
    setProfileMsg('Avatar updated.'); refreshProfile();
  }

  const paymentCols = [
    { key: 'payment_date', label: 'Date' },
    { key: 'memberships', label: 'Plan', render: (_, r) => r.memberships?.plan ?? '—' },
    { key: 'amount', label: 'Amount', render: v => `₹${Number(v).toFixed(2)}` },
    { key: 'payment_status', label: 'Status', render: v => <Badge status={v} /> },
  ];

  const workoutCols = [
    { key: 'name', label: 'Plan' },
    { key: 'duration_minutes', label: 'Duration', render: v => v ? `${v} min` : '—' },
    { key: 'exercises', label: 'Exercises', render: v => `${(v ?? []).length} exercises` },
    { key: 'created_at', label: 'Created', render: v => new Date(v).toLocaleDateString() },
  ];

  const progressCols = [
    { key: 'recorded_date', label: 'Date' },
    { key: 'weight', label: 'Weight', render: v => v ? `${v} kg` : '—' },
    { key: 'notes', label: 'Notes', render: v => v ?? '—' },
  ];

  const attendanceCols = [
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
    { key: 'check_in_time', label: 'Check-in', render: v => v ? new Date(v).toLocaleTimeString() : '—', hideOnMobile: true },
  ];

  return (
    <div>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-avatar">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="avatar" />
            : <span>{profile?.name?.[0]?.toUpperCase() ?? '?'}</span>}
        </div>
        <div className="profile-header-info">
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{profile?.name}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem' }}>
            <Badge status={profile?.account_status} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile?.email}</span>
          </div>
        </div>
        <div className="profile-header-actions">
          <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={uploadAvatar} />
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>Change Photo</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className={`profile-tab${tab === t.key ? ' profile-tab--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div>
          <div className="detail-grid">
            <Card title="Contact Information">
              <dl className="detail-dl">
                <dt>Email</dt> <dd>{profile?.email}</dd>
                <dt>Phone</dt> <dd>{profile?.phone ?? '—'}</dd>
                <dt>Date of Birth</dt> <dd>{trainee?.date_of_birth ?? '—'}</dd>
              </dl>
            </Card>
            <Card title="Membership">
              {membership ? (
                <dl className="detail-dl">
                  <dt>Plan</dt> <dd>{membership.plan}</dd>
                  <dt>Start</dt> <dd>{membership.start_date}</dd>
                  <dt>End</dt> <dd>{membership.end_date}</dd>
                  <dt>Status</dt> <dd><Badge status={membership.status} /></dd>
                  {daysLeft !== null && (<><dt>Days Left</dt> <dd>{daysLeft}</dd></>)}
                </dl>
              ) : (
                <EmptyState icon="🪪" title="No active membership" message="Contact admin to set up a membership plan." />
              )}
            </Card>
            <Card title="Attendance Summary">
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{attendanceSummary ? `${attendanceSummary.pct}%` : '—'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attendance rate</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>{attendanceSummary?.present ?? 0} present</div>
                  <div>{(attendanceSummary?.total ?? 0) - (attendanceSummary?.present ?? 0)} absent</div>
                  <div>{attendanceSummary?.total ?? 0} total sessions</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="detail-grid" style={{ marginTop: '1.25rem' }}>
            <Card title="Assigned Trainer">
              {trainee?.trainers?.profiles?.name ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="avatar-lg" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                    {trainee.trainers.profiles.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{trainee.trainers.profiles.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{trainee.trainers.profiles.specialization ?? 'Personal Trainer'}</div>
                  </div>
                </div>
              ) : (
                <EmptyState icon="🏋️" title="No trainer assigned" message="Contact admin to assign a trainer." />
              )}
            </Card>
            <Card title="Payment Summary">
              <dl className="detail-dl">
                <dt>Total Paid</dt> <dd>₹{(payments ?? []).filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.amount), 0).toFixed(2)}</dd>
                <dt>Pending</dt> <dd>₹{(payments ?? []).filter(p => p.payment_status === 'pending').reduce((s, p) => s + Number(p.amount), 0).toFixed(2)}</dd>
                <dt>Last Payment</dt> <dd>{(payments ?? [])[0] ? `₹${Number((payments ?? [])[0].amount).toFixed(2)}` : '—'}</dd>
              </dl>
            </Card>
            <Card title="Workout Summary">
              {workouts?.[0] ? (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>{workouts[0].name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    {workouts[0].duration_minutes ? `${workouts[0].duration_minutes} min` : ''} · {(workouts[0].exercises ?? []).length} exercises
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {(workouts[0].exercises ?? []).slice(0, 3).map((ex, i) => (
                      <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{i + 1}.</span>
                        <span>{ex.name}</span>
                        {ex.sets && <span style={{ color: 'var(--text-muted)' }}>{ex.sets}×{ex.reps}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <EmptyState icon="💪" title="No workout assigned" message="Your trainer will assign a plan soon." />
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 'attendance' && (
        <Card title="Attendance Records" padding={false}>
          <Table columns={attendanceCols} data={attendanceSummary ? [] : []} loading={false} emptyMsg="No attendance records." />
        </Card>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <Card title="Payment History" padding={false}>
          {payLoading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (
            <Table columns={paymentCols} data={payments ?? []} loading={payLoading} emptyMsg="No payment records." />
          )}
        </Card>
      )}

      {/* Workout Tab */}
      {tab === 'workout' && (
        <Card title="Workout Plans" padding={false}>
          {wkLoading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (workouts ?? []).length === 0 ? (
            <EmptyState icon="💪" title="No workout plans yet" message="Your trainer will assign a plan soon." />
          ) : (
            <Table columns={workoutCols} data={workouts ?? []} loading={wkLoading} />
          )}
        </Card>
      )}

      {/* Progress Tab */}
      {tab === 'progress' && (
        <Card title="Progress Log" padding={false}>
          {progLoading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (progress ?? []).length === 0 ? (
            <EmptyState icon="📈" title="No progress entries yet" message="Your trainer will log progress after each session." />
          ) : (
            <Table columns={progressCols} data={(progress ?? []).reverse()} loading={progLoading} />
          )}
        </Card>
      )}

      {/* Account Settings */}
      <div style={{ marginTop: '2rem' }}>
        <Card title="Account Settings" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={saveProfile} className="auth-form">
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={profile?.email ?? ''} disabled style={{ opacity: 0.6 }} />
            </div>
            {profileErr && <div className="auth-error">{profileErr}</div>}
            {profileMsg && <div className="auth-success">{profileMsg}</div>}
            <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Card>

        <Card title="Change Password">
          <form onSubmit={changePassword} className="auth-form">
            <div className="form-group"><label>New Password *</label><input required type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} /></div>
            <div className="form-group"><label>Confirm Password *</label><input required type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} /></div>
            {pwErr && <div className="auth-error">{pwErr}</div>}
            {pwMsg && <div className="auth-success">{pwMsg}</div>}
            <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Change Password'}</button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
