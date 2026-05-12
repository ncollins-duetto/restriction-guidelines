import AppHeader from "@/components/AppHeader";
import RestrictionsV2Content from "./RestrictionsContent";

export default function RestrictionsV2Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        breadcrumb={["Home", "Pricing & Strategy", "Restriction Guidelines V2"]}
      />
      <RestrictionsV2Content />
    </div>
  );
}
