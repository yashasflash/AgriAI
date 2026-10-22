/**
 * AgriAI — System-Assigned Predefined Avatars
 * Deterministically assigned and persisted per user in localStorage.
 * 100% offline, no photo uploads or external avatar services required.
 */

export const AVATAR_PRESETS = [
  {
    id: 'farmer-m',
    emoji: '👨‍🌾',
    label: 'Traditional Cultivator',
    title: 'Field Cultivator',
    badge: 'Field Expert',
    bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
    border: '#86efac',
    color: '#166534'
  },
  {
    id: 'farmer-f',
    emoji: '👩‍🌾',
    label: 'Agri Specialist',
    title: 'Agri Specialist',
    badge: 'Crop Scientist',
    bg: 'linear-gradient(135deg, #fef3c7, #fde047)',
    border: '#fde047',
    color: '#854d0e'
  },
  {
    id: 'sprout',
    emoji: '🌱',
    label: 'Sprout Pioneer',
    title: 'Sprout Pioneer',
    badge: 'Soil Nutritionist',
    bg: 'linear-gradient(135deg, #dbeafe, #93c5fd)',
    border: '#93c5fd',
    color: '#1e40af'
  },
  {
    id: 'wheat',
    emoji: '🌾',
    label: 'Grain Master',
    title: 'Grain Master',
    badge: 'Harvest Veteran',
    bg: 'linear-gradient(135deg, #ffedd5, #fdba74)',
    border: '#fdba74',
    color: '#9a3412'
  },
  {
    id: 'tractor',
    emoji: '🚜',
    label: 'Field Operator',
    title: 'Field Operator',
    badge: 'Farm Mechanizer',
    bg: 'linear-gradient(135deg, #fae8ff, #f0abfc)',
    border: '#f0abfc',
    color: '#86198f'
  },
  {
    id: 'leaf',
    emoji: '🍃',
    label: 'Plant Guardian',
    title: 'Plant Guardian',
    badge: 'Plant Caretaker',
    bg: 'linear-gradient(135deg, #e0f2fe, #7dd3fc)',
    border: '#7dd3fc',
    color: '#075985'
  }
];

export function getOrAssignUserAvatar(user) {
  if (!user) return AVATAR_PRESETS[0];

  const userIdentifier = user.id ? `id_${user.id}` : `name_${user.name || 'default'}`;
  const storageKey = `agriai_user_avatar_${userIdentifier}`;

  const savedId = localStorage.getItem(storageKey);
  if (savedId) {
    const matched = AVATAR_PRESETS.find((a) => a.id === savedId);
    if (matched) return matched;
  }

  // Deterministic seed from user's unique identifier
  const seedString = `${user.id || ''}_${user.name || 'farmer'}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }

  const selectedIndex = Math.abs(hash) % AVATAR_PRESETS.length;
  const assigned = AVATAR_PRESETS[selectedIndex];
  localStorage.setItem(storageKey, assigned.id);
  return assigned;
}
