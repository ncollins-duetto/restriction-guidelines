import AppHeader from "@/components/AppHeader";
import RestrictionsContent from "./RestrictionsContent";

export default function RestrictionsMlpPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <RestrictionsContent />
    </div>
  );
}
