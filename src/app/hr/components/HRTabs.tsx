'use client'
import React from 'react'

type TabType = 'candidates' | 'results' | 'credits' | 'reports'

interface HRTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const HRTabs: React.FC<HRTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: TabType[] = ['candidates', 'results', 'credits', 'reports']

  return (
    <div style={{
      display: 'flex',
      gap: '2px',
      background: 'rgba(255,255,255,0.05)',
      padding: '3px',
      borderRadius: '10px',
      marginBottom: '20px',
      width: 'fit-content'
    }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            textTransform: 'capitalize',
            background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--fb)'
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
