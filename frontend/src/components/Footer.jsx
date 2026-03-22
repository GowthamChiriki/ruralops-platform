import ruralopsLogo from "../assets/ruralops-logo.png";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="got-footer">
      <div className="got-footer__topbar" />
      <div className="got-footer__orb" />
      <div className="got-footer__grid-bg" />

      <div className="got-footer__inner">
        <div className="got-footer__cols">

          {/* ── BRAND ── */}
          <div>
            <div className="got-brand__sigil">
            
              <div className="got-brand__text-block">
                <div className="got-brand__name">RuralOps</div>
                <div className="got-brand__sub">Governance Platform</div>
              </div>
            </div>
            <p className="got-brand__desc">
              A governance-focused operations platform for rural development —
              built on structured oversight, accountability, and timely
              intervention across every ward.
            </p>
            <div className="got-brand__seal">
              <span className="got-brand__seal-dot" />
              Civic Registry Active
            </div>
          </div>

          {/* ── PLATFORM ── */}
          <div>
            <p className="got-col__heading">Platform</p>
            <ul className="got-links">
              {["Citizen Portal","Role Dashboards","Program Monitoring","Grievance Tracking","AI Verification"].map(l => (
                <li key={l}><a href="#" className="got-link">{l} <span className="got-link__arrow">›</span></a></li>
              ))}
            </ul>
          </div>

          {/* ── RESOURCES ── */}
          <div>
            <p className="got-col__heading">Resources</p>
            <ul className="got-links">
              {["Documentation","Usage Guidelines","FAQs","Support"].map(l => (
                <li key={l}><a href="#" className="got-link">{l} <span className="got-link__arrow">›</span></a></li>
              ))}
            </ul>
          </div>

          {/* ── ACCESS & LEGAL ── */}
          <div>
            <p className="got-col__heading">Access & Legal</p>
            <ul className="got-links">
              {["Login","Privacy Policy","Terms of Use","Accessibility"].map(l => (
                <li key={l}><a href="#" className="got-link">{l} <span className="got-link__arrow">›</span></a></li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── ORNAMENTAL DIVIDER ── */}
        <div className="got-divider">
          <div className="got-divider__line" />
          <div className="got-divider__center">
            <div className="got-divider__gem" />
            <div className="got-divider__dash" />
            <div className="got-divider__gem got-divider__gem--lg" />
            <div className="got-divider__dash" />
            <div className="got-divider__gem" />
          </div>
          <div className="got-divider__line" />
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="got-footer__bottom">
          <p className="got-footer__copyright">
            © <strong>{new Date().getFullYear()}</strong> RuralOps — All rights reserved
          </p>
          <p className="got-footer__crest">⚜ Per Officium et Honorem ⚜</p>
          <p className="got-footer__notice">
            <span className="got-footer__notice-icon" />
            Administrative access restricted to authorized personnel
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;