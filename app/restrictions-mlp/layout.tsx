import { RestrictionsProvider } from "@/lib/restrictions-context";

export default function RestrictionsMlpLayout({ children }: { children: React.ReactNode }) {
  return <RestrictionsProvider>{children}</RestrictionsProvider>;
}
