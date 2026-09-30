# Mini Kingdom

Juego de estrategia móvil (React + Three.js + Capacitor).

## Desarrollo

```bash
npm install
npm run dev
```

## Guerra (multijugador asíncrono)

En la pestaña **⚔️ Guerra** los jugadores atacan las aldeas de otros con los guerreros que tengan listos y su Dios de ataque. Cada aldea se defiende sola con lo que su dueño dejó preparado:

- **Guarnición**: tropas que dejas en casa (no pueden atacar mientras defienden).
- **Murallas**: absorben daño antes que las tropas. Las catapultas hacen triple daño a las murallas y los magos las ignoran.
- **Dios defensor**: Tharok (rayo y ataque), Aurelia (curación), Morvath (murallas y vida) y Nyx (críticos). Se desbloquean con gemas al conquistar territorios.

Las batallas se simulan por rondas con una semilla, así que el resultado es el mismo para el atacante y el defensor. Ganar da botín y trofeos; el defensor ve el ataque en su **Registro** al volver, pierde el botín y las tropas caídas, y recibe un escudo de 30 minutos.

### Modo local (por defecto)

Sin configuración, los rivales son aldeas simuladas cerca de tus trofeos y, mientras no juegas, bots atacan tu defensa. Sirve para jugar y probar sin servidor.

### Modo online con Supabase

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta [`supabase/schema.sql`](supabase/schema.sql).
3. En **Project Settings → API**, copia la URL y la clave `anon` y añádelas a `.env`:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

4. Reinicia `npm run dev`. La pestaña Guerra mostrará "🌐 En línea". Si hay pocos jugadores reales cerca de tus trofeos, la lista se completa con bots (marcados con 🤖).

**Importante antes de publicar:** en este modo cada cliente calcula sus batallas y escribe directamente en la base de datos, así que un jugador con conocimientos podría hacer trampa. Para producción, añade Supabase Auth, restringe las políticas RLS a `auth.uid()` y mueve la simulación (`src/core/pvp/PvpBattle.ts`, que es código puro) a una Edge Function.

### Código

- `src/core/pvp/PvpBattle.ts`: simulación de batalla (pura y determinista).
- `src/core/pvp/PvpRules.ts`: botín, trofeos y ligas.
- `src/core/pvp/PvpManager.ts`: cambios en el estado del jugador.
- `src/core/pvp/PvpService.ts`: interfaz del backend; `LocalPvpService` y `SupabasePvpService` la implementan.
- `src/core/GodManager.ts` y `GameConfig.gods`: Dioses.
