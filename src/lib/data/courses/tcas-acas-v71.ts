/**
 * TCAS / ACAS II (Version 7.1) - Advanced Masterclass
 * Standards: ICAO Annex 10, RTCA DO-185B (v7.1), EASA CS-ACNS.
 */

export const TCAS_ACASII_COURSE = {
  id: 'tcas-acas-masterclass',
  title: 'TCAS II Version 7.1: The Collision Avoidance Masterclass',
  category: 'General Subject Courses',
  aircraft: 'Universal (All Glass Cockpit Fleets)',
  duration: '35:00',
  slides: 82,
  exam: true,
  authoritative_sources: ['ICAO PANS-OPS', 'EASA Part-ORO', 'RTCA DO-385 (ACAS X Intro)'],
  outline: [
    { title: '1. THE EVOLUTION OF SAFETY', type: 'intro' },
    { 
      title: '2. TCAS II v7.1 LOGIC DEEP-DIVE', 
      subpoints: [
        'The Change to "Level Off" RA: Why v7.0 "Adjust Vertical Speed" was failing.',
        'Reversal Logic Enhancements: Handling coordinated pilot responses.',
        'The 100ft RA modification: Reducing nuisance alerts during parallel approaches.'
      ]
    },
    { 
      title: '3. TRAFFIC & RESOLUTION ADVISORIES (TA/RA)', 
      subpoints: [
        'Sensitivity Levels (SL) vs Altitude: SL 2 to SL 7 logic.',
        'RA Time Thresholds: The "Tau" (τ) calculation (25-35 seconds to CPA).',
        'Coordinated RA: How aircraft negotiate vertical separation over Mode S.'
      ]
    },
    { 
      title: '4. PILOT RESPONSE & RA MANEUVERS', 
      subpoints: [
        'Follow the Green: Maximum 5-second response time for initial RA.',
        'Visual Cues on PFD/ND: The Red Arcs and Fly-To Green Zones.',
        'Clear of Conflict (CC): The process of returning to Assigned Altitude.'
      ]
    },
    { 
      title: '5. ACAS X: THE FUTURE OF AUTOMATION', 
      subpoints: [
        'Introduction to ACAS Xa (Active) and ACAS Xo (Ops-specific).',
        'Markov Process logic vs legacy Tau logic.',
        'Integrating Drones and UAM into the collision mesh.'
      ]
    },
    { title: '6. INTERACTIVE RA SIMULATOR', type: 'interactive' },
    { title: '7. CERTIFICATION EXAM (80% PASS)', type: 'exam' }
  ]
};
