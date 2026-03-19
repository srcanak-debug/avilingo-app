/**
 * WXR-2100 Weather Radar (Boeing) - Technical Course Content
 * Based on Flyco Global / Airline Standard Reference
 */

export const WXR_2100_COURSE = {
  id: 'wxr-2100-boeing',
  title: 'WXR-2100 MultiScan™ Weather Radar (Boeing Masterclass)',
  category: 'General Subject Courses',
  aircraft: 'Boeing (B737/B777/B787)',
  duration: '22:30',
  slides: 64,
  exam: true,
  outline: [
    { title: '1. SYSTEM OVERVIEW', type: 'intro' },
    { 
      title: '2. AUTOMATIC MULTISCAN™ LOGIC', 
      subpoints: [
        'How MultiScan technology merges two 12° beams into a single tactical picture.',
        'Ground Clutter Suppression (GCS) algorithms and terrain database integration.',
        'Auto-Tilt vs Manual: When to trust the system in convective weather.'
      ]
    },
    { 
      title: '3. TACTICAL TILT & GAIN MANAGEMENT', 
      subpoints: [
        'Strategic scanning: Using 60-80NM range to identify cell height.',
        'The 1:1 Rule: Estimating cell base and top using tilt angles.',
        'Calibrated (CAL) vs Manual Gain: Identifying the "Core" of a thunderstorm.'
      ]
    },
    { 
      title: '4. PATH ATTENUATION & SHADOWING', 
      subpoints: [
        'The "Radar Shadow": Why a black hole behind a cell is a major threat.',
        'PAC (Path Attenuation Compensation) alerts and limitations.',
        'Reactive vs Proactive avoidance: The 20NM clearance rule.'
      ]
    },
    { 
      title: '5. PREDICTIVE WINDSHEAR (PWS)', 
      subpoints: [
        'Doppler shift measurement in moisture-rich environments.',
        'Inhibition logic: Takeoff vs Approach phases.',
        'Response procedures: TOGA/Windshear recovery actions.'
      ]
    },
    { title: '6. FINAL EXAM & CERTIFICATION', type: 'exam' }
  ]
};
