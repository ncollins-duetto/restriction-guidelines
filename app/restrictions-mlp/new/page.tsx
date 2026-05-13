import { Suspense } from "react";
import NewRestrictionForm from "./NewRestrictionForm";

export default function NewRestrictionMlpPage() {
  return (
    <Suspense>
      <NewRestrictionForm />
    </Suspense>
  );
}
