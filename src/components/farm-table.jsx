import { useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import useFarms from "../hooks/useFarms";
import { fetchItemPrice } from "../hooks/useItem";
import EditFarmForm from "./editfarm-form";
import FarmDetails from "./farm-details";

const PAGE_SIZE = 10;
const formatGold = (value) => new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 0,
}).format(value);

export default function FarmTable({ canEdit = false }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const queryClient = useQueryClient();
  const { data: farms = [], isLoading, isError, error } = useFarms();

  const needle = search.trim().toLocaleLowerCase("es-CL");
  const filtered = needle
    ? farms.filter((farm) => farm.name.toLocaleLowerCase("es-CL").includes(needle) ||
        farm.farm_materials.some((material) => material.item_name.toLocaleLowerCase("es-CL").includes(needle)))
    : farms;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const firstItem = currentPage * PAGE_SIZE;
  const visible = filtered.slice(firstItem, firstItem + PAGE_SIZE);
  const itemIds = [...new Set(visible.flatMap((farm) => farm.farm_materials.map((material) => material.item_id)))];
  const priceQueries = useQueries({
    queries: itemIds.map((itemId) => ({
      queryKey: ["itemPrice", itemId],
      queryFn: ({ signal }) => fetchItemPrice(itemId, signal),
      staleTime: 30 * 60 * 1000,
      refetchInterval: 30 * 60 * 1000,
    })),
  });
  const priceByItemId = new Map(itemIds.map((itemId, index) => [itemId, priceQueries[index]]));
  const editingFarm = farms.find((farm) => farm.id === editingId);
  const detailsFarm = visible.find((farm) => farm.id === detailsId);

  async function handleDelete(farm) {
    if (!window.confirm(`¿Borrar el farmeo "${farm.name}" y todos sus materiales? Esta acción no se puede deshacer.`)) return;
    setDeletingId(farm.id);
    setActionError("");
    try {
      const { data, error: deleteError } = await supabase.from("farms").delete().eq("id", farm.id).select("id").maybeSingle();
      if (deleteError) throw deleteError;
      if (!data) throw new Error("No se pudo borrar el farmeo o no tienes permiso.");
      if (editingId === farm.id) setEditingId(null);
      if (detailsId === farm.id) setDetailsId(null);
      await queryClient.invalidateQueries({ queryKey: ["farms"] });
    } catch (deleteError) {
      setActionError(deleteError.message || "No se pudo borrar el farmeo.");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) return <p>Cargando farmeos...</p>;
  if (isError) return <p role="alert">Error al cargar farmeos: {error.message}</p>;

  return (
    <section className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); setDetailsId(null); }}
          placeholder="Buscar farmeo o material..." aria-label="Buscar farmeo o material"
          className="w-full max-w-sm rounded-md border border-green/50 bg-fondo px-4 py-2 text-dorado placeholder:text-dorado/55 focus:border-dorado focus:outline-none" />
        <p className="text-sm text-dorado/75" aria-live="polite">
          {filtered.length === 0 ? "0 farmeos" : `Mostrando ${firstItem + 1}–${Math.min(firstItem + PAGE_SIZE, filtered.length)} de ${filtered.length} farmeos`}
        </p>
      </div>
      {actionError && <p role="alert" className="mb-3 text-red-300">{actionError}</p>}
      <div className="overflow-x-auto rounded-lg border border-green/50 shadow-xl">
        <table className="w-full min-w-[700px] text-left">
          <thead className="bg-fondo text-dorado">
            <tr>
              <th scope="col" className="px-4 py-4">FARMEO</th>
              <th scope="col" className="px-4 py-4">MATERIALES</th>
              <th scope="col" className="px-4 py-4">SOLO</th>
              <th scope="col" className="px-4 py-4">ORO/HORA</th>
              {canEdit && <th scope="col" className="px-4 py-4">ACCIONES</th>}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={canEdit ? 5 : 4} className="bg-slate px-4 py-5">
                {needle ? "No se encontraron farmeos." : "No hay farmeos."}
              </td></tr>
            )}
            {visible.map((farm) => {
              const prices = farm.farm_materials.map((material) => {
                const query = priceByItemId.get(material.item_id);
                return Number.isFinite(query?.data?.marketValue) ? Math.floor(query.data.marketValue) : null;
              });
              const total = farm.farm_materials.length > 0 && prices.every((price) => price !== null)
                ? farm.farm_materials.reduce((sum, material, index) =>
                    sum + prices[index] * ((material.qty_min + material.qty_max) / 2) / 10000, 0)
                : null;
              return (
                <tr key={farm.id} className="border-t border-green/30 bg-slate text-dorado hover:bg-green/20">
                  <th scope="row" className="px-4 py-4 font-semibold">
                    <button type="button" onClick={() => setDetailsId(farm.id)} className="text-left hover:text-dorado-fuerte hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-dorado-fuerte" aria-label={`Ver detalles de ${farm.name}`}>{farm.name}</button>
                  </th>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setDetailsId(farm.id)} className="flex items-center gap-2 rounded text-left text-sm hover:text-dorado-fuerte hover:underline focus-visible:outline-2 focus-visible:outline-dorado-fuerte" aria-label={`Ver materiales de ${farm.name}`}>
                      {farm.farm_materials[0]?.item_icon && <img src={farm.farm_materials[0].item_icon} alt="" className="h-6 w-6 shrink-0 rounded" />}
                      <span>{farm.farm_materials.length === 0 ? "Sin materiales" : farm.farm_materials[0].item_name}</span>
                      {farm.farm_materials.length > 1 && <span className="whitespace-nowrap text-dorado/70">+{farm.farm_materials.length - 1} más</span>}
                      <span className="whitespace-nowrap text-dorado/70">· Ver detalles</span>
                    </button>
                  </td>
                  <td className="px-4 py-4">{farm.solo ? "Sí" : "No"}</td>
                  <td className="px-4 py-4 font-bold">{total === null ? "—" : (
                    <span className="flex items-center gap-2">
                      <span>{formatGold(total)}</span>
                      <img src="/GoldStack.webp" alt="" className="h-5 w-5 rounded-b-sm" />
                    </span>
                  )}</td>
                  {canEdit && <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setEditingId(farm.id)} className="rounded bg-dorado px-3 py-1 font-bold text-fondo">Editar</button>
                      <button type="button" onClick={() => handleDelete(farm)} disabled={deletingId !== null} className="rounded border border-red-300/60 px-3 py-1 text-red-200 disabled:opacity-50">
                        {deletingId === farm.id ? "Borrando..." : "Borrar"}
                      </button>
                    </div>
                  </td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && <nav aria-label="Paginación de farmeos" className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => { setPage(currentPage - 1); setDetailsId(null); }} disabled={currentPage === 0} className="rounded border border-green/60 bg-slate px-4 py-2 disabled:opacity-40">Anterior</button>
        <span aria-live="polite">Página {currentPage + 1} de {pageCount}</span>
        <button type="button" onClick={() => { setPage(currentPage + 1); setDetailsId(null); }} disabled={currentPage >= pageCount - 1} className="rounded border border-green/60 bg-slate px-4 py-2 disabled:opacity-40">Siguiente</button>
      </nav>}
      {detailsFarm && <FarmDetails farm={detailsFarm} priceByItemId={priceByItemId} onClose={() => setDetailsId(null)} />}
      {canEdit && editingFarm && <EditFarmForm key={editingFarm.id} farm={editingFarm} onClose={() => setEditingId(null)} />}
    </section>
  );
}
