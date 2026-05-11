import { aiRiskNotes, borrowers, loanApplications, policyProfiles, scoreResults } from "./data";
import { scoreApplication } from "./scoring";

export function applicationsWithBorrowers() {
  return loanApplications.map((application) => ({
    ...application,
    borrower: borrowers.find((borrower) => borrower.id === application.borrowerId),
    latestScore: latestScoreForApplication(application.id)
  }));
}

export function applicationDetail(id: string) {
  const application = loanApplications.find((item) => item.id === id);
  if (!application) return null;
  const borrower = borrowers.find((item) => item.id === application.borrowerId);
  const latestScore = latestScoreForApplication(id) ?? scoreApplication(application, policyProfiles.find((p) => p.name === "Balanced") ?? policyProfiles[0]);
  return {
    application,
    borrower,
    latestScore,
    notes: aiRiskNotes.filter((note) => note.applicationId === id),
    comparisons: policyProfiles.map((policy) => ({ policy, score: scoreApplication(application, policy) }))
  };
}

export function latestScoreForApplication(applicationId: string) {
  return scoreResults.filter((score) => score.applicationId === applicationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}
