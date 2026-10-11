-- Revisa y resuelve los item_id duplicados antes de aplicar esta migración.
-- select item_id, count(*) from public.materials group by item_id having count(*) > 1;
alter table public.materials
  add constraint materials_item_id_unique unique (item_id);
