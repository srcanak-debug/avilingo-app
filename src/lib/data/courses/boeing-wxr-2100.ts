/**
 * WXR-2100 Weather Radar (Boeing) - Technical Course Content
 * Based on Flyco Global / Airline Standard Reference
 */

export const WXR_2100_COURSE = {
  id: 'wxr-2100-boeing',
  title: 'WXR-2100 Weather Radar (Boeing)',
  category: 'General Subject Courses',
  aircraft: 'Boeing',
  duration: '13:51',
  slides: 48,
  exam: false,
  outline: [
    { title: 'COURSE START', type: 'intro' },
    { title: 'WXR-2100 WEATHER RADAR (BOEING)', type: 'title' },
    { 
      title: 'WEATHER RADAR', 
      subpoints: [
        'Tilt Management: Adjusting the beam to avoid ground clutter while scanning cells.',
        'Gain Management: Fine-tuning sensitivity for accurate precipitation intensity.',
        'Range Management: Strategic use of 40NM to 160NM scales for tactical and strategic planning.'
      ]
    },
    { 
      title: 'PREDICTIVE WINDSHEAR', 
      subpoints: [
        'Warning/Caution logic below 1200ft RA.',
        'Aural alerts: "WINDSHEAR AHEAD"',
        'Visual icons on ND (Navigation Display).'
      ]
    },
    { 
      title: 'OPERATIONAL RECOMMENDATIONS', 
      subpoints: [
        'Tilt Management (Auto vs Manual)',
        'Gain Management (CAL vs MAN)',
        'Range Management (Scale selection)',
        'Other Considerations (Shadowing, Path Attenuation)'
      ]
    },
    { title: 'COURSE END', type: 'summary' }
  ]
};
