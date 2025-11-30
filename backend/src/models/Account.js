const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    fullName: { type: String, default: '' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    invitedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SubscriptionSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['active', 'canceled', 'inactive', 'past_due'], default: 'active' },
    planId: { type: String, enum: ['basic', 'guide', 'ai_assurance'], default: 'basic' },
    startedAt: { type: Date, default: () => new Date() },
    currentPeriodEnd: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  },
  { _id: false }
);

const AccountSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    primaryEmail: { type: String, required: true, lowercase: true, unique: true, index: true }, // owner email
    members: [MemberSchema],
    subscription: { type: SubscriptionSchema, default: () => ({}) }, // legacy single-subscription
    subscriptions: [
      new mongoose.Schema(
        {
          homeId: { type: String, required: true, index: true },
          homeName: { type: String, default: '' },
          planId: { type: String, enum: ['guide', 'ai_assurance'], required: true },
          status: { type: String, enum: ['active', 'canceled', 'inactive', 'past_due'], default: 'active' },
          startedAt: { type: Date, default: () => new Date() },
          currentPeriodEnd: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        { _id: false }
      ),
    ],
  },
  { timestamps: true }
);

const Account = mongoose.model('Account', AccountSchema);

module.exports = { Account };


