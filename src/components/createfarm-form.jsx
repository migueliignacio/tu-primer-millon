import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateFarmForm() {
  const queryClient = useQueryClient();

  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const itemId = Number(form.get("itemId"));

    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      setError("Introduce un ID válido.");
      return;
    }

    setLoading(true);
    setError("");
    setMetadata(null);

    const { data, error: functionError } = await supabase.functions.invoke(
      "item-metadata",
      {
        body: { itemId },
      },
    );

    setLoading(false);

    if (functionError) {
      setError(functionError.message);
      return;
    }

    setMetadata(data);
  }

  async function handleSave(event) {
    if (!metadata) return;

    const form = new FormData(event.currentTarget.form);
    const qtyMin = Number(form.get("qtyMin"));
    const qtyMax = Number(form.get("qtyMax"));

    if (
      !Number.isFinite(qtyMin) ||
      !Number.isFinite(qtyMax) ||
      qtyMin < 0 ||
      qtyMax < qtyMin
    ) {
      setError("Revisa las cantidades mínima y máxima.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("materials").insert({
      item_id: metadata.itemId,
      item_name: metadata.name,
      item_icon: metadata.icon,
      qty_min: qtyMin,
      qty_max: qtyMax,
      solo: form.get("solo") === "on",
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSaved(true);
    await queryClient.invalidateQueries({ queryKey: ["materials"] });
  }

  return (
    <div className="bg-neutral-700 text-white">
      <p>Form</p>
      <form onSubmit={handleSubmit}>
        <label>
          ID del objeto:
          <input
            className="border"
            name="itemId"
            type="number"
            min="1"
            required
          />
        </label>
        <button
          className="bg-red-300 cursor-pointer"
          type="submit"
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar objeto"}
        </button>
        {error && <p role="alert">{error}</p>}
        {metadata && (
          <div>
            {metadata.icon && <img src={metadata.icon} alt="" width="40" />}
            <p>{metadata.name}</p>
            <small>ID: {metadata.itemId}</small>
            <label>
              Cantidad minima:
              <input name="qtyMin" type="number" min={0} required />
            </label>
            <label>
              Cantidad maxima:
              <input name="qtyMax" type="number" min={0} required />
            </label>
            <label>
              Solo:
              <input name="solo" type="checkbox" />
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saved}
            >
              {saving ? "Guardando..." : saved ? "Guardado" : "Guardar farm"}
            </button>
          </div>
        )}
        {saved && <p>El material se agregó a la tabla.</p>}
      </form>
    </div>
  );
}
