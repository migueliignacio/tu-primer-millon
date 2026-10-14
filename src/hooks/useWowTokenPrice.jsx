import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export default function useWowTokenPrice() {
  return useQuery({
    queryKey: ["wowTokenPrice"],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.functions.invoke(
        "token-price",
        { signal },
      );
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
