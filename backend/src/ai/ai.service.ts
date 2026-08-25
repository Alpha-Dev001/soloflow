import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Lazy-load the Gemini SDK to avoid issues when the key is missing
let GoogleGenAI: any;
let Type: any;
try {
  const genai = require('@google/genai');
  GoogleGenAI = genai.GoogleGenAI;
  Type = genai.Type;
} catch {
  // SDK not installed — AI features will return graceful fallbacks
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ProposalPromptData {
  clientName: string;
  projectName?: string;
  projectTitle: string;
  description: string;
  budget?: string | number;
  tone?: string;
}

export interface GenerateProposalResult {
  proposal: any;
  /** True only when Gemini returned a valid structured proposal. */
  success: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiClient: any = null;
  private readonly candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];

  constructor(private readonly configService: ConfigService) {}

  private getClient(): any {
    if (!this.aiClient && GoogleGenAI) {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY', '');
      if (apiKey) {
        this.aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'soloflow-api' } },
        });
      }
    }
    return this.aiClient;
  }

  async generateProposal(data: ProposalPromptData): Promise<GenerateProposalResult> {
    const ai = this.getClient();

    const budgetNum =
      typeof data.budget === 'number'
        ? data.budget
        : parseInt(String(data.budget || '4500').replace(/[^0-9]/g, ''), 10) || 4500;

    if (!ai) {
      this.logger.warn('Gemini client not available — using template fallback');
      return { proposal: this.proposalFallback(data, budgetNum), success: false };
    }

    const prompt = `You are an elite freelance proposal specialist.
Generate a structured, persuasive proposal for:
Client: ${data.clientName}
Project: ${data.projectTitle}
Description: ${data.description}
Budget: $${budgetNum.toLocaleString()}
Tone: ${data.tone || 'Professional'}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        projectOverview: { type: Type.STRING },
        scopeOfWork: { type: Type.ARRAY, items: { type: Type.STRING } },
        deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
        timeline: { type: Type.STRING },
        investment: {
          type: Type.OBJECT,
          properties: {
            totalCost: { type: Type.NUMBER },
            paymentTerms: { type: Type.STRING },
          },
          required: ['totalCost', 'paymentTerms'],
        },
      },
      required: ['title', 'subtitle', 'projectOverview', 'scopeOfWork', 'deliverables', 'timeline', 'investment'],
    };

    for (const model of this.candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction:
                "You are SoloFlow's AI Proposal Specialist. Output structured JSON only, strictly matching the schema.",
              responseMimeType: 'application/json',
              responseSchema,
            },
          });
          const text = response.text?.trim() || '';
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed?.title && parsed?.scopeOfWork) {
              return { proposal: parsed, success: true };
            }
          }
        } catch (err: any) {
          this.logger.warn(`Proposal generation failed (${model}, attempt ${attempt + 1}): ${err?.message}`);
          if (attempt === 0) await sleep(600);
        }
      }
    }

    return { proposal: this.proposalFallback(data, budgetNum), success: false };
  }

  async chat(message: string, context?: any): Promise<string> {
    const ai = this.getClient();

    const systemInstruction = `You are the SoloFlow AI Business Assistant, an expert AI partner for freelancers.
You help with: pricing & rate negotiations, proposal writing & contract terms, scope management,
client communication & invoice follow-up, freelance business strategy.
Keep answers concise, actionable, and professional. Use bullet points.`;

    if (!ai) {
      return this.chatFallback(message, context);
    }

    for (const model of this.candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: message,
          config: { systemInstruction },
        });
        const text = response.text?.trim();
        if (text) return text;
      } catch (err: any) {
        this.logger.warn(`Chat failed (${model}): ${err?.message}`);
      }
    }

    return this.chatFallback(message, context);
  }

  private proposalFallback(data: ProposalPromptData, budgetNum: number): any {
    const desc = (data.description || '').toLowerCase();
    let scopeOfWork: string[];
    let deliverables: string[];

    if (desc.includes('design') || desc.includes('ui') || desc.includes('brand')) {
      scopeOfWork = [
        'User Research & Competitor Audit',
        'Information Architecture & Wireframes',
        'High-Fidelity Component Library & Design System',
        'Interactive Prototype & Usability Testing',
        'Developer Handoff Specs & Asset Export',
      ];
      deliverables = [
        'Full Figma Workspace & Editable Component System',
        'Interactive Desktop & Mobile Prototypes',
        'Brand Guidelines (Typography, Color, Spacing)',
        'Developer Handoff Package with Exported Assets',
        'Post-Launch Design Support (30 Days)',
      ];
    } else if (desc.includes('mobile') || desc.includes('app')) {
      scopeOfWork = [
        'Mobile Architecture & User Journey Mapping',
        'Native / Cross-Platform UI Development',
        'Backend API & Database Integration',
        'End-to-End Testing & Performance Tuning',
        'App Store Submission Preparation',
      ];
      deliverables = [
        'Production-Ready Mobile Application Build',
        'RESTful API & Authentication Integration',
        'CI/CD Pipeline Configuration',
        'App Store Metadata & Screenshot Package',
        'Source Code Repository & Documentation',
      ];
    } else {
      scopeOfWork = [
        'Discovery, Strategy & Requirements Analysis',
        'Architecture Planning & Visual Design',
        'Core Development & Integration',
        'Testing, QA & Performance Optimization',
        'Deployment, Handoff & 30-Day Support',
      ];
      deliverables = [
        'Comprehensive Project Specification & Design Assets',
        'Production-Ready Application / Deliverables',
        'Integration with Client Systems & APIs',
        'Automated Testing & Security Validation',
        'Documentation & User Handoff Guide',
      ];
    }

    return {
      title: `Proposal for ${data.clientName}`,
      subtitle: data.projectTitle || 'Strategic Freelance Engagement',
      projectOverview: `This proposal outlines the plan for ${data.clientName}'s ${data.projectTitle}. ${data.description ? `Focusing on: ${data.description}` : 'Designed to deliver high-quality results with clear milestone tracking.'}`,
      scopeOfWork,
      deliverables,
      timeline:
        budgetNum > 8000
          ? 'Estimated Delivery: 6–8 weeks from kickoff.'
          : 'Estimated Delivery: 3–5 weeks from kickoff.',
      investment: {
        totalCost: budgetNum,
        paymentTerms: '50% upfront retainer, 50% upon final delivery and acceptance.',
      },
    };
  }

  private chatFallback(message: string, context?: any): string {
    return `Based on your workspace data, here are key insights:

• **Focus on billing**: Ensure all active milestones have corresponding invoices issued.
• **Proposal pipeline**: Follow up on any sent proposals that haven't been viewed yet.
• **Scope protection**: Document all change requests in writing before beginning extra work.
• **Rate strategy**: For new clients, anchor with a clear project value statement in your proposals.

Is there a specific area of your freelance business you'd like to focus on?`;
  }
}
