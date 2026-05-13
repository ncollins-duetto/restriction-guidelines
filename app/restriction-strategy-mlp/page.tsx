import AppHeader from "@/components/AppHeader";
import StrategyContent from "./StrategyContent";

export default function RestrictionStrategyMlpPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        breadcrumb={["Home", "Pricing & Strategy", "Restriction Strategy (MLP)"]}
        propertyName="Grand Hotel Downtown"
      />
      <StrategyContent />
    </div>
  );
}
