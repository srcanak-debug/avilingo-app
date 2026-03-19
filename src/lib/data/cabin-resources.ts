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
    title: 'Modern Cabin Emniyet El Kitabı (E-Book)',
    description: 'Dünya standartlarında interaktif kabin emniyet rehberi.',
    url: '/resources/ebooks/cabin-safety-v3.epub',
    thumbnailUrl: '/assets/img/res-cover-safety.webp',
    sizeMb: 12.4,
    tags: ['Safety', 'SOP', 'Standard']
  },
  {
    id: 'res-ns-002',
    topicId: 'normal-safety-procedures',
    type: 'AI-VIDEO',
    title: 'Kalkış Öncesi Kontrol Video Simülasyonu',
    description: 'AI tarafından canlandırılmış gerçekçi pre-flight kabin hazırlığı.',
    url: '/resources/videos/preflight-ai.mp4',
    thumbnailUrl: '/assets/img/v-preflight-thumb.webp',
    sizeMb: 45.2,
    tags: ['Video', 'AI', 'Simulation']
  },
  {
    id: 'res-ns-003',
    topicId: 'normal-safety-procedures',
    type: 'INFOGRAPH',
    title: 'Kabin Ekipman Dağılıım Haritası',
    description: 'Tüm acil durum ekipmanlarının hızlı erişim infografiği.',
    url: '/resources/infographics/equipment-map.webp',
    thumbnailUrl: '/resources/infographics/equipment-map-small.webp',
    sizeMb: 2.1,
    tags: ['Visual', 'QuickView']
  },
  {
    id: 'res-ff-001',
    topicId: 'fire-fighting',
    type: 'PDF-MANUAL',
    title: 'Lityum Pil Yangınları - Teknik Bülten',
    description: 'Kabin içi lityum yangınlarına müdahale protokolleri.',
    url: '/resources/ebooks/lithium-fire-protocol.pdf',
    sizeMb: 4.8,
    tags: ['Dangerous Goods', 'Emergency']
  }
];
