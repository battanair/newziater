"use client";

import { use } from "react";
import { ReclamarEntidad } from "@/components/ReclamarEntidad";

export default function Page({ params }: { params: Promise<{ id: string; lang: string }> }) {
  const { id } = use(params);
  return <ReclamarEntidad tipo="sala" id={id} />;
}
