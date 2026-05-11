import type { AiRiskNote, Borrower, LoanApplication, ScoreResult } from "@/types/domain";

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
  generateRiskNarrative(input: RiskNarrativeInput): Promise<RiskNarrativeOutput>;
}

export class MockAiRiskNarrativeProvider implements AiRiskNarrativeProvider {
  async generateRiskNarrative(input: RiskNarrativeInput): Promise<RiskNarrativeOutput> {
    const top = [...input.score.signals].sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 3);
    const lowerAmount = Math.round(input.application.requestedAmount * 0.78);
    return {
      summary: `RiskyBusiness generated a simulated ${input.score.decision.replace("_", " ")} narrative. The deterministic score remains ${Math.round(input.score.totalRiskScore)}/100 and is not changed by this note.`,
      plainEnglishExplanation: `The strongest simulated risk drivers are ${top.map((s) => s.name.toLowerCase()).join(", ")}. This narrative only interprets supplied simulator signals and is not a lending recommendation.`,
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
  async generateRiskNarrative(input: RiskNarrativeInput): Promise<RiskNarrativeOutput> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return new MockAiRiskNarrativeProvider().generateRiskNarrative(input);

    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
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

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) return new MockAiRiskNarrativeProvider().generateRiskNarrative(input);
    const payload = await response.json();
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content || "{}");
    return {
      summary: String(parsed.summary || ""),
      plainEnglishExplanation: String(parsed.plainEnglishExplanation || ""),
      reviewQuestions: Array.isArray(parsed.reviewQuestions) ? parsed.reviewQuestions.map(String) : [],
      mitigationOptions: Array.isArray(parsed.mitigationOptions) ? parsed.mitigationOptions.map(String) : [],
      counterfactual: String(parsed.counterfactual || ""),
      promptMetadata: `provider=openai-compatible; model=${model}; safety=simulation_only`
    };
  }
}

export function getAiProvider(): AiRiskNarrativeProvider {
  return process.env.AI_PROVIDER === "openai" ? new OpenAiRiskNarrativeProvider() : new MockAiRiskNarrativeProvider();
}

export function toAiRiskNote(applicationId: string, scoreResultId: string, provider: string, output: RiskNarrativeOutput): AiRiskNote {
  return {
    id: `note-${Date.now()}`,
    applicationId,
    scoreResultId,
    provider,
    ...output,
    createdAt: new Date().toISOString()
  };
}
