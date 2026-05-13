import { UpstreamError } from "./errors";
import { id } from "./ids";
import { logger } from "./logger";
import type { AiRiskNote, Borrower, LoanApplication, ScoreResult } from "@/types/domain";

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4.1-mini";

export interface RiskNarrativeInput {
  borrower: Borrower;
  application: LoanApplication;
  score: ScoreResult;
}

export interface RiskNarrativeOutput {
  summary: string;
  plainEnglishExplanation: string;
  reviewQuestions: string[];
  mitigationOptions: string[];
  counterfactual: string;
  promptMetadata: string;
}

export interface AiRiskNarrativeProvider {
  readonly name: string;
  generateRiskNarrative(input: RiskNarrativeInput): Promise<RiskNarrativeOutput>;
}

export class MockAiRiskNarrativeProvider implements AiRiskNarrativeProvider {
  readonly name = "mock";

  async generateRiskNarrative(input: RiskNarrativeInput): Promise<RiskNarrativeOutput> {
    const top = [...input.score.signals].sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 3);
    const lowerAmount = Math.round(input.application.requestedAmount * 0.78);
    const driverList = top.length ? top.map((s) => s.name.toLowerCase()).join(", ") : "no enabled signals";

    return {
      summary: `RiskyBusiness generated a simulated ${input.score.decision.replace("_", " ")} narrative. The deterministic score remains ${Math.round(input.score.totalRiskScore)}/100 and is not changed by this note.`,
      plainEnglishExplanation: `The strongest simulated risk drivers are ${driverList}. This narrative only interprets supplied simulator signals and is not a lending recommendation.`,
      reviewQuestions: [
        "Which supplied income and expense assumptions should be checked before relying on this scenario?",
        "Is the requested amount materially changing the affordability signals?",
        "Which policy threshold caused the simulated decision band?"
      ],
      mitigationOptions: [
        "Run a sensitivity scenario with a lower requested amount.",
        "Compare the application against Conservative, Balanced, and Growth policies.",
        "Inspect cash buffer, debt-to-income, and recent-default signals before changing policy weights."
      ],
      counterfactual: `If the requested amount changed from ${input.application.requestedAmount.toLocaleString("en-AU")} to ${lowerAmount.toLocaleString("en-AU")}, the simulated loan-to-income pressure would decrease. Re-score the scenario to confirm whether the decision band changes.`,
      promptMetadata: "provider=mock; safety=simulation_only; protected_attributes=excluded"
    };
  }
}

export class OpenAiRiskNarrativeProvider implements AiRiskNarrativeProvider {
  readonly name = "openai-compatible";
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fallback: AiRiskNarrativeProvider;

  constructor(opts: { apiKey: string; baseUrl?: string; model?: string; timeoutMs?: number; fallback?: AiRiskNarrativeProvider }) {
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.model = opts.model || DEFAULT_MODEL;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fallback = opts.fallback ?? new MockAiRiskNarrativeProvider();
  }

  async generateRiskNarrative(input: RiskNarrativeInput): Promise<RiskNarrativeOutput> {
    try {
      return await this.invoke(input);
    } catch (error) {
      logger.warn("AI provider request failed, falling back to mock narrative", {
        provider: this.name,
        model: this.model,
        error: error instanceof Error ? error : { message: String(error) }
      });
      return this.fallback.generateRiskNarrative(input);
    }
  }

  private async invoke(input: RiskNarrativeInput): Promise<RiskNarrativeOutput> {
    const topSignals = [...input.score.signals].sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 5);
    const prompt = [
      "You are writing a loan risk simulator narrative for a portfolio project.",
      "Do not claim this is a real credit decision. Do not provide legal or financial advice.",
      "Do not infer protected attributes. Use only supplied simulated signals.",
      "Return JSON with summary, plainEnglishExplanation, reviewQuestions, mitigationOptions, counterfactual.",
      JSON.stringify({
        borrower: { industry: input.borrower.industry, income: input.borrower.annualIncome },
        application: input.application,
        deterministicScore: input.score.totalRiskScore,
        deterministicDecision: input.score.decision,
        topSignals
      })
    ].join("\n");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new UpstreamError(`AI provider returned ${response.status}`, { status: response.status, body: body.slice(0, 500) });
    }

    const payload = (await response.json().catch(() => null)) as { choices?: Array<{ message?: { content?: string } }> } | null;
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      throw new UpstreamError("AI provider returned no content");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new UpstreamError("AI provider returned non-JSON content");
    }

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      plainEnglishExplanation: typeof parsed.plainEnglishExplanation === "string" ? parsed.plainEnglishExplanation : "",
      reviewQuestions: Array.isArray(parsed.reviewQuestions) ? parsed.reviewQuestions.map(String) : [],
      mitigationOptions: Array.isArray(parsed.mitigationOptions) ? parsed.mitigationOptions.map(String) : [],
      counterfactual: typeof parsed.counterfactual === "string" ? parsed.counterfactual : "",
      promptMetadata: `provider=${this.name}; model=${this.model}; safety=simulation_only`
    };
  }
}

export function getAiProvider(): AiRiskNarrativeProvider {
  if (process.env.AI_PROVIDER !== "openai") {
    return new MockAiRiskNarrativeProvider();
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn("AI_PROVIDER=openai but OPENAI_API_KEY is not set; using mock provider");
    return new MockAiRiskNarrativeProvider();
  }
  const timeoutMs = process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : undefined;
  return new OpenAiRiskNarrativeProvider({
    apiKey,
    baseUrl: process.env.OPENAI_BASE_URL,
    model: process.env.OPENAI_MODEL,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : undefined
  });
}

export function toAiRiskNote(applicationId: string, scoreResultId: string, provider: string, output: RiskNarrativeOutput): AiRiskNote {
  return {
    id: id("note"),
    applicationId,
    scoreResultId,
    provider,
    ...output,
    createdAt: new Date().toISOString()
  };
}
