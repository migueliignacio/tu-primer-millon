import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export const fetchItemPrice = async (itemId, signal) => {
  const { data, error } = await supabase.functions.invoke("item-price", {
    body: { itemId },
    signal,
  });

  if (error) throw error;
  return data;
};

export default function useItem(itemId) {
  return useQuery({
    queryKey: ["itemPrice", itemId],
    queryFn: ({ signal }) => fetchItemPrice(itemId, signal),
    enabled: Boolean(itemId),
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
}
