const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const PhaseKeyEnum = ['planning', 'preconstruction', 'exterior', 'interior'];

const PersonLiteSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    url: { type: String, required: true },
    s3Key: { type: String },
    fileName: { type: String, default: '' },
    category: { type: String, default: 'other' }, // e.g. contract | bid | invoice | picture | permit | architecture_*
    version: { type: Number, default: 1 }, // versioning for architecture docs
    isFinal: { type: Boolean, default: false }, // whether this version is marked final (per category)
    analysis: {
      houseType: { type: String, default: '' },
      roofType: { type: String, default: '' },
      exteriorType: { type: String, default: '' },
      address: { type: String, default: '' },
      totalSqFt: { type: Number, default: 0 },
      projectInfo: {
        address: String,
        totalSqFt: Number,
        houseType: String,
        roofType: String,
        exteriorType: String
      },
      raw: { type: String, default: '' },
      analyzed: { type: Boolean, default: false },
      suggestions: [{ type: String }],
      suggestedTasks: [
        {
          title: { type: String, default: '' },
          description: { type: String, default: '' },
          phaseKey: { type: String, enum: ['planning', 'preconstruction', 'exterior', 'interior'], default: 'planning' },
          _id: false,
        }
      ],
      // New enriched sections
      roomAnalysis: [
        {
          _id: false,
          name: { type: String, default: '' },
          level: { type: String, default: '' }, // e.g., ground, first, basement
          areaSqFt: { type: Number, default: 0 },
          dimensions: {
            lengthFt: { type: Number, default: 0 },
            widthFt: { type: Number, default: 0 },
          },
          windows: { type: Number, default: 0 },
          doors: { type: Number, default: 0 },
          notes: { type: String, default: '' },
        }
      ],
      costAnalysis: {
        summary: { type: String, default: '' },
        highImpactItems: [
          {
            _id: false,
            item: { type: String, default: '' },
            rationale: { type: String, default: '' },
            estCostImpact: { type: String, default: '' }, // e.g., +$5k, -$2k, or qualitative
          }
        ],
        valueEngineeringIdeas: [
          {
            _id: false,
            idea: { type: String, default: '' },
            estSavings: { type: String, default: '' }, // e.g., ~$3k
            trade: { type: String, default: '' },
          }
        ],
      },
      accessibilityComfort: {
        metrics: {
          avgDoorWidthIn: { type: Number, default: 0 },
          minHallwayWidthIn: { type: Number, default: 0 },
          bathroomTurnRadiusIn: { type: Number, default: 0 },
          stepFreeEntries: { type: Number, default: 0 },
          naturalLightScore: { type: Number, default: 0 }, // 0-100
          thermalZoningScore: { type: Number, default: 0 }, // 0-100
        },
        issues: [
          {
            _id: false,
            area: { type: String, default: '' },
            issue: { type: String, default: '' },
            severity: { type: String, default: '' }, // low | medium | high
            recommendation: { type: String, default: '' },
          }
        ],
      },
      optimizationSuggestions: [
        {
          _id: false,
          title: { type: String, default: '' },
          description: { type: String, default: '' },
          impact: { type: String, default: '' }, // low | medium | high
        }
      ],
      feedback: {
        summary: { type: String, default: '' },
        matches: [{ type: String }],
        mismatches: [{ type: String }],
        suggestions: [{ type: String }]
      },
      analyzedAt: { type: Date },
    },
    uploadedBy: {
      email: { type: String, default: '' },
      fullName: { type: String, default: '' },
    },
    pinnedTo: {
      type: {
        type: String,
        enum: ['trade', 'task', 'home'],
        default: 'home',
      },
      id: { type: String }, // tradeId or taskId
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TaskSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    description: { type: String },
    phaseKey: { type: String, enum: PhaseKeyEnum, required: true },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'blocked', 'done'],
      default: 'todo',
    },
    completedBy: { type: String }, // email or name
    completedAt: { type: Date },
    dueDate: { type: Date },
    assignee: { type: String },
    dependsOn: [
      {
        tradeId: { type: String, required: true },
        taskId: { type: String, required: true },
        _id: false
      }
    ],
    checklist: [
      {
        _id: { type: String, default: uuidv4 },
        label: String,
        done: { type: Boolean, default: false },
      },
    ],
    comments: [
      {
        _id: { type: String, default: uuidv4 },
        author: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);

const TradeContactSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    company: { type: String, default: '' },
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const TradeSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    name: { type: String, required: true }, // e.g. Electrical, Plumbing, HVAC
    category: { type: String }, // free-form or controlled by UI
    // optional base key to derive prompts by action, e.g., 'bid.trade.electrical'
    promptBaseKey: { type: String, default: '' },
    phaseKeys: [{ type: String, enum: PhaseKeyEnum, required: true }],
    vendor: {
      name: String,
      contactName: String,
      phone: String,
      email: String,
    },
    contacts: [TradeContactSchema],
    contractSignedAt: { type: Date },
    totalPrice: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    plannedCostRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      _id: false
    },
    planningSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    additionalCosts: [
      {
        _id: { type: String, default: uuidv4 },
        label: String,
        amount: Number,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    qualityChecks: [
      {
        _id: { type: String, default: uuidv4 },
        phaseKey: { type: String, enum: PhaseKeyEnum, required: true },
        title: { type: String, required: true },
        notes: { type: String },
        accepted: { type: Boolean, default: false },
        acceptedBy: { type: String },
        acceptedAt: { type: Date },
      },
    ],
    invoices: [
      {
        _id: { type: String, default: uuidv4 },
        label: String,
        amount: Number,
        dueDate: { type: Date },
        paid: { type: Boolean, default: false },
        paidAt: { type: Date },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tasks: [TaskSchema],
    notes: String,
    attachments: [DocumentSchema],
    changeLog: [
      {
        _id: { type: String, default: uuidv4 },
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        changedBy: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);

const PlanningStepSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    dueDate: { type: Date },
    assignee: { type: String, default: '' },
  },
  { _id: false }
);

const PlanningSectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
    steps: [PlanningStepSchema],
    notes: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ScheduleSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    location: { type: String },
    bidId: { type: String },
    taskId: { type: String },
  },
  { _id: false }
);

const ParticipantSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: '' },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    role: { type: String, default: '' }, // e.g., owner, builder, designer, coordinator
    permission: { type: String, enum: ['admin', 'write', 'read'], default: 'read' },
  },
  { _id: false }
);

const HomeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    // Deprecated fields (no longer used): clientName, client, monitors, builder
    clientName: { type: String },
    client: { type: PersonLiteSchema },
    monitors: [PersonLiteSchema],
    builder: { type: PersonLiteSchema },
    participants: [ParticipantSchema],
    subscription: {
      planId: { type: String, default: '' }, // e.g., guide, ai_assurance
      status: { type: String, enum: ['active', 'canceled', 'inactive', 'past_due', ''], default: '' }
    },
    phases: [
      {
        key: { type: String, enum: PhaseKeyEnum, required: true },
        notes: String,
      },
    ],
    // Primary field going forward
    trades: [TradeSchema],
    // Back-compat field for older documents (read-only usage in controllers)
    bids: [TradeSchema],
    // Cross-trade planning tracked at the root (outside individual trades)
    planning: {
      architecture: {
        type: PlanningSectionSchema,
        default: { title: 'Architecture Planning', status: 'todo', steps: [], notes: '' },
      },
      windows_doors: {
        type: PlanningSectionSchema,
        default: { title: 'Windows & Doors Planning', status: 'todo', steps: [], notes: '' },
      },
      hardwood_tiles: {
        type: PlanningSectionSchema,
        default: { title: 'Hardwood & Tiles Planning', status: 'todo', steps: [], notes: '' },
      },
      electrical: {
        type: PlanningSectionSchema,
        default: { title: 'Electrical Planning', status: 'todo', steps: [], notes: '' },
      },
      plumbing: {
        type: PlanningSectionSchema,
        default: { title: 'Plumbing Planning', status: 'todo', steps: [], notes: '' },
      },
      drywall_paint: {
        type: PlanningSectionSchema,
        default: { title: 'Drywall & Paint Planning', status: 'todo', steps: [], notes: '' },
      },
      hvac: {
        type: PlanningSectionSchema,
        default: { title: 'HVAC Planning', status: 'todo', steps: [], notes: '' },
      },
      insulation: {
        type: PlanningSectionSchema,
        default: { title: 'Insulation Planning', status: 'todo', steps: [], notes: '' },
      },
      exterior_materials: {
        type: PlanningSectionSchema,
        default: { title: 'Exterior Materials Planning', status: 'todo', steps: [], notes: '' },
      },
      countertops: {
        type: PlanningSectionSchema,
        default: { title: 'Countertops Planning', status: 'todo', steps: [], notes: '' },
      },
    },
    schedules: [ScheduleSchema],
    documents: [DocumentSchema],
    // Optional freeform homeowner requirements used to guide analysis
    requirements: { type: String, default: '' },
    // New: structured list of homeowner requirements
    requirementsList: [
      {
        _id: { type: String, default: uuidv4 },
        text: { type: String, required: true },
        tags: [{ type: String }],
        category: { type: String, default: '' }, // optional primary category
        priority: { type: String, enum: ['must', 'should', 'nice', ''], default: '' },
        source: { type: mongoose.Schema.Types.Mixed, default: null }, // e.g., { type: 'manual'|'paste'|'interview'|'analysis'|'doc', refId, note }
        createdAt: { type: Date, default: Date.now },
      }
    ],
    // Structured interview answers for architecture planning (dynamic Q&A)
    requirementsInterview: { type: mongoose.Schema.Types.Mixed, default: null },
    // Flooring selections per room (free-form structure managed by UI)
    flooring: { type: mongoose.Schema.Types.Mixed, default: null },
    // Windows & Doors planning selections and counts
    windowsDoors: { type: mongoose.Schema.Types.Mixed, default: null },
    // Appliances planning selections
    appliances: { type: mongoose.Schema.Types.Mixed, default: null },
    // Cabinets planning selections
    cabinets: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const Home = mongoose.model('Home', HomeSchema);

module.exports = { Home, PhaseKeyEnum };


