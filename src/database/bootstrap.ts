import { hydrateDemoStateFromPostgres } from "../seed.js";
import { hydrateAuthAccountsFromPostgres } from "../modules/auth/auth.service.js";
import { hydrateSupportTicketsFromPostgres } from "../modules/support/support.store.js";
import { hydrateProgrammeSettingsFromPostgres } from "../modules/configurations/configurations.module.js";
import { hydrateReportsFromPostgres } from "../modules/utilities/utilities.module.js";
import { hydrateDeviceTokensFromPostgres } from "../modules/notifications/notifications.service.js";
import { env } from "../config/env.js";

function describeDatabaseUrl() {
  try {
    const url = new URL(env.databaseUrl);
    return `${url.protocol}//${url.username || "unknown-user"}@${url.hostname}${url.pathname}`;
  } catch {
    return "invalid DATABASE_URL";
  }
}

// Production startup hook. It loads all mutable SIP data from PostgreSQL before
// routes are mounted, so app restarts no longer reset students, schools,
// placements, settings, IRB templates, lesson formats, support tickets or users.
export async function bootstrapProductionState() {
  console.log(`Loading production state from PostgreSQL: ${describeDatabaseUrl()}`);
  const [workflowState] = await Promise.all([
    hydrateDemoStateFromPostgres(),
    hydrateAuthAccountsFromPostgres(),
    hydrateSupportTicketsFromPostgres(),
    hydrateProgrammeSettingsFromPostgres(),
    hydrateReportsFromPostgres(),
    hydrateDeviceTokensFromPostgres(),
  ]);
  console.log(`Production state ${workflowState} from PostgreSQL.`);
}
