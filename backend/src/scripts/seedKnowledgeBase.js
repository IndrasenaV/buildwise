#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectToDatabase } = require('../config/db');
const { KnowledgeBase } = require('../models/KnowledgeBase');

async function upsert(key, data, description = '', extra = {}) {
  if (!data) {
    console.warn(`Skip empty knowledge base for key=${key}`);
    return;
  }
  await KnowledgeBase.updateOne(
    { key },
    {
      $set: {
        data,
        description,
        ...(typeof extra.version === 'number' ? { version: extra.version } : {}),
        ...(typeof extra.type === 'string' ? { type: extra.type } : {}),
        ...(Array.isArray(extra.tags) ? { tags: extra.tags } : {}),
      },
    },
    { upsert: true }
  );
  console.log(`Upserted knowledge base: ${key}`);
}

async function main() {
  await connectToDatabase();
  await upsert(
    'architecture.questions',
    {
      version: 2,
      modes: [
        { key: 'summary', label: 'Summary (20–30 questions)' },
        { key: 'in_depth', label: 'In-Depth (100+ questions)' }
      ],
      progression: {
        strategy: 'start_high_level_then_drill_down',
        maxFollowUpsPerSection: 8,
        guidelines: [
          'Ask top-level goals first (project, household, lifestyle).',
          'For each major space (kitchen, living, bedrooms, baths, office), ask priority/use patterns before specifications.',
          'Use answers to branch into detail: dimensions, features, adjacencies, storage.',
          'Balance cost/complexity by surfacing budget trade-offs early.',
          'Confirm accessibility and future-proofing preferences.'
        ]
      },
      sections: [
        {
          key: 'project',
          label: 'Project Basics',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'project_context', text: 'Briefly describe your project and goals in one or two sentences.', type: 'text' },
            { id: 'home_type', text: 'What type of residence?', type: 'select', options: ['Single-family','Townhome','Duplex','Condo','Custom','Accessory Dwelling Unit (ADU)'] },
            { id: 'stories', text: 'Target number of stories?', type: 'number', min: 1, max: 5 },
            { id: 'total_sqft', text: 'Approximate total conditioned square footage?', type: 'number', min: 200, max: 20000 },
            { id: 'bedrooms', text: 'Target number of bedrooms?', type: 'number', min: 1, max: 12 },
            { id: 'bathrooms', text: 'Target number of bathrooms?', type: 'number', min: 1, max: 12 },
            { id: 'garage_bays', text: 'Garage bays / parking capacity?', type: 'number', min: 0, max: 6 },
            { id: 'target_budget', text: 'Target total budget (USD)?', type: 'number', min: 0 },
            { id: 'budget_flex', text: 'Budget flexibility (low to high)?', type: 'scale', min: 1, max: 5 },
            { id: 'timeline', text: 'Desired completion timeline / key milestones?', type: 'text' },
            { id: 'construction_type', text: 'Preferred construction type?', type: 'select', options: ['Wood frame','Steel','ICF','Masonry','Hybrid','No preference'] },
            { id: 'style', text: 'Preferred architectural style(s)?', type: 'text' }
          ]
        },
        {
          key: 'site',
          label: 'Site & Climate',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'site_address', text: 'Project location (city/state or ZIP)?', type: 'text' },
            { id: 'site_slope', text: 'Is the site flat, sloped, or varied?', type: 'select', options: ['Flat','Slight slope','Moderate slope','Steep'] },
            { id: 'site_views', text: 'Notable views to capture or screen?', type: 'text' },
            { id: 'site_noise', text: 'Noise sources to mitigate?', type: 'text' },
            { id: 'site_solar', text: 'Orientation priorities (morning light in bedrooms, evening light in living, etc.)?', type: 'text' },
            { id: 'climate_zone', text: 'Climate/region characteristics to consider (hot-humid, mixed, marine, cold)?', type: 'text' },
            { id: 'microclimate', text: 'Shading, wind, or drainage concerns?', type: 'text' },
            { id: 'landscaping', text: 'Landscaping goals (native plantings, edible garden, low maintenance)?', type: 'text' }
          ]
        },
        {
          key: 'codes_zoning',
          label: 'Codes & Zoning',
          mode: ['in_depth'],
          questions: [
            { id: 'hoa', text: 'HOA or community guidelines to respect?', type: 'boolean' },
            { id: 'setbacks', text: 'Known setbacks or height limits?', type: 'text' },
            { id: 'historic', text: 'Historic district or design review requirements?', type: 'boolean' },
            { id: 'permit_expectations', text: 'Permitting expectations or known constraints?', type: 'text' }
          ]
        },
        {
          key: 'household',
          label: 'Household Profile',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'num_occupants', text: 'How many full-time occupants?', type: 'number', min: 1, max: 12 },
            { id: 'guests_frequency', text: 'How often do you host overnight guests?', type: 'select', options: ['Rarely','Occasionally','Often','Seasonally extended'] },
            { id: 'children_ages', text: 'Children and ages (if applicable)?', type: 'text' },
            { id: 'elderly', text: 'Elderly occupants (now or soon)?', type: 'boolean' },
            { id: 'pets', text: 'Pets (species/size/number)?', type: 'text' },
            { id: 'work_from_home', text: 'Number of people working from home regularly?', type: 'number', min: 0, max: 6 }
          ]
        },
        {
          key: 'lifestyle',
          label: 'Lifestyle & Priorities',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'natural_light_priority', text: 'Priority: abundant natural light?', type: 'scale', min: 1, max: 5 },
            { id: 'acoustic_privacy_priority', text: 'Priority: acoustic privacy?', type: 'scale', min: 1, max: 5 },
            { id: 'energy_efficiency_priority', text: 'Priority: energy efficiency?', type: 'scale', min: 1, max: 5 },
            { id: 'low_maintenance_priority', text: 'Priority: low maintenance?', type: 'scale', min: 1, max: 5 },
            { id: 'entertaining_style', text: 'Entertaining style (small dinners vs large gatherings)?', type: 'text' },
            { id: 'hobbies', text: 'Hobbies/activities needing space (music, workshop, gym, crafts)?', type: 'text' }
          ]
        },
        {
          key: 'accessibility',
          label: 'Accessibility & Future-Proofing',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'aging_in_place', text: 'Is aging-in-place a priority?', type: 'boolean' },
            { id: 'step_free_entry', text: 'Require step-free entry?', type: 'boolean' },
            { id: 'wide_halls_doors', text: 'Prefer wider hallways/doors?', type: 'boolean' },
            { id: 'primary_on_main', text: 'Primary suite on main level?', type: 'boolean' },
            { id: 'elevator_preference', text: 'Elevator or stacked closet for future elevator?', type: 'select', options: ['No','Future provision','Full elevator'] },
            { id: 'grab_bar_provision', text: 'Reinforcement for future grab bars in baths?', type: 'boolean' }
          ]
        },
        {
          key: 'safety_security',
          label: 'Safety & Security',
          mode: ['in_depth'],
          questions: [
            { id: 'security_system', text: 'Desired level of security system?', type: 'select', options: ['Basic sensors','Cameras','Monitored','Integrated smart locks'] },
            { id: 'safe_room', text: 'Safe room or storm shelter desired?', type: 'boolean' },
            { id: 'fire_safety', text: 'Fire safety concerns (materials, sprinklers)?', type: 'text' }
          ]
        },
        {
          key: 'energy_sustainability',
          label: 'Energy & Sustainability',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'hvac_pref', text: 'HVAC preference?', type: 'select', options: ['Conventional split','High efficiency heat pump','Radiant','Geothermal','No preference'] },
            { id: 'solar', text: 'Solar PV readiness or installation now?', type: 'select', options: ['None','Prewire only','Partial array','Full array'] },
            { id: 'battery_storage', text: 'Battery storage interest?', type: 'boolean' },
            { id: 'iaq', text: 'Indoor air quality priorities (ERV/HRV, filtration)?', type: 'text' },
            { id: 'envelope_goals', text: 'Envelope goals (insulation level, air sealing)?', type: 'text' },
            { id: 'water_heating', text: 'Water heating preference?', type: 'select', options: ['Tank','Tankless','Heat pump','Solar assisted','No preference'] }
          ]
        },
        {
          key: 'technology',
          label: 'Technology & Smart Home',
          mode: ['in_depth'],
          questions: [
            { id: 'networking', text: 'Networking needs (hardwired data, Wi‑Fi coverage, equipment closet)?', type: 'text' },
            { id: 'av', text: 'Audio/Video zones, media room, distributed audio?', type: 'text' },
            { id: 'controls', text: 'Smart controls (lights, shades, climate, security)?', type: 'text' }
          ]
        },
        {
          key: 'kitchen',
          label: 'Kitchen',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'kitchen_role', text: 'How central is the kitchen to daily life and entertaining?', type: 'text' },
            { id: 'kitchen_size_priority', text: 'Priority: spacious kitchen?', type: 'scale', min: 1, max: 5 },
            { id: 'appliances', text: 'Appliance preferences (range size/fuel, wall ovens, fridge/freezer config, ventilation)?', type: 'text' },
            { id: 'island', text: 'Island desired (seating, prep sink)?', type: 'text' },
            { id: 'pantry', text: 'Pantry preference (walk-in size, cabinet pantry)?', type: 'text' },
            { id: 'adjacencies', text: 'Adjacencies (dining, outdoor cooking, mudroom)?', type: 'text' },
            { id: 'specialty', text: 'Specialty zones (coffee, baking, scullery, second dishwasher)?', type: 'text' }
          ]
        },
        {
          key: 'living_dining',
          label: 'Living & Dining',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'living_style', text: 'Preferred living pattern (open concept vs defined rooms)?', type: 'text' },
            { id: 'formal_dining', text: 'Formal dining required?', type: 'boolean' },
            { id: 'fireplace', text: 'Fireplace preference (wood, gas, electric, none)?', type: 'text' },
            { id: 'ceiling_features', text: 'Ceiling features (vaulted, beams, tray)?', type: 'text' },
            { id: 'outdoor_connection', text: 'Connection to outdoor living (sliders, pocket doors)?', type: 'text' }
          ]
        },
        {
          key: 'primary_suite',
          label: 'Primary Suite',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'primary_location', text: 'Preferred location (main level vs upper)?', type: 'select', options: ['Main level','Upper','No preference'] },
            { id: 'primary_size', text: 'Desired bedroom size/feel?', type: 'text' },
            { id: 'primary_bath', text: 'Bath features (shower, tub, double vanity, WC privacy)?', type: 'text' },
            { id: 'primary_closets', text: 'Closet preferences (separate vs shared, sizes, island)?', type: 'text' },
            { id: 'acoustic', text: 'Acoustic privacy importance?', type: 'scale', min: 1, max: 5 }
          ]
        },
        {
          key: 'secondary_bedrooms',
          label: 'Secondary & Guest Bedrooms',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'secondary_count', text: 'Number of secondary bedrooms?', type: 'number', min: 0, max: 10 },
            { id: 'guest_suite', text: 'Guest suite with bath (location, privacy)?', type: 'text' },
            { id: 'kids_needs', text: 'Kids needs (study nook, shared bath vs ensuite)?', type: 'text' }
          ]
        },
        {
          key: 'bathrooms',
          label: 'Bathrooms',
          mode: ['in_depth'],
          questions: [
            { id: 'powder_bath', text: 'Powder bath location preference?', type: 'text' },
            { id: 'tub_vs_shower', text: 'Tub vs shower preferences per bath?', type: 'text' },
            { id: 'laundry_near_beds', text: 'Laundry near bedrooms vs mudroom?', type: 'text' }
          ]
        },
        {
          key: 'service_spaces',
          label: 'Service Spaces',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'mudroom', text: 'Mudroom features (lockers, bench, drop zone, pet wash)?', type: 'text' },
            { id: 'laundry', text: 'Laundry features (appliances, folding, hanging, sink)?', type: 'text' },
            { id: 'storage_general', text: 'General storage needs (seasonal, sports, bulk)?', type: 'text' }
          ]
        },
        {
          key: 'office_flex',
          label: 'Office, Flex & Specialty',
          mode: ['in_depth'],
          questions: [
            { id: 'office_need', text: 'Dedicated office(s) required?', type: 'number', min: 0, max: 3 },
            { id: 'office_specs', text: 'Office specs (acoustics, natural light, backdrop)?', type: 'text' },
            { id: 'media_room', text: 'Media room or acoustically isolated space?', type: 'boolean' },
            { id: 'home_gym', text: 'Home gym (equipment types, floor needs)?', type: 'text' },
            { id: 'maker_space', text: 'Workshop/maker space requirements?', type: 'text' }
          ]
        },
        {
          key: 'circulation_entry',
          label: 'Circulation & Entry',
          mode: ['in_depth'],
          questions: [
            { id: 'formal_entry', text: 'Formal entry/foyer desired?', type: 'boolean' },
            { id: 'stair_style', text: 'Stair style and placement preferences?', type: 'text' },
            { id: 'hallway_widths', text: 'Hallway width preferences?', type: 'text' }
          ]
        },
        {
          key: 'outdoor',
          label: 'Outdoor Living',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'outdoor_program', text: 'Outdoor program (patio, deck, balcony, kitchen, fire pit, pool/spa)?', type: 'text' },
            { id: 'sun_shade', text: 'Sun/shade preferences and seasonal use?', type: 'text' },
            { id: 'indoor_outdoor_flow', text: 'Doors and openings to enhance indoor/outdoor flow?', type: 'text' }
          ]
        },
        {
          key: 'envelope_windows',
          label: 'Windows, Doors & Glazing',
          mode: ['in_depth'],
          questions: [
            { id: 'glazing_ratio', text: 'Preferred glazing ratio and areas to emphasize?', type: 'text' },
            { id: 'window_types', text: 'Window types (casement, double-hung, fixed, sliders)?', type: 'text' },
            { id: 'doors', text: 'Door preferences (front door style, sliders, folding, pivot)?', type: 'text' },
            { id: 'shading_control', text: 'Shading & privacy strategies (overhangs, exterior shades, films)?', type: 'text' }
          ]
        },
        {
          key: 'roof_exterior',
          label: 'Roof & Exterior Materials',
          mode: ['in_depth'],
          questions: [
            { id: 'roof_type', text: 'Preferred roof types (gable, hip, flat/low-slope, shed)?', type: 'text' },
            { id: 'roof_material', text: 'Roof material preferences (shingle, tile, metal, membrane)?', type: 'text' },
            { id: 'facade', text: 'Facade materials (brick, stucco, siding, stone, panels)?', type: 'text' },
            { id: 'maintenance', text: 'Maintenance tolerance for exterior materials?', type: 'text' }
          ]
        },
        {
          key: 'structure_spans',
          label: 'Structure & Spans',
          mode: ['in_depth'],
          questions: [
            { id: 'large_spans', text: 'Desire for large open spans (great room, clearstory)?', type: 'text' },
            { id: 'column_tolerance', text: 'Tolerance for columns/beams vs hidden structure?', type: 'text' }
          ]
        },
        {
          key: 'budget_tradeoffs',
          label: 'Budget & Trade-offs',
          mode: ['summary','in_depth'],
          questions: [
            { id: 'must_haves', text: 'Top 5 must-have features?', type: 'text' },
            { id: 'nice_to_haves', text: 'Nice-to-haves that could be value-engineered?', type: 'text' },
            { id: 'splurge_vs_save', text: 'Where to splurge vs save?', type: 'text' }
          ]
        },
        {
          key: 'timeline_phasing',
          label: 'Timeline & Phasing',
          mode: ['in_depth'],
          questions: [
            { id: 'phasing', text: 'Any phasing needed (finish spaces later, shell-only areas)?', type: 'text' },
            { id: 'move_in_date', text: 'Critical move-in date or constraints?', type: 'text' }
          ]
        },
        {
          key: 'contractor_preferences',
          label: 'Contractor & Delivery Preferences',
          mode: ['in_depth'],
          questions: [
            { id: 'delivery', text: 'Delivery method preference (design-bid-build, design-build, CM-at-risk)?', type: 'text' },
            { id: 'contractor_involvement', text: 'Early contractor involvement desired?', type: 'boolean' }
          ]
        },
        {
          key: 'materials_finishes',
          label: 'Materials & Finishes',
          mode: ['in_depth'],
          questions: [
            { id: 'interior_style', text: 'Interior style/finish preferences (palette, textures)?', type: 'text' },
            { id: 'durability', text: 'Durability requirements (kids, pets, rental)?', type: 'text' },
            { id: 'maintenance_finishes', text: 'Low-maintenance finish preferences?', type: 'text' }
          ]
        },
        {
          key: 'health_iaq',
          label: 'Health & Indoor Air Quality',
          mode: ['in_depth'],
          questions: [
            { id: 'allergies', text: 'Allergies or sensitivities affecting materials/ventilation?', type: 'text' },
            { id: 'humidification', text: 'Humidification/dehumidification needs?', type: 'text' }
          ]
        },
        {
          key: 'future_expansion',
          label: 'Future Expansion',
          mode: ['in_depth'],
          questions: [
            { id: 'future_wing', text: 'Plan for future additions (bedrooms, garage, ADU)?', type: 'text' },
            { id: 'unfinished_spaces', text: 'Unfinished spaces now to complete later (bonus, basement)?', type: 'text' }
          ]
        }
      ]
    },
    'Knowledge base for architecture interview (expanded)',
    { version: 2, type: 'questions', tags: ['architecture','interview','exhaustive'] }
  );
  console.log('Knowledge base seeded.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


