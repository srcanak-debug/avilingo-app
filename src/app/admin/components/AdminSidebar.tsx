'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "e-Test (Sınav)",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "📊" },
      { id: "questions", label: "Question Bank", icon: "📚" },
      { id: "active_exams", label: "Active Exams", icon: "📝" },
      { id: "reports", label: "Reports", icon: "📈" },
    ],
  },
  {
    label: "Virtual & VR (Eğitim)",
    items: [
      { id: "live_class", label: "Live Classroom", icon: "📹" },
      { id: "vr_360", label: "360° Walkthrough", icon: "🥽" },
    ],
  },
  {
    label: "AI Content Engine (Zeka)",
    items: [
      { id: "ai_transform", label: "Manual Transformer", icon: "🤖" },
      { id: "ai_gen", label: "Question Gen", icon: "✍️" },
    ],
  },
  {
    label: "TMS & EBT (Planlama)",
    items: [
      { id: "tms_quals", label: "Qualifications", icon: "📜" },
      { id: "tms_resources", label: "Resource Mgmt", icon: "🏢" },
      { id: "ebt_matrix", label: "EBT Matrix", icon: "🎯" },
      { id: "ebt_forms", label: "Assessment Forms", icon: "✍️" },
    ],
  },
  {
    label: "LMS & CompBT (Eğitim)",
    items: [
      { id: "lms_categories", label: "Course Categories", icon: "🗂️" },
      { id: "lms_library", label: "Course Library", icon: "📚" },
      { id: "lms_player", label: "Lesson Player", icon: "🎥" },
      { id: "compbt_adaptive", label: "Adaptive Learning", icon: "🧠" },
      { id: "evaluator", label: "Grading Queue", icon: "✍️" },
    ],
  },
  {
    label: "Sistem & Güvenlik",
    items: [
      { id: "organizations", label: "Organizations", icon: "🏢" },
      { id: "users", label: "Users & Candidates", icon: "👥" },
      { id: "audit", label: "Audit Logs", icon: "📜" },
      { id: "hr_analytics", label: "HR Analytics", icon: "📊" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div
      style={{
        width: "210px",
        background: "var(--navy)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.05)",
        height: "100vh",
        position: "sticky",
        top: 0
      }}
    >
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: '20px', fontWeight: 900, color: '#fff' }}>
          Avil<span style={{ color: '#5AAEDF' }}>ingo</span>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: 700, letterSpacing: '0.5px' }}>ADMIN CONSOLE</div>
      </div>

      <nav style={{ padding: "20px 8px", flex: 1, overflowY: "auto" }}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                padding: "0 14px 8px 14px",
              }}
            >
              {group.label}
            </div>
            {group.items.map((item) => {
              const href = item.id === "hr_analytics" ? "/hr/analytics" : `/admin/${item.id}`;
              const isActive = pathname.startsWith(`/admin/${item.id}`) || (item.id === 'dashboard' && pathname === '/admin');
              
              return (
                <Link
                  key={item.id}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    marginBottom: "2px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    color: isActive ? "#fff" : item.disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
                    transition: "all 0.2s",
                    fontFamily: "var(--fb)",
                    opacity: item.disabled ? 0.6 : 1,
                    pointerEvents: item.disabled ? 'none' : 'auto'
                  }}
                >
                  <span style={{ fontSize: "16px", opacity: isActive ? 1 : 0.6 }}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.disabled && (
                    <span style={{ fontSize: "8px", background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "4px", marginLeft: "auto" }}>
                      SOON
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      
      <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
        <div style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: "1px", textTransform: "uppercase" }}>
          v3.1.0
        </div>
      </div>
    </div>
  )
}
