"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getMyAccess } from "@/lib/auth";
import { MyAccessItem, PropertyConfig, VerticalConfig } from "@/lib/types";
import { FALLBACK_CONFIG, getPropertyConfig } from "@/lib/vertical";

type PropertyContextValue = {
  propertyId: string | null;
  propertyName: string | null;
  /** The property's business-type configuration: vocabulary and feature flags. */
  config: VerticalConfig;
  /** The full response, including which modules are switched on. Null until loaded. */
  propertyConfig: PropertyConfig | null;
  loadError: string | null;
  loading: boolean;
};

const PropertyContext = createContext<PropertyContextValue>({
  propertyId: null,
  propertyName: null,
  config: FALLBACK_CONFIG,
  propertyConfig: null,
  loadError: null,
  loading: true,
});

const DEFAULT_ROLES = ["manager", "staff"];

export function PropertyProvider({
  children,
  roles = DEFAULT_ROLES,
}: {
  children: ReactNode;
  /** Which access roles may resolve the active property. The guard console passes
   *  ["guard"], since a guard is scoped to exactly one property and never has
   *  manager access to it. */
  roles?: string[];
}) {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string | null>(null);
  const [propertyConfig, setPropertyConfig] = useState<PropertyConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Depend on the contents rather than the array identity, so an inline literal
  // like roles={["guard"]} does not re-run this on every render.
  const roleKey = roles.join(",");

  useEffect(() => {
    async function resolveProperty() {
      try {
        const allowed = roleKey.split(",");
        const access: MyAccessItem[] = await getMyAccess();
        const match = access.find(
          (a) => allowed.includes(a.role) && a.property_id
        );
        if (!match || !match.property_id) {
          setLoadError("No property is linked to your account yet.");
          return;
        }
        setPropertyId(match.property_id);
        setPropertyName(match.property_name);

        // Vocabulary and feature flags for this kind of business. A failure here
        // must not block the page - the fallback config is residential wording
        // with everything on.
        try {
          setPropertyConfig(await getPropertyConfig(match.property_id));
        } catch {
          setPropertyConfig(null);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load your access");
      } finally {
        setLoading(false);
      }
    }
    resolveProperty();
  }, [roleKey]);

  return (
    <PropertyContext.Provider
      value={{
        propertyId,
        propertyName,
        config: propertyConfig?.config ?? FALLBACK_CONFIG,
        propertyConfig,
        loadError,
        loading,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  return useContext(PropertyContext);
}
