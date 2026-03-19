'use client'
import { useState } from 'react'

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  target: string
  ip_address: string
  severity: 'low' | 'medium' | 'high'
}

export default function AuditSystem() {
  const [logs] = useState<AuditLog[]>([
    { id: '1', timestamp: '2026-03-19 05:45:12', user: 'sercan.ak@avilingo.com', action: 'VIEW_EXAM_RESULTS', target: 'Candidate #442', ip_address: '192.168.1.1', severity: 'low' },
    { id: '2', timestamp: '2026-03-19 04:20:05', user: 'admin@avilingo.com', action: 'DELETE_ORGANIZATION', target: 'Skyways Air', ip_address: '10.0.0.5', severity: 'high' },
    { id: '3', timestamp: '2026-03-19 02:10:44', user: 'hr.manager@thy.com', action: 'UPDATE_USER_ROLE', target: 'Pilot Ahmet', ip_address: '172.16.0.44', severity: 'medium' },
  ])

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--bdr)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>System Audit Logs</h2>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: '4px 0 0' }}>Traceability and accountability for all administrative actions (GDPR/KVKK Compliance).</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--bdr)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Export CSV</button>
          <button style={{ padding: '10px 20px', background: 'var(--navy)', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Filter Logs</button>
        </div>
      </div>

      <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>⚖️</span>
        <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 600 }}>Important: These logs are immutable and stored in a secure vault for legal compliance.</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--off)', textAlign: 'left', borderBottom: '2px solid var(--bdr)' }}>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Timestamp</th>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Admin User</th>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Action</th>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Target</th>
              <th style={{ padding: '12px', fontSize: '12px', color: 'var(--t3)', textTransform: 'uppercase' }}>Severity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--bdr)' }}>
                <td style={{ padding: '14px 12px', fontSize: '13px', color: 'var(--t3)', fontFamily: 'monospace' }}>{log.timestamp}</td>
                <td style={{ padding: '14px 12px' }}>
                   <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '14px' }}>{log.user}</div>
                   <div style={{ fontSize: '11px', color: 'var(--t3)' }}>IP: {log.ip_address}</div>
                </td>
                <td style={{ padding: '14px 12px' }}>
                  <code style={{ background: 'var(--off)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>{log.action}</code>
                </td>
                <td style={{ padding: '14px 12px', fontSize: '14px', fontWeight: 600 }}>{log.target}</td>
                <td style={{ padding: '14px 12px' }}>
                   <span style={{ 
                     padding: '4px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: 800,
                     background: log.severity === 'high' ? '#fef2f2' : log.severity === 'medium' ? '#fff7ed' : '#f0f9ff',
                     color: log.severity === 'high' ? '#ef4444' : log.severity === 'medium' ? '#f59e0b' : '#3b82f6',
                     textTransform: 'uppercase'
                   }}>
                     {log.severity}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
