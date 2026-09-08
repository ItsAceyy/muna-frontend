"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useProperty } from "@/lib/property-context";
import { checkInWalkIn, getGuardUnits } from "@/lib/guard";
import { GuardUnit, IdType, WalkInCheckinResult } from "@/lib/types";
import { formatTime } from "../visit-display";

const ID_TYPES: { value: IdType; label: string }[] = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's licence" },
];

export default function WalkInCheckinPage() {
  const {
    propertyId,
    config,
    loadError: accessError,
    loading: accessLoading,
  } = useProperty();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [unitId, setUnitId] = useState("");
  const [hostName, setHostName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [idType, setIdType] = useState<IdType | "">("");
  const [idNumber, setIdNumber] = useState("");
  const [idPhoto, setIdPhoto] = useState<Blob | null>(null);
  const [facePhoto, setFacePhoto] = useState<Blob | null>(null);

  const [units, setUnits] = useState<GuardUnit[]>([]);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WalkInCheckinResult | null>(null);

  useEffect(() => {
    // A gym has no units to fetch - has_spaces is false and the picker is hidden.
    if (!propertyId || !config.has_spaces) return;
    getGuardUnits(propertyId)
      .then((data) => {
        setUnits(data);
        setUnitsError(null);
      })
      .catch((err) =>
        setUnitsError(err instanceof Error ? err.message : "Could not load units")
      );
  }, [propertyId, config.has_spaces]);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setUnitId("");
    setHostName("");
    setPurpose("");
    setIdType("");
    setIdNumber("");
    setIdPhoto(null);
    setFacePhoto(null);
    setError(null);
    setResult(null);
  };

  const canSubmit =
    Boolean(propertyId) && fullName.trim() !== "" && phone.trim() !== "" && facePhoto !== null;

  const handleSubmit = async () => {
    if (!propertyId || !facePhoto) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await checkInWalkIn(propertyId, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        facePhoto,
        unitId: unitId || null,
        hostName: hostName.trim() || null,
        purpose: purpose.trim() || null,
        idType: idType || null,
        idNumber: idNumber.trim() || null,
        idPhoto,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (accessLoading) return <div className="min-h-[60vh]" />;

  if (accessError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-rust">{accessError}</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="px-6 py-10 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-sage/15 text-sage mx-auto mb-5 flex items-center justify-center text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-display font-medium text-foreground mb-1">
          {result.full_name} is checked in
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          At {formatTime(result.checked_in_at)}
          {result.unit_number ? ` · ${config.space_noun} ${result.unit_number}` : ""}
          {result.host_name ? ` · Visiting ${result.host_name}` : ""}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetForm}
            className="px-5 py-3 rounded-xl bg-sage text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Check in someone else
          </button>
          <Link
            href="/guard"
            className="px-5 py-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Back to on site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-lg mx-auto pb-28">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Reception
        </p>
        <h1 className="text-3xl font-display font-medium text-foreground">
          Check in a {config.visitor_noun.toLowerCase()}
        </h1>
      </div>

      <PhotoCapture value={facePhoto} onChange={setFacePhoto} />

      <Section title={config.visitor_noun}>
        <Field label="Full name" required>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        <Field label="Phone" required>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section
        title="Where are they going?"
        hint={
          config.has_spaces
            ? `A ${config.space_noun.toLowerCase()} or a host. Both are optional.`
            : "Who are they here to see? Optional."
        }
      >
        {config.has_spaces && (
          <Field label={config.space_noun}>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className={inputClass}
              disabled={units.length === 0}
            >
              <option value="">
                {units.length === 0
                  ? `No ${config.space_noun_plural.toLowerCase()} on this property`
                  : `No ${config.space_noun.toLowerCase()}`}
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_number}
                  {u.floor ? ` · Floor ${u.floor}` : ""}
                </option>
              ))}
            </select>
            {unitsError && <p className="text-xs text-rust mt-1">{unitsError}</p>}
          </Field>
        )}
        <Field label="Host or company">
          <input
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Who are they here to see?"
            className={inputClass}
          />
        </Field>
        <Field label="Purpose">
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Delivery, meeting, viewing..."
            className={inputClass}
          />
        </Field>
      </Section>

      {config.requires_id_capture && (
      <Section title="Identification" hint="Optional — skip it where ID is not collected.">
        <Field label="ID type">
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value as IdType | "")}
            className={inputClass}
          >
            <option value="">Not recorded</option>
            {ID_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ID number">
          <input
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        <Field label="ID photo">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setIdPhoto(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-muted-foreground file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-secondary file:text-foreground file:text-sm file:font-medium"
          />
        </Field>
      </Section>
      )}

      {error && (
        <div className="mt-5 px-4 py-3 rounded-xl bg-rust/10 border border-rust/20">
          <p className="text-sm text-rust">{error}</p>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-canvas/95 backdrop-blur border-t border-border/60">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full px-5 py-4 rounded-xl bg-sage text-white text-base font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {submitting ? "Checking in..." : "Check in"}
          </button>
          {!facePhoto && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              A photo is required to check someone in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-border/60 bg-card text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {title}
      </h2>
      {hint && <p className="text-xs text-muted-foreground mb-3">{hint}</p>}
      <div className={hint ? "space-y-3" : "space-y-3 mt-3"}>{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-foreground mb-1.5 block">
        {label}
        {required && <span className="text-rust ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

/** Face capture. Uses the desk camera when one is available and falls back to a
 *  file picker, so the console still works on a machine with no webcam. */
function PhotoCapture({
  value,
  onChange,
}: {
  value: Blob | null;
  onChange: (blob: Blob | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  // Release the camera if the guard navigates away mid-capture.
  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("No camera available. Upload a photo instead.");
      setCameraOn(false);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onChange(blob);
          stopCamera();
        }
      },
      "image/jpeg",
      0.85
    );
  };

  if (previewUrl) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Captured visitor photo"
          className="w-24 h-24 rounded-xl object-cover bg-secondary"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground mb-1">Photo captured</p>
          <button
            onClick={() => onChange(null)}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      {cameraOn ? (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full aspect-[4/3] rounded-xl bg-ink object-cover mb-3"
          />
          <div className="flex gap-3">
            <button
              onClick={capture}
              className="flex-1 px-4 py-3 rounded-xl bg-ink text-white text-sm font-medium"
            >
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-foreground mb-1">
            Visitor photo <span className="text-rust">*</span>
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Taken at the desk, so the person on site can be identified later.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={startCamera}
              className="px-4 py-3 rounded-xl bg-ink text-white text-sm font-medium"
            >
              Use camera
            </button>
            <label className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground cursor-pointer">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {cameraError && <p className="text-xs text-rust mt-2">{cameraError}</p>}
        </>
      )}
    </div>
  );
}
