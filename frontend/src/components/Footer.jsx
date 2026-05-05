import { Link } from "react-router-dom";
import { 
  Globe, Mail, MessageSquare, Share2, ArrowRight,
  Shield, Users, BarChart3, MapPin, Check, Zap, Smartphone
} from "lucide-react";
import logo from "../assets/ruralops-logo.png";
import footerVillageBg from "../assets/footer-village-bg.png";

export default function Footer() {
  return (
    <footer className="ft-root">
      <style>{`
        .ft-root {
          background: var(--bg-0);
          color: var(--text-main);
          border-top: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          padding: 100px 8% 40px;
          font-family: 'Outfit', sans-serif;
        }

        /* Subtle atmospheric background */
        .ft-bg-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to top, var(--bg-0) 0%, transparent 100%),
                      url(${footerVillageBg}) bottom center no-repeat;
          background-size: cover;
          opacity: 0.06;
          pointer-events: none;
          z-index: 0;
        }

        .ft-container {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
        }

        .ft-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 2fr;
          gap: 60px;
          margin-bottom: 80px;
        }

        /* Brand Column */
        .ft-brand-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .ft-logo-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
        }

        .ft-logo { 
          height: 64px; 
          width: auto; 
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.1));
        }

        .ft-brand-text h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: var(--text-1);
          line-height: 1;
          letter-spacing: -0.02em;
        }
        
        .ft-brand-text p {
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-top: 4px;
        }

        .ft-desc {
          font-size: 15px;
          color: var(--text-3);
          line-height: 1.7;
          max-width: 300px;
        }

        .ft-socials {
          display: flex;
          gap: 12px;
        }

        .ft-social-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--bg-1);
          color: var(--text-2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.3s;
          border: 1px solid var(--border);
        }

        .ft-social-btn:hover {
          background: var(--accent);
          color: white;
          transform: translateY(-3px);
          border-color: var(--accent);
        }

        /* Links Columns */
        .ft-col h4 {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-1);
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .ft-links {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ft-link {
          font-size: 14px;
          color: var(--text-3);
          text-decoration: none;
          transition: 0.2s;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ft-link:hover {
          color: var(--accent);
          transform: translateX(4px);
        }

        /* Newsletter Section */
        .ft-newsletter-card {
          background: var(--bg-1);
          padding: 32px;
          border-radius: 24px;
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }

        .ft-newsletter-card h4 {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: var(--text-1);
          margin-bottom: 12px;
        }

        .ft-newsletter-card p {
          font-size: 13px;
          color: var(--text-3);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .ft-input-group {
          display: flex;
          background: var(--bg-0);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 4px;
          transition: 0.2s;
        }

        .ft-input-group:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-soft);
        }

        .ft-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0 16px;
          color: var(--text-1);
          font-size: 14px;
          outline: none;
        }

        .ft-submit {
          width: 44px;
          height: 44px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .ft-submit:hover {
          background: var(--accent-hover);
          transform: scale(1.05);
        }

        /* Trust Badges */
        .ft-trust {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 32px 0;
          border-top: 1px solid var(--border);
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .ft-trust-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ft-trust-item svg { color: var(--accent); }

        /* Bottom Bar */
        .ft-bottom {
          padding-top: 32px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .ft-copyright {
          font-size: 14px;
          color: var(--text-4);
          font-weight: 500;
        }

        .ft-legal {
          display: flex;
          gap: 32px;
        }

        .ft-legal a {
          font-size: 14px;
          color: var(--text-4);
          text-decoration: none;
          font-weight: 600;
          transition: 0.2s;
        }

        .ft-legal a:hover {
          color: var(--accent);
        }

        @media (max-width: 1200px) {
          .ft-top { grid-template-columns: 1fr 1fr; }
          .ft-newsletter-card { grid-column: span 2; }
        }

        @media (max-width: 768px) {
          .ft-top { grid-template-columns: 1fr; }
          .ft-newsletter-card { grid-column: span 1; }
          .ft-bottom { flex-direction: column; text-align: center; }
          .ft-logo { height: 56px; }
        }
      `}</style>

      <div className="ft-bg-overlay" />

      <div className="ft-container">
        <div className="ft-top">
          <div className="ft-brand-col">
            <Link to="/" className="ft-logo-wrap">
              <img src={logo} alt="RuralOps" className="ft-logo" />
              <div className="ft-brand-text">
                <h3>RuralOps</h3>
                <p>Digital Village Ledger</p>
              </div>
            </Link>
            <p className="ft-desc">
              Building transparent, efficient, and connected rural communities through state-of-the-art digital governance.
            </p>
            <div className="ft-socials">
              {[Share2, MessageSquare, Globe].map((Icon, i) => (
                <button key={i} className="ft-social-btn">
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="ft-col">
            <h4>Platform</h4>
            <ul className="ft-links">
              <li><Link to="/" className="ft-link">Home</Link></li>
              <li><Link to="/#services" className="ft-link">Services</Link></li>
              <li><Link to="/login" className="ft-link">Portal Access</Link></li>
              <li><Link to="/citizen/register" className="ft-link">Register</Link></li>
            </ul>
          </div>

          <div className="ft-col">
            <h4>Resources</h4>
            <ul className="ft-links">
              <li><Link to="/docs" className="ft-link">Documentation</Link></li>
              <li><Link to="/help" className="ft-link">Support Keep</Link></li>
              <li><Link to="/stats" className="ft-link">Village Ledger</Link></li>
              <li><Link to="/mobile-app" className="ft-link">Mobile Scroll</Link></li>
            </ul>
          </div>

          <div className="ft-col">
            <h4>Dominion</h4>
            <ul className="ft-links">
              <li><Link to="/about" className="ft-link">Our Creed</Link></li>
              <li><Link to="/contact" className="ft-link">Herald Office</Link></li>
              <li><Link to="/privacy" className="ft-link">Privacy Shield</Link></li>
              <li><Link to="/terms" className="ft-link">Oaths & Terms</Link></li>
            </ul>
          </div>

          <div className="ft-newsletter-card">
            <h4>The Royal Decree</h4>
            <p>Subscribe to receive important announcements and village progress reports.</p>
            <form className="ft-input-group" onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder="Your herald email" className="ft-input" required />
              <button type="submit" className="ft-submit">
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>

        <div className="ft-trust">
          <div className="ft-trust-item"><Shield size={16} /> Secured by RSA-4096</div>
          <div className="ft-trust-item"><Check size={16} /> ISO 27001 Certified</div>
          <div className="ft-trust-item"><Users size={16} /> 50K+ Citizens Enrolled</div>
          <div className="ft-trust-item"><Smartphone size={16} /> Mobile-First Design</div>
        </div>

        <div className="ft-bottom">
          <p className="ft-copyright">
            © 2024 RuralOps Platform. Part of the Digital GramaSetu Initiative.
          </p>
          <div className="ft-legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/security">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}