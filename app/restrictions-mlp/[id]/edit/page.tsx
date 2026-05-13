"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useRestrictions } from "@/lib/restrictions-context";
import NewRestrictionForm from "@/app/restrictions-mlp/new/NewRestrictionForm";

function EditFormWrapper() {
  const { id } = useParams<{ id: string }>();
  const { rules } = useRestrictions();
  const rule = rules.find((r) => r.id === id);
  return <NewRestrictionForm mode="edit" seed={rule} />;
}

export default function EditRestrictionMlpPage() {
  return (
    <Suspense>
      <EditFormWrapper />
    </Suspense>
  );
}
