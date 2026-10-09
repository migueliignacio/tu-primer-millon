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

export default function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: fetchMaterials,

    staleTime: 5 * 60 * 1000,
  });
}
