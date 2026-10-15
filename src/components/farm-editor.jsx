import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const fieldClass = "rounded border border-green/60 bg-fondo px-3 py-2 text-dorado";

export default function FarmEditor({ farm, onSaved, onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(farm?.name ?? "");
  const [solo, setSolo] = useState(farm?.solo ?? false);
  const [itemIdInput, setItemIdInput] = useState("");
  const [materials, setMaterials] = useState(() =>
    (farm?.farm_materials ?? []).map((material) => ({
      item_id: material.item_id,
      item_name: material.item_name,
      item_icon: material.item_icon,
      qty_min: String(material.qty_min),
      qty_max: String(material.qty_max),
    })),
  );
  const [busy, setBusy] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function updateMaterial(itemId, field, value) {
    setMaterials((current) => current.map((material) =>
      material.item_id === itemId ? { ...material, [field]: value } : material,
    ));
  }

  async function addMaterial() {
    const itemId = Number(itemIdInput);
    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      setError("Introduce una ID de objeto válida.");
      return;
    }
    if (materials.some((material) => material.item_id === itemId)) {
      setError("Esa ID ya está en este farmeo.");
      return;
    }
    setLookingUp(true);
    setError("");
    setSaved(false);
    try {
      const { data, error: lookupError } = await supabase.functions.invoke("item-metadata", {
        body: { itemId },
      });
      if (lookupError) throw lookupError;
      if (!data?.name || Number(data.itemId) !== itemId) {
        throw new Error("No se encontraron metadatos para esta ID.");
      }
      setMaterials((current) => [...current, {
        item_id: itemId,
        item_name: data.name,
        item_icon: data.icon ?? null,
        qty_min: "0",
        qty_max: "0",
      }]);
      setItemIdInput("");
    } catch (lookupError) {
      setError(lookupError.message || "No se pudo consultar el objeto.");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (busy) return;
    if (!name.trim()) {
      setError("Escribe un nombre para el farmeo.");
      return;
    }
    if (materials.length === 0) {
      setError("Agrega al menos un material.");
      return;
    }
    const payload = materials.map((material) => ({
      item_id: material.item_id,
      item_name: material.item_name,
      item_icon: material.item_icon,
      qty_min: Number(material.qty_min),
      qty_max: Number(material.qty_max),
    }));
    if (payload.some((material) =>
      !Number.isSafeInteger(material.qty_min) || !Number.isSafeInteger(material.qty_max) ||
      material.qty_min < 0 || material.qty_max < material.qty_min
    )) {
      setError("Revisa las cantidades: deben ser enteras y la máxima no puede ser menor.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const args = { p_name: name.trim(), p_solo: solo, p_materials: payload };
      const { error: saveError } = farm
        ? await supabase.rpc("update_farm", { p_farm_id: farm.id, ...args })
        : await supabase.rpc("create_farm", args);
      if (saveError) throw saveError;
      await queryClient.invalidateQueries({ queryKey: ["farms"] });
      if (farm) onSaved?.();
      else {
        setName("");
        setSolo(false);
        setMaterials([]);
        setSaved(true);
      }
    } catch (saveError) {
      setError(saveError.code === "23505"
        ? "No puedes repetir una ID de objeto dentro del mismo farmeo."
        : saveError.message || "No se pudo guardar el farmeo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg bg-slate p-5 shadow-lg">
      <h3 className="mb-4 text-xl font-bold">{farm ? `Editar ${farm.name}` : "Crear farmeo"}</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <label className="flex max-w-md flex-col gap-1">
          Nombre del farmeo
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required className={fieldClass} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={solo} onChange={(event) => setSolo(event.target.checked)} /> Solo
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            ID del material
            <input type="number" min="1" step="1" value={itemIdInput} onChange={(event) => setItemIdInput(event.target.value)} className={fieldClass} />
          </label>
          <button type="button" onClick={addMaterial} disabled={busy || lookingUp} className="rounded bg-green/50 px-4 py-2 disabled:opacity-50">
            {lookingUp ? "Buscando..." : "Agregar material"}
          </button>
        </div>
        {materials.length > 0 && (
          <ul className="space-y-3" aria-label="Materiales del farmeo">
            {materials.map((material) => (
              <li key={material.item_id} className="flex flex-wrap items-end gap-3 rounded border border-green/40 bg-fondo p-3">
                <div className="flex min-w-40 flex-1 items-center gap-2">
                  {material.item_icon && <img src={material.item_icon} alt="" className="h-8 w-8" />}
                  <span>{material.item_name} <small className="text-dorado/60">#{material.item_id}</small></span>
                </div>
                <label className="flex flex-col gap-1 text-sm">Mínimo
                  <input type="number" min="0" step="1" required value={material.qty_min} onChange={(event) => updateMaterial(material.item_id, "qty_min", event.target.value)} className={`${fieldClass} w-24`} />
                </label>
                <label className="flex flex-col gap-1 text-sm">Máximo
                  <input type="number" min="0" step="1" required value={material.qty_max} onChange={(event) => updateMaterial(material.item_id, "qty_max", event.target.value)} className={`${fieldClass} w-24`} />
                </label>
                <button type="button" onClick={() => setMaterials((current) => current.filter((entry) => entry.item_id !== material.item_id))} disabled={busy} className="rounded border border-red-300/50 px-3 py-2 text-red-200 disabled:opacity-50">Quitar</button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={busy || lookingUp} className="rounded bg-dorado px-4 py-2 font-bold text-fondo disabled:opacity-50">
            {busy ? "Guardando..." : farm ? "Guardar cambios" : "Crear farmeo"}
          </button>
          {onClose && <button type="button" onClick={onClose} disabled={busy} className="rounded bg-green/50 px-4 py-2">Cancelar</button>}
        </div>
      </form>
      {error && <p role="alert" className="mt-3 text-red-300">{error}</p>}
      {saved && <p role="status" className="mt-3 text-green-300">Farmeo creado correctamente.</p>}
    </section>
  );
}
