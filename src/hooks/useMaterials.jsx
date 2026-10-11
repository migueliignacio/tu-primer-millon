import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const fetchMaterials = async () => {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .order("id");

  if (error) {
    throw error;
  }

  return data;
};

export async function updateMaterials(id, { qtyMin, qtyMax, solo }) {
  if (
    !Number.isSafeInteger(qtyMin) ||
    !Number.isSafeInteger(qtyMax) ||
    qtyMin < 0 ||
    qtyMax < qtyMin
  ) {
    throw new Error("Revisa las cantidades minima y maxima");
  }

  const { data, error } = await supabase
    .from("materials")
    .update({
      qty_min: qtyMin,
      qty_max: qtyMax,
      solo,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("No se encontró el farmeo o no puedes editarlo.");
}

export default function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: fetchMaterials,

    staleTime: 5 * 60 * 1000,
  });
}
