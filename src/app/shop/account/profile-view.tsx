"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Address, CustomerPublic } from "@/lib/types";
import { useCustomer } from "../customer-context";
import { useToast } from "../../toast-context";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

const AVATAR_SIZE = 256;

function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-1.7A2 2 0 0 1 10.5 3.4h3a2 2 0 0 1 1.7.9L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m14.5 5.5 4 4L8 20H4v-4L14.5 5.5zM12.5 7.5l4 4M17 3l4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

/** Downscale the picked image to a small square JPEG data URL. */
async function fileToAvatar(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    // Cover-crop from the center so any aspect ratio becomes a square.
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const EMPTY_ADDRESS = {
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

type AddressForm = typeof EMPTY_ADDRESS;

export function ProfileView({
  customer,
  welcomeBanner,
  onLogout,
}: {
  customer: CustomerPublic;
  welcomeBanner?: React.ReactNode;
  onLogout: () => void;
}) {
  const { setCustomer } = useCustomer();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `error` is already the inline banner state here.
  const { success, error: toastError, warning } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(customer.name);

  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState<AddressForm>(EMPTY_ADDRESS);

  const addresses = customer.addresses ?? [];

  async function patchProfile(patch: {
    name?: string;
    avatar?: string;
    addresses?: Address[];
  }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/customers/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.error ?? "Could not save changes. Try again.";
        setError(msg);
        toastError(msg);
        return false;
      }
      setCustomer(data);
      return true;
    } catch {
      const msg = "Network error — your changes were not saved.";
      setError(msg);
      toastError(msg);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      warning("Please choose an image file.");
      return;
    }
    try {
      const avatar = await fileToAvatar(file);
      if (await patchProfile({ avatar })) success("Profile photo updated.");
    } catch {
      const msg = "Could not process that image. Try another one.";
      setError(msg);
      toastError(msg);
    }
  }

  async function handleNameSave() {
    if (nameDraft.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      warning("Name must be at least 2 characters.");
      return;
    }
    if (await patchProfile({ name: nameDraft.trim() })) {
      setEditingName(false);
      success("Name updated.");
    }
  }

  function openAddForm() {
    setAddressDraft({ ...EMPTY_ADDRESS, name: customer.name, phone: customer.phone });
    setEditingAddressId(null);
    setAddressFormOpen(true);
    setError(null);
  }

  function openEditForm(address: Address) {
    setAddressDraft({
      label: address.label,
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setEditingAddressId(address.id);
    setAddressFormOpen(true);
    setError(null);
  }

  async function handleAddressSave(e: React.FormEvent) {
    e.preventDefault();
    const entry: Address = {
      id: editingAddressId ?? `addr-${Date.now().toString(36)}`,
      ...addressDraft,
      line2: addressDraft.line2 || undefined,
      isDefault: editingAddressId
        ? addresses.find((a) => a.id === editingAddressId)?.isDefault
        : addresses.length === 0,
    };
    const next = editingAddressId
      ? addresses.map((a) => (a.id === editingAddressId ? entry : a))
      : [...addresses, entry];
    const wasEditing = Boolean(editingAddressId);
    if (await patchProfile({ addresses: next })) {
      setAddressFormOpen(false);
      setEditingAddressId(null);
      success(wasEditing ? "Address updated." : "Address added.");
    }
  }

  async function handleAddressDelete(id: string) {
    if (await patchProfile({ addresses: addresses.filter((a) => a.id !== id) }))
      success("Address removed.");
  }

  async function handleSetDefault(id: string) {
    if (
      await patchProfile({
        addresses: addresses.map((a) => ({ ...a, isDefault: a.id === id })),
      })
    )
      success("Default delivery address updated.");
  }

  const addressField = (key: keyof AddressForm) => ({
    value: addressDraft[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setAddressDraft((d) => ({ ...d, [key]: e.target.value })),
  });

  return (
    <div className="animate-scale-in w-full max-w-2xl space-y-6">
      {/* Profile card */}
      <div className="overflow-hidden rounded-3xl border border-line bg-surface/80 shadow-2xl shadow-black/10 backdrop-blur">
        <div className="bg-brand-gradient px-8 py-7">
          <div className="flex items-center gap-5">
            <div className="relative">
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-black text-2xl font-extrabold text-accent shadow-lg shadow-black/30">
                {customer.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customer.avatar} alt={customer.name} className="h-full w-full object-cover" />
                ) : (
                  customer.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent bg-black text-foreground transition hover:scale-110 disabled:opacity-60"
                aria-label="Change profile photo"
                title="Change profile photo"
              >
                <CameraIcon />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarPick}
              />
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="w-full max-w-60 rounded-lg border-0 bg-black px-3 py-1.5 text-sm font-bold text-foreground outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleNameSave}
                    disabled={busy}
                    className="rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-foreground transition hover:brightness-125 disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setNameDraft(customer.name);
                    }}
                    className="text-xs font-semibold text-black/70 transition hover:text-black"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h1 className="truncate text-xl font-extrabold text-black">{customer.name}</h1>
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(customer.name);
                      setEditingName(true);
                    }}
                    className="rounded-full bg-black/15 p-1.5 text-black transition hover:bg-black/25"
                    aria-label="Edit name"
                    title="Edit name"
                  >
                    <PencilIcon />
                  </button>
                </div>
              )}
              <div className="mt-1 text-sm font-semibold text-black/70">Buyzo Member</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-8 py-6">
          {welcomeBanner}
          {error && (
            <p className="animate-fade-in rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-between border-b border-line pb-3 text-sm">
            <span className="text-muted">Email</span>
            <span className="font-medium">{customer.email}</span>
          </div>
          <div className="flex justify-between border-b border-line pb-3 text-sm">
            <span className="text-muted">Phone</span>
            <span className="font-medium">
              {customer.phone ? (
                <>
                  {customer.phone}{" "}
                  <span className="ml-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                    VERIFIED
                  </span>
                </>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Member since</span>
            <span className="font-medium">
              {new Date(customer.createdAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Address book */}
      <div className="rounded-3xl border border-line bg-surface/80 p-6 shadow-2xl shadow-black/10 backdrop-blur sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span className="text-accent">
                <PinIcon />
              </span>
              Saved addresses
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Used as delivery options when you place an order.
            </p>
          </div>
          {!addressFormOpen && (
            <button
              type="button"
              onClick={openAddForm}
              className="shrink-0 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-bold transition hover:brightness-110"
            >
              + Add address
            </button>
          )}
        </div>

        {addresses.length === 0 && !addressFormOpen && (
          <div className="rounded-2xl border border-dashed border-line bg-surface-2/60 px-5 py-8 text-center text-sm text-muted">
            No addresses yet. Add one so checkout can use it.
          </div>
        )}

        {addresses.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`rounded-2xl border p-4 transition ${
                  address.isDefault ? "border-accent/60 bg-accent/5" : "border-line bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{address.label}</span>
                  {address.isDefault && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium">{address.name}</p>
                <p className="mt-0.5 text-sm leading-6 text-muted">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} — {address.pincode}
                  <br />
                  📞 {address.phone}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address.id)}
                      disabled={busy}
                      className="text-accent transition hover:underline disabled:opacity-60"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditForm(address)}
                    className="text-muted transition hover:text-foreground"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddressDelete(address.id)}
                    disabled={busy}
                    className="text-muted transition hover:text-danger disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {addressFormOpen && (
          <form
            onSubmit={handleAddressSave}
            className="animate-fade-up mt-4 space-y-3 rounded-2xl border border-line bg-surface-2/50 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingAddressId ? "Edit address" : "New address"}
              </h3>
              <div className="flex gap-1.5">
                {["Home", "Office", "Other"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setAddressDraft((d) => ({ ...d, label }))}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      addressDraft.label === label
                        ? "bg-brand-gradient"
                        : "border border-line bg-surface text-muted hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-muted">Full name *</span>
                <input {...addressField("name")} required className={inputClass} placeholder="Receiver's name" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted">Phone *</span>
                <input {...addressField("phone")} required type="tel" className={inputClass} placeholder="Contact number" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-muted">Address line 1 *</span>
              <input {...addressField("line1")} required className={inputClass} placeholder="House no., street, area" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted">Address line 2</span>
              <input {...addressField("line2")} className={inputClass} placeholder="Landmark (optional)" />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium text-muted">City *</span>
                <input {...addressField("city")} required className={inputClass} placeholder="City" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted">State *</span>
                <input {...addressField("state")} required className={inputClass} placeholder="State" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted">Pincode *</span>
                <input
                  {...addressField("pincode")}
                  required
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="e.g. 452001"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setAddressFormOpen(false);
                  setEditingAddressId(null);
                }}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-brand-gradient px-5 py-2 text-sm font-bold transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save address"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* My orders */}
      <Link
        href="/shop/account/orders"
        className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 transition hover:border-accent/40"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg">
            📦
          </span>
          <span>
            <span className="block text-sm font-bold">My orders</span>
            <span className="block text-xs text-muted">
              Track your orders and delivery status
            </span>
          </span>
        </span>
        <span className="text-accent">→</span>
      </Link>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/shop"
          className="flex-1 rounded-lg bg-brand-gradient px-4 py-2.5 text-center text-sm font-bold shadow-lg shadow-accent/20 transition hover:brightness-110"
        >
          Continue shopping
        </Link>
        <button
          onClick={onLogout}
          className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition hover:border-danger/50 hover:text-danger"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
