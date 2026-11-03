import { apiFetch } from "./api-client";
import { Package } from "./types";

export async function getPropertyPackages(
  propertyId: string,
  status: "arrived" | "picked_up",
  limit = 200
): Promise<Package[]> {
  return apiFetch<Package[]>(`/properties/${propertyId}/packages?status=${status}&limit=${limit}`);
}

export async function logPackage(
  propertyId: string,
  unitId: string,
  description: string
): Promise<Package> {
  return apiFetch<Package>(`/properties/${propertyId}/units/${unitId}/packages`, {
    method: "POST",
    body: JSON.stringify({ description: description || undefined }),
  });
}

export async function markPackageCollected(propertyId: string, packageId: string): Promise<Package> {
  return apiFetch<Package>(`/properties/${propertyId}/packages/${packageId}/pickup`, { method: "POST" });
}
