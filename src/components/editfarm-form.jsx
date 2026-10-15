import { useEffect, useRef } from "react";
import FarmEditor from "./farm-editor";

export default function EditFarmForm({ farm, onClose }) {
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
      aria-label={`Editar ${farm.name}`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="m-auto max-h-[90dvh] w-[min(48rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-green/50 bg-fondo p-4 text-dorado shadow-2xl backdrop:bg-black/75"
    >
      <FarmEditor farm={farm} onSaved={onClose} onClose={onClose} />
    </dialog>
  );
}
