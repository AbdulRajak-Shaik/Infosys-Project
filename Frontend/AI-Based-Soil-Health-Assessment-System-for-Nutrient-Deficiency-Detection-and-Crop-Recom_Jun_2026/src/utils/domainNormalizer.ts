/**
 * Helper module for canonical key mapping for domain entities:
 * Soil Types, Nutrient Types, Crop Types, Topics, Statuses, Roles
 */

export function normalizeSoilKey(soilStr: string): string {
  if (!soilStr) return '';
  const s = soilStr.trim().toLowerCase();
  if (s.includes('alluvial') || s.includes('जलोढ़')) return 'soil.alluvial';
  if (s.includes('loamy') || s.includes('दोमट')) return 'soil.loamy';
  if (s.includes('red') || s.includes('लाल')) return 'soil.red';
  if (s.includes('sandy') || s.includes('बलुई')) return 'soil.sandy';
  if (s.includes('black') || s.includes('काली')) return 'soil.black';
  if (s.includes('clay') || s.includes('चिकनी')) return 'soil.clay';
  if (s.includes('laterite')) return 'soil.laterite';
  return `soil.${s.replace(/\s+/g, '')}`;
}

export function normalizeNutrientKey(nutrStr: string): string {
  if (!nutrStr) return '';
  const n = nutrStr.trim().toLowerCase();
  if (n.includes('nitrogen') || n === 'n') return 'nutrient.nitrogen';
  if (n.includes('potassium') || n === 'k') return 'nutrient.potassium';
  if (n.includes('phosphorus') || n === 'p') return 'nutrient.phosphorus';
  if (n === 'ph' || n.includes('ph')) return 'nutrient.ph';
  return `nutrient.${n}`;
}

export function normalizeCropKey(cropStr: string): string {
  if (!cropStr) return '';
  const c = cropStr.trim().toLowerCase();
  if (c.includes('wheat')) return 'crop.wheat';
  if (c.includes('cotton')) return 'crop.cotton';
  if (c.includes('maize') || c.includes('corn')) return 'crop.maize';
  if (c.includes('groundnut') || c.includes('peanut')) return 'crop.groundnut';
  if (c.includes('rice') || c.includes('paddy')) return 'crop.rice';
  if (c.includes('pulse')) return 'crop.pulses';
  if (c.includes('sugarcane')) return 'crop.sugarcane';
  if (c.includes('soybean')) return 'crop.soybean';
  if (c.includes('vegetable')) return 'crop.vegetables';
  if (c.includes('millet')) return 'crop.millets';
  if (c.includes('sorghum')) return 'crop.sorghum';
  return `crop.${c.replace(/\s+/g, '')}`;
}

export function normalizeTopicKey(topicStr: string): string {
  if (!topicStr) return '';
  const t = topicStr.trim().toLowerCase();
  if (t.includes('fertilizer') || t.includes('উর্ব') || t.includes('खत')) return 'topic.fertilizer';
  if (t.includes('general') || t.includes('सामान्य') || t.includes('సాధారణ')) return 'topic.general';
  if (t.includes('soil') || t.includes('मिट्टी')) return 'topic.soilClassification';
  if (t.includes('crop') || t.includes('फसल')) return 'topic.cropRecommendation';
  if (t.includes('weather') || t.includes('मौसम')) return 'topic.weather';
  if (t.includes('pest') || t.includes('कीट')) return 'topic.pestManagement';
  if (t.includes('scheme') || t.includes('योजना')) return 'topic.governmentSchemes';
  return `topic.${t.replace(/\s+/g, '')}`;
}

export function normalizeStatusKey(statusStr: string): string {
  if (!statusStr) return '';
  const st = statusStr.trim().toLowerCase();
  if (st === 'resolved' || st.includes('resolv')) return 'status.resolved';
  if (st === 'pending' || st.includes('pend')) return 'status.pending';
  if (st === 'active' || st.includes('activ')) return 'status.active';
  if (st === 'inactive' || st.includes('inactiv')) return 'status.inactive';
  if (st === 'suspended') return 'status.suspended';
  return `status.${st}`;
}
