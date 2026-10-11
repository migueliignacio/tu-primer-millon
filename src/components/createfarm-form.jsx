import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export default function CreateFarmForm() {
  const queryClient = useQueryClient();
  const [itemIdInput, setItemIdInput] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();
    const itemId = Number(itemIdInput);
    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      setError("Introduce una ID válida.");
      return;
    }
    setLoading(true);
    setError("");
    setMetadata(null);
    setSaved(false);
    try {
      const { data: existing, error: lookupError } = await supabase.from("materials").select("id").eq("item_id", itemId).limit(1).maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) {
        setError("Ya existe un farmeo con esta ID de objeto.");
        return;
      }
      const { data, error: functionError } = await supabase.functions.invoke("item-metadata", { body: { itemId } });
      if (functionError) throw functionError;
      if (!data?.name || Number(data.itemId) !== itemId) throw new Error("No se encontraron metadatos válidos para esta ID.");
      setMetadata(data);
    } catch (searchError) {
      setError(searchError.message || "No se pudo buscar el objeto.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!metadata || saving) return;
    const form = new FormData(event.currentTarget);
    const qtyMin = Number(form.get("qtyMin"));
    const qtyMax = Number(form.get("qtyMax"));
    if (!Number.isSafeInteger(qtyMin) || !Number.isSafeInteger(qtyMax) || qtyMin < 0 || qtyMax < qtyMin) {
      setError("Usa cantidades enteras; la máxima debe ser igual o mayor que la mínima.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data: existing, error: lookupError } = await supabase.from("materials").select("id").eq("item_id", metadata.itemId).limit(1).maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) {
        setError("Ya existe un farmeo con esta ID de objeto.");
        return;
      }
      const { error: insertError } = await supabase.from("materials").insert({
        item_id: metadata.itemId,
        item_name: metadata.name,
        item_icon: metadata.icon,
        qty_min: qtyMin,
        qty_max: qtyMax,
        solo: form.get("solo") === "on",
      });
      if (insertError) throw insertError;
      setSaved(true);
      setMetadata(null);
      setItemIdInput("");
      await queryClient.invalidateQueries({ queryKey: ["materials"] });
    } catch (saveError) {
      setError(saveError.code === "23505" ? "Ya existe un farmeo con esta ID de objeto." : saveError.message || "No se pudo guardar el farmeo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg bg-neutral-700 p-5 shadow-lg">
      <h2 className="mb-4 text-xl font-bold">Ingresar material</h2>
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">ID del objeto
          <input name="itemId" type="number" min="1" step="1" required value={itemIdInput} onChange={(event) => { setItemIdInput(event.target.value); setMetadata(null); setSaved(false); setError(""); }} className="rounded border border-neutral-500 bg-neutral-900 px-3 py-2 text-white" />
        </label>
        <button type="submit" disabled={loading || saving} className="rounded bg-amber-500 px-4 py-2 font-bold text-neutral-950 disabled:opacity-50">{loading ? "Buscando..." : "Buscar objeto"}</button>
      </form>
      {metadata && (
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            {metadata.icon && <img src={metadata.icon} alt="" width="40" height="40" />}
            <div><p className="font-bold">{metadata.name}</p><p className="text-sm text-neutral-300">ID: {metadata.itemId}</p></div>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1">Cantidad mínima<input name="qtyMin" type="number" min="0" step="1" required className="rounded border border-neutral-500 bg-neutral-900 px-3 py-2 text-white" /></label>
            <label className="flex flex-col gap-1">Cantidad máxima<input name="qtyMax" type="number" min="0" step="1" required className="rounded border border-neutral-500 bg-neutral-900 px-3 py-2 text-white" /></label>
            <label className="flex items-center gap-2 self-end pb-2"><input name="solo" type="checkbox" /> Solo</label>
          </div>
          <button type="submit" disabled={saving} className="rounded bg-green-600 px-4 py-2 font-bold disabled:opacity-50">{saving ? "Guardando..." : "Guardar farmeo"}</button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-red-300">{error}</p>}
      {saved && <p role="status" className="mt-3 text-green-300">Material agregado correctamente.</p>}
    </div>
  );
}
