/**
 * Cabin Crew Professional Resource Library (Phase 22)
 * High-performance, worldwide standard training assets.
 */

export interface CabinResource {
  id: string;
  topicId: string;
  type: 'E-BOOK' | 'AI-VIDEO' | 'INFOGRAPH' | 'PDF-MANUAL';
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  sizeMb?: number;
  tags: string[];
}

export const CABIN_RESOURCES: CabinResource[] = [
  {
    id: 'res-ns-001',
    topicId: 'normal-safety-procedures',
    type: 'E-BOOK',
    title: 'EASA Part-CC Cabin Safety Standard (E-Book)',
    description: 'Comprehensive guide to EASA Initial Training requirements including aircraft systems and passenger safety SOPs.',
    url: '/resources/ebooks/cabin-safety-v3.epub',
    thumbnailUrl: '/assets/img/res-cover-safety.webp',
    sizeMb: 12.4,
    tags: ['Safety', 'EASA', 'Standard']
  },
  {
    id: 'res-ns-002',
    topicId: 'normal-safety-procedures',
    type: 'AI-VIDEO',
    title: 'Pre-Flight Equipment Inspection Simulation',
    description: 'HQ AI-generated training video demonstrating 100% accurate PBE, Fire Extinguisher, and Oxygen pre-checks.',
    url: '/resources/videos/preflight-ai.mp4',
    thumbnailUrl: '/assets/img/v-preflight-thumb.webp',
    sizeMb: 45.2,
    tags: ['Video', 'AI', 'SOP']
  },
  {
    id: 'res-ns-003',
    topicId: 'normal-safety-procedures',
    type: 'INFOGRAPH',
    title: 'Narrow-Body Cabin Equipment Map (LOPA)',
    description: 'Technical infographic showing standard emergency equipment locations on a typical A320/B737 configuration.',
    url: '/resources/infographics/equipment-map.webp',
    thumbnailUrl: '/resources/infographics/equipment-map-small.webp',
    sizeMb: 2.1,
    tags: ['Visual', 'Equipment']
  },
  {
    id: 'res-ff-001',
    topicId: 'fire-fighting',
    type: 'PDF-MANUAL',
    title: 'Lithium Battery Fire Protocol (Tech Bulletin)',
    description: 'Authorized EBT procedures for identifying and suppressing lithium battery thermal runaway in the cabin.',
    url: '/resources/ebooks/lithium-fire-protocol.pdf',
    sizeMb: 4.8,
    tags: ['Dangerous Goods', 'Emergency']
  }
];
