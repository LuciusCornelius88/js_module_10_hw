const numberFilters = ['>', '<', '===', '<=', '>=', '!=='];
const boolFilters = ['===', '!=='];
const sortTypes = ['Asc', 'Desc'];

const numberFilterParams = [
  'indoor',
  'adaptability',
  'affection_level',
  'child_friendly',
  'dog_friendly',
  'energy_level',
  'grooming',
  'health_issues',
  'intelligence',
  'shedding_level',
  'social_needs',
  'stranger_friendly',
  'vocalisation',
];

const boolFilterParams = ['experimental', 'hairless', 'natural', 'rare', 'rex', 'suppressed_tail', 'short_legs'];

const allFilterParams = [
  'indoor',
  'adaptability',
  'affection_level',
  'child_friendly',
  'dog_friendly',
  'energy_level',
  'grooming',
  'health_issues',
  'intelligence',
  'shedding_level',
  'social_needs',
  'stranger_friendly',
  'vocalisation',
  'experimental',
  'hairless',
  'natural',
  'rare',
  'rex',
  'suppressed_tail',
  'short_legs',
];

export { numberFilterParams, boolFilterParams, numberFilters, boolFilters, allFilterParams, sortTypes };
