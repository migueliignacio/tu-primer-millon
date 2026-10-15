import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

async function fetchFarms() {
  const { data, error } = await supabase
    .from("farms")
    .select("id,name,solo,farm_materials(id,item_id,item_name,item_icon,qty_min,qty_max)")
    .order("id");
  if (error) throw error;
  return data.map((farm) => ({
    ...farm,
    farm_materials: [...farm.farm_materials].sort((a, b) => a.id - b.id),
  }));
}

export default function useFarms() {
  return useQuery({ queryKey: ["farms"], queryFn: fetchFarms, staleTime: 5 * 60 * 1000 });
}
