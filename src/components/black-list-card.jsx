import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

async function fetchBlacklist() {
  const { data, error } = await supabase.from("blacklist_characters").select("id,name,realm").order("name");
  if (error) throw error;
  return data;
}

export default function BlackListCard({ canEdit = false }) {
  const queryClient = useQueryClient();
  const { data: characters = [], isLoading, isError, error: loadError } = useQuery({
    queryKey: ["blacklistCharacters"], queryFn: fetchBlacklist, staleTime: 5 * 60 * 1000,
  });
  const [name, setName] = useState("");
  const [realm, setRealm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(event) {
    event.preventDefault();
    if (!name.trim() || !realm.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { error: insertError } = await supabase.from("blacklist_characters").insert({
        name: name.trim(), realm: realm.trim(),
      });
      if (insertError) throw insertError;
      setName("");
      setRealm("");
      await queryClient.invalidateQueries({ queryKey: ["blacklistCharacters"] });
    } catch (insertError) {
      setError(insertError.code === "23505"
        ? "Ese personaje y reino ya están en la blacklist."
        : insertError.message || "No se pudo agregar el personaje.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id) {
    setBusy(true);
    setError("");
    try {
      const { error: deleteError } = await supabase.from("blacklist_characters").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await queryClient.invalidateQueries({ queryKey: ["blacklistCharacters"] });
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo quitar el personaje.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-orange/50 bg-slate p-5 shadow-xl">
      <h2 className="text-lg font-semibold uppercase tracking-wide text-dorado">Blacklist</h2>
      {isLoading && <p className="mt-2 text-sm">Cargando personajes...</p>}
      {isError && <p role="alert" className="mt-2 text-sm text-red-300">{loadError.message}</p>}
      {!isLoading && !isError && (
        characters.length === 0
          ? <p className="mt-2 text-sm text-dorado/70">No hay personajes en la lista.</p>
          : <ul className="mt-3 space-y-2 text-sm">
            {characters.map((character) => <li key={character.id} className="flex items-start justify-between gap-2">
              <span className="min-w-0 break-words">{character.name}–{character.realm}</span>
              {canEdit && <button type="button" onClick={() => handleRemove(character.id)} disabled={busy} aria-label={`Quitar a ${character.name} de la blacklist`} className="text-red-200 underline disabled:opacity-50">Quitar</button>}
            </li>)}
          </ul>
      )}
      {canEdit && <form onSubmit={handleAdd} className="mt-4 space-y-2">
        <label className="block text-sm">Personaje
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required className="mt-1 w-full rounded border border-green/60 bg-fondo px-2 py-1 text-dorado" />
        </label>
        <label className="block text-sm">Reino
          <input value={realm} onChange={(event) => setRealm(event.target.value)} maxLength={80} required className="mt-1 w-full rounded border border-green/60 bg-fondo px-2 py-1 text-dorado" />
        </label>
        <button type="submit" disabled={busy} className="rounded bg-dorado px-3 py-1 font-bold text-fondo disabled:opacity-50">Agregar</button>
      </form>}
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
      <p className="mt-3 text-xs uppercase text-dorado/65">Devaluan precios en subasta.</p>
    </section>
  );
}
