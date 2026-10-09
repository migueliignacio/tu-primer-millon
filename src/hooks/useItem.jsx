import { useQuery } from "@tanstack/react-query";

export const fetchItemPrice = async (itemId, signal) => {
  const apiKey = import.meta.env.VITE_UNDERMINE_APIKEY;

  if (!apiKey) {
    throw new Error("Falta VITE_UNDERMINE_APIKEY en el archivo .env.");
  }

  const response = await fetch(
    `https://api.undermine.exchange/v1/region/us/commodities/${encodeURIComponent(
      itemId,
    )}/now.json`,
    {
      signal,
      headers: {
        Authorization: `ApiKey ${apiKey}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Error al consultar el precio: ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();
  const item = payload.result;

  return {
    marketValue: item.price,
    quantity: item.quantity,
    lastUpdated: item.lastUpdated,
  };
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
