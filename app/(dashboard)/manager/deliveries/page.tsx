"use client";

import DeliveryDesk from "@/components/DeliveryDesk";
import { apiFetch } from "@/lib/api-client";
import { Unit } from "@/lib/types";

// A manager reaches units through the general endpoint; the guard one refuses them.
function loadUnits(propertyId: string) {
  return apiFetch<Unit[]>(`/properties/${propertyId}/units`);
}

export default function ManagerDeliveriesPage() {
  return <DeliveryDesk loadUnits={loadUnits} />;
}
