/**
 * Development / demo seed script.
 *
 * Run with:  npm run seed   (from backend/ directory)
 *
 * Drops all existing data for the seed user and populates:
 *  - 1 demo user
 *  - 5 clients
 *  - 4 projects
 *  - 3 proposals
 *  - 3 invoices
 *  - 3 calendar events
 */

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/soloflow';

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const db = mongoose.connection.db!;

  // ── Collections ──
  const users = db.collection('users');
  const clients = db.collection('clients');
  const projects = db.collection('projects');
  const proposals = db.collection('proposals');
  const invoices = db.collection('invoices');
  const calendar = db.collection('calendarevents');
  const activities = db.collection('activities');

  // Remove previous seed data for the demo user
  const existing = await users.findOne({ email: 'demo@soloflow.com' });
  if (existing) {
    const uid = existing._id;
    await Promise.all([
      clients.deleteMany({ userId: uid }),
      projects.deleteMany({ userId: uid }),
      proposals.deleteMany({ userId: uid }),
      invoices.deleteMany({ userId: uid }),
      calendar.deleteMany({ userId: uid }),
      activities.deleteMany({ userId: uid }),
      users.deleteOne({ _id: uid }),
    ]);
    console.log('🗑  Removed previous seed data');
  }

  // ── Demo User ──
  const passwordHash = await bcrypt.hash('demo123', 12);
  const userResult = await users.insertOne({
    name: 'Demo User',
    email: 'demo@soloflow.com',
    passwordHash,
    businessName: 'Demo Design Studio',
    currency: 'USD',
    plan: 'pro',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const userId = userResult.insertedId;
  console.log('👤 Created demo user: demo@soloflow.com / demo123');

  // ── Clients ──
  const now = new Date();
  const clientDocs = [
    { name: 'Acme Corporation', company: 'acme.com', email: 'contact@acme.com', phone: '+1 (888) 123-4567', website: 'https://acme.com', status: 'Active', tier: 'Enterprise', country: 'US', notes: 'Key long-term client. Prefers modern design.' },
    { name: 'Bright Labs', company: 'brightlabs.io', email: 'hello@brightlabs.io', phone: '+1 (415) 555-0192', website: 'https://brightlabs.io', status: 'Active', tier: 'Startup', country: 'US', notes: 'Fast-paced team. Weekly syncs preferred.' },
    { name: 'Visionary Studios', company: 'visionary.com', email: 'hi@visionary.com', phone: '+1 (310) 555-4321', website: 'https://visionary.com', status: 'Active', tier: 'SMB', country: 'US', notes: '' },
    { name: 'Nova Labs', company: 'novalabs.io', email: 'team@novalabs.io', website: 'https://novalabs.io', status: 'Lead', tier: 'Startup', country: 'US', notes: '' },
    { name: 'Zenith Studios', company: 'zenith.com', email: 'team@zenith.com', website: 'https://zenith.com', status: 'Active', tier: 'Startup', country: 'US', notes: '' },
  ].map(c => ({ ...c, userId, phone: c.phone || '', address: '', createdAt: now, updatedAt: now }));

  const clientRes = await clients.insertMany(clientDocs);
  const [acmeId, brightId, visionaryId, novaId, zenithId] = Object.values(clientRes.insertedIds);
  console.log('🏢 Created 5 clients');

  // ── Projects ──
  const projectDocs = [
    {
      userId,
      clientId: acmeId,
      title: 'Mobile App UI Design',
      description: 'Complete UI/UX overhaul for the Acme mobile application.',
      budget: 4850,
      priority: 'High',
      status: 'In Progress',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      tags: ['design', 'mobile'],
      tasks: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      clientId: brightId,
      title: 'Brand Identity Redesign',
      description: 'Logo, typography, and full brand guidelines refresh.',
      budget: 3200,
      priority: 'Medium',
      status: 'To Do',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      tags: ['branding'],
      tasks: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      clientId: visionaryId,
      title: 'Marketing Website',
      description: 'Responsive landing page and product pages.',
      budget: 5500,
      priority: 'High',
      status: 'In Progress',
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      tags: ['web', 'design'],
      tasks: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      clientId: zenithId,
      title: 'E-commerce Website',
      description: 'Full Shopify store with custom theme development.',
      budget: 6200,
      priority: 'Urgent',
      status: 'Completed',
      deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      tags: ['web', 'ecommerce'],
      tasks: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const projectRes = await projects.insertMany(projectDocs);
  const [proj1Id, , proj3Id] = Object.values(projectRes.insertedIds);
  console.log('📁 Created 4 projects');

  // ── Proposals ──
  const proposalDocs = [
    {
      userId,
      proposalNumber: 'PROP-2024-001',
      clientId: acmeId,
      projectId: proj1Id,
      title: 'Proposal for Acme Corporation',
      amount: 4850,
      status: 'Sent',
      tone: 'Professional',
      overview: 'This proposal outlines the UI/UX design services for the Acme mobile application.',
      scopeOfWork: ['User Research & Analysis', 'Wireframes & User Flows', 'High-Fidelity UI Design', 'Interactive Prototypes', 'Design System & Style Guide'],
      deliverables: ['Complete UI Design Files (Figma)', 'Interactive Prototype', 'Design System & Assets', 'Handoff Documentation'],
      timeline: 'Estimated project duration: 3–4 weeks from project kickoff.',
      investment: 'Total Project Cost: $4,850 USD. Payment Terms: 50% upfront, 50% upon completion.',
      terms: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      proposalNumber: 'PROP-2024-002',
      clientId: visionaryId,
      projectId: proj3Id,
      title: 'Proposal for Visionary Studios',
      amount: 5500,
      status: 'Accepted',
      tone: 'Professional',
      overview: 'Marketing website development with responsive design and CMS integration.',
      scopeOfWork: ['Discovery & Requirements', 'UX Design & Wireframes', 'Frontend Development', 'CMS Integration', 'Testing & Launch'],
      deliverables: ['Fully responsive website', 'CMS setup', 'SEO foundations', '30-day support'],
      timeline: 'Estimated Delivery: 4–5 weeks from project kickoff.',
      investment: 'Total Project Cost: $5,500. Payment Terms: 50% upfront, 50% on delivery.',
      terms: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      proposalNumber: 'PROP-2024-003',
      clientId: novaId,
      title: 'Proposal for Nova Labs',
      amount: 3800,
      status: 'Draft',
      tone: 'Friendly',
      overview: 'Consultation and prototype development for AI interface exploration.',
      scopeOfWork: ['Product Discovery', 'User Journey Mapping', 'Prototype Development', 'Usability Testing'],
      deliverables: ['Clickable Prototype', 'Research Report', 'Next Steps Roadmap'],
      timeline: 'Estimated Delivery: 2–3 weeks.',
      investment: 'Total Project Cost: $3,800. Payment Terms: 100% upfront for discovery phase.',
      terms: '',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await proposals.insertMany(proposalDocs);
  console.log('📄 Created 3 proposals');

  // ── Invoices ──
  const invoiceDocs = [
    {
      userId,
      invoiceNumber: 'INV-2024-001',
      clientId: acmeId,
      projectId: proj1Id,
      issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'Sent',
      items: [{ description: 'UI Design — Phase 1 Milestone', quantity: 1, unitPrice: 2425, amount: 2425 }],
      subtotal: 2425,
      taxRate: 0,
      taxAmount: 0,
      total: 2425,
      currency: 'USD',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      invoiceNumber: 'INV-2024-002',
      clientId: visionaryId,
      projectId: proj3Id,
      issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'Paid',
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      items: [{ description: 'Marketing Website — Deposit (50%)', quantity: 1, unitPrice: 2750, amount: 2750 }],
      subtotal: 2750,
      taxRate: 0,
      taxAmount: 0,
      total: 2750,
      currency: 'USD',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      invoiceNumber: 'INV-2024-003',
      clientId: zenithId,
      issueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      status: 'Overdue',
      items: [{ description: 'E-commerce Development — Final Payment', quantity: 1, unitPrice: 3100, amount: 3100 }],
      subtotal: 3100,
      taxRate: 0,
      taxAmount: 0,
      total: 3100,
      currency: 'USD',
      notes: 'Please process payment at your earliest convenience.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await invoices.insertMany(invoiceDocs);
  console.log('🧾 Created 3 invoices');

  // ── Calendar Events ──
  await calendar.insertMany([
    {
      userId,
      title: 'Kickoff Call — Bright Labs',
      clientName: 'Bright Labs',
      clientId: brightId,
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      type: 'meeting',
      description: 'Initial project kickoff and requirements gathering.',
      completed: false,
      sourceType: 'manual',
      createdAt: now,
      updatedAt: now,
    },
    {
      userId,
      title: 'Design Review — Acme Corp',
      clientName: 'Acme Corporation',
      clientId: acmeId,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: 'milestone',
      description: 'Present first-round design concepts.',
      completed: false,
      sourceType: 'manual',
      createdAt: now,
      updatedAt: now,
    },
  ]);
  console.log('📅 Created 2 calendar events');

  await mongoose.disconnect();
  console.log('\n✅ Seed complete! Log in with: demo@soloflow.com / demo123\n');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
