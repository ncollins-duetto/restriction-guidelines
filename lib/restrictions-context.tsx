"use client";

import { createContext, useContext, useState } from "react";
import type { GuidelineRule } from "./types";
import { MOCK_RULES } from "./data";

type RestrictionsContextType = {
  rules: GuidelineRule[];
  ruleStates: Record<string, boolean>;
  addRule: (rule: GuidelineRule) => void;
  updateRule: (id: string, updates: Partial<GuidelineRule>) => void;
  toggleRule: (id: string) => void;
  toast: string | null;
  clearToast: () => void;
};

const RestrictionsContext = createContext<RestrictionsContextType | null>(null);

export function RestrictionsProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<GuidelineRule[]>(MOCK_RULES);
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_RULES.map((r) => [r.id, r.active]))
  );
  const [toast, setToast] = useState<string | null>(null);

  function addRule(rule: GuidelineRule) {
    setRules((prev) => [...prev, rule]);
    setRuleStates((prev) => ({ ...prev, [rule.id]: true }));
    setToast("Guideline created");
  }

  function updateRule(id: string, updates: Partial<GuidelineRule>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    setToast("Changes saved");
  }

  function toggleRule(id: string) {
    setRuleStates((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function clearToast() {
    setToast(null);
  }

  return (
    <RestrictionsContext.Provider value={{ rules, ruleStates, addRule, updateRule, toggleRule, toast, clearToast }}>
      {children}
    </RestrictionsContext.Provider>
  );
}

export function useRestrictions() {
  const ctx = useContext(RestrictionsContext);
  if (!ctx) throw new Error("useRestrictions must be used within RestrictionsProvider");
  return ctx;
}
