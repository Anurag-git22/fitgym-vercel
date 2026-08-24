import '../../styles/landing.css';
import Navbar           from './Navbar';
import Hero             from './Hero';
import TrustBar         from './TrustBar';
import Features         from './Features';
import Roles            from './Roles';
import DashboardPreview from './DashboardPreview';
import HowItWorks       from './HowItWorks';
import CTA              from './CTA';
import Footer           from './Footer';

export default function LandingPage() {
  return (
    <div className="landing-root">
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <Roles />
      <DashboardPreview />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
