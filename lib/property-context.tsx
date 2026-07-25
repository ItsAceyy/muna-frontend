"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getMyAccess } from "@/lib/auth";
import { MyAccessItem } from "@/lib/types";

type PropertyContextValue = {
  propertyId: string | null;
  propertyName: string | null;
  loadError: string | null;
  loading: boolean;
};

const PropertyContext = createContext<PropertyContextValue>({
  propertyId: null,
  propertyName: null,
  loadError: null,
  loading: true,
});

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveProperty() {
      try {
        const access: MyAccessItem[] = await getMyAccess();
        const managerAccess = access.find(
          (a) => (a.role === "manager" || a.role === "staff") && a.property_id
        );
        if (!managerAccess || !managerAccess.property_id) {
          setLoadError("No property is linked to your account yet.");
          return;
        }
        setPropertyId(managerAccess.property_id);
        setPropertyName(managerAccess.property_name);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load your access");
      } finally {
        setLoading(false);
      }
    }
    resolveProperty();
  }, []);

  return (
    <PropertyContext.Provider value={{ propertyId, propertyName, loadError, loading }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  return useContext(PropertyContext);
}