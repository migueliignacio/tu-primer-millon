import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateMaterials } from "../hooks/useMaterials";

export default function EditFarmForm({ farm, onClose }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await updateMaterials(farm.id, {
        qtyMin: Number(form.get("qtyMin")),
        qtyMax: Number(form.get("qtyMax")),
        solo: form.get("solo") === "on",
      });
      await queryClient.invalidateQueries({ queryKey: ["materials"] });
      onClose();
    } catch (saveError) {
      setError(saveError.message || "No se pudo actualizar el farmeo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 rounded-lg bg-slate p-5">
      <h2 className="mb-4 text-xl font-bold">Editar {farm.item_name} (ID: {farm.item_id})</h2>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1">Cantidad mínima<input name="qtyMin" type="number" min="0" step="1" defaultValue={farm.qty_min} required className="rounded border border-green/60 bg-fondo px-3 py-2 text-dorado" /></label>
        <label className="flex flex-col gap-1">Cantidad máxima<input name="qtyMax" type="number" min="0" step="1" defaultValue={farm.qty_max} required className="rounded border border-green/60 bg-fondo px-3 py-2 text-dorado" /></label>
        <label className="flex items-center gap-2 self-end pb-2"><input name="solo" type="checkbox" defaultChecked={farm.solo} /> Solo</label>
      </div>
      <div className="mt-4 flex gap-3">
        <button type="submit" disabled={saving} className="rounded bg-dorado px-4 py-2 font-bold text-fondo disabled:opacity-50">{saving ? "Guardando..." : "Guardar cambios"}</button>
        <button type="button" onClick={onClose} disabled={saving} className="rounded bg-green/50 px-4 py-2 disabled:opacity-50">Cancelar</button>
      </div>
      {error && <p role="alert" className="mt-3 text-red-300">{error}</p>}
    </form>
  );
}
