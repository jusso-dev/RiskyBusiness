import { borrowers, loanApplications, policyProfiles, riskSignals } from "../src/lib/data";

async function main() {
  console.log("RiskyBusiness seed preview");
  console.log(`${borrowers.length} borrowers`);
  console.log(`${loanApplications.length} loan applications`);
  console.log(`${riskSignals.length} risk signals`);
  console.log(`${policyProfiles.length} policy profiles`);
  console.log("The running demo uses in-memory seed data. Wire this script to Prisma createMany when persisting data.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
