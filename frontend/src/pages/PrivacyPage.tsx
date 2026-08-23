/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StaticPageLayout } from './StaticPageLayout';

export const PrivacyPage: React.FC = () => (
  <StaticPageLayout
    eyebrow="Legal"
    title="Privacy Policy"
    subtitle="Last updated: January 2025. We collect the minimum data needed to run your workspace — never sold, never shared for advertising."
  >
    <section className="mb-10">
      <h2 className="text-[18px] font-semibold tracking-tight mb-3">1. Information we collect</h2>
      <ul className="list-disc pl-5 space-y-2 text-[14px] leading-relaxed" style={{ color: '#6B6158' }}>
        <li><strong>Account data:</strong> name, email address, business name, and currency preference.</li>
        <li><strong>Workspace data:</strong> clients, projects, proposals, invoices, and calendar events you create.</li>
        <li><strong>Usage data:</strong> pages visited and features used, to improve the product.</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-[18px] font-semibold tracking-tight mb-3">2. How we use your information</h2>
      <p className="text-[14px] leading-relaxed" style={{ color: '#6B6158' }}>
        We use your data to operate the Service — storing your records, generating AI-assisted
        documents on your request, providing analytics, and communicating service updates. We do not
        sell personal data or use it for third-party advertising.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-[18px] font-semibold tracking-tight mb-3">3. AI processing</h2>
      <p className="text-[14px] leading-relaxed" style={{ color: '#6B6158' }}>
        When you use AI features such as proposal generation, relevant portions of your brief are
        sent to our AI provider strictly to produce your requested output. Prompts and outputs are
        not used to train public models.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-[18px] font-semibold tracking-tight mb-3">4. Data storage & security</h2>
      <p className="text-[14px] leading-relaxed" style={{ color: '#6B6158' }}>
        Data is encrypted in transit (TLS) and at rest. Access is restricted to personnel who need
        it to operate the Service. Authentication tokens are stored locally in your browser and can
        be revoked by signing out.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-[18px] font-semibold tracking-tight mb-3">5. Your rights</h2>
      <p className="text-[14px] leading-relaxed" style={{ color: '#6B6158' }}>
        You may export or delete your workspace data at any time from Settings. You may also request
        correction or deletion of your account data by emailing{' '}
        <a href="mailto:privacy@soloflow.com" className="underline" style={{ color: '#937A62' }}>privacy@soloflow.com</a>.
        We respond to requests within 30 days.
      </p>
    </section>

    <section className="mb-4">
      <h2 className="text-[18px] font-semibold tracking-tight mb-3">6. Cookies & contact</h2>
      <p className="text-[14px] leading-relaxed" style={{ color: '#6B6158' }}>
        We use only essential cookies for authentication and session management. See our Cookie
        Policy for details. For any privacy question, contact{' '}
        <a href="mailto:privacy@soloflow.com" className="underline" style={{ color: '#937A62' }}>privacy@soloflow.com</a>.
      </p>
    </section>
  </StaticPageLayout>
);