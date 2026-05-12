import { RestrictionsProvider } from "@/lib/restrictions-context";

export default function RestrictionsLayout({ children }: { children: React.ReactNode }) {
  return <RestrictionsProvider>{children}</RestrictionsProvider>;
}
