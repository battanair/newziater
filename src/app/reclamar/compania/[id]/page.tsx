"use client";

import { use } from "react";
import { ReclamarEntidad } from "@/components/ReclamarEntidad";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReclamarEntidad tipo="compania" id={id} />;
}
