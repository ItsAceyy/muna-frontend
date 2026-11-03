"use client";

import DeliveryDesk from "@/components/DeliveryDesk";
import { getGuardUnits } from "@/lib/guard";

export default function GuardDeliveriesPage() {
  return <DeliveryDesk loadUnits={getGuardUnits} />;
}
