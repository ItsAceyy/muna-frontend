"use client";

import { useEffect, useState } from "react";
import { UnitTypeDef } from "@/lib/types";
import { getOrganizationIdForProperty, listUnitTypes } from "@/lib/unit-types";
import GenerateUnitsModal from "./GenerateUnitsModal";
import ImportUnitsCsvModal from "./ImportUnitsCsvModal";
import NewUnitModal from "./NewUnitModal";
import UnitTypesManager from "./UnitTypesManager";
import { primaryButton, secondaryButton } from "./setup-styles";

type Panel = "types" | "generate" | "import" | "add";

interface UnitSetupToolbarProps {
  propertyId: string;
  /** Known up front on manager pages. When omitted it is resolved from the property. */
  organizationId?: string | null;
  existingUnitNumbers: string[];
  onChanged: () => void;
}

/** Everything a manager uses to set up a building's units, in one place, so the owner
 *  dashboard and the manager's Residences page offer exactly the same tools. */
export default function UnitSetupToolbar({
  propertyId,
  organizationId,
  existingUnitNumbers,
  onChanged,
}: UnitSetupToolbarProps) {
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);
  const orgId = organizationId ?? resolvedOrgId;

  const [types, setTypes] = useState<UnitTypeDef[] | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [typesIntro, setTypesIntro] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) return;
    let cancelled = false;
    getOrganizationIdForProperty(propertyId)
      .then((id) => {
        if (!cancelled) setResolvedOrgId(id);
      })
      .catch(() => {
        // The toolbar stays disabled; the page's own unit load surfaces the problem.
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId, propertyId]);

  // Bumped when the type list changes, to re-fetch it.
  const [typesVersion, setTypesVersion] = useState(0);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    listUnitTypes(orgId)
      .then((data) => {
        if (!cancelled) setTypes(data);
      })
      .catch((err) => {
        if (!cancelled) setNotice(err instanceof Error ? err.message : "Could not load unit types");
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, typesVersion]);

  function open(target: Panel) {
    // Every unit is labelled with a type, so there is nothing to generate or import
    // against until at least one exists. Send the manager there with a reason.
    if (target !== "types" && types && types.length === 0) {
      setTypesIntro(
        "Add your unit types first. Every unit is labelled with one, and occupancy reports group on them."
      );
      setPanel("types");
      return;
    }
    setTypesIntro(undefined);
    setPanel(target);
  }

  function handleCreated(count: number) {
    onChanged();
    setNotice(`${count.toLocaleString()} ${count === 1 ? "unit" : "units"} added`);
    window.setTimeout(() => setNotice(null), 5000);
  }

  const ready = types !== null;
  const close = () => setPanel(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {notice && (
          <span role="status" className="mr-1 text-xs text-muted-foreground">
            {notice}
          </span>
        )}
        <button type="button" onClick={() => open("types")} disabled={!orgId} className={secondaryButton}>
          Unit types
        </button>
        <button type="button" onClick={() => open("import")} disabled={!ready} className={secondaryButton}>
          Import CSV
        </button>
        <button type="button" onClick={() => open("generate")} disabled={!ready} className={secondaryButton}>
          Generate
        </button>
        <button type="button" onClick={() => open("add")} disabled={!ready} className={primaryButton}>
          Add unit
        </button>
      </div>

      {panel === "types" && orgId && (
        <UnitTypesManager
          organizationId={orgId}
          intro={typesIntro}
          onClose={close}
          onChanged={() => {
            setTypesVersion((v) => v + 1);
            // A renamed type changes the label on every unit that uses it.
            onChanged();
          }}
        />
      )}
      {panel === "generate" && types && (
        <GenerateUnitsModal
          propertyId={propertyId}
          types={types}
          existingUnitNumbers={existingUnitNumbers}
          onClose={close}
          onCreated={handleCreated}
        />
      )}
      {panel === "import" && types && (
        <ImportUnitsCsvModal
          propertyId={propertyId}
          typeNames={types.map((t) => t.name)}
          onClose={close}
          onCreated={handleCreated}
        />
      )}
      {panel === "add" && types && (
        <NewUnitModal
          propertyId={propertyId}
          types={types}
          onClose={close}
          onCreated={() => handleCreated(1)}
        />
      )}
    </>
  );
}
