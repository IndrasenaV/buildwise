export function normalizeTradeName(name) {
  return String(name || '').toLowerCase().trim()
}

// Map normalized trade names (exact) to planning slugs we support
const TRADE_TO_PLANNING_SLUG = {
  'hvac': 'hvac',
  'plumbing': 'plumbing',
  'electrical': 'electrical',
  'insulation': 'insulation',
  'exterior materials': 'exterior-materials',
  'drywalls': 'drywall-paint',
  'paint (interior)': 'drywall-paint',
  'cabinets': 'cabinets',
  'hardwood flooring': 'flooring',
  'bathroom tiles': 'flooring',
  'windows (pella / iron)': 'windows-doors',
  'appliances': 'appliances',
  'countertops': 'countertops',
}

export function planningSlugForTrade(trade) {
  const key = normalizeTradeName(trade?.name)
  return TRADE_TO_PLANNING_SLUG[key] || null
}

export function planningPathForTrade(homeId, trade) {
  const slug = planningSlugForTrade(trade)
  return slug ? `/homes/${homeId}/planning/${slug}` : null
}

export function budgetPathForTrade(homeId, trade) {
  return `/homes/${homeId}/trades/${trade?._id}/budget`
}

export function executionPathForTrade(homeId, trade) {
  return `/homes/${homeId}/trades/${trade?._id}`
}

export function tradeMatchesPlanningSlug(trade, slug) {
  return planningSlugForTrade(trade) === slug
}


