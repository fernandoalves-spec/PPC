import { useState, useEffect, useRef, useCallback } from “react”;
import {
BookOpen, UploadCloud, Lock, Unlock, ShieldCheck, X, Trash2,
PlusCircle, MapPin, Layers, Users, Calculator, ChevronDown,
ChevronRight, FileText, CheckCircle, Clock, AlertCircle,
BarChart3, TrendingUp, GraduationCap, Building2, Sparkles,
RefreshCw, Send, Eye, Filter, Bell, Settings, LogOut,
History, Mail, Download, Printer, UserCheck, Shield,
Edit3, Save, AlertTriangle, Info, ChevronUp, MoreVertical,
PieChart, Activity, Search, Star, Zap
} from “lucide-react”;

// ─── PALETA ─────────────────────────────────────────────────────────────────
const C = {
navy: “#0f2044”, navyMid: “#1a3565”, blue: “#1e5cad”, blueLight: “#3a7bd5”,
accent: “#e8a020”, accentLight: “#f5c842”, teal: “#0d7c6e”, tealLight: “#12a090”,
purple: “#7c3aed”, purpleLight: “#a78bfa”,
slate: “#f1f5f9”, text: “#1e293b”, muted: “#64748b”, border: “#e2e8f0”,
danger: “#dc2626”, success: “#16a34a”, warn: “#d97706”,
bg: “#eef2f7”,
};

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const ADMIN_PIN = “2025”;
const COORD_PIN = “1234”;
const COURSE_TYPES = [“Bacharelado”,“Tecnólogo”,“Licenciatura”,“Técnico”,“Pós-graduação”,“MBA”,“Mestrado”];
const ROLES = { ADMIN: “admin”, COORD: “coordenador”, VIEWER: “viewer” };

// ─── UTILS ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toLocaleString(“pt-BR”);
const fmt = n => (n || 0).toLocaleString(“pt-BR”);

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || “”;
const API_HEADERS = {
“Content-Type”: “application/json”,
“x-api-key”: API_KEY,
“anthropic-version”: “2023-06-01”,
“anthropic-dangerous-direct-browser-access”: “true”,
};

const callClaude = async (system, user, maxTokens = 2500) => {
const r = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: API_HEADERS,
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: maxTokens,
system,
messages: [{ role: “user”, content: user }],
}),
});
const d = await r.json();
return d.content?.[0]?.text || “”;
};

const sendEmailViaGmail = async (to, subject, body, mcp) => {
try {
const r = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: API_HEADERS,
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 500,
messages: [{ role: “user”, content: `Envie um email para ${to} com assunto "${subject}" e corpo: ${body}` }],
mcp_servers: [{ type: “url”, url: “https://gmail.mcp.claude.com/mcp”, name: “gmail-mcp” }],
}),
});
return true;
} catch { return false; }
};

// ─── ESTADO INICIAL ──────────────────────────────────────────────────────────
const INIT_AREAS = [
{ id: uid(), name: “Exatas e Tecnologia”, color: C.blue },
{ id: uid(), name: “Humanas e Sociais”, color: C.teal },
{ id: uid(), name: “Saúde”, color: C.purple },
{ id: uid(), name: “Negócios e Gestão”, color: C.accent },
];
const INIT_CAMPUS = [
{ id: uid(), name: “Campus Central”, email: “coord.central@instituicao.edu.br” },
{ id: uid(), name: “Campus Norte”, email: “coord.norte@instituicao.edu.br” },
];
const INIT_USERS = [
{ id: uid(), name: “Administrador”, email: “admin@instituicao.edu.br”, role: ROLES.ADMIN, campusId: null, pin: ADMIN_PIN },
{ id: uid(), name: “Coordenador Central”, email: “coord.central@instituicao.edu.br”, role: ROLES.COORD, campusId: null, pin: COORD_PIN },
];

// ─── MICRO-COMPONENTES ───────────────────────────────────────────────────────
const Badge = ({ children, color = C.blue, small, pill }) => (
<span style={{
background: color + “18”, color, border: `1px solid ${color}30`,
padding: small ? “1px 6px” : “2px 10px”,
borderRadius: pill ? 99 : 6,
fontSize: small ? 10 : 11, fontWeight: 700,
letterSpacing: “0.04em”, textTransform: “uppercase”, whiteSpace: “nowrap”,
}}>{children}</span>
);

const Tag = ({ label, value, icon: Icon, color }) => (
<span style={{
display: “inline-flex”, alignItems: “center”, gap: 4,
background: “#f8fafc”, border: “1px solid #e2e8f0”,
padding: “2px 8px”, borderRadius: 6, fontSize: 11,
color: color || C.muted, whiteSpace: “nowrap”,
}}>
{Icon && <Icon size={10} color={color || C.muted} />}
{label && <span style={{ color: “#94a3b8” }}>{label}:</span>}
{value}
</span>
);

const Spin = ({ size = 16, color = C.blue }) => (

  <div style={{
    width: size, height: size,
    border: `2px solid ${color}30`, borderTop: `2px solid ${color}`,
    borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0,
  }} />
);

const Dot = ({ status }) => {
const map = { done: C.success, pending: C.warn, none: “#cbd5e1” };
return <span style={{
display: “inline-block”, width: 8, height: 8, borderRadius: “50%”,
background: map[status] || map.none, flexShrink: 0,
boxShadow: status === “done” ? `0 0 0 3px ${C.success}22` : “none”,
}} />;
};

const Divider = () => <div style={{ height: 1, background: C.border, margin: “4px 0” }} />;

// ─── GRÁFICO SIMPLES ─────────────────────────────────────────────────────────
const MiniBar = ({ data, colorFn, height = 80, showLabel }) => {
const max = Math.max(…data.map(d => d.value), 1);
return (
<div style={{ display: “flex”, alignItems: “flex-end”, gap: 6, height }}>
{data.map((d, i) => (
<div key={i} style={{ display: “flex”, flexDirection: “column”, alignItems: “center”, flex: 1, gap: 4 }}>
<span style={{ fontSize: 9, color: C.muted, fontWeight: 700 }}>{fmt(d.value)}</span>
<div style={{
width: “100%”, background: (colorFn ? colorFn(i) : C.blue) + “dd”,
borderRadius: “4px 4px 0 0”,
height: Math.max((d.value / max) * (height - 24), 4),
transition: “height 0.5s ease”,
}} />
{showLabel && <span style={{ fontSize: 9, color: C.muted, textAlign: “center”, lineHeight: 1.2, maxWidth: 60 }}>{d.label}</span>}
</div>
))}
</div>
);
};

const DonutChart = ({ data, size = 120 }) => {
const total = data.reduce((a, d) => a + d.value, 0) || 1;
let cumulative = 0;
const r = 40, cx = size / 2, cy = size / 2;
const segments = data.map(d => {
const pct = d.value / total;
const start = cumulative;
cumulative += pct;
const startAngle = start * 2 * Math.PI - Math.PI / 2;
const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
const large = pct > 0.5 ? 1 : 0;
return { …d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, pct };
});
return (
<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
{total === 0 ? (
<circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
) : segments.map((s, i) => (
<path key={i} d={s.path} fill={s.color} opacity={0.85} />
))}
<circle cx={cx} cy={cy} r={r * 0.55} fill=“white” />
<text x={cx} y={cy + 4} textAnchor=“middle” fontSize={11} fontWeight={700} fill={C.navy}>{fmt(total)}</text>
</svg>
);
};

// ─── MODAL BASE ──────────────────────────────────────────────────────────────
const Modal = ({ show, onClose, title, children, wide, icon: Icon, iconColor }) => {
if (!show) return null;
return (
<div onClick={onClose} style={{
position: “fixed”, inset: 0, background: “rgba(15,32,68,0.6)”,
backdropFilter: “blur(6px)”, display: “flex”, alignItems: “center”,
justifyContent: “center”, zIndex: 200, padding: 16,
}}>
<div onClick={e => e.stopPropagation()} style={{
background: “#fff”, borderRadius: 18, width: “100%”,
maxWidth: wide ? 900 : 500, maxHeight: “92vh”, overflow: “auto”,
boxShadow: “0 32px 80px rgba(15,32,68,0.25)”,
animation: “fadeUp 0.22s ease”,
}}>
<div style={{
padding: “18px 22px 14px”, borderBottom: “1px solid #f1f5f9”,
display: “flex”, justifyContent: “space-between”, alignItems: “center”,
position: “sticky”, top: 0, background: “#fff”, zIndex: 1,
borderRadius: “18px 18px 0 0”,
}}>
<div style={{ display: “flex”, alignItems: “center”, gap: 10 }}>
{Icon && <div style={{ background: (iconColor || C.blue) + “15”, borderRadius: 8, padding: 7, display: “flex” }}>
<Icon size={18} color={iconColor || C.blue} />
</div>}
<h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.navy }}>{title}</h3>
</div>
<button onClick={onClose} style={{ border: “none”, background: “#f1f5f9”, cursor: “pointer”, color: C.muted, padding: 6, borderRadius: 8, display: “flex” }}>
<X size={18} />
</button>
</div>
<div style={{ padding: “18px 22px 22px” }}>{children}</div>
</div>
</div>
);
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (

  <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 300, display: "flex", flexDirection: "column", gap: 8 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: t.type === "error" ? C.danger : t.type === "warn" ? C.warn : C.success,
        color: "#fff", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600,
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 8,
        animation: "fadeUp 0.2s ease", maxWidth: 320,
      }}>
        {t.type === "error" ? <AlertCircle size={15} /> : t.type === "warn" ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
        {t.msg}
      </div>
    ))}
  </div>
);

// ─── CARD MÉTRICA ────────────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, sub, color = C.blue, onClick }) => (

  <div onClick={onClick} style={{
    background: "#fff", borderRadius: 14, padding: "16px 18px",
    border: "1px solid #e8edf4", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 10,
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)")}
    onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)")}>
    <div style={{ background: color + "15", borderRadius: 10, padding: 8, width: "fit-content" }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color = C.blue, label }) => {
const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
return (
<div style={{ display: “flex”, alignItems: “center”, gap: 10 }}>
{label && <span style={{ fontSize: 11, color: C.muted, width: 130, flexShrink: 0, overflow: “hidden”, textOverflow: “ellipsis”, whiteSpace: “nowrap” }} title={label}>{label}</span>}
<div style={{ flex: 1, background: “#f1f5f9”, borderRadius: 99, height: 8, overflow: “hidden” }}>
<div style={{ width: `${pct}%`, background: color, height: “100%”, borderRadius: 99, transition: “width 0.6s ease” }} />
</div>
<span style={{ fontSize: 11, color: C.muted, width: 44, textAlign: “right”, fontWeight: 600 }}>{fmt(value)}</span>
</div>
);
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function PPCDigitalV2() {
// ── AUTH ──
const [currentUser, setCurrentUser] = useState(null);
const [showLoginModal, setShowLoginModal] = useState(false);
const [loginRole, setLoginRole] = useState(ROLES.ADMIN);
const [loginPin, setLoginPin] = useState(””);
const [loginName, setLoginName] = useState(””);
const [loginEmail, setLoginEmail] = useState(””);
const [loginError, setLoginError] = useState(””);

// ── DADOS ──
const [areas, setAreas] = useState(INIT_AREAS);
const [campuses, setCampuses] = useState(INIT_CAMPUS);
const [courses, setCourses] = useState([]);
const [users, setUsers] = useState(INIT_USERS);
const [auditLog, setAuditLog] = useState([]);
const [notifications, setNotifications] = useState([]);

// ── TABS ──
const [activeTab, setActiveTab] = useState(“dashboard”);

// ── FORMS ──
const [newArea, setNewArea] = useState({ name: “”, color: C.blue });
const [newCampus, setNewCampus] = useState({ name: “”, email: “” });
const [newCourse, setNewCourse] = useState({ name: “”, type: “Bacharelado”, campusId: “”, duration: 8, classesFirstHalfYear: 1, classesSecondHalfYear: 1 });
const [subjectForms, setSubjectForms] = useState({});

// ── IA / IMPORT ──
const [showImportModal, setShowImportModal] = useState(false);
const [importText, setImportText] = useState(””);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [importResult, setImportResult] = useState(null);
const [importError, setImportError] = useState(””);
const fileInputRef = useRef();

// ── COORDENADOR MODAL ──
const [showCoordModal, setShowCoordModal] = useState(false);
const [coordTarget, setCoordTarget] = useState(null); // { course, subject }
const [coordAreaSel, setCoordAreaSel] = useState(””);
const [coordHours, setCoordHours] = useState({ t: 0, p: 0, e: 0 });
const [coordNote, setCoordNote] = useState(””);

// ── EMAIL MODAL ──
const [showEmailModal, setShowEmailModal] = useState(false);
const [emailTarget, setEmailTarget] = useState(null);
const [isSendingEmail, setIsSendingEmail] = useState(false);
const [emailSent, setEmailSent] = useState({});

// ── UI ──
const [expandedCourse, setExpandedCourse] = useState(null);
const [expandedSems, setExpandedSems] = useState({});
const [filterCampus, setFilterCampus] = useState(””);
const [filterCourse, setFilterCourse] = useState(””);
const [filterSem, setFilterSem] = useState(””);
const [filterArea, setFilterArea] = useState(””);
const [searchQ, setSearchQ] = useState(””);
const [toasts, setToasts] = useState([]);
const [historyFilter, setHistoryFilter] = useState(“all”);
const [showNewCourseForm, setShowNewCourseForm] = useState(false);

// ─── CSS ─────────────────────────────────────────────────────────────────
useEffect(() => {
const s = document.createElement(“style”);
s.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Serif+Display&display=swap'); *{box-sizing:border-box;} body{margin:0;background:#eef2f7;font-family:'DM Sans',sans-serif;} input,select,textarea{font-family:inherit;} @keyframes spin{to{transform:rotate(360deg);}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}} @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}} ::-webkit-scrollbar{width:5px;height:5px;} ::-webkit-scrollbar-track{background:#f1f5f9;} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px;} .hov:hover{opacity:.85;} .card-hov{transition:box-shadow .2s;} .card-hov:hover{box-shadow:0 6px 24px rgba(15,32,68,.12)!important;} .row-hov:hover{background:#f8fafc!important;} .tab-btn{transition:all .15s;border:none;cursor:pointer;font-family:inherit;} .tab-btn:hover{background:rgba(255,255,255,.12)!important;} .tab-active{background:rgba(255,255,255,.18)!important;color:#fff!important;border-bottom:2px solid #e8a020!important;} .btn{transition:all .15s;cursor:pointer;font-family:inherit;border:none;display:inline-flex;align-items:center;gap:6px;} .btn:hover{filter:brightness(0.92);transform:translateY(-1px);} .btn:active{transform:translateY(0);} .btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important;filter:none!important;}`;
document.head.appendChild(s);
return () => document.head.removeChild(s);
}, []);

// ─── TOAST ──────────────────────────────────────────────────────────────
const toast = useCallback((msg, type = “success”) => {
const id = uid();
setToasts(p => […p, { id, msg, type }]);
setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
}, []);

// ─── AUDIT LOG ──────────────────────────────────────────────────────────
const audit = useCallback((action, detail, type = “info”) => {
setAuditLog(p => [{
id: uid(), action, detail, type,
user: currentUser?.name || “Sistema”,
role: currentUser?.role || “—”,
timestamp: now(),
}, …p].slice(0, 200));
}, [currentUser]);

// ─── HELPERS ─────────────────────────────────────────────────────────────
const getCampus = id => campuses.find(c => c.id === id);
const getCampusName = id => getCampus(id)?.name || “—”;
const getArea = id => areas.find(a => a.id === id);
const getAreaName = id => getArea(id)?.name || “—”;
const getAreaColor = id => getArea(id)?.color || C.blue;
const isAdmin = currentUser?.role === ROLES.ADMIN;
const isCoord = currentUser?.role === ROLES.COORD || isAdmin;

const semHours = (course, sem) => {
const subs = (course.subjects || []).filter(s => s.semester === sem);
const h = subs.reduce((a, s) => a + (s.hoursTotal || 0), 0);
const t = sem % 2 === 1 ? course.classesFirstHalfYear : course.classesSecondHalfYear;
return { h, turmas: t, aulas: h * t, subs };
};

const courseTotal = course =>
Array.from({ length: course.duration }, (_, i) => i + 1)
.reduce((a, sem) => a + semHours(course, sem).aulas, 0);

const allSubjects = courses.flatMap(c => (c.subjects || []).map(s => ({ …s, course: c })));
const pendingAll = allSubjects.filter(s => !s.areaId);

// ─── STATS ──────────────────────────────────────────────────────────────
const globalStats = () => {
const byArea = {}, byCampus = {}, bySem = {}, byCourse = {};
let totalAulas = 0, totalDisciplinas = 0;
courses.forEach(c => {
const ta = courseTotal(c);
totalAulas += ta;
totalDisciplinas += (c.subjects || []).length;
const campus = getCampusName(c.campusId);
byCampus[campus] = (byCampus[campus] || 0) + ta;
byCourse[c.name] = { aulas: ta, campus };
Array.from({ length: c.duration }, (_, i) => i + 1).forEach(sem => {
const sh = semHours(c, sem);
bySem[`${sem}º`] = (bySem[`${sem}º`] || 0) + sh.aulas;
sh.subs.forEach(s => {
if (s.areaId) {
const an = getAreaName(s.areaId);
byArea[an] = (byArea[an] || 0) + (s.hoursTotal || 0);
}
});
});
});
return { totalAulas, totalDisciplinas, byArea, byCampus, bySem, byCourse };
};
const stats = globalStats();

// ─── AUTH ─────────────────────────────────────────────────────────────────
const handleLogin = () => {
setLoginError(””);
if (loginRole === ROLES.ADMIN && loginPin === ADMIN_PIN) {
const u = { id: uid(), name: “Administrador”, email: “admin@instituicao.edu.br”, role: ROLES.ADMIN };
setCurrentUser(u);
audit(“Login”, `Acesso como Administrador`, “success”);
toast(“Bem-vindo, Administrador!”);
setShowLoginModal(false); setLoginPin(””);
return;
}
if (loginRole === ROLES.COORD && loginPin === COORD_PIN) {
const u = { id: uid(), name: loginName || “Coordenador”, email: loginEmail || “coord@inst.edu.br”, role: ROLES.COORD };
setCurrentUser(u);
audit(“Login”, `Acesso como Coordenador: ${u.name}`, “success”);
toast(`Bem-vindo(a), ${u.name}!`);
setShowLoginModal(false); setLoginPin(””);
return;
}
setLoginError(“Credenciais incorretas. Tente novamente.”);
};

const handleLogout = () => {
audit(“Logout”, `Saída de ${currentUser?.name}`);
setCurrentUser(null);
toast(“Sessão encerrada”, “warn”);
};

// ─── ÁREAS ───────────────────────────────────────────────────────────────
const addArea = () => {
if (!newArea.name.trim()) return;
const a = { id: uid(), name: newArea.name.trim(), color: newArea.color };
setAreas(p => […p, a]);
audit(“Área criada”, a.name, “success”);
toast(`Área "${a.name}" criada`);
setNewArea({ name: “”, color: C.blue });
};

const removeArea = id => {
const a = areas.find(x => x.id === id);
if (!a) return;
setAreas(p => p.filter(x => x.id !== id));
audit(“Área removida”, a.name, “warn”);
toast(`Área "${a.name}" removida`, “warn”);
};

// ─── CAMPUS ──────────────────────────────────────────────────────────────
const addCampus = () => {
if (!newCampus.name.trim()) return;
const c = { id: uid(), name: newCampus.name.trim(), email: newCampus.email };
setCampuses(p => […p, c]);
audit(“Campus criado”, c.name, “success”);
toast(`Campus "${c.name}" criado`);
setNewCampus({ name: “”, email: “” });
};

// ─── CURSOS ──────────────────────────────────────────────────────────────
const addCourse = () => {
if (!newCourse.name.trim() || !newCourse.campusId) { toast(“Preencha nome e campus”, “error”); return; }
const c = { …newCourse, id: uid(), subjects: [], createdAt: now() };
setCourses(p => […p, c]);
audit(“Curso criado”, `${c.name} — ${getCampusName(c.campusId)}`, “success”);
toast(`Curso "${c.name}" cadastrado`);
setNewCourse({ name: “”, type: “Bacharelado”, campusId: “”, duration: 8, classesFirstHalfYear: 1, classesSecondHalfYear: 1 });
setShowNewCourseForm(false);
};

const removeCourse = id => {
const c = courses.find(x => x.id === id);
setCourses(p => p.filter(x => x.id !== id));
audit(“Curso removido”, c?.name, “warn”);
toast(`Curso "${c?.name}" removido`, “warn”);
};

// ─── DISCIPLINAS ─────────────────────────────────────────────────────────
const addSubject = (courseId, sem) => {
const f = subjectForms[courseId] || {};
if (!f.name?.trim()) { toast(“Informe o nome da disciplina”, “error”); return; }
const s = {
id: uid(), name: f.name.trim(), semester: sem,
hoursT: Number(f.hoursT || 0), hoursP: Number(f.hoursP || 0), hoursE: Number(f.hoursE || 0),
hoursTotal: Number(f.hoursT || 0) + Number(f.hoursP || 0) + Number(f.hoursE || 0),
areaId: f.areaId || null, createdAt: now(),
};
setCourses(p => p.map(c => c.id !== courseId ? c : { …c, subjects: […(c.subjects || []), s] }));
const course = courses.find(c => c.id === courseId);
audit(“Disciplina adicionada”, `${s.name} — ${course?.name} (${sem}º sem)`, “success”);
if (!s.areaId) {
const notif = { id: uid(), type: “pending_area”, subject: s, course, timestamp: now(), read: false };
setNotifications(p => [notif, …p]);
}
setSubjectForms(p => ({ …p, [courseId]: {} }));
toast(`Disciplina "${s.name}" adicionada`);
};

const removeSubject = (courseId, subjectId) => {
const course = courses.find(c => c.id === courseId);
const sub = (course?.subjects || []).find(s => s.id === subjectId);
setCourses(p => p.map(c => c.id !== courseId ? c : { …c, subjects: (c.subjects || []).filter(s => s.id !== subjectId) }));
audit(“Disciplina removida”, `${sub?.name} — ${course?.name}`, “warn”);
toast(`"${sub?.name}" removida`, “warn”);
};

// ─── COORDENADOR ─────────────────────────────────────────────────────────
const openCoordModal = (course, sub) => {
setCoordTarget({ course, subject: sub });
setCoordAreaSel(sub.areaId || “”);
setCoordHours({ t: sub.hoursT || 0, p: sub.hoursP || 0, e: sub.hoursE || 0 });
setCoordNote(””);
setShowCoordModal(true);
};

const saveCoord = () => {
if (!coordAreaSel) { toast(“Selecione uma área”, “error”); return; }
const { course, subject } = coordTarget;
setCourses(p => p.map(c => c.id !== course.id ? c : {
…c, subjects: (c.subjects || []).map(s => s.id !== subject.id ? s : {
…s, areaId: coordAreaSel,
hoursT: coordHours.t, hoursP: coordHours.p, hoursE: coordHours.e,
hoursTotal: coordHours.t + coordHours.p + coordHours.e,
indicatedBy: currentUser?.name, indicatedAt: now(), coordNote,
})
}));
audit(“Área indicada”, `${subject.name} → ${getAreaName(coordAreaSel)} (por ${currentUser?.name})`, “success”);
setNotifications(p => p.map(n => n.subject?.id === subject.id ? { …n, read: true } : n));
toast(“Área indicada com sucesso!”);
setShowCoordModal(false);
};

// ─── EMAIL ───────────────────────────────────────────────────────────────
const openEmailModal = course => {
const pending = (course.subjects || []).filter(s => !s.areaId);
if (pending.length === 0) { toast(“Nenhuma disciplina pendente neste curso”, “warn”); return; }
setEmailTarget({ course, pending });
setShowEmailModal(true);
};

const sendEmail = async () => {
if (!emailTarget) return;
setIsSendingEmail(true);
const { course, pending } = emailTarget;
const campus = getCampus(course.campusId);
const to = campus?.email || “coordenacao@instituicao.edu.br”;
const subject = `[PPC Digital] Solicitação de indicação de área — ${course.name}`;
const body = `Prezado(a) Coordenador(a),\n\nVocê tem ${pending.length} disciplina(s) aguardando indicação de área docente no curso "${course.name}":\n\n${pending.map(s => `• ${s.name} (${s.semester}º sem) — ${s.hoursTotal}h`).join("\n")}\n\nAcesse o PPC Digital para indicar as áreas.\n\nAtenciosamente,\nSistema PPC Digital`;
await sendEmailViaGmail(to, subject, body);
audit(“Email enviado”, `Solicitação de indicação — ${course.name} → ${to}`, “success”);
setEmailSent(p => ({ …p, [course.id]: now() }));
toast(`Email enviado para ${to}`);
setIsSendingEmail(false);
setShowEmailModal(false);
};

// ─── IMPORTAR IA ──────────────────────────────────────────────────────────
const handleFileUpload = e => {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = ev => setImportText((ev.target.result || “”).slice(0, 15000));
reader.readAsText(file, “utf-8”);
toast(`Arquivo "${file.name}" carregado`);
};

const analyzePPC = async () => {
if (!importText.trim()) return;
setIsAnalyzing(true); setImportError(””); setImportResult(null);
try {
const campusNames = campuses.map(c => c.name).join(”, “);
const system = `Você é especialista em PPCs (Projetos Pedagógicos de Curso) de instituições brasileiras. Analise o texto e retorne SOMENTE um JSON válido sem qualquer texto extra: { "courseName": "string", "courseType": "Bacharelado|Tecnólogo|Licenciatura|Técnico|Pós-graduação|MBA|Mestrado", "campus": "string ou null", "duration": número_de_semestres, "classesFirstHalfYear": número_de_turmas_iniciando_no_1sem, "classesSecondHalfYear": número_de_turmas_iniciando_no_2sem, "subjects": [ { "name": "string", "semester": número, "hoursT": número, "hoursP": número, "hoursE": número, "hoursTotal": número } ] } Regras: hoursTotal = hoursT + hoursP + hoursE. Se não encontrar turmas, use 1. Retorne APENAS JSON.`;
const raw = await callClaude(system, `Campus disponíveis: ${campusNames}\n\nTexto do PPC:\n${importText}`);
const clean = raw.replace(/`json|`/g, “”).trim();
const parsed = JSON.parse(clean);
setImportResult(parsed);
audit(“PPC analisado por IA”, parsed.courseName, “success”);
} catch (err) {
setImportError(“Não foi possível analisar. Certifique-se que o texto contém informações do PPC.”);
}
setIsAnalyzing(false);
};

const confirmImport = () => {
if (!importResult) return;
const campus = campuses.find(c => c.name?.toLowerCase().includes((importResult.campus || “”).toLowerCase().slice(0, 6)));
const campusId = campus?.id || campuses[0]?.id || “”;
const duration = Math.max(1, Math.min(importResult.duration || 8, 12));
const type = COURSE_TYPES.includes(importResult.courseType) ? importResult.courseType : “Bacharelado”;
const subjects = (importResult.subjects || []).map(s => ({
id: uid(), name: s.name || “Disciplina”,
semester: Math.min(Math.max(s.semester || 1, 1), duration),
hoursT: s.hoursT || 0, hoursP: s.hoursP || 0, hoursE: s.hoursE || 0,
hoursTotal: s.hoursTotal || (s.hoursT || 0) + (s.hoursP || 0) + (s.hoursE || 0),
areaId: null, createdAt: now(),
}));
const course = {
id: uid(), name: importResult.courseName || “Curso Importado”,
type, campusId, duration,
classesFirstHalfYear: importResult.classesFirstHalfYear || 1,
classesSecondHalfYear: importResult.classesSecondHalfYear || 0,
subjects, importedByAI: true, createdAt: now(),
};
setCourses(p => […p, course]);
const pending = subjects.filter(s => !s.areaId).length;
if (pending > 0) {
setNotifications(p => [{
id: uid(), type: “import”, course, count: pending, timestamp: now(), read: false,
}, …p]);
}
audit(“Curso importado via IA”, `${course.name} — ${subjects.length} disciplinas`, “success”);
toast(`"${course.name}" importado com ${subjects.length} disciplinas!`);
setShowImportModal(false); setImportText(””); setImportResult(null);
setActiveTab(“cursos”); setExpandedCourse(course.id);
};

// ─── RELATÓRIO ───────────────────────────────────────────────────────────
const reportRows = () => {
let filtered = courses.filter(c =>
(!filterCampus || c.campusId === filterCampus) &&
(!filterCourse || c.id === filterCourse) &&
(!searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase()))
);
return filtered.flatMap(c =>
Array.from({ length: c.duration }, (_, i) => i + 1)
.filter(sem => !filterSem || String(sem) === filterSem)
.map(sem => {
const subs = (c.subjects || []).filter(s => s.semester === sem && (!filterArea || s.areaId === filterArea));
const h = subs.reduce((a, s) => a + (s.hoursTotal || 0), 0);
const t = sem % 2 === 1 ? c.classesFirstHalfYear : c.classesSecondHalfYear;
return { courseId: c.id, courseName: c.name, campus: getCampusName(c.campusId), type: c.type, semester: sem, disciplines: subs.length, hoursPerClass: h, classes: t, totalHours: h * t };
}).filter(r => r.disciplines > 0 || !filterArea)
);
};
const report = reportRows();

// ─── EXPORT PRINT ────────────────────────────────────────────────────────
const handlePrint = () => { window.print(); };

// ─── TABS CONFIG ─────────────────────────────────────────────────────────
const tabs = [
{ id: “dashboard”, icon: BarChart3, label: “Visão Geral” },
{ id: “cursos”, icon: BookOpen, label: “Cursos & PPC” },
{ id: “relatorio”, icon: FileText, label: “Relatório” },
{ id: “historico”, icon: History, label: `Histórico${auditLog.length > 0 ? ` (${auditLog.length})` : ""}` },
…(isAdmin ? [{ id: “admin”, icon: Settings, label: “Admin” }] : []),
];

// ─── ROLE COLOR ──────────────────────────────────────────────────────────
const roleColor = r => ({ admin: C.blue, coordenador: C.teal, viewer: C.muted }[r] || C.muted);
const roleLabel = r => ({ admin: “Administrador”, coordenador: “Coordenador”, viewer: “Visualizador” }[r] || r);

const unreadNotifs = notifications.filter(n => !n.read).length;

// ═════════════════════════════════════════════════════════════════════════
// RENDER
// ═════════════════════════════════════════════════════════════════════════
return (
<div style={{ minHeight: “100vh”, background: C.bg, fontFamily: “‘DM Sans’, sans-serif” }}>
<style>{`@media print { .no-print{display:none!important;} .print-only{display:block!important;} }`}</style>

```
  {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
  <header className="no-print" style={{
    background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 55%, ${C.blue} 100%)`,
    padding: "0 24px", boxShadow: "0 2px 24px rgba(15,32,68,.35)",
    position: "sticky", top: 0, zIndex: 60,
  }}>
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 8px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: C.accent, borderRadius: 10, padding: 8, display: "flex" }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#fff", lineHeight: 1 }}>PPC Digital</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Planejamento Acadêmico Institucional</div>
          </div>
        </div>
        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Notificações */}
          {unreadNotifs > 0 && (
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ background: C.accent, color: "#fff", borderRadius: 99, padding: "4px 10px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                <Bell size={12} /> {unreadNotifs} pendente{unreadNotifs > 1 ? "s" : ""}
              </div>
            </div>
          )}
          {/* User info */}
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{currentUser.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{roleLabel(currentUser.role)}</div>
              </div>
              <div style={{ background: roleColor(currentUser.role) + "33", border: `1.5px solid ${roleColor(currentUser.role)}66`, borderRadius: 99, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{currentUser.name[0]}</span>
              </div>
              <button onClick={handleLogout} className="btn hov" style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.8)", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="btn hov" style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600 }}>
              <Lock size={14} /> Entrar
            </button>
          )}
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 2 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`tab-btn ${activeTab === t.id ? "tab-active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: activeTab === t.id ? "#fff" : "rgba(255,255,255,.5)", padding: "9px 15px", fontSize: 12.5, fontWeight: activeTab === t.id ? 700 : 500, borderRadius: "8px 8px 0 0", borderBottom: "2px solid transparent" }}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>
    </div>
  </header>

  {/* ─── MAIN ──────────────────────────────────────────────────────────── */}
  <main style={{ maxWidth: 1280, margin: "0 auto", padding: "22px 16px 40px" }}>

    {/* ══════════════ DASHBOARD ══════════════ */}
    {activeTab === "dashboard" && (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .3s ease" }}>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14 }}>
          <MetricCard icon={BookOpen} label="Total de Cursos" value={courses.length} color={C.blue} onClick={() => setActiveTab("cursos")} />
          <MetricCard icon={FileText} label="Disciplinas" value={fmt(allSubjects.length)} color={C.teal} />
          <MetricCard icon={Calculator} label="Total Aulas/Ano" value={fmt(stats.totalAulas)} sub="turmas × horas" color={C.navy} />
          <MetricCard icon={Building2} label="Campus" value={campuses.length} color={C.accent} />
          <MetricCard icon={Layers} label="Áreas de Ensino" value={areas.length} color={C.purple} />
          <MetricCard icon={AlertCircle} label="Pendentes de Área" value={pendingAll.length} color={pendingAll.length > 0 ? C.warn : C.success} sub={pendingAll.length === 0 ? "Tudo OK ✓" : "Indicar área"} onClick={() => setActiveTab("cursos")} />
        </div>

        {/* Gráficos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* Por Campus */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e8edf4" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Building2 size={14} color={C.blue} /> Aulas por Campus
            </div>
            {Object.keys(stats.byCampus).length === 0
              ? <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "20px 0" }}>Sem dados</div>
              : <MiniBar data={Object.entries(stats.byCampus).map(([l, v]) => ({ label: l, value: v }))} colorFn={() => C.blue} height={100} showLabel />
            }
          </div>

          {/* Por Área — Donut */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e8edf4" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <PieChart size={14} color={C.teal} /> Horas por Área
            </div>
            {Object.keys(stats.byArea).length === 0
              ? <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "20px 0" }}>Indique áreas nas disciplinas</div>
              : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <DonutChart size={100} data={areas.filter(a => stats.byArea[a.name]).map(a => ({ label: a.name, value: stats.byArea[a.name] || 0, color: a.color }))} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {areas.filter(a => stats.byArea[a.name]).map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                        <span style={{ color: C.muted }}>{a.name}</span>
                        <span style={{ fontWeight: 700, color: C.navy, marginLeft: "auto" }}>{fmt(stats.byArea[a.name])}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </div>

          {/* Por Semestre */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e8edf4" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={14} color={C.accent} /> Aulas por Semestre
            </div>
            {Object.keys(stats.bySem).length === 0
              ? <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "20px 0" }}>Sem dados</div>
              : <MiniBar data={Object.entries(stats.bySem).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([l, v]) => ({ label: l, value: v }))} colorFn={i => [C.blue, C.teal, C.purple, C.accent][i % 4]} height={100} showLabel />
            }
          </div>
        </div>

        {/* Tabela de status dos cursos */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8edf4", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, display: "flex", alignItems: "center", gap: 6 }}>
              <TrendingUp size={15} /> Status dos Cursos
            </div>
            <button onClick={() => setActiveTab("cursos")} className="btn" style={{ background: C.navy + "10", color: C.navy, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>
              Ver todos <ChevronRight size={12} />
            </button>
          </div>
          {courses.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
              <GraduationCap size={28} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Nenhum curso cadastrado</div>
              <button onClick={() => { setActiveTab("cursos"); }} className="btn" style={{ background: C.navy, color: "#fff", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, marginTop: 6 }}>
                <PlusCircle size={13} /> Criar primeiro curso
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
                    {["Curso", "Tipo", "Campus", "Sem.", "Disciplinas", "Pendentes", "Aulas/Ano", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "9px 12px", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => {
                    const pend = (c.subjects || []).filter(s => !s.areaId).length;
                    const total = courseTotal(c);
                    return (
                      <tr key={c.id} className="row-hov" style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "9px 12px", fontWeight: 700, color: C.navy }}>
                          {c.name}
                          {c.importedByAI && <span style={{ marginLeft: 6, fontSize: 9, background: C.teal + "20", color: C.teal, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>IA</span>}
                        </td>
                        <td style={{ padding: "9px 12px" }}><Badge small>{c.type}</Badge></td>
                        <td style={{ padding: "9px 12px", color: C.muted, fontSize: 12 }}>{getCampusName(c.campusId)}</td>
                        <td style={{ padding: "9px 12px", color: C.muted }}>{c.duration}</td>
                        <td style={{ padding: "9px 12px" }}>{(c.subjects || []).length}</td>
                        <td style={{ padding: "9px 12px" }}>
                          {pend > 0
                            ? <span style={{ color: C.warn, fontWeight: 700, fontSize: 12 }}>⚠ {pend}</span>
                            : <span style={{ color: C.success, fontWeight: 700, fontSize: 12 }}>✓</span>
                          }
                        </td>
                        <td style={{ padding: "9px 12px", fontWeight: 800, color: C.navy }}>{fmt(total)}</td>
                        <td style={{ padding: "9px 12px" }}>
                          {pend > 0 && isCoord && (
                            <button onClick={() => openEmailModal(c)} className="btn hov" style={{ background: C.accent + "15", color: C.accent, borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 700 }}>
                              <Mail size={10} /> Notificar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ══════════════ CURSOS & PPC ══════════════ */}
    {activeTab === "cursos" && (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
        {/* Actions bar */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.navy }}>
            {courses.length} curso{courses.length !== 1 ? "s" : ""}
            {pendingAll.length > 0 && <span style={{ marginLeft: 10, fontSize: 12, color: C.warn, fontWeight: 600 }}>⚠ {pendingAll.length} disciplinas pendentes</span>}
          </div>
          <button onClick={() => setShowImportModal(true)} className="btn" style={{ background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600, boxShadow: "0 2px 8px rgba(13,124,110,.3)" }}>
            <Sparkles size={14} /> Importar PPC com IA
          </button>
          {isAdmin && (
            <button onClick={() => setShowNewCourseForm(!showNewCourseForm)} className="btn" style={{ background: C.navy, color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600 }}>
              <PlusCircle size={14} /> Novo Curso
            </button>
          )}
        </div>

        {/* Form novo curso */}
        {isAdmin && showNewCourseForm && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e8edf4", animation: "fadeUp .2s ease" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Cadastrar Novo Curso</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
              {[
                { label: "Nome *", type: "text", key: "name", placeholder: "Ex: Análise e Desenvolvimento de Sistemas" },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input value={newCourse[f.key]} placeholder={f.placeholder}
                    onChange={e => setNewCourse(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13 }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Tipo</label>
                <select value={newCourse.type} onChange={e => setNewCourse(p => ({ ...p, type: e.target.value }))} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff" }}>
                  {COURSE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Campus *</label>
                <select value={newCourse.campusId} onChange={e => setNewCourse(p => ({ ...p, campusId: e.target.value }))} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff" }}>
                  <option value="">Selecione...</option>
                  {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Semestres</label>
                <select value={newCourse.duration} onChange={e => setNewCourse(p => ({ ...p, duration: Number(e.target.value) }))} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff" }}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Turmas 1º Sem</label>
                <input type="number" min={0} value={newCourse.classesFirstHalfYear} onChange={e => setNewCourse(p => ({ ...p, classesFirstHalfYear: Number(e.target.value) }))} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Turmas 2º Sem</label>
                <input type="number" min={0} value={newCourse.classesSecondHalfYear} onChange={e => setNewCourse(p => ({ ...p, classesSecondHalfYear: Number(e.target.value) }))} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13 }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={() => setShowNewCourseForm(false)} className="btn" style={{ background: "#f1f5f9", color: C.muted, borderRadius: 8, padding: "8px 16px", fontSize: 13 }}>Cancelar</button>
              <button onClick={addCourse} className="btn" style={{ background: C.navy, color: "#fff", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700 }}>
                <Save size={13} /> Cadastrar
              </button>
            </div>
          </div>
        )}

        {/* Cursos */}
        {courses.length === 0 && !showNewCourseForm && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 56, textAlign: "center", border: "2px dashed #e2e8f0" }}>
            <GraduationCap size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Nenhum curso cadastrado</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setShowImportModal(true)} className="btn" style={{ background: `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
                <Sparkles size={13} /> Importar com IA
              </button>
              {isAdmin && <button onClick={() => setShowNewCourseForm(true)} className="btn" style={{ background: C.navy, color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
                <PlusCircle size={13} /> Criar manualmente
              </button>}
            </div>
          </div>
        )}

        {courses.map(course => {
          const isOpen = expandedCourse === course.id;
          const pend = (course.subjects || []).filter(s => !s.areaId).length;
          const total = courseTotal(course);
          return (
            <div key={course.id} className="card-hov" style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8edf4", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              {/* Cabeçalho do curso */}
              <div onClick={() => setExpandedCourse(isOpen ? null : course.id)} style={{
                padding: "13px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                borderBottom: isOpen ? "1px solid #f1f5f9" : "none", background: isOpen ? "#fafbff" : "#fff",
                userSelect: "none",
              }}>
                <div style={{ color: C.muted }}>{isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{course.name}</span>
                    <Badge small>{course.type}</Badge>
                    {course.importedByAI && <Badge small color={C.teal}>IA</Badge>}
                    {pend > 0 && <Badge small color={C.warn}>⚠ {pend} sem área</Badge>}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Tag icon={MapPin} value={getCampusName(course.campusId)} />
                    <Tag icon={BookOpen} value={`${course.duration} semestres`} />
                    <Tag icon={Users} value={`${course.classesFirstHalfYear}+${course.classesSecondHalfYear} turmas/ano`} />
                    <Tag icon={Calculator} value={`${fmt(total)} aulas/ano`} color={C.navy} />
                    <Tag value={`${(course.subjects || []).length} disciplinas`} />
                  </div>
                </div>
                {/* Ações */}
                <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                  {isCoord && pend > 0 && (
                    <button onClick={() => openEmailModal(course)} className="btn" style={{ background: C.accent + "18", color: C.accent, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
                      <Mail size={12} /> Notificar
                      {emailSent[course.id] && <span style={{ fontSize: 9, opacity: 0.7 }}> ✓</span>}
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => removeCourse(course.id)} className="btn" style={{ background: "none", color: "#fca5a5", padding: 6, borderRadius: 8 }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Grade semestral */}
              {isOpen && (
                <div style={{ padding: "14px 18px" }}>
                  {Array.from({ length: course.duration }, (_, i) => i + 1).map(sem => {
                    const sh = semHours(course, sem);
                    const sk = `${course.id}-${sem}`;
                    const semOpen = expandedSems[sk] !== false;
                    return (
                      <div key={sem} style={{ marginBottom: 10, border: "1px solid #f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                        <div onClick={() => setExpandedSems(p => ({ ...p, [sk]: !semOpen }))}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", background: "#f8fafc", cursor: "pointer", userSelect: "none" }}>
                          {semOpen ? <ChevronDown size={13} color={C.muted} /> : <ChevronRight size={13} color={C.muted} />}
                          <span style={{ fontWeight: 700, fontSize: 13, color: C.navy }}>{sem}º Semestre</span>
                          <div style={{ flex: 1, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Tag value={`${sh.subs.length} disc.`} small />
                            <Tag value={`${sh.h}h/turma`} small />
                            <Tag value={`${sh.turmas} turma${sh.turmas !== 1 ? "s" : ""}`} small />
                            <Tag value={`${fmt(sh.aulas)} aulas`} color={C.navy} small />
                          </div>
                        </div>
                        {semOpen && (
                          <div style={{ padding: "6px 13px 12px" }}>
                            {sh.subs.length > 0 ? (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    {["Disciplina", "T", "P", "Ext.", "Total", "Área", "Indicado por", ""].map(h => (
                                      <th key={h} style={{ textAlign: "left", padding: "4px 6px", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {sh.subs.map(sub => (
                                    <tr key={sub.id} className="row-hov" style={{ borderBottom: "1px solid #f8fafc" }}>
                                      <td style={{ padding: "6px 6px", fontWeight: 500, color: C.text }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          <Dot status={sub.areaId ? "done" : "pending"} />
                                          {sub.name}
                                        </div>
                                      </td>
                                      <td style={{ padding: "6px 6px", color: C.muted }}>{sub.hoursT}h</td>
                                      <td style={{ padding: "6px 6px", color: C.muted }}>{sub.hoursP}h</td>
                                      <td style={{ padding: "6px 6px", color: C.muted }}>{sub.hoursE}h</td>
                                      <td style={{ padding: "6px 6px", fontWeight: 700, color: C.navy }}>{sub.hoursTotal}h</td>
                                      <td style={{ padding: "6px 6px" }}>
                                        {sub.areaId
                                          ? <Badge color={getAreaColor(sub.areaId)} small pill>{getAreaName(sub.areaId)}</Badge>
                                          : <span style={{ fontSize: 10, color: C.warn, fontStyle: "italic" }}>Pendente</span>
                                        }
                                      </td>
                                      <td style={{ padding: "6px 6px", fontSize: 10, color: C.muted }}>
                                        {sub.indicatedBy ? `${sub.indicatedBy}` : "—"}
                                        {sub.indicatedAt && <div style={{ fontSize: 9, color: "#94a3b8" }}>{sub.indicatedAt}</div>}
                                      </td>
                                      <td style={{ padding: "6px 6px" }}>
                                        <div style={{ display: "flex", gap: 4 }}>
                                          {isCoord && (
                                            <button onClick={() => openCoordModal(course, sub)} className="btn" style={{ background: sub.areaId ? "#f0fdf4" : "#fffbeb", border: `1px solid ${sub.areaId ? "#bbf7d0" : "#fde68a"}`, borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: sub.areaId ? C.success : C.warn }}>
                                              {sub.areaId ? <><Edit3 size={9} /> Editar</> : <><Star size={9} /> Indicar Área</>}
                                            </button>
                                          )}
                                          {isAdmin && (
                                            <button onClick={() => removeSubject(course.id, sub.id)} className="btn" style={{ background: "none", color: "#fca5a5", padding: "3px 4px" }}>
                                              <Trash2 size={12} />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>Nenhuma disciplina neste semestre</div>}

                            {/* Add disciplina */}
                            {isAdmin && (
                              <div style={{ marginTop: 10, background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #f1f5f9", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                                <div style={{ flex: "2 1 160px" }}>
                                  <label style={{ fontSize: 10, fontWeight: 600, color: C.muted, display: "block", marginBottom: 3 }}>Disciplina *</label>
                                  <input value={subjectForms[course.id]?.name || ""} placeholder="Nome da disciplina"
                                    onChange={e => setSubjectForms(p => ({ ...p, [course.id]: { ...p[course.id], name: e.target.value } }))}
                                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "6px 8px", fontSize: 12 }} />
                                </div>
                                {[["hoursT", "T(h)"], ["hoursP", "P(h)"], ["hoursE", "Ext."]].map(([k, l]) => (
                                  <div key={k} style={{ flex: "0 0 58px" }}>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: C.muted, display: "block", marginBottom: 3 }}>{l}</label>
                                    <input type="number" min={0} value={subjectForms[course.id]?.[k] || ""}
                                      onChange={e => setSubjectForms(p => ({ ...p, [course.id]: { ...p[course.id], [k]: e.target.value } }))}
                                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "6px 6px", fontSize: 12 }} />
                                  </div>
                                ))}
                                <div style={{ flex: "1 1 120px" }}>
                                  <label style={{ fontSize: 10, fontWeight: 600, color: C.muted, display: "block", marginBottom: 3 }}>Área</label>
                                  <select value={subjectForms[course.id]?.areaId || ""} onChange={e => setSubjectForms(p => ({ ...p, [course.id]: { ...p[course.id], areaId: e.target.value } }))}
                                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "6px 8px", fontSize: 12, background: "#fff" }}>
                                    <option value="">Sem área</option>
                                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                  </select>
                                </div>
                                <button onClick={() => addSubject(course.id, sem)} className="btn" style={{ background: C.navy, color: "#fff", borderRadius: 7, padding: "7px 12px", fontSize: 12, fontWeight: 700 }}>
                                  <PlusCircle size={13} /> Add
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}

    {/* ══════════════ RELATÓRIO ══════════════ */}
    {activeTab === "relatorio" && (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
        {/* Filtros */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e8edf4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 13, fontWeight: 700, color: C.navy }}>
            <Filter size={14} color={C.blue} /> Filtros
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "2 1 180px" }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Buscar Curso</label>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Nome do curso..."
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px 7px 28px", fontSize: 13 }} />
              </div>
            </div>
            {[
              { label: "Campus", value: filterCampus, setter: setFilterCampus, opts: campuses.map(c => ({ v: c.id, l: c.name })) },
              { label: "Curso", value: filterCourse, setter: setFilterCourse, opts: courses.map(c => ({ v: c.id, l: c.name })) },
              { label: "Semestre", value: filterSem, setter: setFilterSem, opts: Array.from({ length: 12 }, (_, i) => ({ v: String(i + 1), l: `${i + 1}º Sem.` })) },
              { label: "Área", value: filterArea, setter: setFilterArea, opts: areas.map(a => ({ v: a.id, l: a.name })) },
            ].map(f => (
              <div key={f.label} style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{f.label}</label>
                <select value={f.value} onChange={e => f.setter(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13, background: "#fff" }}>
                  <option value="">Todos</option>
                  {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
            <button onClick={() => { setFilterCampus(""); setFilterCourse(""); setFilterSem(""); setFilterArea(""); setSearchQ(""); }}
              className="btn" style={{ background: "#f1f5f9", color: C.muted, borderRadius: 8, padding: "7px 12px", fontSize: 12 }}>
              <RefreshCw size={12} /> Limpar
            </button>
            <button onClick={handlePrint} className="btn" style={{ background: C.navy, color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600 }}>
              <Printer size={12} /> Imprimir
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          <MetricCard icon={FileText} label="Linhas no Relatório" value={report.length} color={C.blue} />
          <MetricCard icon={BookOpen} label="Total Disciplinas" value={fmt(report.reduce((a, r) => a + r.disciplines, 0))} color={C.teal} />
          <MetricCard icon={Calculator} label="Total Aulas" value={fmt(report.reduce((a, r) => a + r.totalHours, 0))} color={C.navy} />
        </div>

        {/* Tabela */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8edf4", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.navy }}>
                  {["Curso", "Campus", "Tipo", "Semestre", "Disciplinas", "H/Turma", "Turmas", "Total Aulas"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, color: "rgba(255,255,255,.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.length === 0
                  ? <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>Nenhum dado encontrado</td></tr>
                  : report.map((r, i) => (
                    <tr key={i} className="row-hov" style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: C.navy }}>{r.courseName}</td>
                      <td style={{ padding: "9px 12px", color: C.muted, fontSize: 12 }}>{r.campus}</td>
                      <td style={{ padding: "9px 12px" }}><Badge small>{r.type}</Badge></td>
                      <td style={{ padding: "9px 12px", fontWeight: 600 }}>{r.semester}º</td>
                      <td style={{ padding: "9px 12px" }}>{r.disciplines}</td>
                      <td style={{ padding: "9px 12px" }}>{r.hoursPerClass}h</td>
                      <td style={{ padding: "9px 12px" }}>{r.classes}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 800, color: C.navy }}>{fmt(r.totalHours)}</td>
                    </tr>
                  ))
                }
              </tbody>
              {report.length > 0 && (
                <tfoot>
                  <tr style={{ background: C.navy, color: "#fff" }}>
                    <td colSpan={4} style={{ padding: "10px 12px", fontWeight: 700, fontSize: 13 }}>TOTAL GERAL</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{fmt(report.reduce((a, r) => a + r.disciplines, 0))}</td>
                    <td colSpan={2} style={{ padding: "10px 12px" }}>—</td>
                    <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 15 }}>{fmt(report.reduce((a, r) => a + r.totalHours, 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Por área (breakdown) */}
        {Object.keys(stats.byArea).length > 0 && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e8edf4" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={14} color={C.purple} /> Distribuição de Horas por Área
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(stats.byArea).sort((a, b) => b[1] - a[1]).map(([name, val]) => {
                const area = areas.find(a => a.name === name);
                return <ProgressBar key={name} label={name} value={val} max={Math.max(...Object.values(stats.byArea))} color={area?.color || C.blue} />;
              })}
            </div>
          </div>
        )}
      </div>
    )}

    {/* ══════════════ HISTÓRICO ══════════════ */}
    {activeTab === "historico" && (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, flex: 1 }}>Auditoria — {auditLog.length} registros</div>
          <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13, background: "#fff" }}>
            <option value="all">Todos</option>
            <option value="success">Criação</option>
            <option value="warn">Remoção</option>
            <option value="info">Login</option>
          </select>
          {isAdmin && <button onClick={() => setAuditLog([])} className="btn" style={{ background: "#fef2f2", color: C.danger, borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600 }}>
            <Trash2 size={13} /> Limpar
          </button>}
        </div>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8edf4", overflow: "hidden" }}>
          {auditLog.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>
              <History size={28} color="#cbd5e1" style={{ marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
              Nenhuma ação registrada ainda
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {auditLog
                .filter(l => historyFilter === "all" || l.type === historyFilter)
                .map((l, i) => {
                  const typeColor = { success: C.success, warn: C.warn, error: C.danger, info: C.blue }[l.type] || C.muted;
                  return (
                    <div key={l.id} className="row-hov" style={{ padding: "10px 18px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: typeColor, marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: C.navy }}>{l.action}</span>
                          <Badge small color={roleColor(l.role)}>{l.role}</Badge>
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{l.detail}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: C.muted }}>{l.user}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{l.timestamp}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    )}

    {/* ══════════════ ADMIN ══════════════ */}
    {activeTab === "admin" && isAdmin && (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "11px 15px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.success, fontWeight: 600 }}>
          <ShieldCheck size={16} /> Painel de Administração — alterações em tempo real
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Áreas */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e8edf4" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={15} color={C.blue} /> Áreas de Ensino
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input value={newArea.name} onChange={e => setNewArea(p => ({ ...p, name: e.target.value }))} placeholder="Nome da área"
                onKeyDown={e => e.key === "Enter" && addArea()}
                style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13 }} />
              <input type="color" value={newArea.color} onChange={e => setNewArea(p => ({ ...p, color: e.target.value }))}
                style={{ width: 38, height: 38, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: 2, cursor: "pointer" }} />
              <button onClick={addArea} className="btn" style={{ background: C.blue, color: "#fff", borderRadius: 8, padding: "7px 12px" }}>
                <PlusCircle size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {areas.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a.name}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{allSubjects.filter(s => s.areaId === a.id).length} disc.</span>
                  <button onClick={() => removeArea(a.id)} className="btn" style={{ background: "none", color: "#fca5a5", padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Campus */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e8edf4" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Building2 size={15} color={C.teal} /> Campus / Unidades
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              <input value={newCampus.name} onChange={e => setNewCampus(p => ({ ...p, name: e.target.value }))} placeholder="Nome do campus"
                style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newCampus.email} onChange={e => setNewCampus(p => ({ ...p, email: e.target.value }))} placeholder="Email do coordenador"
                  style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13 }} />
                <button onClick={addCampus} className="btn" style={{ background: C.teal, color: "#fff", borderRadius: 8, padding: "7px 12px" }}>
                  <PlusCircle size={16} />
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {campuses.map(c => (
                <div key={c.id} style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Building2 size={13} color={C.muted} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{courses.filter(cr => cr.campusId === c.id).length} cursos</span>
                    <button onClick={() => setCampuses(p => p.filter(x => x.id !== c.id))} className="btn" style={{ background: "none", color: "#fca5a5", padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {c.email && <div style={{ fontSize: 11, color: C.muted, marginTop: 3, paddingLeft: 21, display: "flex", alignItems: "center", gap: 4 }}>
                    <Mail size={10} /> {c.email}
                  </div>}
                </div>
              ))}
            </div>
          </div>

          {/* Usuários */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e8edf4", gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={15} color={C.purple} /> Usuários Cadastrados
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
                    {["Nome", "Email", "Perfil", "PIN"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="row-hov" style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: C.navy }}>{u.name}</td>
                      <td style={{ padding: "9px 12px", color: C.muted, fontSize: 12 }}>{u.email}</td>
                      <td style={{ padding: "9px 12px" }}><Badge color={roleColor(u.role)} small>{roleLabel(u.role)}</Badge></td>
                      <td style={{ padding: "9px 12px", fontFamily: "monospace", color: C.muted, fontSize: 12 }}>{"•".repeat(u.pin?.length || 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12, color: C.muted }}>
              <strong>PINs de acesso:</strong> Admin = <code>2025</code> · Coordenador = <code>1234</code>
            </div>
          </div>
        </div>
      </div>
    )}
  </main>

  {/* ═══════════════════════════════════════════════════════════════════
      MODAIS
  ═══════════════════════════════════════════════════════════════════ */}

  {/* LOGIN */}
  <Modal show={showLoginModal} onClose={() => { setShowLoginModal(false); setLoginPin(""); setLoginError(""); }} title="Acesso ao Sistema" icon={Shield} iconColor={C.navy}>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Perfil de Acesso</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ r: ROLES.ADMIN, l: "Administrador", icon: Shield }, { r: ROLES.COORD, l: "Coordenador", icon: UserCheck }].map(p => (
            <button key={p.r} onClick={() => setLoginRole(p.r)} className="btn" style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${loginRole === p.r ? C.blue : "#e2e8f0"}`, background: loginRole === p.r ? C.blue + "10" : "#f8fafc", color: loginRole === p.r ? C.blue : C.muted, fontWeight: loginRole === p.r ? 700 : 500, fontSize: 13, justifyContent: "center" }}>
              <p.icon size={14} /> {p.l}
            </button>
          ))}
        </div>
      </div>
      {loginRole === ROLES.COORD && (
        <>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Seu Nome</label>
            <input value={loginName} onChange={e => setLoginName(e.target.value)} placeholder="Nome do coordenador"
              style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Email</label>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="email@instituicao.edu.br"
              style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14 }} />
          </div>
        </>
      )}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>PIN de Acesso</label>
        <input type="password" value={loginPin} onChange={e => setLoginPin(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          placeholder="••••" autoFocus
          style={{ width: "100%", border: "2px solid #e2e8f0", borderRadius: 10, padding: "11px", textAlign: "center", fontSize: 22, letterSpacing: "0.3em" }} />
      </div>
      {loginError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: C.danger }}>{loginError}</div>}
      <button onClick={handleLogin} className="btn" style={{ background: `linear-gradient(135deg,${C.navy},${C.blue})`, color: "#fff", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, justifyContent: "center", width: "100%" }}>
        <Unlock size={15} /> Entrar
      </button>
      <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>Admin PIN: <code>2025</code> · Coord PIN: <code>1234</code></div>
    </div>
  </Modal>

  {/* IMPORTAR PPC IA */}
  <Modal show={showImportModal} onClose={() => { setShowImportModal(false); setImportText(""); setImportResult(null); setImportError(""); }} title="Importar PPC com Inteligência Artificial" icon={Sparkles} iconColor={C.teal} wide>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: C.teal + "12", border: `1px solid ${C.teal}30`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.teal, lineHeight: 1.5 }}>
        <strong>Como usar:</strong> Abra o PDF do PPC, selecione todo o texto (Ctrl+A), copie (Ctrl+C) e cole abaixo — ou faça upload de um .txt exportado do PDF. A IA extrai automaticamente curso, campus, semestres, disciplinas e cargas horárias.
      </div>
      <input ref={fileInputRef} type="file" accept=".txt" style={{ display: "none" }} onChange={handleFileUpload} />
      <button onClick={() => fileInputRef.current?.click()} className="btn" style={{ background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: C.muted, width: "100%", justifyContent: "center" }}>
        <UploadCloud size={15} /> Upload arquivo de texto (.txt)
      </button>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Texto do PPC</label>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmt(importText.length)} / 15.000 caracteres</span>
        </div>
        <textarea value={importText} onChange={e => setImportText(e.target.value.slice(0, 15000))}
          placeholder="Cole aqui o conteúdo extraído do PDF do PPC..."
          rows={10} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px", fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
      </div>
      <button onClick={analyzePPC} disabled={isAnalyzing || !importText.trim()} className="btn" style={{ background: isAnalyzing ? "#94a3b8" : `linear-gradient(135deg,${C.teal},${C.tealLight})`, color: "#fff", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, justifyContent: "center" }}>
        {isAnalyzing ? <><Spin size={16} color="#fff" /> Analisando com IA...</> : <><Sparkles size={15} /> Analisar PPC</>}
      </button>
      {importError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: C.danger }}>⚠ {importError}</div>}
      {importResult && (
        <div style={{ border: `1.5px solid ${C.success}50`, borderRadius: 12, overflow: "hidden", animation: "fadeUp .3s ease" }}>
          <div style={{ background: C.success + "12", padding: "11px 16px", borderBottom: `1px solid ${C.success}30`, display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: C.success }}>
            <CheckCircle size={15} /> Identificado: {importResult.courseName}
          </div>
          <div style={{ padding: "14px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>
              {[["Curso", importResult.courseName], ["Tipo", importResult.courseType], ["Campus", importResult.campus || "Auto"], ["Semestres", importResult.duration], ["Turmas 1º Sem", importResult.classesFirstHalfYear], ["Turmas 2º Sem", importResult.classesSecondHalfYear]].map(([l, v]) => (
                <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: "9px 12px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{String(v || "—")}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
              {(importResult.subjects || []).length} disciplinas identificadas:
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
              {(importResult.subjects || []).map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", background: "#f8fafc", borderRadius: 7, fontSize: 12 }}>
                  <span style={{ background: C.navy + "15", color: C.navy, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{s.semester}º</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{s.name}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>{s.hoursTotal || ((s.hoursT || 0) + (s.hoursP || 0) + (s.hoursE || 0))}h</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <button onClick={() => setImportResult(null)} className="btn" style={{ background: "#f1f5f9", color: C.muted, borderRadius: 8, padding: "8px 16px", fontSize: 13 }}>Reanalisar</button>
              <button onClick={confirmImport} className="btn" style={{ background: `linear-gradient(135deg,${C.navy},${C.blue})`, color: "#fff", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700 }}>
                <CheckCircle size={14} /> Importar Curso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </Modal>

  {/* COORDENADOR — INDICAR ÁREA */}
  <Modal show={showCoordModal} onClose={() => setShowCoordModal(false)} title="Indicar Área do Docente" icon={UserCheck} iconColor={C.teal}>
    {coordTarget && (() => {
      const { course, subject: sub } = coordTarget;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#f8fafc", border: "1px solid #e8edf4", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Disciplina</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{sub.name}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <Tag icon={BookOpen} value={`${sub.semester}º semestre`} />
              <Tag value={`${sub.hoursTotal}h total`} />
              <Tag icon={GraduationCap} value={course.name} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: "block", marginBottom: 6 }}>Área do Docente Responsável *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {areas.map(a => (
                <button key={a.id} onClick={() => setCoordAreaSel(a.id)} className="btn" style={{ padding: "10px 12px", borderRadius: 10, border: `2px solid ${coordAreaSel === a.id ? a.color : "#e2e8f0"}`, background: coordAreaSel === a.id ? a.color + "15" : "#f8fafc", color: coordAreaSel === a.id ? a.color : C.muted, fontWeight: coordAreaSel === a.id ? 700 : 500, fontSize: 13, justifyContent: "flex-start" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                  {a.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: "block", marginBottom: 6 }}>Carga Horária</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[["Teórica (h)", "t"], ["Prática (h)", "p"], ["Extensão (h)", "e"]].map(([l, k]) => (
                <div key={k}>
                  <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 3 }}>{l}</label>
                  <input type="number" min={0} value={coordHours[k]}
                    onChange={e => setCoordHours(p => ({ ...p, [k]: Number(e.target.value) }))}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 14 }} />
                </div>
              ))}
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: C.muted, marginTop: 6 }}>
              Total: <strong style={{ color: C.navy }}>{coordHours.t + coordHours.p + coordHours.e}h</strong>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: "block", marginBottom: 4 }}>Observação (opcional)</label>
            <textarea value={coordNote} onChange={e => setCoordNote(e.target.value)} rows={2} placeholder="Justificativa ou observação..."
              style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", resize: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowCoordModal(false)} className="btn" style={{ background: "#f1f5f9", color: C.muted, borderRadius: 8, padding: "9px 18px", fontSize: 13 }}>Cancelar</button>
            <button onClick={saveCoord} disabled={!coordAreaSel} className="btn" style={{ background: coordAreaSel ? `linear-gradient(135deg,${C.navy},${C.blue})` : "#94a3b8", color: "#fff", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 700 }}>
              <Send size={14} /> Confirmar Indicação
            </button>
          </div>
        </div>
      );
    })()}
  </Modal>

  {/* EMAIL */}
  <Modal show={showEmailModal} onClose={() => setShowEmailModal(false)} title="Notificar Coordenador por Email" icon={Mail} iconColor={C.accent}>
    {emailTarget && (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "11px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.warn, marginBottom: 6 }}>⚠ {emailTarget.pending.length} disciplina{emailTarget.pending.length > 1 ? "s" : ""} sem área em <em>{emailTarget.course.name}</em></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {emailTarget.pending.map(s => (
              <div key={s.id} style={{ fontSize: 12, color: C.text }}>• {s.name} ({s.semester}º sem) — {s.hoursTotal}h</div>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Destinatário</label>
          <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 7 }}>
            <Mail size={14} />
            {getCampus(emailTarget.course.campusId)?.email || "coordenacao@instituicao.edu.br"}
          </div>
        </div>
        <div style={{ background: "#f8fafc", border: "1px solid #e8edf4", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: C.muted }}>
          <div style={{ fontWeight: 700, color: C.navy, marginBottom: 6, fontSize: 13 }}>Prévia do email</div>
          <div style={{ lineHeight: 1.6 }}>
            <strong>Assunto:</strong> [PPC Digital] Solicitação de indicação de área — {emailTarget.course.name}<br />
            <strong>Corpo:</strong> Prezado(a) Coordenador(a), você tem {emailTarget.pending.length} disciplina(s) aguardando indicação de área docente...
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => setShowEmailModal(false)} className="btn" style={{ background: "#f1f5f9", color: C.muted, borderRadius: 8, padding: "9px 18px", fontSize: 13 }}>Cancelar</button>
          <button onClick={sendEmail} disabled={isSendingEmail} className="btn" style={{ background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700 }}>
            {isSendingEmail ? <><Spin size={14} color="#fff" /> Enviando...</> : <><Send size={14} /> Enviar Email</>}
          </button>
        </div>
      </div>
    )}
  </Modal>

  {/* TOASTS */}
  <Toast toasts={toasts} />
</div>
```

);
}
