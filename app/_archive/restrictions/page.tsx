import AppHeader from "@/components/AppHeader";
import RestrictionsContent from "./RestrictionsContent";

export default function RestrictionsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <RestrictionsContent />
    </div>
  );
}
