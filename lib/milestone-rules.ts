import type { ConditionOperator, ProviderRole } from "@prisma/client";

// Nexus Core: Pure helpers for versioned milestone rules policies.
// Isolated from Next.js/server deps so they can be unit-tested directly.

const CONDITION_OPERATORS: Record<string, ConditionOperator> = {
  "<=": "LTE",
  ">=": "GTE",
  "<": "LT",
  ">": "GT",
  "==": "EQ",
} as const;

const PROVIDER_ROLES = new Set<ProviderRole>([
  "LAB",
  "INSPECTOR",
  "ORACLE",
  "CARRIER",
]);

export interface RuleInput {
  parameter?: string;
  operator?: string;
  value?: string;
  unit?: string;
  providerRole?: string;
  isRequired?: boolean;
}

export interface NormalizedRule {
  parameter: string;
  operator: ConditionOperator;
  value: string;
  unit: string | null;
  providerRole: ProviderRole;
  isRequired: boolean;
}

export interface RulesSnapshot {
  conditions: Array<{
    parameter: string;
    operator: string;
    value: string;
    unit: string | null;
    providerRole: string;
    isRequired: boolean;
  }>;
}

// Validates a rule set and normalizes it for storage / snapshots.
// Returns null when any rule is malformed.
export function normalizeRuleSet(rules: RuleInput[]): NormalizedRule[] | null {
  if (!Array.isArray(rules)) return null;
  const normalized: NormalizedRule[] = [];
  for (const condition of rules) {
    if (
      !condition ||
      !condition.parameter?.trim() ||
      !condition.value?.trim() ||
      !condition.operator ||
      !CONDITION_OPERATORS[condition.operator] ||
      !condition.providerRole ||
      !PROVIDER_ROLES.has(condition.providerRole as ProviderRole)
    ) {
      return null;
    }
    normalized.push({
      parameter: condition.parameter.trim(),
      operator: CONDITION_OPERATORS[condition.operator],
      value: condition.value.trim(),
      unit: condition.unit?.trim() || null,
      providerRole: condition.providerRole as ProviderRole,
      isRequired: condition.isRequired ?? true,
    });
  }
  return normalized;
}

export function conditionOperatorFor(operator: string): ConditionOperator | null {
  return CONDITION_OPERATORS[operator] ?? null;
}

// Produces the frozen JSON snapshot payload for a rules policy version.
export function buildRulesSnapshot(rules: NormalizedRule[]): RulesSnapshot {
  return {
    conditions: rules.map((rule) => ({
      parameter: rule.parameter,
      operator: rule.operator,
      value: rule.value,
      unit: rule.unit,
      providerRole: rule.providerRole,
      isRequired: rule.isRequired,
    })),
  };
}

export function nextRulesVersion(current: number): number {
  return Number.isSafeInteger(current) ? current + 1 : 1;
}
