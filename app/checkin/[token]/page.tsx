"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";
import { GuestInviteRecord, IdType } from "@/lib/types";

/** The page a guest opens from the link their host sent them.
 *
 *  Public by design - the token is the credential, and the guest has no account.
 *  They fill this in before arriving so the gate already knows them. */

const ID_TYPES: { value: IdType; label: string }[] = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's licence" },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-border/60 bg-card text-base text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring/35 focus:border-border-strong transition-shadow";

export default function GuestCheckinPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [invite, setInvite] = useState<GuestInviteRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState<IdType>("national_id");
  const [idNumber, setIdNumber] = useState("");
  const [facePhoto, setFacePhoto] = useState<Blob | null>(null);
  const [idPhoto, setIdPhoto] = useState<Blob | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<GuestInviteRecord>(`/guest-invites/${token}`)
      .then((data) => {
        setInvite(data);
        if (data.guest_name) setFullName(data.guest_name);
        if (data.guest_phone) setPhone(data.guest_phone);
        setLoadError(null);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 410) {
          setLoadError("This invitation has expired or has already been used.");
        } else if (err instanceof ApiError && err.status === 404) {
          setLoadError("We could not find that invitation. Check the link you were sent.");
        } else {
          setLoadError(err instanceof Error ? err.message : "Could not load your invitation");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const canSubmit =
    fullName.trim() !== "" &&
    phone.trim() !== "" &&
    idNumber.trim() !== "" &&
    facePhoto !== null &&
    idPhoto !== null;

  const submit = async () => {
    if (!canSubmit || !facePhoto || !idPhoto) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("full_name", fullName.trim());
      form.set("phone", phone.trim());
      form.set("id_type", idType);
      form.set("id_number", idNumber.trim());
      form.set("face_photo", facePhoto, "face.jpg");
      form.set("id_photo", idPhoto, "id.jpg");
      await apiFetch(`/guest-invites/${token}/checkin`, { method: "POST", body: form });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Shell><div className="h-40 rounded-2xl bg-card border border-border/60 animate-pulse" /></Shell>;
  }

  if (loadError) {
    return (
      <Shell>
        <div className="bg-card rounded-2xl border border-border/60 p-8 text-center">
          <p className="text-base font-medium text-foreground mb-1">
            This link is not usable
          </p>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Ask the person who invited you to send a new one.
          </p>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="bg-card rounded-2xl border border-border/60 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sage/15 text-sage mx-auto mb-4 flex items-center justify-center text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-display font-medium text-foreground mb-1">
            You are registered
          </h1>
          <p className="text-sm text-muted-foreground">
            Show your ID at the gate when you arrive. Reception already has your details.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          You have been invited
        </p>
        <h1 className="text-3xl font-display font-medium text-foreground mb-2">
          Register your visit
        </h1>
        <p className="text-sm text-muted-foreground">
          Fill this in before you arrive and the gate will be expecting you. Your ID is
          held securely and is only visible to property management.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <Labelled label="Your name" required>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </Labelled>
        <Labelled label="Phone" required>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            className={inputClass}
          />
        </Labelled>
        <Labelled label="ID type" required>
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value as IdType)}
            className={inputClass}
          >
            {ID_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Labelled>
        <Labelled label="ID number" required>
          <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className={inputClass} />
        </Labelled>
      </div>

      <PhotoInput
        title="Your photo"
        hint="So the guard can recognise you at the gate."
        value={facePhoto}
        onChange={setFacePhoto}
        allowCamera
      />

      <PhotoInput
        title="Photo of your ID"
        hint="Held privately. Only property management can view it."
        value={idPhoto}
        onChange={setIdPhoto}
      />

      {error && (
        <div className="mt-5 px-4 py-3 rounded-xl bg-rust/10 border border-rust/20">
          <p className="text-sm text-rust">{error}</p>
        </div>
      )}

      <button
        onClick={submit}
        disabled={!canSubmit || submitting}
        className="w-full mt-6 px-5 py-4 rounded-xl bg-ink text-primary-foreground text-base font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {submitting ? "Registering…" : "Complete registration"}
      </button>
      {!canSubmit && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Both photos and all fields are needed before you can register.
        </p>
      )}
      {invite?.expires_at && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          This link expires {new Date(invite.expires_at + "Z").toLocaleString()}.
        </p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas px-5 py-10">
      <div className="max-w-md mx-auto">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-6">
          Muna
        </p>
        {children}
      </div>
    </div>
  );
}

function Labelled({
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

/** Camera where the device has one, file picker everywhere else. Guests are on
 *  phones, so the camera path matters more here than at the desk. */
function PhotoInput({
  title,
  hint,
  value,
  onChange,
  allowCamera = false,
}: {
  title: string;
  hint: string;
  value: Blob | null;
  onChange: (b: Blob | null) => void;
  allowCamera?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
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
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob((b) => { if (b) { onChange(b); stop(); } }, "image/jpeg", 0.85);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 mt-4">
      {preview ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-20 h-20 rounded-xl object-cover bg-secondary" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">{title} added</p>
            <button
              onClick={() => onChange(null)}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Replace
            </button>
          </div>
        </div>
      ) : cameraOn ? (
        <>
          <video ref={videoRef} playsInline muted className="w-full aspect-[4/3] rounded-xl bg-ink object-cover mb-3" />
          <div className="flex gap-3">
            <button onClick={capture} className="flex-1 px-4 py-3 rounded-xl bg-ink text-primary-foreground text-sm font-medium">
              Capture
            </button>
            <button onClick={stop} className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-foreground mb-1">
            {title} <span className="text-rust">*</span>
          </p>
          <p className="text-xs text-muted-foreground mb-3">{hint}</p>
          <div className="flex flex-wrap gap-3 items-center">
            {allowCamera && (
              <button onClick={start} className="px-4 py-3 rounded-xl bg-ink text-primary-foreground text-sm font-medium">
                Use camera
              </button>
            )}
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
