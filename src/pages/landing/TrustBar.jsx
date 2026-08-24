import { Shield, Zap, Database, Lock } from 'lucide-react';

export default function TrustBar() {
  return (
    <div className="land-trust">
      <h2 className="land-trust-title">Everything your gym needs. One platform.</h2>
      <p className="land-trust-sub">
        FitGym simplifies gym management by connecting administration, trainers
        and trainees in a single, secure, real-time platform.
      </p>
      <div className="land-trust-pills">
        <span className="land-trust-pill"><Shield size={13} /> Role-Based Access</span>
        <span className="land-trust-pill"><Zap size={13} /> Real-Time Data</span>
        <span className="land-trust-pill"><Database size={13} /> Supabase Powered</span>
        <span className="land-trust-pill"><Lock size={13} /> Secure by Default</span>
      </div>
    </div>
  );
}
