/**
 * Comprehensive development seed script — client-centered architecture.
 *
 * Run with:  npm run seed   (from backend/ directory)
 *
 * Creates ONE dedicated demo user with 20 clients and realistic relational data.
 * Safe to run repeatedly — only clears/recreates the demo user's data.
 *
 * DEMO LOGIN
 * Email:    demo@soloflow.local
 * Password: SoloFlowDemo123!
 */

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/soloflow';

/* ── Helpers ── */
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

/** Days from today (negative = past, positive = future) */
const days = (n: number) => new Date(now.getTime() + n * 86400000);

/** Months ago (day defaults to 15) */
const monthsAgo = (m: number, d = 15) =>
  new Date(year, month - m, d, 12, 0, 0);

/** Months from now */
const monthsFrom = (m: number, d = 15) =>
  new Date(year, month + m, d, 12, 0, 0);

let invSeq = 0;
const nextInv = () => `INV-${year}-${String(++invSeq).padStart(3, '0')}`;

/* ══ Client definitions ══ */
interface ClientDef {
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  status: 'Active' | 'Lead' | 'Inactive';
  tier: 'Enterprise' | 'Startup' | 'SMB';
  country: string;
  notes: string;
  monthsOld: number; // how many months ago this client was created
}

const CLIENTS: ClientDef[] = [
  { name: 'Acme Digital', company: 'acmedigital.com', email: 'hello@acmedigital.com', phone: '+1 (415) 555-0142', website: 'https://acmedigital.com', address: 'San Francisco, CA', status: 'Active', tier: 'Enterprise', country: 'US', notes: 'Long-term retainer. Weekly standups on Tuesdays. Prefers Slack communication.', monthsOld: 8 },
  { name: 'Kigali Tech Hub', company: 'kigalitech.rw', email: 'team@kigalitech.rw', phone: '+250 788 321 456', website: 'https://kigalitech.rw', address: 'Kigali, Rwanda', status: 'Active', tier: 'Startup', country: 'RW', notes: 'Fast-moving startup. Invoice via bank transfer. CEO: Jean-Paul.', monthsOld: 6 },
  { name: 'Nova Creative Studio', company: 'novacreative.co', email: 'projects@novacreative.co', phone: '+44 20 7946 0958', website: 'https://novacreative.co', address: 'London, UK', status: 'Active', tier: 'SMB', country: 'GB', notes: 'Design agency. They resell our work to their clients. Net 30 terms.', monthsOld: 7 },
  { name: 'Umucyo Consulting', company: 'umucyoconsulting.rw', email: 'info@umucyoconsulting.rw', phone: '+250 785 111 222', website: '', address: 'Kigali, Rwanda', status: 'Active', tier: 'SMB', country: 'RW', notes: 'Government consulting firm. Slow payment cycles. Always pays eventually.', monthsOld: 5 },
  { name: 'East Africa Labs', company: 'ealabs.io', email: 'dev@ealabs.io', phone: '+254 712 345 678', website: 'https://ealabs.io', address: 'Nairobi, Kenya', status: 'Active', tier: 'Startup', country: 'KE', notes: 'AI/ML startup. Very technical team. Prefer async communication.', monthsOld: 4 },
  { name: 'PixelForge Studios', company: 'pixelforge.dev', email: 'hello@pixelforge.dev', phone: '+1 (512) 555-0199', website: 'https://pixelforge.dev', address: 'Austin, TX', status: 'Active', tier: 'SMB', country: 'US', notes: 'Game studio exploring web3. Pay on time. Fun projects.', monthsOld: 6 },
  { name: 'Green Horizon Energy', company: 'greenhorizon.energy', email: 'contact@greenhorizon.energy', phone: '+49 30 1234 5678', website: 'https://greenhorizon.energy', address: 'Berlin, Germany', status: 'Active', tier: 'Enterprise', country: 'DE', notes: 'Renewable energy company. Strict compliance requirements. GDPR-sensitive data.', monthsOld: 5 },
  { name: 'Apex Systems Corp', company: 'apexsystems.io', email: 'business@apexsystems.io', phone: '+1 (646) 555-0177', website: 'https://apexsystems.io', address: 'New York, NY', status: 'Active', tier: 'Enterprise', country: 'US', notes: 'Enterprise SaaS client. Multiple departments. Procurement process is slow.', monthsOld: 7 },
  { name: 'Mosaic Design Co', company: 'mosaicdesign.com', email: 'studio@mosaicdesign.com', phone: '+1 (310) 555-0133', website: 'https://mosaicdesign.com', address: 'Los Angeles, CA', status: 'Active', tier: 'SMB', country: 'US', notes: 'Interior design firm. Need simple, elegant solutions. Very visual.', monthsOld: 3 },
  { name: 'BrightPath Education', company: 'brightpath.edu', email: 'admin@brightpath.edu', phone: '+27 11 234 5678', website: 'https://brightpath.edu', address: 'Johannesburg, SA', status: 'Active', tier: 'Startup', country: 'ZA', notes: 'EdTech startup. Tight budget but great vision. Equity conversation ongoing.', monthsOld: 4 },
  { name: 'UrbanWorks Architecture', company: 'urbanworks.arch', email: 'hello@urbanworks.arch', phone: '+1 (206) 555-0188', website: 'https://urbanworks.arch', address: 'Seattle, WA', status: 'Active', tier: 'SMB', country: 'US', notes: 'Architecture firm. Need portfolio site + project management tool.', monthsOld: 5 },
  { name: 'Nexa Commerce', company: 'nexacommerce.com', email: 'tech@nexacommerce.com', phone: '+91 80 4567 8901', website: 'https://nexacommerce.com', address: 'Bangalore, India', status: 'Active', tier: 'Startup', country: 'IN', notes: 'E-commerce platform. High volume. Need performance optimization.', monthsOld: 3 },
  { name: 'BluePeak Analytics', company: 'bluepeakanalytics.com', email: 'team@bluepeakanalytics.com', phone: '+1 (720) 555-0144', website: 'https://bluepeakanalytics.com', address: 'Denver, CO', status: 'Lead', tier: 'SMB', country: 'US', notes: 'Data analytics firm. Interested in dashboard development. Meeting scheduled.', monthsOld: 1 },
  { name: 'Visionary Labs', company: 'visionarylabs.co', email: 'hello@visionarylabs.co', phone: '+1 (305) 555-0166', website: 'https://visionarylabs.co', address: 'Miami, FL', status: 'Active', tier: 'Startup', country: 'US', notes: 'VR/AR startup. Cutting edge tech. Flexible on timelines.', monthsOld: 4 },
  { name: 'CoreBridge Solutions', company: 'corebridge.solutions', email: 'info@corebridge.solutions', phone: '+61 2 9876 5432', website: 'https://corebridge.solutions', address: 'Sydney, Australia', status: 'Active', tier: 'SMB', country: 'AU', notes: 'Fintech consultancy. Need compliance-friendly design. AEST timezone.', monthsOld: 6 },
  { name: 'Summit Ventures', company: 'summitvc.com', email: 'partners@summitvc.com', phone: '+1 (212) 555-0155', website: 'https://summitvc.com', address: 'New York, NY', status: 'Inactive', tier: 'Enterprise', country: 'US', notes: 'VC firm. Project paused Q3. May resume Q1 next year.', monthsOld: 8 },
  { name: 'Atlas Media Group', company: 'atlasmedia.com', email: 'projects@atlasmedia.com', phone: '+44 161 234 5678', website: 'https://atlasmedia.com', address: 'Manchester, UK', status: 'Active', tier: 'SMB', country: 'GB', notes: 'Media production company. Need content management system. Fast turnaround.', monthsOld: 2 },
  { name: 'NextWave Robotics', company: 'nextwaverobotics.com', email: 'engineering@nextwaverobotics.com', phone: '+1 (650) 555-0122', website: 'https://nextwaverobotics.com', address: 'Palo Alto, CA', status: 'Active', tier: 'Startup', country: 'US', notes: 'Robotics company. Need internal tools + dashboard. Very engineering-focused.', monthsOld: 3 },
  { name: 'Elevate Consulting', company: 'elevate.consulting', email: 'hello@elevate.consulting', phone: '+27 21 456 7890', website: 'https://elevate.consulting', address: 'Cape Town, SA', status: 'Lead', tier: 'SMB', country: 'ZA', notes: 'Management consultancy. Interested in proposal automation. Hot lead.', monthsOld: 1 },
  { name: 'Rwanda Ventures Ltd', company: 'rwandaventures.rw', email: 'invest@rwandaventures.rw', phone: '+250 788 999 000', website: 'https://rwandaventures.rw', address: 'Kigali, Rwanda', status: 'Active', tier: 'Enterprise', country: 'RW', notes: 'Investment firm. Multiple portfolio companies. Long-term relationship.', monthsOld: 7 },
];

export async function runSeed(db: mongoose.mongo.Db): Promise<void> {
  const users = db.collection('users');
  const clients = db.collection('clients');
  const projects = db.collection('projects');
  const invoices = db.collection('invoices');
  const calendar = db.collection('calendarevents');
  const activities = db.collection('activities');
  const subscriptions = db.collection('subscriptions');

  // ── Clear only demo user's data (idempotent) ──
  const demoUser = await users.findOne({ email: 'demo@soloflow.com' });
  const otherUser = await users.findOne({ email: 'other@soloflow.com' });

  // Clear demo user's data if exists
  if (demoUser) {
    const uid = demoUser._id;
    await Promise.all([
      clients.deleteMany({ userId: uid }),
      projects.deleteMany({ userId: uid }),
      invoices.deleteMany({ userId: uid }),
      calendar.deleteMany({ userId: uid }),
      activities.deleteMany({ userId: uid }),
      subscriptions.deleteMany({ userId: uid }),
    ]);
    await users.deleteOne({ _id: uid });
    console.log('🗑  Cleared existing demo user data');
  }

  // Also clear isolation-test user for clean slate
  if (otherUser) {
    const uid = otherUser._id;
    await Promise.all([
      clients.deleteMany({ userId: uid }),
      projects.deleteMany({ userId: uid }),
      invoices.deleteMany({ userId: uid }),
      activities.deleteMany({ userId: uid }),
    ]);
    await users.deleteOne({ _id: uid });
    console.log('🗑  Cleared existing isolation-test user');
  }

  // Clear admin if exists
  await users.deleteMany({ email: 'admin@soloflow.com' });

  // ══ Users ══
  const passwordHash = await bcrypt.hash('SoloFlowDemo123!', 12);
  const userResult = await users.insertOne({
    name: 'SoloFlow Demo',
    email: 'demo@soloflow.com',
    passwordHash,
    businessName: 'Demo Design Studio',
    currency: 'USD',
    role: 'USER',
    plan: 'pro',
    subscriptionStatus: 'active',
    accountStatus: 'active',
    createdAt: monthsAgo(9),
    updatedAt: now,
  });
  const userId = userResult.insertedId;
  console.log('👤 Created demo user: demo@soloflow.com / SoloFlowDemo123! (Pro)');

  const otherHash = await bcrypt.hash('other123', 12);
  const otherResult = await users.insertOne({
    name: 'Other Freelancer',
    email: 'other@soloflow.com',
    passwordHash: otherHash,
    businessName: 'Other Studio',
    currency: 'USD',
    role: 'USER',
    plan: 'free',
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

  // Pro subscription
  await subscriptions.insertOne({
    userId,
    plan: 'pro',
    status: 'active',
    startedAt: monthsAgo(8),
    expiresAt: monthsFrom(4),
    provider: 'seed',
    providerReference: 'demo_pro',
    previousPlan: 'free',
    createdAt: monthsAgo(8),
    updatedAt: now,
  });

  // ══ Clients ══
  const clientDocs = CLIENTS.map((c) => ({
    userId,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    website: c.website,
    address: c.address,
    status: c.status,
    tier: c.tier,
    country: c.country,
    notes: c.notes,
    createdAt: monthsAgo(c.monthsOld, Math.floor(Math.random() * 28) + 1),
    updatedAt: now,
  }));

  const clientRes = await clients.insertMany(clientDocs);
  const clientIds = Object.values(clientRes.insertedIds);
  const clientMap = new Map(CLIENTS.map((c, i) => [c.name, clientIds[i]]));
  console.log(`🏢 Created ${CLIENTS.length} clients`);

  // ══ Isolation-test client for other user ══
  const otherClientRes = await clients.insertOne({
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
    notes: 'Must never be visible to demo user.',
    createdAt: now,
    updatedAt: now,
  });

  // ══ Projects (2-5 per client) ══
  interface ProjectDef {
    clientName: string;
    title: string;
    description: string;
    budget: number;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'To Do' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
    startMonthsAgo: number;
    deadlineDays: number;
    tags: string[];
  }

  const PROJECTS: ProjectDef[] = [
    // Acme Digital
    { clientName: 'Acme Digital', title: 'Website Redesign', description: 'Complete redesign of the Acme marketing website with modern design system, responsive layouts, and CMS integration.', budget: 8500, priority: 'High', status: 'In Progress', startMonthsAgo: 3, deadlineDays: 14, tags: ['design', 'web', 'cms'] },
    { clientName: 'Acme Digital', title: 'Brand Identity Refresh', description: 'Update brand guidelines, logo variations, color palette, and typography system.', budget: 3200, priority: 'Medium', status: 'Completed', startMonthsAgo: 6, deadlineDays: -30, tags: ['branding', 'design'] },
    { clientName: 'Acme Digital', title: 'SEO Dashboard', description: 'Internal analytics dashboard for tracking SEO metrics, keyword rankings, and competitor analysis.', budget: 4800, priority: 'Medium', status: 'To Do', startMonthsAgo: 1, deadlineDays: 45, tags: ['analytics', 'dashboard'] },

    // Kigali Tech Hub
    { clientName: 'Kigali Tech Hub', title: 'SaaS Platform MVP', description: 'Build the minimum viable product for the SaaS platform including auth, billing, and core features.', budget: 12000, priority: 'Urgent', status: 'In Progress', startMonthsAgo: 2, deadlineDays: 21, tags: ['saas', 'fullstack'] },
    { clientName: 'Kigali Tech Hub', title: 'Admin Dashboard', description: 'Internal admin panel for user management, analytics, and system configuration.', budget: 5500, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 60, tags: ['dashboard', 'admin'] },

    // Nova Creative Studio
    { clientName: 'Nova Creative Studio', title: 'Portfolio Platform', description: 'Custom portfolio showcase platform for their design team with project galleries and case studies.', budget: 6200, priority: 'High', status: 'In Progress', startMonthsAgo: 2, deadlineDays: 10, tags: ['portfolio', 'design'] },
    { clientName: 'Nova Creative Studio', title: 'Client Portal', description: 'White-label client portal for project tracking, file sharing, and approvals.', budget: 7800, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 90, tags: ['portal', 'fullstack'] },
    { clientName: 'Nova Creative Studio', title: 'CMS Integration', description: 'Headless CMS setup with content modeling and API layer for marketing pages.', budget: 3500, priority: 'Low', status: 'Completed', startMonthsAgo: 5, deadlineDays: -60, tags: ['cms', 'api'] },

    // Umucyo Consulting
    { clientName: 'Umucyo Consulting', title: 'Government Report System', description: 'Secure report generation and distribution system for government clients.', budget: 9200, priority: 'High', status: 'In Progress', startMonthsAgo: 3, deadlineDays: 30, tags: ['government', 'security'] },
    { clientName: 'Umucyo Consulting', title: 'Training Portal', description: 'E-learning platform for government employee training with certificates and progress tracking.', budget: 4500, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 75, tags: ['elearning', 'portal'] },

    // East Africa Labs
    { clientName: 'East Africa Labs', title: 'ML Model Dashboard', description: 'Real-time dashboard for monitoring ML model performance, drift detection, and retraining triggers.', budget: 7200, priority: 'High', status: 'In Progress', startMonthsAgo: 1, deadlineDays: 28, tags: ['ai', 'dashboard'] },
    { clientName: 'East Africa Labs', title: 'Data Pipeline UI', description: 'Visual interface for configuring and monitoring ETL data pipelines.', budget: 5800, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 55, tags: ['data', 'ui'] },

    // PixelForge Studios
    { clientName: 'PixelForge Studios', title: 'Game Asset Store', description: 'Marketplace platform for buying and selling game assets with reviews and ratings.', budget: 8900, priority: 'High', status: 'In Progress', startMonthsAgo: 2, deadlineDays: 18, tags: ['marketplace', 'fullstack'] },
    { clientName: 'PixelForge Studios', title: 'Community Forum', description: 'Developer community forum with discussions, tutorials, and resource sharing.', budget: 3200, priority: 'Low', status: 'Completed', startMonthsAgo: 5, deadlineDays: -45, tags: ['community', 'forum'] },

    // Green Horizon Energy
    { clientName: 'Green Horizon Energy', title: 'Energy Monitoring Dashboard', description: 'Real-time energy production and consumption dashboard with predictive analytics.', budget: 11500, priority: 'Urgent', status: 'In Progress', startMonthsAgo: 2, deadlineDays: 7, tags: ['iot', 'dashboard', 'analytics'] },
    { clientName: 'Green Horizon Energy', title: 'Carbon Calculator', description: 'Web-based carbon footprint calculator for corporate clients with PDF report generation.', budget: 4200, priority: 'Medium', status: 'Completed', startMonthsAgo: 4, deadlineDays: -20, tags: ['calculator', 'reports'] },
    { clientName: 'Green Horizon Energy', title: 'Investor Portal', description: 'Secure portal for investors to view financial reports, project updates, and sustainability metrics.', budget: 6800, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 80, tags: ['portal', 'finance'] },

    // Apex Systems Corp
    { clientName: 'Apex Systems Corp', title: 'Enterprise Dashboard', description: 'Multi-tenant analytics dashboard with role-based access control and custom reporting.', budget: 15000, priority: 'High', status: 'In Progress', startMonthsAgo: 4, deadlineDays: 5, tags: ['enterprise', 'dashboard'] },
    { clientName: 'Apex Systems Corp', title: 'API Documentation Portal', description: 'Interactive API documentation with code samples, testing sandbox, and versioning.', budget: 4500, priority: 'Medium', status: 'Completed', startMonthsAgo: 6, deadlineDays: -90, tags: ['docs', 'api'] },
    { clientName: 'Apex Systems Corp', title: 'Customer Onboarding Flow', description: 'Guided onboarding experience for new enterprise customers with progress tracking.', budget: 6200, priority: 'Medium', status: 'On Hold', startMonthsAgo: 2, deadlineDays: 40, tags: ['onboarding', 'ux'] },

    // Mosaic Design Co
    { clientName: 'Mosaic Design Co', title: 'Portfolio Website', description: 'Elegant portfolio website showcasing interior design projects with before/after galleries.', budget: 4800, priority: 'High', status: 'In Progress', startMonthsAgo: 1, deadlineDays: 20, tags: ['portfolio', 'design'] },
    { clientName: 'Mosaic Design Co', title: 'Project Booking System', description: 'Online booking system for design consultations with calendar integration.', budget: 2800, priority: 'Low', status: 'To Do', startMonthsAgo: 0, deadlineDays: 50, tags: ['booking', 'calendar'] },

    // BrightPath Education
    { clientName: 'BrightPath Education', title: 'Learning Management System', description: 'Full LMS with course creation, student tracking, assessments, and certificates.', budget: 10500, priority: 'Urgent', status: 'In Progress', startMonthsAgo: 3, deadlineDays: 12, tags: ['lms', 'education'] },
    { clientName: 'BrightPath Education', title: 'Student Mobile App', description: 'Companion mobile app for course access, notifications, and progress tracking.', budget: 7200, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 90, tags: ['mobile', 'education'] },

    // UrbanWorks Architecture
    { clientName: 'UrbanWorks Architecture', title: 'Architecture Portfolio', description: 'Immersive 3D portfolio showcasing architectural projects with virtual tours.', budget: 6500, priority: 'High', status: 'In Progress', startMonthsAgo: 2, deadlineDays: 15, tags: ['portfolio', '3d'] },
    { clientName: 'UrbanWorks Architecture', title: 'Project Timeline Tool', description: 'Internal tool for tracking construction project timelines and milestones.', budget: 3800, priority: 'Low', status: 'Completed', startMonthsAgo: 5, deadlineDays: -50, tags: ['tool', 'internal'] },

    // Nexa Commerce
    { clientName: 'Nexa Commerce', title: 'E-commerce Platform', description: 'Full-featured e-commerce platform with inventory management, payments, and analytics.', budget: 14000, priority: 'Urgent', status: 'In Progress', startMonthsAgo: 2, deadlineDays: 25, tags: ['ecommerce', 'fullstack'] },
    { clientName: 'Nexa Commerce', title: 'Vendor Dashboard', description: 'Multi-vendor management dashboard with sales analytics and payout tracking.', budget: 5200, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 65, tags: ['dashboard', 'vendor'] },

    // BluePeak Analytics
    { clientName: 'BluePeak Analytics', title: 'Data Visualization Suite', description: 'Interactive data visualization suite with custom chart types and export capabilities.', budget: 7800, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 70, tags: ['analytics', 'visualization'] },

    // Visionary Labs
    { clientName: 'Visionary Labs', title: 'AR Experience Platform', description: 'Web-based AR experience builder for marketing campaigns and product demos.', budget: 9500, priority: 'High', status: 'In Progress', startMonthsAgo: 1, deadlineDays: 35, tags: ['ar', 'webxr'] },
    { clientName: 'Visionary Labs', title: 'VR Collaboration Tool', description: 'Virtual reality collaboration tool for remote team meetings and whiteboarding.', budget: 12000, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 120, tags: ['vr', 'collaboration'] },

    // CoreBridge Solutions
    { clientName: 'CoreBridge Solutions', title: 'Fintech Dashboard', description: 'Compliance-friendly financial dashboard with real-time market data and portfolio tracking.', budget: 8200, priority: 'High', status: 'In Progress', startMonthsAgo: 2, deadlineDays: 22, tags: ['fintech', 'dashboard'] },
    { clientName: 'CoreBridge Solutions', title: 'Client Reporting Portal', description: 'Automated client reporting with PDF generation and email delivery.', budget: 4000, priority: 'Low', status: 'Completed', startMonthsAgo: 4, deadlineDays: -35, tags: ['reports', 'automation'] },

    // Summit Ventures
    { clientName: 'Summit Ventures', title: 'Portfolio Analytics', description: 'Investment portfolio analytics dashboard with performance metrics and projections.', budget: 9800, priority: 'Medium', status: 'On Hold', startMonthsAgo: 5, deadlineDays: 30, tags: ['analytics', 'finance'] },

    // Atlas Media Group
    { clientName: 'Atlas Media Group', title: 'Content Management Hub', description: 'Centralized content management system for multi-platform publishing workflows.', budget: 6800, priority: 'High', status: 'In Progress', startMonthsAgo: 1, deadlineDays: 28, tags: ['cms', 'publishing'] },
    { clientName: 'Atlas Media Group', title: 'Video Production Tracker', description: 'Project management tool for video production pipelines with asset management.', budget: 3500, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 55, tags: ['video', 'management'] },

    // NextWave Robotics
    { clientName: 'NextWave Robotics', title: 'Robot Fleet Dashboard', description: 'Real-time monitoring dashboard for robot fleet status, diagnostics, and task assignment.', budget: 11000, priority: 'Urgent', status: 'In Progress', startMonthsAgo: 1, deadlineDays: 10, tags: ['iot', 'robotics', 'dashboard'] },
    { clientName: 'NextWave Robotics', title: 'Simulation Interface', description: 'Web-based robot simulation interface for testing path planning algorithms.', budget: 7500, priority: 'High', status: 'To Do', startMonthsAgo: 0, deadlineDays: 60, tags: ['simulation', 'engineering'] },

    // Elevate Consulting
    { clientName: 'Elevate Consulting', title: 'Proposal Generator', description: 'AI-powered proposal generation tool for management consulting engagements.', budget: 5500, priority: 'Medium', status: 'To Do', startMonthsAgo: 0, deadlineDays: 45, tags: ['ai', 'proposals'] },

    // Rwanda Ventures Ltd
    { clientName: 'Rwanda Ventures Ltd', title: 'Investment Portal', description: 'Secure investment management portal with deal flow tracking and LP reporting.', budget: 13500, priority: 'High', status: 'In Progress', startMonthsAgo: 3, deadlineDays: 16, tags: ['finance', 'portal'] },
    { clientName: 'Rwanda Ventures Ltd', title: 'Portfolio Company Dashboard', description: 'Dashboard for monitoring portfolio company performance and KPIs.', budget: 6000, priority: 'Medium', status: 'Completed', startMonthsAgo: 5, deadlineDays: -40, tags: ['dashboard', 'portfolio'] },
    { clientName: 'Rwanda Ventures Ltd', title: 'LP Reporting System', description: 'Automated limited partner reporting with customizable templates and email delivery.', budget: 4500, priority: 'Low', status: 'On Hold', startMonthsAgo: 2, deadlineDays: 50, tags: ['reporting', 'automation'] },
  ];

  const projectDocs = PROJECTS.map((p) => {
    const cid = clientMap.get(p.clientName)!;
    return {
      userId,
      clientId: cid,
      title: p.title,
      description: p.description,
      budget: p.budget,
      priority: p.priority,
      status: p.status,
      startDate: monthsAgo(p.startMonthsAgo, Math.floor(Math.random() * 28) + 1),
      deadline: days(p.deadlineDays),
      tags: p.tags,
      tasks: [],
      createdAt: monthsAgo(p.startMonthsAgo, Math.floor(Math.random() * 28) + 1),
      updatedAt: now,
    };
  });

  const projRes = await projects.insertMany(projectDocs);
  const projIds = Object.values(projRes.insertedIds);

  // Build project lookup: clientName -> [{id, title, status}]
  const projByClient = new Map<string, { id: mongoose.Types.ObjectId; title: string; status: string }[]>();
  PROJECTS.forEach((p, i) => {
    if (!projByClient.has(p.clientName)) projByClient.set(p.clientName, []);
    projByClient.get(p.clientName)!.push({ id: projIds[i], title: p.title, status: p.status });
  });

  console.log(`📁 Created ${PROJECTS.length} projects`);

  // Proposals removed

  // ══ Invoices (1-4 per client) ══
  interface InvoiceDef {
    clientName: string;
    projectTitle?: string;
    items: { description: string; quantity: number; unitPrice: number }[];
    taxRate: number;
    status: 'Paid' | 'Pending' | 'Overdue' | 'Sent' | 'Draft';
    issueDaysAgo: number;
    dueDays: number; // from issue date
    paidDaysAgo?: number; // from now
    notes: string;
  }

  const INVOICES: InvoiceDef[] = [
    // Acme Digital
    { clientName: 'Acme Digital', projectTitle: 'Website Redesign', items: [{ description: 'Website Redesign — Milestone 1 (Discovery & Design)', quantity: 1, unitPrice: 3400 }, { description: 'Design system documentation', quantity: 1, unitPrice: 500 }], taxRate: 0, status: 'Paid', issueDaysAgo: 90, dueDays: 30, paidDaysAgo: 70, notes: 'Milestone 1 of 3.' },
    { clientName: 'Acme Digital', projectTitle: 'Website Redesign', items: [{ description: 'Website Redesign — Milestone 2 (Development)', quantity: 1, unitPrice: 3400 }, { description: 'CMS integration', quantity: 1, unitPrice: 800 }], taxRate: 0, status: 'Paid', issueDaysAgo: 45, dueDays: 30, paidDaysAgo: 30, notes: 'Milestone 2 of 3.' },
    { clientName: 'Acme Digital', projectTitle: 'Website Redesign', items: [{ description: 'Website Redesign — Milestone 3 (Launch)', quantity: 1, unitPrice: 400 }], taxRate: 0, status: 'Sent', issueDaysAgo: 3, dueDays: 14, notes: 'Final milestone. Payment due on launch.' },
    { clientName: 'Acme Digital', projectTitle: 'Brand Identity Refresh', items: [{ description: 'Brand identity refresh', quantity: 1, unitPrice: 3200 }], taxRate: 0, status: 'Paid', issueDaysAgo: 150, dueDays: 30, paidDaysAgo: 130, notes: '' },

    // Kigali Tech Hub
    { clientName: 'Kigali Tech Hub', projectTitle: 'SaaS Platform MVP', items: [{ description: 'SaaS MVP — Architecture & Auth', quantity: 40, unitPrice: 75 }, { description: 'Subscription billing integration', quantity: 20, unitPrice: 85 }, { description: 'Core feature development', quantity: 30, unitPrice: 80 }], taxRate: 0, status: 'Paid', issueDaysAgo: 60, dueDays: 30, paidDaysAgo: 40, notes: 'Milestone 1 — Architecture complete.' },
    { clientName: 'Kigali Tech Hub', projectTitle: 'SaaS Platform MVP', items: [{ description: 'SaaS MVP — Core features phase 2', quantity: 35, unitPrice: 80 }, { description: 'API development', quantity: 25, unitPrice: 85 }], taxRate: 0, status: 'Overdue', issueDaysAgo: 35, dueDays: 30, notes: 'Payment overdue. Please process ASAP.' },

    // Nova Creative Studio
    { clientName: 'Nova Creative Studio', projectTitle: 'Portfolio Platform', items: [{ description: 'Portfolio platform — Design & UX', quantity: 1, unitPrice: 2500 }, { description: 'Gallery system development', quantity: 1, unitPrice: 2000 }], taxRate: 0, status: 'Paid', issueDaysAgo: 50, dueDays: 30, paidDaysAgo: 35, notes: '' },
    { clientName: 'Nova Creative Studio', projectTitle: 'Portfolio Platform', items: [{ description: 'Portfolio platform — Final delivery', quantity: 1, unitPrice: 1700 }], taxRate: 0, status: 'Pending', issueDaysAgo: 10, dueDays: 30, notes: 'Final payment.' },
    { clientName: 'Nova Creative Studio', projectTitle: 'CMS Integration', items: [{ description: 'Headless CMS setup & content modeling', quantity: 1, unitPrice: 3500 }], taxRate: 0, status: 'Paid', issueDaysAgo: 120, dueDays: 30, paidDaysAgo: 100, notes: '' },

    // Umucyo Consulting
    { clientName: 'Umucyo Consulting', projectTitle: 'Government Report System', items: [{ description: 'Security audit & compliance review', quantity: 1, unitPrice: 2000 }, { description: 'Report engine development', quantity: 1, unitPrice: 3500 }], taxRate: 5, status: 'Paid', issueDaysAgo: 70, dueDays: 45, paidDaysAgo: 50, notes: 'Government billing cycle.' },
    { clientName: 'Umucyo Consulting', projectTitle: 'Government Report System', items: [{ description: 'Distribution system & audit logging', quantity: 1, unitPrice: 3700 }], taxRate: 5, status: 'Overdue', issueDaysAgo: 40, dueDays: 45, notes: 'Payment processing may take time due to government procedures.' },

    // East Africa Labs
    { clientName: 'East Africa Labs', projectTitle: 'ML Model Dashboard', items: [{ description: 'IoT data pipeline setup', quantity: 1, unitPrice: 2800 }, { description: 'Dashboard UI development', quantity: 1, unitPrice: 2400 }], taxRate: 0, status: 'Paid', issueDaysAgo: 30, dueDays: 30, paidDaysAgo: 15, notes: '' },

    // PixelForge Studios
    { clientName: 'PixelForge Studios', projectTitle: 'Game Asset Store', items: [{ description: 'Marketplace platform — Phase 1', quantity: 1, unitPrice: 3500 }, { description: 'Search & filtering system', quantity: 1, unitPrice: 1500 }], taxRate: 0, status: 'Paid', issueDaysAgo: 40, dueDays: 30, paidDaysAgo: 25, notes: '' },
    { clientName: 'PixelForge Studios', projectTitle: 'Game Asset Store', items: [{ description: 'Payment system & creator dashboard', quantity: 1, unitPrice: 2500 }, { description: 'Review & rating system', quantity: 1, unitPrice: 1400 }], taxRate: 0, status: 'Sent', issueDaysAgo: 5, dueDays: 30, notes: 'Phase 2 invoiced.' },
    { clientName: 'PixelForge Studios', projectTitle: 'Community Forum', items: [{ description: 'Community forum development', quantity: 1, unitPrice: 3200 }], taxRate: 0, status: 'Paid', issueDaysAgo: 110, dueDays: 30, paidDaysAgo: 90, notes: '' },

    // Green Horizon Energy
    { clientName: 'Green Horizon Energy', projectTitle: 'Energy Monitoring Dashboard', items: [{ description: 'IoT data integration layer', quantity: 1, unitPrice: 4000 }, { description: 'Real-time chart components', quantity: 1, unitPrice: 2500 }], taxRate: 19, status: 'Paid', issueDaysAgo: 35, dueDays: 30, paidDaysAgo: 20, notes: 'German VAT included.' },
    { clientName: 'Green Horizon Energy', projectTitle: 'Energy Monitoring Dashboard', items: [{ description: 'Predictive analytics module', quantity: 1, unitPrice: 3000 }, { description: 'Alert system', quantity: 1, unitPrice: 2000 }], taxRate: 19, status: 'Pending', issueDaysAgo: 8, dueDays: 30, notes: 'Awaiting PO from finance dept.' },
    { clientName: 'Green Horizon Energy', projectTitle: 'Carbon Calculator', items: [{ description: 'Carbon calculator development', quantity: 1, unitPrice: 4200 }], taxRate: 19, status: 'Paid', issueDaysAgo: 95, dueDays: 30, paidDaysAgo: 75, notes: '' },

    // Apex Systems Corp
    { clientName: 'Apex Systems Corp', projectTitle: 'Enterprise Dashboard', items: [{ description: 'Enterprise dashboard — Architecture', quantity: 1, unitPrice: 4500 }, { description: 'Multi-tenancy implementation', quantity: 1, unitPrice: 3500 }, { description: 'RBAC system', quantity: 1, unitPrice: 2500 }], taxRate: 0, status: 'Paid', issueDaysAgo: 80, dueDays: 45, paidDaysAgo: 50, notes: 'Enterprise billing terms.' },
    { clientName: 'Apex Systems Corp', projectTitle: 'Enterprise Dashboard', items: [{ description: 'Report builder & export engine', quantity: 1, unitPrice: 4500 }], taxRate: 0, status: 'Sent', issueDaysAgo: 7, dueDays: 45, notes: 'Phase 2 deliverable.' },
    { clientName: 'Apex Systems Corp', projectTitle: 'API Documentation Portal', items: [{ description: 'Interactive API docs platform', quantity: 1, unitPrice: 4500 }], taxRate: 0, status: 'Paid', issueDaysAgo: 140, dueDays: 45, paidDaysAgo: 110, notes: '' },

    // Mosaic Design Co
    { clientName: 'Mosaic Design Co', projectTitle: 'Portfolio Website', items: [{ description: 'Portfolio design & development', quantity: 1, unitPrice: 4800 }], taxRate: 0, status: 'Pending', issueDaysAgo: 5, dueDays: 15, notes: 'Net 15 terms.' },

    // BrightPath Education
    { clientName: 'BrightPath Education', projectTitle: 'Learning Management System', items: [{ description: 'LMS — Course builder & auth', quantity: 1, unitPrice: 4000 }, { description: 'Assessment engine', quantity: 1, unitPrice: 2500 }], taxRate: 14, status: 'Paid', issueDaysAgo: 60, dueDays: 30, paidDaysAgo: 45, notes: 'South African VAT.' },
    { clientName: 'BrightPath Education', projectTitle: 'Learning Management System', items: [{ description: 'Certificate system & analytics', quantity: 1, unitPrice: 2500 }, { description: 'Student dashboard', quantity: 1, unitPrice: 1500 }], taxRate: 14, status: 'Overdue', issueDaysAgo: 30, dueDays: 30, notes: 'Payment reminder sent.' },

    // UrbanWorks Architecture
    { clientName: 'UrbanWorks Architecture', projectTitle: 'Architecture Portfolio', items: [{ description: '3D portfolio development', quantity: 1, unitPrice: 4000 }, { description: 'Virtual tour integration', quantity: 1, unitPrice: 2500 }], taxRate: 0, status: 'Sent', issueDaysAgo: 4, dueDays: 15, notes: 'Net 15 terms.' },

    // Nexa Commerce
    { clientName: 'Nexa Commerce', projectTitle: 'E-commerce Platform', items: [{ description: 'E-commerce platform — Core', quantity: 1, unitPrice: 5000 }, { description: 'Product catalog & inventory', quantity: 1, unitPrice: 3000 }], taxRate: 18, status: 'Paid', issueDaysAgo: 45, dueDays: 30, paidDaysAgo: 30, notes: 'Indian GST.' },
    { clientName: 'Nexa Commerce', projectTitle: 'E-commerce Platform', items: [{ description: 'Payment integration', quantity: 1, unitPrice: 3000 }, { description: 'Analytics dashboard', quantity: 1, unitPrice: 3000 }], taxRate: 18, status: 'Pending', issueDaysAgo: 10, dueDays: 30, notes: 'Phase 2.' },

    // Visionary Labs
    { clientName: 'Visionary Labs', projectTitle: 'AR Experience Platform', items: [{ description: 'WebXR integration', quantity: 1, unitPrice: 4500 }, { description: 'Campaign builder', quantity: 1, unitPrice: 3000 }], taxRate: 0, status: 'Draft', issueDaysAgo: 0, dueDays: 30, notes: 'Draft — not yet sent.' },

    // CoreBridge Solutions
    { clientName: 'CoreBridge Solutions', projectTitle: 'Fintech Dashboard', items: [{ description: 'Financial dashboard — Market data & portfolio', quantity: 1, unitPrice: 4500 }, { description: 'Reporting engine', quantity: 1, unitPrice: 2000 }], taxRate: 10, status: 'Paid', issueDaysAgo: 50, dueDays: 30, paidDaysAgo: 35, notes: 'Australian GST.' },
    { clientName: 'CoreBridge Solutions', projectTitle: 'Fintech Dashboard', items: [{ description: 'Compliance layer & audit', quantity: 1, unitPrice: 1700 }], taxRate: 10, status: 'Sent', issueDaysAgo: 6, dueDays: 30, notes: '' },
    { clientName: 'CoreBridge Solutions', projectTitle: 'Client Reporting Portal', items: [{ description: 'Client reporting portal', quantity: 1, unitPrice: 4000 }], taxRate: 10, status: 'Paid', issueDaysAgo: 100, dueDays: 30, paidDaysAgo: 80, notes: '' },

    // Summit Ventures (inactive)
    { clientName: 'Summit Ventures', projectTitle: 'Portfolio Analytics', items: [{ description: 'Analytics platform — Discovery & architecture', quantity: 1, unitPrice: 3000 }], taxRate: 0, status: 'Overdue', issueDaysAgo: 90, dueDays: 45, notes: 'Client paused. Follow up Q1.' },

    // Atlas Media Group
    { clientName: 'Atlas Media Group', projectTitle: 'Content Management Hub', items: [{ description: 'CMS hub — Content modeling & workflow', quantity: 1, unitPrice: 3500 }, { description: 'Multi-platform publishing', quantity: 1, unitPrice: 2000 }], taxRate: 20, status: 'Paid', issueDaysAgo: 25, dueDays: 30, paidDaysAgo: 10, notes: 'UK VAT.' },
    { clientName: 'Atlas Media Group', projectTitle: 'Content Management Hub', items: [{ description: 'Analytics & automation', quantity: 1, unitPrice: 1300 }], taxRate: 20, status: 'Draft', issueDaysAgo: 0, dueDays: 30, notes: 'Draft for final deliverable.' },

    // NextWave Robotics
    { clientName: 'NextWave Robotics', projectTitle: 'Robot Fleet Dashboard', items: [{ description: 'IoT data pipeline', quantity: 1, unitPrice: 4000 }, { description: 'Real-time dashboard', quantity: 1, unitPrice: 3500 }], taxRate: 0, status: 'Paid', issueDaysAgo: 20, dueDays: 30, paidDaysAgo: 5, notes: '' },
    { clientName: 'NextWave Robotics', projectTitle: 'Robot Fleet Dashboard', items: [{ description: 'Task management & analytics', quantity: 1, unitPrice: 3500 }], taxRate: 0, status: 'Pending', issueDaysAgo: 8, dueDays: 30, notes: 'Phase 2.' },

    // Rwanda Ventures Ltd
    { clientName: 'Rwanda Ventures Ltd', projectTitle: 'Investment Portal', items: [{ description: 'Investment portal — Deal flow system', quantity: 1, unitPrice: 5000 }, { description: 'LP portal & reporting', quantity: 1, unitPrice: 3500 }], taxRate: 0, status: 'Paid', issueDaysAgo: 65, dueDays: 45, paidDaysAgo: 45, notes: '' },
    { clientName: 'Rwanda Ventures Ltd', projectTitle: 'Investment Portal', items: [{ description: 'Analytics & export engine', quantity: 1, unitPrice: 5000 }], taxRate: 0, status: 'Sent', issueDaysAgo: 12, dueDays: 45, notes: 'Milestone 2.' },
    { clientName: 'Rwanda Ventures Ltd', projectTitle: 'Portfolio Company Dashboard', items: [{ description: 'Portfolio dashboard development', quantity: 1, unitPrice: 6000 }], taxRate: 0, status: 'Paid', issueDaysAgo: 110, dueDays: 45, paidDaysAgo: 90, notes: '' },
  ];

  const invoiceDocs = INVOICES.map((inv) => {
    const cid = clientMap.get(inv.clientName)!;
    let pid: mongoose.Types.ObjectId | undefined;
    if (inv.projectTitle) {
      const projs = projByClient.get(inv.clientName);
      const match = projs?.find((pr) => pr.title === inv.projectTitle);
      if (match) pid = match.id;
    }
    const items = inv.items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      amount: it.quantity * it.unitPrice,
    }));
    const subtotal = items.reduce((s, it) => s + it.amount, 0);
    const taxAmount = Math.round(subtotal * inv.taxRate) / 100;
    const issueDate = days(-inv.issueDaysAgo);
    const dueDate = new Date(issueDate.getTime() + inv.dueDays * 86400000);
    return {
      userId,
      invoiceNumber: nextInv(),
      clientId: cid,
      projectId: pid,
      issueDate,
      dueDate,
      status: inv.status,
      items,
      subtotal,
      taxRate: inv.taxRate,
      taxAmount,
      total: subtotal + taxAmount,
      currency: 'USD',
      notes: inv.notes,
      paidAt: inv.paidDaysAgo ? days(-inv.paidDaysAgo) : undefined,
      createdAt: issueDate,
      updatedAt: now,
    };
  });

  await invoices.insertMany(invoiceDocs);
  console.log(`🧾 Created ${INVOICES.length} invoices`);

  // ══ Calendar Events (from real data) ══
  const calEvents: any[] = [];

  // Project deadlines
  PROJECTS.forEach((p) => {
    const deadline = days(p.deadlineDays);
    if (p.deadlineDays > -7 && p.deadlineDays < 90) {
      calEvents.push({
        userId,
        title: `Deadline: ${p.title}`,
        clientName: p.clientName,
        clientId: clientMap.get(p.clientName),
        date: deadline,
        type: 'deadline',
        description: `Project deadline for ${p.title}`,
        completed: p.status === 'Completed',
        sourceType: 'project',
        sourceId: projIds[PROJECTS.indexOf(p)],
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  // Invoice due dates
  INVOICES.forEach((inv) => {
    const dueDate = new Date(days(-inv.issueDaysAgo).getTime() + inv.dueDays * 86400000);
    if (dueDate > days(-14) && dueDate < days(60)) {
      calEvents.push({
        userId,
        title: `Invoice due: ${invoiceDocs[INVOICES.indexOf(inv)].invoiceNumber}`,
        clientName: inv.clientName,
        clientId: clientMap.get(inv.clientName),
        date: dueDate,
        type: 'invoice_due',
        description: `Payment of $${invoiceDocs[INVOICES.indexOf(inv)].total.toLocaleString()} due`,
        completed: inv.status === 'Paid',
        sourceType: 'invoice',
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  // Meetings
  const meetingClients = ['Acme Digital', 'Kigali Tech Hub', 'Green Horizon Energy', 'Nexa Commerce', 'Atlas Media Group'];
  meetingClients.forEach((cn, i) => {
    calEvents.push({
      userId,
      title: `Meeting: ${cn}`,
      clientName: cn,
      clientId: clientMap.get(cn),
      date: days(3 + i * 5),
      type: 'meeting',
      description: `Client sync meeting with ${cn}`,
      completed: false,
      sourceType: 'manual',
      createdAt: now,
      updatedAt: now,
    });
  });

  // Milestones
  const milestoneProjects = PROJECTS.filter((p) => p.status === 'In Progress').slice(0, 5);
  milestoneProjects.forEach((p, i) => {
    calEvents.push({
      userId,
      title: `Milestone: ${p.title}`,
      clientName: p.clientName,
      clientId: clientMap.get(p.clientName),
      date: days(7 + i * 7),
      type: 'milestone',
      description: `Mid-project milestone for ${p.title}`,
      completed: false,
      sourceType: 'project',
      createdAt: now,
      updatedAt: now,
    });
  });

  await calendar.insertMany(calEvents);
  console.log(`📅 Created ${calEvents.length} calendar events`);

  // ══ Activities (100+) ══
  const activityDocs: any[] = [];

  // Client creation activities
  CLIENTS.forEach((c) => {
    activityDocs.push({
      userId,
      clientId: clientMap.get(c.name),
      type: 'client_added',
      title: `Client ${c.name}`,
      subtitle: 'added',
      iconType: 'client',
      timestamp: monthsAgo(c.monthsOld, Math.floor(Math.random() * 28) + 1),
    });
  });

  // Project creation activities
  PROJECTS.forEach((p) => {
    activityDocs.push({
      userId,
      clientId: clientMap.get(p.clientName),
      type: 'project_created',
      title: `Project "${p.title}"`,
      subtitle: `created for ${p.clientName}`,
      iconType: 'project',
      timestamp: monthsAgo(p.startMonthsAgo, Math.floor(Math.random() * 28) + 1),
    });
  });

  // Project status changes for completed projects
  PROJECTS.filter((p) => p.status === 'Completed').forEach((p) => {
    activityDocs.push({
      userId,
      clientId: clientMap.get(p.clientName),
      type: 'project_status',
      title: `Project "${p.title}"`,
      subtitle: 'marked as Completed',
      iconType: 'project',
      timestamp: days(p.deadlineDays + 5),
    });
  });

  // Invoice creation activities
  INVOICES.forEach((inv) => {
    activityDocs.push({
      userId,
      clientId: clientMap.get(inv.clientName),
      type: 'invoice_created',
      title: `Invoice for ${inv.clientName}`,
      subtitle: `$${invoiceDocs[INVOICES.indexOf(inv)].total.toLocaleString()}`,
      iconType: 'invoice',
      timestamp: days(-inv.issueDaysAgo),
    });
  });

  // Invoice paid activities
  INVOICES.filter((inv) => inv.status === 'Paid').forEach((inv) => {
    activityDocs.push({
      userId,
      clientId: clientMap.get(inv.clientName),
      type: 'invoice_paid',
      title: `Invoice paid by ${inv.clientName}`,
      subtitle: `$${invoiceDocs[INVOICES.indexOf(inv)].total.toLocaleString()}`,
      iconType: 'check',
      timestamp: days(-inv.paidDaysAgo!),
    });
  });

  await activities.insertMany(activityDocs);
  console.log(`⚡ Created ${activityDocs.length} activities`);

  // ══ Isolation-test data for other user ══
  await projects.insertOne({
    userId: otherUserId,
    clientId: otherClientRes.insertedId,
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
  });

  // ══ Verification ══
  const counts = {
    clients: await clients.countDocuments({ userId }),
    projects: await projects.countDocuments({ userId }),
    invoices: await invoices.countDocuments({ userId }),
    activities: await activities.countDocuments({ userId }),
    calendar: await calendar.countDocuments({ userId }),
    isolatedClient: await clients.countDocuments({ userId: otherUserId }),
    isolatedProjects: await projects.countDocuments({ userId: otherUserId }),
  };

  console.log('\n🔍 Relationship verification:');
  console.log(`  Demo user: ${counts.clients} clients | ${counts.projects} projects | ${counts.invoices} invoices | ${counts.activities} activities | ${counts.calendar} calendar events`);
  console.log(`  Other user: ${counts.isolatedClient} client | ${counts.isolatedProjects} projects`);

  // Verify relational integrity
  const orphans = {
    projectsWithoutClient: await projects.countDocuments({ userId, clientId: { $exists: false } }),
    invoicesWithoutClient: await invoices.countDocuments({ userId, clientId: { $exists: false } }),
  };

  if (orphans.projectsWithoutClient + orphans.invoicesWithoutClient > 0) {
    console.error('❌ RELATIONAL INTEGRITY ERROR:', orphans);
  } else {
    console.log('  ✅ All records have valid userId + clientId');
  }

  await mongoose.disconnect();
  console.log(`\n✅ Seed complete!\n\nDEMO LOGIN\nEmail:    demo@soloflow.com\nPassword: SoloFlowDemo123!\n`);
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

if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
