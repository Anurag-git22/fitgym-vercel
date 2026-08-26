import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card from '../../components/ui/Card';

export default function TrainerProfile() {
  const { profile, refreshProfile } = useAuth();

  const { data: trainer, refetch: refetchTrainer } = useSupabaseQuery(() =>
    supabase.from('trainers').select('id, specialization, joining_date').eq('profile_id', profile.id).single(),
  [profile.id]);

  const [profileForm, setProfileForm] = useState({
    name:           profile?.name   ?? '',
    phone:          profile?.phone  ?? '',
    specialization: trainer?.specialization ?? '',
    joining_date:   trainer?.joining_date   ?? '',
  });

  const [pwForm,      setPwForm]      = useState({ next: '', confirm: '' });
  const [profileMsg,  setProfileMsg]  = useState('');
  const [profileErr,  setProfileErr]  = useState('');
  const [pwMsg,       setPwMsg]       = useState('');
  const [pwErr,       setPwErr]       = useState('');
  const [busy,        setBusy]        = useState(false);
  const fileRef = useRef(null);

  // Sync specialization/joining_date once trainer loads
  useState(() => {
    if (trainer) {
      setProfileForm(f => ({
        ...f,
        specialization: trainer.specialization ?? '',
        joining_date:   trainer.joining_date   ?? '',
      }));
    }
  });

  async function saveProfile(e) {
    e.preventDefault(); setBusy(true); setProfileErr(''); setProfileMsg('');
    const { error: pe } = await supabase.from('profiles')
      .update({ name: profileForm.name, phone: profileForm.phone || null })
      .eq('id', profile.id);
    if (pe) { setProfileErr(pe.message); setBusy(false); return; }

    if (trainer?.id) {
      const { error: te } = await supabase.from('trainers')
        .update({ specialization: profileForm.specialization || null, joining_date: profileForm.joining_date || null })
        .eq('id', trainer.id);
      if (te) { setProfileErr(te.message); setBusy(false); return; }
    }

    setBusy(false);
    setProfileMsg('Profile updated successfully.');
    refreshProfile();
    refetchTrainer();
  }

  async function changePassword(e) {
    e.preventDefault(); setBusy(true); setPwErr(''); setPwMsg('');
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match.'); setBusy(false); return; }
    if (pwForm.next.length < 6)         { setPwErr('Password must be at least 6 characters.'); setBusy(false); return; }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setBusy(false);
    if (error) { setPwErr(error.message); return; }
    setPwMsg('Password changed successfully.');
    setPwForm({ next: '', confirm: '' });
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const ext  = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { setProfileErr(upErr.message); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id);
    setProfileMsg('Avatar updated.');
    refreshProfile();
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header"><h2>My Profile</h2></div>

      {/* Profile Info */}
      <Card title="Profile Information" style={{ marginBottom: '1.5rem' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="sidebar-user-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" />
              : <span>{profile?.name?.[0]?.toUpperCase() ?? '?'}</span>
            }
          </div>
          <div>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={uploadAvatar} />
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>Change Photo</button>
          </div>
        </div>

        <form onSubmit={saveProfile} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required value={profileForm.name}  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label>Phone</label>       <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={profile?.email ?? ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Specialization</label>
              <input value={profileForm.specialization} onChange={e => setProfileForm(f => ({ ...f, specialization: e.target.value }))} placeholder="e.g. Strength & Conditioning" />
            </div>
            <div className="form-group">
              <label>Joining Date</label>
              <input type="date" value={profileForm.joining_date} onChange={e => setProfileForm(f => ({ ...f, joining_date: e.target.value }))} />
            </div>
          </div>
          {profileErr && <div className="auth-error">{profileErr}</div>}
          {profileMsg && <div className="auth-success">{profileMsg}</div>}
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card title="Change Password">
        <form onSubmit={changePassword} className="auth-form">
          <div className="form-group"><label>New Password *</label>    <input required type="password" value={pwForm.next}    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} /></div>
          <div className="form-group"><label>Confirm Password *</label><input required type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} /></div>
          {pwErr && <div className="auth-error">{pwErr}</div>}
          {pwMsg && <div className="auth-success">{pwMsg}</div>}
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Change Password'}</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
