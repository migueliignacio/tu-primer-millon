import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useQueries } from "@tanstack/react-query";
import useMaterials from "../hooks/useMaterials";
import { fetchItemPrice } from "../hooks/useItem";

const features = tableFeatures({});
const columnHelper = createColumnHelper();
const columns = columnHelper.columns([
  columnHelper.accessor("item_icon", {
    header: "",
    cell: (info) => (
      <div className="flex items-center justify-center">
        <img
          src={info.getValue()}
          alt={info.row.original.item_name}
          className="w-5 h-5 rounded-sm"
        />
      </div>
    ),
  }),
  columnHelper.accessor("item_name", {
    header: "Nombre del Material",
  }),
  columnHelper.accessor("price", {
    header: "Precio",
    cell: (info) => {
      const row = info.row.original;
      if (row.priceStatus === "loading") return "Cargando...";
      if (row.priceStatus === "error") return "Error al consultar";
      const valueCopper = info.getValue(); // Total en cobre
      if (valueCopper == null) return "No disponible";
      const Gold = Math.floor(valueCopper / 10000); // oro
      const Silver = Math.floor((valueCopper % 10000) / 100); // plata
      return `${Gold}g ${Silver}s`;
    },
  }),
  columnHelper.accessor("qty_min", { header: "Cantidad mínima" }),
  columnHelper.accessor("qty_max", { header: "Cantidad máxima" }),
  columnHelper.accessor("solo", {
    header: "Solo",
    cell: (info) => (info.getValue() ? "Si" : "No"),
  }),
  columnHelper.accessor("goldXhour", {
    header: "Oro/Hora",
    cell: (info) => {
      const row = info.row.original;
      if (row.price == null) return "—";
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="min-w-24 text-right">
            {((row.price * ((row.qty_min + row.qty_max) / 2)) / 10000).toFixed(
              0,
            )}
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

export default function FarmTable() {
  const { data: materials = [], isLoading, isError, error } = useMaterials();

  const queries = useQueries({
    queries: materials.map((mat) => ({
      queryKey: ["itemPrice", mat.item_id],

      queryFn: ({ signal }) => fetchItemPrice(mat.item_id, signal),

      staleTime: 30 * 60 * 1000,

      refetchInterval: 30 * 60 * 1000,
    })),
  });

  const fullMats = materials.map((mat, index) => {
    const query = queries[index];
    const apiData = query?.data;
    const marketValue = apiData?.marketValue;

    return {
      ...mat,

      price: Number.isFinite(marketValue) ? Math.floor(marketValue) : null,
      priceStatus: query?.isError ? "error" : query?.isPending ? "loading" : "ready",

      marketQuantity: apiData?.quantity ?? 0,

      lastUpdated: apiData?.lastUpdated ?? null,
    };
  });

  const table = useTable({
    features,
    columns,
    data: fullMats,
  });

  if (isLoading) return <p>Cargando materiales...</p>;
  if (isError) return <p>Error al cargar materiales: {error.message}</p>;

  return (
    <div className="w-full max-w-7xl h-100 mx-auto">
      <table className="table w-full border-collapse border border-red-500 text-center">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="bg-slate-800 px-2 py-4 text-white"
                >
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-red-100 text-black justify-center">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="bg-slate-100 text-black justify-center">
              {row.getAllCells().map((cell) => (
                <td key={cell.id} className="bg-slate-100 text-black">
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
