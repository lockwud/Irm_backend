import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { workflow } from "../../seed.js";
import { persistState, readState } from "../../database/state-store.js";

type DemoAccount = { role: string; identifier: string; passwordHash: string; name: string; mustChangePassword?: boolean };

function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase().replace("@st.ammusted.edu.gh", "@st.aamusted.edu.gh");
}

function identifierMatches(left: string, right: string) {
  return normalizeIdentifier(left) === normalizeIdentifier(right);
}

const demoAccounts: DemoAccount[] = [
  { role: "student", identifier: "student@aamusted.edu.gh", passwordHash: hashPassword("Student@123"), name: "Kwame Mensah", mustChangePassword: false },
  { role: "student", identifier: "5201040012", passwordHash: hashPassword("5201040012"), name: "Kwame Mensah", mustChangePassword: true },
  { role: "supervisor", identifier: "STA-0182", passwordHash: hashPassword("Supervisor@123"), name: "Dr. Samuel Ofori", mustChangePassword: false },
  { role: "coordinator", identifier: "coordinator@aamusted.edu.gh", passwordHash: hashPassword("Coordinator@123"), name: "Emmanuel Owusu", mustChangePassword: false },
];

export function hydrateAuthAccountsFromState(saved: DemoAccount[]) {
  if (Array.isArray(saved)) demoAccounts.splice(0, demoAccounts.length, ...saved);
}

export async function hydrateAuthAccountsFromPostgres() {
  const saved = await readState<DemoAccount[]>("sip.auth-accounts");
  if (saved?.length) hydrateAuthAccountsFromState(saved);
  else await persistAccountsNow();
}

export async function persistAccountsNow() {
  await persistState("sip.auth-accounts", demoAccounts);
}

function persistAccounts() {
  persistState("sip.auth-accounts", demoAccounts);
}

export function studentInitialPassword(input: { id?: string; email?: string }) {
  const emailPrefix = input.email?.split("@")[0]?.trim();
  return emailPrefix || input.id || "";
}

export function upsertDemoAccount(account: Omit<DemoAccount, "passwordHash"> & { password: string }) {
  const index = demoAccounts.findIndex((item) => item.role === account.role && identifierMatches(item.identifier, account.identifier));
  const hashedAccount = { role: account.role, identifier: account.identifier, passwordHash: hashPassword(account.password), name: account.name, mustChangePassword: account.mustChangePassword };
  if (index >= 0) demoAccounts[index] = { ...demoAccounts[index], ...hashedAccount };
  else demoAccounts.push(hashedAccount);
  persistAccounts();
  return { role: account.role, identifier: account.identifier, name: account.name, mustChangePassword: account.mustChangePassword ?? true };
}

export function provisionStudentAccount(student: { id: string; email: string; name: string }) {
  const password = studentInitialPassword(student);
  upsertDemoAccount({ role: "student", identifier: student.email, password, name: student.name, mustChangePassword: true });
  const correctedEmail = student.email.replace("@st.ammusted.edu.gh", "@st.aamusted.edu.gh");
  if (correctedEmail !== student.email) upsertDemoAccount({ role: "student", identifier: correctedEmail, password, name: student.name, mustChangePassword: true });
  upsertDemoAccount({ role: "student", identifier: student.id, password, name: student.name, mustChangePassword: true });
  return { identifier: student.email, alternateIdentifier: student.id, initialPassword: password, mustChangePassword: true };
}

export function provisionStaffAccount(staff: { staffId: string; email?: string; name: string; role: "coordinator" | "supervisor" }) {
  const password = staff.staffId;
  upsertDemoAccount({ role: staff.role, identifier: staff.staffId, password, name: staff.name, mustChangePassword: true });
  if (staff.email) upsertDemoAccount({ role: staff.role, identifier: staff.email, password, name: staff.name, mustChangePassword: true });
  return { identifier: staff.email || staff.staffId, alternateIdentifier: staff.staffId, initialPassword: password, mustChangePassword: true };
}

export class AuthService {
  login(role: string, identifier: string, password: string) {
    let account = demoAccounts.find((item) => item.role === role && identifierMatches(item.identifier, identifier));
    if (!account && role === "student") {
      const student = workflow.students.find((item) => identifierMatches(item.email, identifier) || item.id === identifier);
      if (student && studentInitialPassword(student) === password) {
        provisionStudentAccount(student);
        account = demoAccounts.find((item) => item.role === role && identifierMatches(item.identifier, identifier));
      }
    }
    if (!account || !bcrypt.compareSync(password, account.passwordHash)) return null;
    const token = jwt.sign({ role: account.role, identifier: account.identifier, name: account.name, mustChangePassword: account.mustChangePassword ?? false }, env.jwtSecret, { expiresIn: "8h" });
    return { token, accessToken: token, tokenType: "Bearer", user: { role: account.role, identifier: account.identifier, name: account.name, mustChangePassword: account.mustChangePassword ?? false } };
  }

  changePassword(role: string, identifier: string, currentPassword: string, newPassword: string) {
    const account = demoAccounts.find((item) => item.role === role && identifierMatches(item.identifier, identifier));
    if (!account || !bcrypt.compareSync(currentPassword, account.passwordHash)) return null;
    account.passwordHash = hashPassword(newPassword);
    account.mustChangePassword = false;
    persistAccounts();
    return { message: "Password changed successfully.", mustChangePassword: false };
  }
}
