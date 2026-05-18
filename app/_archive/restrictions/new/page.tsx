import { Suspense } from "react";
import NewRestrictionForm from "./NewRestrictionForm";

export default function NewRestrictionPage() {
  return (
    <Suspense>
      <NewRestrictionForm />
    </Suspense>
  );
}
