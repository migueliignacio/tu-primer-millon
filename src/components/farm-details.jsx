import { useEffect, useRef } from "react";

const formatGold = (value) => new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 0,
}).format(value);

export default function FarmDetails({ farm, priceByItemId, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="farm-details-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="m-auto max-h-[90dvh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-green/50 bg-fondo p-5 text-dorado shadow-2xl backdrop:bg-black/75"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id="farm-details-title" className="text-xl font-bold text-dorado-fuerte">{farm.name}</h2>
          <p className="text-sm text-dorado/70">{farm.farm_materials.length} {farm.farm_materials.length === 1 ? "material" : "materiales"}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar detalles" className="rounded border border-green/60 px-3 py-1 hover:bg-green/20">Cerrar</button>
      </div>
      {farm.farm_materials.length === 0 ? (
        <p className="text-dorado/70">Sin materiales; pendiente de completar.</p>
      ) : (
        <ul className="space-y-2">
          {farm.farm_materials.map((material) => {
            const query = priceByItemId.get(material.item_id);
            const price = Number.isFinite(query?.data?.marketValue) ? Math.floor(query.data.marketValue) : null;
            return (
              <li key={material.id} className="flex items-start gap-3 rounded-md border border-green/30 bg-slate p-3">
                {material.item_icon && <img src={material.item_icon} alt="" className="h-9 w-9 shrink-0 rounded" />}
                <div className="min-w-0">
                  <p className="break-words font-semibold">{material.item_name}</p>
                  <p className="text-sm text-dorado/75">Cantidad: {material.qty_min}–{material.qty_max}</p>
                  <p className="text-sm text-dorado/75">Precio unitario: {price !== null ? (
                    <>
                      <span className="text-dorado">{formatGold(Math.floor(price / 10000))}</span><span className="text-dorado-fuerte">g</span>{" "}
                      <span>{Math.floor((price % 10000) / 100)}</span><span className="text-[#A7A8B8]">s</span>
                    </>
                  ) : query?.isPending ? "Cargando precio..." : "Precio no disponible"}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </dialog>
  );
}
