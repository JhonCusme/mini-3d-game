# Mini Kingdom

Juego de estrategia móvil (React + Three.js + Capacitor).

## Desarrollo

```bash
npm install
npm run dev
```

## Aldea

La aldea se ve en 3D a pantalla completa, con el HUD encima, como en Clash of Clans:

- **Edificios en cuadrícula**: tócalos para ver info, mejorarlos o moverlos (arrastrar y "Colocar").
- **Constructores**: cada mejora ocupa un constructor durante un tiempo; puedes terminarla con gemas o contratar más constructores.
- **Ayuntamiento**: su nivel limita el nivel del resto de edificios y cuántas defensas puedes construir.
- **Mina de oro**: acumula oro (también con el juego cerrado); toca la moneda para recogerlo.
- **Defensas**: cañones y torres de arqueros desde el botón 🔨 Construir; murallas desde el Ayuntamiento.

## Ataque multijugador (tiempo real)

**¡Atacar! → Multijugador** muestra la aldea de un rival en 3D. Puedes pasar a otro rival (cuesta oro) o soltar tus tropas fuera de la zona roja. Las tropas buscan edificios, rompen murallas y pelean; los cañones y torres disparan y la guarnición del rival sale a defender. Tu Dios de ataque se lanza una vez tocando el mapa (Tharok: rayo, Aurelia: curación, Morvath: terremoto, Nyx: sombras que duplican el daño).

Estrellas como en Clash: 50 % de destrucción, destruir el Ayuntamiento y 100 %. El botín depende de la destrucción. El defensor ve el ataque en su **🛡️ Registro** al volver, pierde el botín y la guarnición caída, y recibe un escudo de 30 minutos.

Cada aldea se defiende con lo que su dueño dejó preparado: guarnición (Ayuntamiento → Defensa), murallas, cañones, torres y Dios defensor (Altar).

### Modo local (por defecto)

Sin configuración, los rivales son aldeas simuladas cerca de tus trofeos y, mientras no juegas, bots atacan tu defensa. Sirve para jugar y probar sin servidor.

### Modo online con Supabase

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta [`supabase/schema.sql`](supabase/schema.sql).
3. En **Project Settings → API Keys**, copia la URL del proyecto y la clave pública (`sb_publishable_...` o la antigua `anon` que empieza por `eyJ`) y añádelas a `.env.local` (no se sube a git):

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```

   Nunca uses la clave `sb_secret_...` / `service_role` en el juego.

4. Reinicia `npm run dev`. La pestaña Guerra mostrará "🌐 En línea". Si hay pocos jugadores reales cerca de tus trofeos, la lista se completa con bots (marcados con 🤖).

**Importante antes de publicar:** en este modo cada cliente calcula sus batallas y escribe directamente en la base de datos, así que un jugador con conocimientos podría hacer trampa. Para producción, añade Supabase Auth, restringe las políticas RLS a `auth.uid()` y mueve la simulación (`src/core/pvp/PvpBattle.ts`, que es código puro) a una Edge Function.

### Código

- `src/core/pvp/AttackSim.ts`: combate en tiempo real (paso fijo, determinista).
- `src/core/pvp/PvpBattle.ts`: simulación por rondas para los ataques que recibe tu aldea en modo local.
- `src/core/VillageManager.ts` y `src/config/BuildingsConfig.ts`: edificios, constructores y mina.
- `src/core/pvp/PvpRules.ts`: botín, trofeos y ligas.
- `src/core/pvp/PvpManager.ts`: cambios en el estado del jugador.
- `src/core/pvp/PvpService.ts`: interfaz del backend; `LocalPvpService` y `SupabasePvpService` la implementan.
- `src/core/GodManager.ts` y `GameConfig.gods`: Dioses.
