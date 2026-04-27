import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="ro-footer">
      <div className="ro-footer__inner">

        <div className="ro-footer__cols">

          {/* brand */}
          <div className="ro-footer__brand">
            <div className="ro-footer__logo-row">
              <div className="ro-footer__logo-mark">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.9"/>
                  <rect x="9" y="2" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.5"/>
                  <rect x="2" y="9" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.5"/>
                  <rect x="9" y="9" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.9"/>
                </svg>
              </div>
              <span className="ro-footer__brand-name">RuralOps</span>
            </div>
            <p className="ro-footer__brand-desc">
              A governance-focused operations platform for rural development —
              built on structured oversight, accountability, and timely
              intervention across every ward.
            </p>
            <div className="ro-footer__status-pill">
              <span className="ro-footer__status-dot" />
              Civic Registry Active
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="ro-footer__col-heading">Platform</p>
            <ul className="ro-footer__links">
              {["Citizen Portal", "Role Dashboards", "Program Monitoring", "Grievance Tracking", "AI Verification"].map(l => (
                <li key={l}><a href="#" className="ro-footer__link">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="ro-footer__col-heading">Resources</p>
            <ul className="ro-footer__links">
              {["Documentation", "Usage Guidelines", "FAQs", "Support"].map(l => (
                <li key={l}><a href="#" className="ro-footer__link">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Access & Legal */}
          <div>
            <p className="ro-footer__col-heading">Access & Legal</p>
            <ul className="ro-footer__links">
              {["Login", "Privacy Policy", "Terms of Use", "Accessibility"].map(l => (
                <li key={l}><a href="#" className="ro-footer__link">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ro-footer__divider" />

        <div className="ro-footer__bottom">
          <p className="ro-footer__copyright">
            © {new Date().getFullYear()} RuralOps — All rights reserved
          </p>
          <p className="ro-footer__notice">
            <span className="ro-footer__notice-dot" />
            Administrative access restricted to authorized personnel
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;