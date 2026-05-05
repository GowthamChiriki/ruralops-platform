import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../Styles/CitizenApprovals.css";

/* ════════════════════════════════════════════
   BASE URL — single source of truth
════════════════════════════════════════════ */
const BASE = import.meta.env.VITE_API_BASE_URL ?? "https://ruralops-platform-production.up.railway.app";

/* ════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════ */
function getToken() { return localStorage.getItem("accessToken"); }
function getRole()  { return localStorage.getItem("accountType"); }

/**
 * Central fetch wrapper.
 * - Always reads token fresh.
 * - Throws typed errors for 401 / 403.
 */
async function authFetch(url, options = {}) {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    localStorage.clear();
    const err = new Error("Session expired. Please log in again.");
    err.code = 401;
    throw err;
  }

  if (res.status === 403) {
    const err = new Error("You do not have permission to perform this action.");
    err.code = 403;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `The Citadel refused the raven (${res.status})`);
  }

  return res; // return raw Response — callers decide .json() or .text()
}

/* ════════════════════════════════════════════
   ROLE GUARD HOOK — only ROLE_VAO may enter
════════════════════════════════════════════ */
function useRequireRole(requiredRole) {
  const nav = useNavigate();

  useEffect(() => {
    const token = getToken();
    const role  = getRole();

    if (!token) {
      nav("/vao/login", { replace: true });
      return;
    }
    if (role !== requiredRole) {
      nav("/unauthorized", { replace: true });
    }
  }, [nav, requiredRole]);
}

/* ════════════════════════════════════════════
   PAGINATED FETCH HELPER
   Keeps fetching until an empty / partial page.
   Uses authFetch so 401/403 propagate correctly.
════════════════════════════════════════════ */
async function fetchAllPages(urlBase, pageSize = 5) {
  const all = [];
  let page = 0;
  const SAFETY = 500;

  while (page < SAFETY) {
    const res  = await authFetch(`${urlBase}?page=${page}`);
    const raw  = await res.json().catch(() => []);
    const list = Array.isArray(raw) ? raw : (raw?.content ?? raw?.data ?? []);
    if (!list.length) break;
    all.push(...list);
    if (list.length < pageSize) break;
    page++;
  }
  return all;
}

/* ════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════ */
function Sk({ w, h, r = 6, mb = 0 }) {
  return (
    <div className="ca-sk" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
  );
}

function Toast({ msg, type, onDismiss }) {
  const icon = type === "success" ? "⚔" : type === "warn" ? "📜" : "🐉";
  return (
    <div className={`ca-toast ca-toast--${type}`} onClick={onDismiss}>
      <span className="ca-toast__icon">{icon}</span>
      <span>{msg}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING_APPROVAL:   { cls: "badge--amber", label: "Awaiting the King's Seal" },
    PENDING_ACTIVATION: { cls: "badge--blue",  label: "Oath Pending"             },
    ACTIVE:             { cls: "badge--green", label: "Sworn & Active"           },
    REJECTED:           { cls: "badge--red",   label: "Petition Denied"          },
    SUSPENDED:          { cls: "badge--red",   label: "Banished"                 },
    PENDING:            { cls: "badge--amber", label: "Awaiting Review"          },
  };
  const b = map[status] || { cls: "badge--muted", label: status || "Unknown" };
  return <span className={`ca-badge ${b.cls}`}>{b.label}</span>;
}

function DetailRow({ icon, label, value, mono }) {
  return (
    <div className="ca-detail-row">
      <span className="ca-detail-row__icon">{icon}</span>
      <div className="ca-detail-row__body">
        <span className="ca-detail-row__label">{label}</span>
        <span className={[
          "ca-detail-row__value",
          mono   ? "ca-detail-row__value--mono"  : "",
          !value ? "ca-detail-row__value--empty" : "",
        ].filter(Boolean).join(" ")}>
          {value || "Not inscribed upon the scroll"}
        </span>
      </div>
    </div>
  );
}

function ConfirmModal({ citizen, decision, onConfirm, onCancel, loading }) {
  const isApprove = decision === "APPROVE";
  return (
    <div className="ca-modal-overlay" onClick={onCancel}>
      <div className="ca-modal" onClick={e => e.stopPropagation()}>
        <div className="ca-modal__bg-glow" aria-hidden="true">⚔</div>
        <div className={`ca-modal__icon ${isApprove ? "ca-modal__icon--approve" : "ca-modal__icon--reject"}`}>
          <span>{isApprove ? "⚔" : "🐉"}</span>
          <div className="ca-modal__icon-ring" />
          <div className="ca-modal__icon-ring2" />
        </div>
        <h3 className="ca-modal__title">
          {isApprove ? "Grant the Petition?" : "Deny the Petition?"}
        </h3>
        <p className="ca-modal__sub">
          {isApprove ? (
            <>Thou art about to grant entry to the realm for <strong>{citizen.fullName}</strong>. A Citizen's Seal shall be forged, and they may proceed to swear their oath of activation.</>
          ) : (
            <>Thou art about to deny the petition of <strong>{citizen.fullName}</strong>. This decree is final and cannot be overturned by mortal hand.</>
          )}
        </p>
        <div className="ca-modal__citizen-chip">
          <span>🛡</span>
          <span>{citizen.fullName}</span>
          <span className="ca-modal__citizen-chip-sep">·</span>
          <span>{citizen.villageName}</span>
        </div>
        <div className="ca-modal__actions">
          <button className="ca-btn ca-btn--ghost" onClick={onCancel} disabled={loading} type="button">
            Withdraw the Scroll
          </button>
          <button
            className={`ca-btn ${isApprove ? "ca-btn--approve" : "ca-btn--reject"}${loading ? " ca-btn--busy" : ""}`}
            onClick={onConfirm} disabled={loading} type="button"
          >
            {loading ? (
              <><span className="ca-btn__spin" />Sealing the Decree…</>
            ) : isApprove ? <>⚔ Seal the Approval</> : <>🐉 Issue the Denial</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function CitizenCard({ citizen, index, onDecision, processing }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`ca-card${expanded ? " ca-card--open" : ""}`} style={{ animationDelay: `${index * 0.07}s` }}>
      <div className="ca-card__header" onClick={() => setExpanded(e => !e)} role="button" aria-expanded={expanded}>
        <div className="ca-card__avatar">
          <span>{citizen.fullName?.[0]?.toUpperCase() || "?"}</span>
          <div className="ca-card__avatar-ring" aria-hidden="true" />
          <div className="ca-card__avatar-ring2" aria-hidden="true" />
        </div>
        <div className="ca-card__identity">
          <span className="ca-card__name">{citizen.fullName}</span>
          <span className="ca-card__meta">
            <span>🛡 {citizen.fatherName || "—"}</span>
            <span className="ca-card__dot" aria-hidden="true" />
            <span>⚜ {citizen.villageName}, {citizen.mandalName}</span>
          </span>
        </div>
        <div className="ca-card__right">
          <StatusBadge status={citizen.status} />
          <span className={`ca-card__chevron${expanded ? " ca-card__chevron--open" : ""}`} aria-hidden="true">›</span>
        </div>
      </div>

      {expanded && (
        <div className="ca-card__body">
          <div className="ca-card__body-inner">
            <div className="ca-card__watermark" aria-hidden="true">⚔</div>
            <div className="ca-section">
              <h4 className="ca-section__title"><span className="ca-section__title-sword">⚔</span>Petitioner's Chronicle</h4>
              <div className="ca-section__grid">
                <DetailRow icon="📜" label="Full Name of the Petitioner" value={citizen.fullName} />
                <DetailRow icon="🛡" label="Father's Name" value={citizen.fatherName} />
              </div>
            </div>
            <div className="ca-section">
              <h4 className="ca-section__title"><span className="ca-section__title-sword">📜</span>Raven & Crystal Channels</h4>
              <div className="ca-section__grid">
                <DetailRow icon="🔮" label="Mobile - Crystal Channel" value={citizen.phoneNumber} mono />
                <DetailRow icon="🦅" label="Email - Raven Address" value={citizen.email} />
              </div>
            </div>
            <div className="ca-section">
              <h4 className="ca-section__title"><span className="ca-section__title-sword">⚜</span>Realm of Origin</h4>
              <div className="ca-section__grid">
                <DetailRow icon="🏰" label="Village of Birth" value={citizen.villageName} />
                <DetailRow icon="🗺" label="Mandal Province" value={citizen.mandalName} />
                <DetailRow icon="🔑" label="Village Seal" value={citizen.villageId} mono />
                <DetailRow icon="🔑" label="Mandal Seal" value={citizen.mandalId} mono />
              </div>
            </div>
          </div>
          <div className="ca-card__actions">
            <button
              className={`ca-btn ca-btn--reject${processing === citizen.citizenInternalId ? " ca-btn--busy" : ""}`}
              onClick={() => onDecision(citizen, "REJECT")}
              disabled={!!processing} type="button"
            >
              🐉 Deny the Petition
            </button>
            <button
              className={`ca-btn ca-btn--approve${processing === citizen.citizenInternalId ? " ca-btn--busy" : ""}`}
              onClick={() => onDecision(citizen, "APPROVE")}
              disabled={!!processing} type="button"
            >
              ⚔ Grant Entry to the Realm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function CitizenApprovals() {
  const navigate  = useNavigate();
  const { vaoId } = useParams();

  // ── Role guard ──
  useRequireRole("VAO");

  const [citizens,    setCitizens]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(null);
  const [authError,   setAuthError]   = useState(null);
  const [visible,     setVisible]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [modal,       setModal]       = useState(null);
  const [processing,  setProcessing]  = useState(null);
  const [decided,     setDecided]     = useState([]);

  /* ── FETCH ALL PENDING CITIZENS ──
     Backend: GET /vao/citizens/pending?page=N
     VAO is resolved from JWT principal — no vaoId in URL.
  */
  const fetchPending = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setAuthError(null);

    try {
      const list = await fetchAllPages(`${BASE}/vao/citizens/pending`);
      setCitizens(list);
    } catch (e) {
      if (e.code === 401) {
        setAuthError(e.message);
        setTimeout(() => navigate("/vao/login", { replace: true }), 2000);
      } else if (e.code === 403) {
        setAuthError(e.message);
      } else {
        setFetchError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  /* ── Animate in once loaded ── */
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 60);
      return () => clearTimeout(t);
    }
  }, [loading]);

  /* ── Auto-dismiss toast ── */
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  /* ── FILTERED LIST ── */
  const filtered = citizens.filter(c => {
    if (decided.includes(c.citizenInternalId)) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      c.fullName?.toLowerCase().includes(q)    ||
      c.fatherName?.toLowerCase().includes(q)  ||
      c.phoneNumber?.includes(q)               ||
      c.email?.toLowerCase().includes(q)       ||
      c.villageName?.toLowerCase().includes(q)
    );
  });

  const handleDecision = (citizen, decision) => setModal({ citizen, decision });

  /* ── EXECUTE APPROVE / REJECT ──
     Backend: POST /vao/citizens/decision
     Body: { citizenInternalId, decision }  (CitizenApprovalRequest)
     VAO is resolved from JWT principal — no vaoId in URL.
  */
  const executeDecision = async () => {
    const { citizen, decision } = modal;
    const internalId = citizen.citizenInternalId;

    setProcessing(internalId);
    setModal(null);

    try {
      const res = await authFetch(
        `${BASE}/vao/citizens/decision`,
        {
          method: "POST",
          body: JSON.stringify({ citizenInternalId: internalId, decision }),
        }
      );

      // Response may be plain text or empty — read safely
      await res.text().catch(() => "");

      setDecided(d => [...d, internalId]);
      setToast({
        msg:  decision === "APPROVE"
          ? `⚔ ${citizen.fullName} hath been granted entry to the realm`
          : `📜 The petition of ${citizen.fullName} hath been denied`,
        type: decision === "APPROVE" ? "success" : "warn",
      });
    } catch (e) {
      if (e.code === 401) {
        setAuthError(e.message);
        setToast({ msg: "Session expired. Redirecting to login…", type: "error" });
        setTimeout(() => navigate("/vao/login", { replace: true }), 2000);
      } else if (e.code === 403) {
        setToast({ msg: "You do not have permission to issue this decree.", type: "error" });
      } else {
        setToast({ msg: e.message, type: "error" });
      }
    } finally {
      setProcessing(null);
    }
  };

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <>
      <Navbar />

      <div className="ca-page">

        {/* ── AMBIENT ── */}
        <div className="ca-ambient" aria-hidden="true">
          <div className="ca-orb ca-orb--1" /><div className="ca-orb ca-orb--2" />
          <div className="ca-orb ca-orb--3" /><div className="ca-orb ca-orb--4" />
          <div className="ca-orb ca-orb--5" />
          <div className="ca-dot-grid" />
          <div className="ca-vignette" />
        </div>

        {/* ── TOAST ── */}
        {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}

        {/* ── CONFIRM MODAL ── */}
        {modal && (
          <ConfirmModal
            citizen={modal.citizen}
            decision={modal.decision}
            onConfirm={executeDecision}
            onCancel={() => setModal(null)}
            loading={!!processing}
          />
        )}

        <div className={`ca-wrap${visible ? " ca-wrap--visible" : ""}`}>

          {/* ── BACK LINK ── */}
          <button className="ca-back" onClick={() => navigate(`/vao/dashboard/${vaoId}`)} type="button">
            <span className="ca-back__arrow">←</span>
            <span>Return to the Great Hall</span>
          </button>

          {/* ── PAGE HEADER ── */}
          <header className="ca-header">
            <div className="ca-header__badge">
              <span className="ca-header__badge-dot" />
              <span className="ca-header__badge-pulse" />
              <span className="ca-header__badge-sword">⚔</span>
              Village Administrative Officer
            </div>
            <h1 className="ca-header__title">
              <span className="ca-title-word">Petitioner</span>
              <span className="ca-title-word ca-title-word--hl">Registry</span>
            </h1>
            <p className="ca-header__sub">
              Review the petitions of those who seek to dwell within thy village.
              Grant entry to worthy souls, or deny those who fail the king's standard.
              Thy seal is thy word, and thy word is law.
            </p>
            <div className="ca-header__deco" aria-hidden="true">
              <div className="ca-header__deco-line" />
              <span className="ca-header__deco-crown">👑</span>
              <div className="ca-header__deco-line" />
            </div>
          </header>

          {/* ── AUTH ERROR BANNER (401 / 403) ── */}
          {authError && (
            <div className="ca-error-state">
              <div className="ca-error-state__icon">🔒</div>
              <h3 className="ca-error-state__title">Access Denied</h3>
              <p className="ca-error-state__msg">{authError}</p>
              {authError.includes("expired") && (
                <button
                  className="ca-btn ca-btn--primary"
                  onClick={() => navigate("/vao/login", { replace: true })}
                  type="button"
                >
                  Go to Login
                </button>
              )}
            </div>
          )}

          {/* ── HERALDIC STAT TILES ── */}
          {!loading && !fetchError && !authError && (
            <div className="ca-stats-bar">
              <div className="ca-stat ca-stat--amber">
                <div className="ca-stat__inner">
                  <span className="ca-stat__val">{filtered.length}</span>
                  <span className="ca-stat__label">Awaiting the King's Seal</span>
                </div>
                <div className="ca-stat__icon">⏳</div>
              </div>
              <div className="ca-stat ca-stat--green">
                <div className="ca-stat__inner">
                  <span className="ca-stat__val">{decided.length}</span>
                  <span className="ca-stat__label">Decrees Issued This Session</span>
                </div>
                <div className="ca-stat__icon">⚔</div>
              </div>
              <div className="ca-stat ca-stat--blue">
                <div className="ca-stat__inner">
                  <span className="ca-stat__val">{citizens.length}</span>
                  <span className="ca-stat__label">Scrolls Received</span>
                </div>
                <div className="ca-stat__icon">📜</div>
              </div>
            </div>
          )}

          {/* ── SEARCH TOOLBAR ── */}
          {!loading && !fetchError && !authError && citizens.length > 0 && (
            <div className="ca-toolbar">
              <div className="ca-search">
                <span className="ca-search__icon">🔍</span>
                <input
                  className="ca-search__input"
                  placeholder="Search by name, raven address, crystal channel, or village…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="ca-search__clear" onClick={() => setSearch("")} type="button">✕</button>
                )}
              </div>
              <button className="ca-btn ca-btn--ghost ca-btn--sm" onClick={fetchPending} type="button">
                ↻ Summon New Ravens
              </button>
            </div>
          )}

          {/* ── SKELETON LOADING ── */}
          {loading && (
            <div className="ca-list">
              {[0, 1, 2, 3].map(i => (
                <div className="ca-card" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="ca-card__header">
                    <Sk w={50} h={50} r={50} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <Sk w="50%" h={15} r={4} />
                      <Sk w="72%" h={11} r={4} />
                    </div>
                    <Sk w={120} h={26} r={999} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── GENERAL ERROR STATE ── */}
          {fetchError && !authError && (
            <div className="ca-error-state">
              <div className="ca-error-state__icon">🐉</div>
              <h3 className="ca-error-state__title">The Ravens Could Not Deliver</h3>
              <p className="ca-error-state__msg">{fetchError}</p>
              <button className="ca-btn ca-btn--primary" onClick={fetchPending} type="button">
                ↻ Dispatch New Ravens
              </button>
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {!loading && !fetchError && !authError && filtered.length === 0 && (
            <div className="ca-empty">
              <div className="ca-empty__icon">{search ? "🔍" : "👑"}</div>
              <h3 className="ca-empty__title">
                {search ? "No Petitioners Found" : "The Hall Stands Empty"}
              </h3>
              <p className="ca-empty__sub">
                {search
                  ? `No petitioners match "${search}". Try a different search of the rolls.`
                  : decided.length > 0
                  ? `Thou hast issued ${decided.length} royal decree${decided.length > 1 ? "s" : ""} this session. The registry is clear.`
                  : "No petitions await thy seal at this hour. The realm is at peace."}
              </p>
              {search && (
                <button className="ca-btn ca-btn--ghost" onClick={() => setSearch("")} type="button">
                  Clear the Search Rolls
                </button>
              )}
            </div>
          )}

          {/* ── CITIZEN LIST ── */}
          {!loading && !fetchError && !authError && filtered.length > 0 && (
            <div className="ca-list">
              {filtered.map((citizen, i) => (
                <CitizenCard
                  key={citizen.citizenInternalId || i}
                  citizen={citizen}
                  index={i}
                  onDecision={handleDecision}
                  processing={processing}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </>
  );
}