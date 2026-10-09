import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useQueries } from "@tanstack/react-query";
import { localMats } from "../data/mats.js";
import { fetchItemPrice } from "../hooks/useItem";

const features = tableFeatures({});
const columnHelper = createColumnHelper();
const columns = columnHelper.columns([
  columnHelper.accessor("itemIcon", {
    header: "",
    cell: (info) => (
      <div className="flex items-center justify-center">
        <img
          src={info.getValue()}
          alt={info.row.original.itemName}
          className="w-5 h-5 rounded-sm"
        />
      </div>
    ),
  }),
  columnHelper.accessor("itemName", {
    header: "Nombre del Material",
  }),
  columnHelper.accessor("price", {
    header: "Precio",
    cell: (info) => {
      const valueCopper = info.getValue(); // Total en cobre
      const Gold = Math.floor(valueCopper / 10000); // oro
      const Silver = Math.floor((valueCopper % 10000) / 100); // plata
      const Copper = valueCopper % 100;
      return valueCopper ? `${Gold}g ${Silver}s ${Copper}c` : "No disponible";
    },
  }),
  columnHelper.accessor("qtyMin", { header: "Cantidad mínima" }),
  columnHelper.accessor("qtyMax", { header: "Cantidad máxima" }),
  columnHelper.accessor("solo", {
    header: "Solo",
    cell: (info) => (info.getValue() ? "Si" : "No"),
  }),
  columnHelper.accessor("goldXhour", {
    header: "Oro/Hora",
    cell: (info) => {
      const row = info.row.original;
      return (row.price * ((row.qtyMin + row.qtyMax) / 2)) / 10000;
    },
  }),
]);

export default function FarmTable() {
  const queries = useQueries({
    queries: localMats.map((mat) => ({
      queryKey: ["itemPrice", mat.itemId],

      queryFn: ({ signal }) => fetchItemPrice(mat.itemId, signal),

      staleTime: 30 * 60 * 1000,

      refetchInterval: 30 * 60 * 1000,
    })),
  });

  const fullMats = localMats.map((mat, index) => {
    const apiData = queries[index].data;

    return {
      ...mat,

      price: Math.floor(apiData?.marketValue ?? 0),

      marketQuantity: apiData?.quantity ?? 0,

      lastUpdated: apiData?.lastUpdated ?? null,
    };
  });
  const table = useTable({
    features,
    columns,
    data: fullMats,
  });

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
            <tr key={row.id} className="bg-red-100 text-black justify-center">
              {row.getAllCells().map((cell) => (
                <td key={cell.id} className="bg-red-200 text-black">
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
