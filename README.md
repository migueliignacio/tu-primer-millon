# Tu Primer Millón

## Precios de Undermine Exchange

La app consulta la Edge Function `item-price`. La clave de Undermine debe estar
en el entorno de Supabase como `UNDERMINE_API_KEY`; nunca uses un nombre `VITE_*`
para esta clave.

Para desarrollo local, `supabase/functions/.env` contiene el secreto y está
ignorado por Git. Para producción, añade `UNDERMINE_API_KEY` en **Supabase →
Edge Functions → Secrets** y despliega `item-price` con la CLI de Supabase.
Después, vuelve a compilar y publicar el frontend para retirar la antigua
clave de los archivos JavaScript publicados.

Esta función consulta commodities de la región US. Los objetos que no son
commodities requieren el endpoint de items y una selección del precio adecuado.

## Próximos pasos recomendados

### Prioridad alta: completar el flujo de farms

- **Restringir el formulario al administrador.** `App.jsx` muestra actualmente el login y `CreateFarmForm` a la vez. Mostrar el formulario solo con la sesión autorizada y mantener RLS como control real de escritura.
- **Editar un farm.** Añadir una acción por fila para modificar `qty_min`, `qty_max` y `solo`, una política RLS de `UPDATE` limitada al administrador y actualizar la consulta `materials` tras guardar.
- **Eliminar un farm.** Pedir confirmación, aplicar una política RLS de `DELETE` limitada al administrador y actualizar la tabla tras borrar.
- **Validar y evitar duplicados.** Exigir cantidades enteras y decidir si un `item_id` puede aparecer en varios farms. Si no, crear una restricción única en la base de datos.
- **Mejorar los errores de guardado.** Mostrar el motivo del fallo y permitir reintentar sin repetir la búsqueda de metadatos.

### Datos de WoW y cálculos

- **Distinguir commodities de otros objetos.** `item-price` solo consulta commodities de US. Guardar el tipo de mercado y usar el endpoint adecuado para los demás.
- **Definir el precio US mostrado.** Para objetos normales, decidir entre mínimo, mediana o precio de un reino y etiquetarlo claramente.
- **Revisar “Oro/Hora”.** Definir si las cantidades son por hora o por recorrido. Si son por recorrido, incorporar la duración al cálculo.
- **Completar metadatos antiguos.** Buscar nombre e icono una vez para las filas incompletas y guardarlos en Supabase.
- **Cachear precios.** Reducir llamadas al crecer la lista de materiales y mostrar la fecha de actualización de cada precio.

### Experiencia visual

- **Rediseñar la pantalla principal.** Dar jerarquía clara al título, formulario y tabla, con colores y espaciado consistentes.
- **Mejorar la tabla.** Añadir búsqueda, orden por oro por hora, estados vacíos y de error, diseño para móvil y formato consistente de oro/plata/cobre.
- **Pulir el formulario.** Mostrar la vista previa del objeto, validar cada campo junto al input y confirmar claramente el guardado.

### Mantenimiento

- **Versionar el esquema de Supabase.** Añadir migraciones para tablas, restricciones y políticas RLS.
- **Probar los flujos principales.** Cubrir creación, edición y eliminación autorizadas, rechazo sin sesión y respuestas fallidas o sin cotización de las APIs.
