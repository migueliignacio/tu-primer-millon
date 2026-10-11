import { useState } from "react";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useQueries } from "@tanstack/react-query";
import useMaterials from "../hooks/useMaterials";
import EditFarmForm from "./editfarm-form";
import { fetchItemPrice } from "../hooks/useItem";

const features = tableFeatures({});
const PAGE_SIZE = 10;
const columnHelper = createColumnHelper();
const columns = columnHelper.columns([
  columnHelper.accessor("item_name", {
    header: () => (
      <div className="text-left w-full pl-2">NOMBRE DEL MATERIAL</div>
    ),
    cell: (info) => {
      return (
        <div className="flex mx-4 gap-2 items-center">
          <img
            src={info.row.original.item_icon}
            alt={info.row.original.item_name}
            className="w-5 h-5 rounded-sm"
          />
          <p className="group-hover:text-yellow-300">
            {info.row.original.item_name}
          </p>
        </div>
      );
    },
  }),
  columnHelper.accessor("price", {
    header: "PRECIO",
    cell: (info) => {
      const row = info.row.original;
      if (row.priceStatus === "loading") return "Cargando...";
      if (row.priceStatus === "error") return "Error al consultar";
      const valueCopper = info.getValue(); // Total en cobre
      if (valueCopper == null) return "No disponible";
      const Gold = Math.floor(valueCopper / 10000); // oro
      const Silver = Math.floor((valueCopper % 10000) / 100); // plata
      return (
        <div className="">
          <span className="text-yellow-200">
            {Gold}
            <span className="text-yellow-500">g</span>
          </span>{" "}
          <span className="text-zinc-300">
            {Silver}
            <span className="text-zinc-400">s</span>
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("qty_min", {
    header: "CANTIDAD MÍNIMA",
    cell: (info) => {
      return (
        <div>
          <span className="text-neutral-300">{info.getValue()}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("qty_max", {
    header: "CANTIDAD MÁXIMA",
    cell: (info) => {
      return (
        <div>
          <span className="text-neutral-300">{info.getValue()}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("solo", {
    header: "SOLO",
    cell: (info) => (info.getValue() ? "Si" : "No"),
  }),
  columnHelper.accessor("goldXhour", {
    header: "ORO/HORA",
    cell: (info) => {
      const row = info.row.original;

      if (row.price == null) return "—";

      return (
        <div className="flex items-center justify-center gap-2">
          <span className="min-w-24 text-right text-amber-200">
            {new Intl.NumberFormat("es-CL", {
              maximumFractionDigits: 0,
            }).format((row.price * ((row.qty_min + row.qty_max) / 2)) / 10000)}
          </span>
          <img
            src="GoldStack.webp"
            alt="gold"
            className="w-5 h-5 rounded-b-sm"
          />
        </div>
      );
    },
  }),
]);

export default function FarmTable({ canEdit = false }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editingFarm, setEditingFarm] = useState(null);
  const { data: materials = [], isLoading, isError, error } = useMaterials();

  const normalizedSearch = search.trim().toLocaleLowerCase("es-CL");
  const filteredMaterials = normalizedSearch
    ? materials.filter((mat) =>
        mat.item_name?.toLocaleLowerCase("es-CL").includes(normalizedSearch),
      )
    : materials;
  const pageCount = Math.max(1, Math.ceil(filteredMaterials.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const firstItem = currentPage * PAGE_SIZE;
  const visibleMaterials = filteredMaterials.slice(firstItem, firstItem + PAGE_SIZE);

  const queries = useQueries({
    queries: visibleMaterials.map((mat) => ({
      queryKey: ["itemPrice", mat.item_id],

      queryFn: ({ signal }) => fetchItemPrice(mat.item_id, signal),

      staleTime: 30 * 60 * 1000,

      refetchInterval: 30 * 60 * 1000,
    })),
  });

  const visibleRows = visibleMaterials.map((mat, index) => {
    const query = queries[index];
    const apiData = query?.data;
    const marketValue = apiData?.marketValue;

    return {
      ...mat,

      price: Number.isFinite(marketValue) ? Math.floor(marketValue) : null,
      priceStatus: query?.isError
        ? "error"
        : query?.isPending
          ? "loading"
          : "ready",

      marketQuantity: apiData?.quantity ?? 0,

      lastUpdated: apiData?.lastUpdated ?? null,
    };
  });

  const table = useTable({
    features,
    columns,
    data: visibleRows,
  });

  if (isLoading) return <p>Cargando materiales...</p>;
  if (isError) return <p>Error al cargar materiales: {error.message}</p>;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder="Buscar material..."
          aria-label="Buscar material por nombre"
          className="w-full max-w-sm rounded-md border border-neutral-600 bg-neutral-900 px-4 py-2 text-white placeholder:text-neutral-400 focus:border-amber-400 focus:outline-none"
        />
        <p className="text-sm text-neutral-300" aria-live="polite">
          {filteredMaterials.length === 0
            ? "0 farmeos"
            : `Mostrando ${firstItem + 1}–${Math.min(firstItem + PAGE_SIZE, filteredMaterials.length)} de ${filteredMaterials.length} farmeos`}
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-neutral-600 shadow-xl">
      <table className="w-full min-w-[700px] text-center">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="bg-neutral-900 px-2 py-4 text-white"
                >
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </th>
              ))}
              {canEdit && <th className="bg-neutral-900 px-2 py-4 text-white">ACCIONES</th>}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (canEdit ? 1 : 0)} className="bg-neutral-700 py-4 text-white">
                {normalizedSearch ? "No se encontraron materiales." : "No hay materiales."}
              </td>
            </tr>
          )}
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="group">
              {row.getAllCells().map((cell) => (
                <td
                  key={cell.id}
                  className="bg-neutral-700 text-white py-2 group-hover:bg-neutral-600 transition-colors duration-150"
                >
                  <table.FlexRender cell={cell} />
                </td>
              ))}
              {canEdit && (
                <td className="bg-neutral-700 px-2 py-2">
                  <button type="button" onClick={() => setEditingFarm(row.original)} className="rounded bg-amber-500 px-3 py-1 font-bold text-neutral-950">Editar</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {filteredMaterials.length > 0 && (
        <nav aria-label="Paginación de farmeos" className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0} className="rounded border border-neutral-500 bg-neutral-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
          <span className="min-w-28 text-center" aria-live="polite">Página {currentPage + 1} de {pageCount}</span>
          <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount - 1} className="rounded border border-neutral-500 bg-neutral-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40">Siguiente</button>
        </nav>
      )}
      {canEdit && editingFarm && <EditFarmForm key={editingFarm.id} farm={editingFarm} onClose={() => setEditingFarm(null)} />}
    </div>
  );
}
