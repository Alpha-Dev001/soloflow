/**
 * Development seed script — client-centered architecture.
 *
 * Run with:  npm run seed   (from backend/ directory)
 *
 * The core seeding logic is exported as `runSeed(db)` so the dev-only
 * POST /api/seed/reset endpoint can reuse it without duplicating anything.
 *
 * RESETS the development database (the MONGODB_URI in backend/.env) and
 * populates a controlled dataset that follows the client-centered model:
 *
 *  demo@soloflow.com / demo123 (Pro freelancer)
 *  ├── Acme Ltd
 *  │    ├── Website Redesign (project)
 *  │    ├── Website Proposal (proposal → project)
 *  │    ├── INV-2026-001 (Paid, → project)
 *  │    └── INV-2026-002 (Sent)
 *  └── Kigali Tech
 *       ├── Mobile App (project)
 *       ├── Mobile App Proposal (proposal)
 *       └── INV-2026-003 (Overdue)
 *
 *  other@soloflow.com / other123 — isolation-test user with their own client,
 *  used to verify cross-user access is impossible.
 *
 *  admin@soloflow.com / admin123 — platform admin.
 */

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/soloflow';

export async function runSeed(db: mongoose.mongo.Db): Promise<void> {
  // ── Collections ──
  const users = db.collection('users');
  const clients = db.collection('clients');
  const projects = db.collection('projects');
  const proposals = db.collection('proposals');
  const invoices = db.collection('invoices');
  const calendar = db.collection('calendarevents');
  const activities = db.collection('activities');

  // ── FULL DEVELOPMENT RESET ──
  // This script only ever runs against the development database configured
  // in backend/.env. Take a snapshot first with `npm run backup`.
  await Promise.all([
    clients.deleteMany({}),
    projects.deleteMany({}),
    proposals.deleteMany({}),
    invoices.deleteMany({}),
    calendar.deleteMany({}),
    activities.deleteMany({}),
  ]);
  await Promise.all([
    users.deleteMany({ email: 'demo@soloflow.com' }),
    users.deleteMany({ email: 'admin@soloflow.com' }),
    users.deleteMany({ email: 'other@soloflow.com' }),
  ]);
  console.log('🗑  Development collections cleared');

  const now = new Date();
  const year = now.getFullYear();
  const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
  // First day of `offsetMonths` months ago (keeps paidAt inside the dashboard's
  // 6-month rolling window described in dashboard.service).
  const pastMonth = (offsetMonths: number, day = 15) =>
    new Date(now.getFullYear(), now.getMonth() - offsetMonths, day, 12, 0, 0);

  // ══ Users ══
  const passwordHash = await bcrypt.hash('demo123', 12);
  const userResult = await users.insertOne({
    name: 'Demo User',
    email: 'demo@soloflow.com',
    passwordHash,
    businessName: 'Demo Design Studio',
    currency: 'USD',
    role: 'USER',
    plan: 'pro',
    subscriptionStatus: 'active',
    accountStatus: 'active',
    createdAt: now,
    updatedAt: now,
  });
  const userId = userResult.insertedId;
  console.log('👤 Created demo user: demo@soloflow.com / demo123 (Pro)');

  const otherHash = await bcrypt.hash('other123', 12);
  const otherResult = await users.insertOne({
    name: 'Other Freelancer',
    email: 'other@soloflow.com',
    passwordHash: otherHash,
    businessName: 'Other Studio',
    currency: 'USD',
    role: 'USER',
    plan: 'pro',
    subscriptionStatus: 'active',
    accountStatus: 'active',
    createdAt: now,
    updatedAt: now,
  });
  const otherUserId = otherResult.insertedId;
  console.log('👤 Created isolation-test user: other@soloflow.com / other123');

  const adminHash = await bcrypt.hash('admin123', 12);
  await users.insertOne({
    name: 'SoloFlow Admin',
    email: 'admin@soloflow.com',
    passwordHash: adminHash,
    businessName: 'SoloFlow',
    currency: 'USD',
    role: 'ADMIN',
    plan: 'pro',
    subscriptionStatus: 'active',
    accountStatus: 'active',
    createdAt: now,
    updatedAt: now,
  });
  console.log('🛡  Created admin user: admin@soloflow.com / admin123');

  // Pro subscription for the demo user
  const subscriptions = db.collection('subscriptions');
  await subscriptions.deleteMany({ userId });
  await subscriptions.insertOne({
    userId,
    plan: 'pro',
    status: 'active',
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    provider: 'seed',
    providerReference: 'demo_pro',
    previousPlan: 'free',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // ══ Clients ══
  const clientRes = await clients.insertMany([
    {
      userId,
      name: 'Acme Ltd',
      company: 'acme-ltd.com',
      email: 'contact@acmeltd.com',
      phone: '+1 (888) 123-4567',
      website: 'https://acme-ltd.com',
      address: '',
      status: 'Active',
      tier: 'Enterprise',
      country: 'US',
      notes: 'Key long-term client. Prefers modern design and weekly summaries.',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      name: 'Kigali Tech',
      company: 'kigalitech.rw',
      email: 'hello@kigalitech.rw',
      phone: '+250 788 000 111',
      website: 'https://kigalitech.rw',
      address: '',
      status: 'Active',
      tier: 'Startup',
      country: 'RW',
      notes: 'Fast-moving startup. Invoice via bank transfer.',
      createdAt: now,
      updatedAt: now,
    },
    {
      // Isolation-test data — belongs to the OTHER user, must never leak
      userId: otherUserId,
      name: 'Other Client Co',
      company: 'otherclient.com',
      email: 'team@otherclient.com',
      phone: '',
      website: '',
      address: '',
      status: 'Active',
      tier: 'SMB',
      country: 'US',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const [acmeId, kigaliId] = [clientRes.insertedIds[0], clientRes.insertedIds[1]];
  console.log('🏢 Created 3 clients (2 for demo, 1 for isolation test)');

  // ══ Projects ══
  const projectRes = await projects.insertMany([
    {
      userId,
      clientId: acmeId,
      title: 'Website Redesign',
      description: 'Full redesign of the Acme marketing website with a modern design system.',
      budget: 4850,
      priority: 'High',
      status: 'In Progress',
      deadline: days(14),
      tags: ['design', 'web'],
      tasks: [],
      createdAt: pastMonth(1, 5),
      updatedAt: now,
    },
    {
      userId,
      clientId: kigaliId,
      title: 'Mobile App',
      description: 'Cross-platform mobile app for Kigali Tech customers.',
      budget: 6200,
      priority: 'Medium',
      status: 'To Do',
      deadline: days(30),
      tags: ['mobile'],
      tasks: [],
      createdAt: pastMonth(0, 8),
      updatedAt: now,
    },
    {
      // Isolation-test data for the OTHER user
      userId: otherUserId,
      clientId: clientRes.insertedIds[2],
      title: 'Secret Project',
      description: 'Must never be visible to the demo user.',
      budget: 9999,
      priority: 'Urgent',
      status: 'In Progress',
      deadline: days(10),
      tags: [],
      tasks: [],
      createdAt: now,
      updatedAt: now,
    },
  ]);
  const acmeProjectId = projectRes.insertedIds[0];
  console.log('📁 Created 3 projects (2 for demo, 1 for isolation test)');

  // ══ Proposals ══
  await proposals.insertMany([
    {
      userId,
      proposalNumber: `PROP-${year}-001`,
      clientId: acmeId,
      projectId: acmeProjectId,
      title: 'Website Redesign Proposal',
      amount: 4850,
      status: 'Accepted',
      tone: 'Professional',
      overview:
        'A complete overhaul of the Acme marketing site — modern visuals, faster load times and a conversion-focused structure.',
      scopeOfWork: ['Discovery & wireframes', 'Visual design', 'Front-end build', 'Launch support'],
      deliverables: ['Figma design files', 'Responsive build', 'CMS setup'],
      timeline: '4 weeks',
      investment: '$4,850',
      terms: '50% upfront, 50% on delivery.',
      createdAt: pastMonth(1, 3),
      updatedAt: pastMonth(1, 6),
    },
    {
      userId,
      proposalNumber: `PROP-${year}-002`,
      clientId: kigaliId,
      title: 'Mobile App Proposal',
      amount: 6200,
      status: 'Sent',
      tone: 'Professional',
      overview: 'Cross-platform mobile app covering onboarding, payments and push notifications.',
      scopeOfWork: ['UX flows', 'UI kit', 'React Native build'],
      deliverables: ['iOS & Android builds', 'App store submission'],
      timeline: '6 weeks',
      investment: '$6,200',
      terms: '40% upfront, milestones billed bi-weekly.',
      createdAt: pastMonth(0, 7),
      updatedAt: pastMonth(0, 9),
    },
  ]);
  console.log('📄 Created 2 proposals');

  // ══ Invoices ══
  await invoices.insertMany([
    {
      userId,
      invoiceNumber: `INV-${year}-001`,
      clientId: acmeId,
      projectId: acmeProjectId,
      issueDate: pastMonth(1, 10),
      dueDate: pastMonth(1, 24),
      status: 'Paid',
      paidAt: pastMonth(1, 22),
      items: [{ description: 'Website Redesign — Milestone 1', quantity: 1, unitPrice: 2425, amount: 2425 }],
      subtotal: 2425,
      taxRate: 0,
      taxAmount: 0,
      total: 2425,
      currency: 'USD',
      notes: '',
      createdAt: pastMonth(1, 10),
      updatedAt: pastMonth(1, 22),
    },
    {
      userId,
      invoiceNumber: `INV-${year}-002`,
      clientId: acmeId,
      projectId: acmeProjectId,
      issueDate: days(-3),
      dueDate: days(14),
      status: 'Sent',
      items: [{ description: 'Website Redesign — Final Payment', quantity: 1, unitPrice: 2425, amount: 2425 }],
      subtotal: 2425,
      taxRate: 0,
      taxAmount: 0,
      total: 2425,
      currency: 'USD',
      notes: 'Payment due within 14 days.',
      createdAt: days(-3),
      updatedAt: days(-3),
    },
    {
      userId,
      invoiceNumber: `INV-${year}-003`,
      clientId: kigaliId,
      issueDate: days(-45),
      dueDate: days(-15),
      status: 'Overdue',
      items: [{ description: 'Mobile App — Discovery Phase', quantity: 1, unitPrice: 1500, amount: 1500 }],
      subtotal: 1500,
      taxRate: 0,
      taxAmount: 0,
      total: 1500,
      currency: 'USD',
      notes: 'Please process payment at your earliest convenience.',
      createdAt: days(-45),
      updatedAt: days(-15),
    },
  ]);
  console.log('🧾 Created 3 invoices');

  // ══ Calendar Events ══
  await calendar.insertMany([
    {
      userId,
      title: 'Kickoff Call — Kigali Tech',
      clientName: 'Kigali Tech',
      clientId: kigaliId,
      date: days(3),
      type: 'meeting',
      description: 'Initial project kickoff and requirements gathering.',
      completed: false,
      sourceType: 'manual',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      title: 'Design Review — Acme Ltd',
      clientName: 'Acme Ltd',
      clientId: acmeId,
      date: days(7),
      type: 'milestone',
      description: 'Present first-round design concepts.',
      completed: false,
      sourceType: 'manual',
      createdAt: now,
      updatedAt: now,
    },
  ]);
  console.log('📅 Created 2 calendar events');

  // ══ Activities ══
  await activities.insertMany([
    { userId, type: 'client_added', title: 'Client Acme Ltd', subtitle: 'added', iconType: 'client', timestamp: pastMonth(1, 1) },
    { userId, type: 'project_created', title: 'Project "Website Redesign"', subtitle: 'created for Acme Ltd', iconType: 'project', timestamp: pastMonth(1, 5) },
    { userId, type: 'proposal_accepted', title: `Proposal PROP-${year}-001`, subtitle: 'accepted by Acme Ltd', iconType: 'proposal', timestamp: pastMonth(1, 6) },
    { userId, type: 'invoice_paid', title: `Invoice INV-${year}-001`, subtitle: 'Paid by Acme Ltd', iconType: 'check', timestamp: pastMonth(1, 22) },
    { userId, type: 'client_added', title: 'Client Kigali Tech', subtitle: 'added', iconType: 'client', timestamp: pastMonth(0, 6) },
    { userId, type: 'project_created', title: 'Project "Mobile App"', subtitle: 'created for Kigali Tech', iconType: 'project', timestamp: pastMonth(0, 8) },
  ]);
  console.log('⚡ Created 6 activities');

  // ══ Sanity-check relationships ══
  const counts = {
    clients: await clients.countDocuments({ userId }),
    projects: await projects.countDocuments({ userId }),
    proposals: await proposals.countDocuments({ userId }),
    invoices: await invoices.countDocuments({ userId }),
    isolatedClient: await clients.countDocuments({ userId: otherUserId }),
    isolatedProjects: await projects.countDocuments({ userId: otherUserId }),
  };
  console.log('\n🔍 Relationship verification:');
  console.log('  demo   clients:', counts.clients, '| projects:', counts.projects, '| proposals:', counts.proposals, '| invoices:', counts.invoices);
  console.log('  other  clients:', counts.isolatedClient, '| projects:', counts.isolatedProjects);

  await mongoose.disconnect();
  console.log('\n✅ Seed complete! Log in with: demo@soloflow.com / demo123\n');
}

/** Standalone CLI entry point: `npm run seed`. */
async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected:', MONGODB_URI);

  try {
    await runSeed(mongoose.connection.db!);
  } finally {
    await mongoose.disconnect();
  }
}

// Only run the CLI seeding when executed directly (not when imported).
if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
