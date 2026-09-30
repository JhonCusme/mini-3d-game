# MINI KINGDOM — Documento maestro del proyecto

> Estado del proyecto, qué está hecho y qué falta para que sea el mejor juego de su tipo (estrategia de aldea + batallas multijugador, estilo Clash of Clans).
>
> Última actualización: 30 de septiembre de 2026.

---

## 1. Resumen

| | |
|---|---|
| **Género** | Estrategia móvil: construir aldea + atacar a otros jugadores |
| **Plataformas** | Web (Vercel), Android e iOS (Capacitor) |
| **Tecnología** | React 19 + TypeScript + Vite, Three.js (React Three Fiber), Supabase |
| **Orientación** | Horizontal (bloqueada en Android/iOS) |
| **Repositorio** | `JhonCusme/mini-3d-game`, rama `master` |
| **Estado general** | **Prototipo jugable (alfa)**. El bucle principal funciona de punta a punta; faltan contenido, arte, sonido, seguridad online y monetización real. |

**Bucle de juego actual:** recoger oro de la mina → mejorar edificios con constructores → entrenar tropas → atacar aldeas (multijugador o campaña) → ganar botín, trofeos y gemas → despertar Dioses → volver a mejorar.

---

## 2. Lo que ya está hecho ✅

### Aldea (base)
- [x] Aldea 3D a pantalla completa con cámara estilo Clash (arrastrar para mover, pellizcar para zoom, sin rotación).
- [x] Cuadrícula de 24×24 con murallas alrededor.
- [x] Edificios: Ayuntamiento, Mina de Oro, Cuartel, Herrería, Armería, Arena, Altar de los Dioses, Cañón y Torre de Arqueros.
- [x] Seleccionar edificio → Info, Mejorar, Terminar con gemas, Mover.
- [x] Mover edificios arrastrando (verde = cabe, rojo = choca).
- [x] Constructores: 2 iniciales, se pueden contratar más con gemas (máx. 5).
- [x] Mejoras con temporizador y andamio visible; se pueden terminar al instante con gemas.
- [x] El nivel del Ayuntamiento limita el resto de edificios y el número de defensas.
- [x] Mina de oro que produce con el tiempo (también con el juego cerrado) y se recoge tocando la moneda.
- [x] Construir defensas nuevas desde el botón 🔨.
- [x] Guarnición: tropas que se quedan defendiendo la aldea.

### Tropas, héroe y Dioses
- [x] 6 tropas: Infantería, Arqueros, Caballería, Magos (voladores), Catapultas (anti-murallas) y Sanadores.
- [x] Héroe con niveles (aumenta el poder de todas las tropas).
- [x] 4 Dioses desbloqueables y con niveles: **Tharok** (trueno), **Aurelia** (sol/curación), **Morvath** (tierra/murallas) y **Nyx** (noche/críticos).
- [x] Cada Dios se equipa en ataque (poder que se lanza una vez sobre el mapa) y/o en defensa (efecto pasivo).

### Combate
- [x] **Ataque multijugador en tiempo real**: ver la aldea del rival en 3D, "Siguiente" rival pagando oro, soltar tropas fuera de la zona roja (×1 o ×5 por toque).
- [x] Las tropas buscan objetivos, rompen murallas y pelean; cañones y torres disparan proyectiles; la guarnición rival sale a defender.
- [x] 3 estrellas (50 %, Ayuntamiento, 100 %), temporizador de 2 minutos, botín según destrucción, trofeos y ligas (Bronce → Leyenda).
- [x] **Campaña** de 20 territorios con jefes (rasgos especiales) que desbloquea Dioses.
- [x] Golpes críticos (mejora de la Arena) con efecto visual.

### Multijugador online
- [x] Capa de servicio intercambiable: modo local (rivales simulados) y **Supabase** (ya configurado en `.env`).
- [x] Cada jugador publica su aldea (distribución, guarnición, murallas, Dios defensor).
- [x] Registro de defensa: ves quién te atacó, qué perdiste y recibes un escudo de 30 min.
- [x] Si hay pocos jugadores reales cerca de tus trofeos, se completa con bots.

### Interfaz y plataforma
- [x] HUD estilo Clash: perfil y trofeos, constructores, recursos, botón ¡Atacar!, menús.
- [x] Menús como paneles sobre la aldea (Misiones, Tienda, Ajustes, Registro, Campaña).
- [x] Aviso "Gira tu dispositivo" en vertical; Android e iOS bloqueados en horizontal.
- [x] Creación de personaje (6 héroes, 3 reinos).
- [x] Misiones (10), recompensa diaria, cofres, prestigio.
- [x] Guardado automático en el dispositivo.
- [x] Publicado en Vercel desde `master`.

---

## 3. Lo que falta 🚧

Prioridad: **P0** = imprescindible antes de publicar, **P1** = muy importante, **P2** = mejora, **P3** = a futuro.

### 3.1 Técnico y seguridad (P0)
- [ ] **Anti-trampas**: ahora cada teléfono calcula su batalla y escribe directo en la base de datos. Mover la validación de batallas a una Edge Function de Supabase (el motor `AttackSim` ya es determinista y se puede reutilizar en el servidor).
- [ ] **Cuentas de usuario** con Supabase Auth (email/Google/Apple) y políticas RLS por `auth.uid()`.
- [ ] **Guardado en la nube**: hoy la partida vive solo en el dispositivo; si se borra el navegador o se cambia de teléfono, se pierde.
- [ ] **Probar el modo online real** con varios jugadores (aún no se ha probado contra Supabase).
- [ ] Ejecutar `supabase/schema.sql` en el proyecto (si no se ha hecho) y revocar la clave secreta expuesta.
- [ ] Rendimiento en móviles de gama baja (sombras, número de tropas, calidad gráfica ajustable).

### 3.2 Arte y sensación de juego (P1)
- [ ] Modelos 3D de calidad para edificios y tropas (ahora son figuras simples). Opciones: comprar un pack low-poly (p. ej. KayKit, Quaternius, gratuitos CC0) o encargarlos.
- [ ] Animaciones de tropas (caminar, atacar, morir) y de edificios (disparo, destrucción).
- [ ] Iconos y retratos de edificios, tropas y Dioses con estilo unificado.
- [ ] **Sonido**: música de aldea y de batalla, efectos (espadas, cañones, flechas, oro, mejoras). Ahora solo hay un clic.
- [ ] Efectos de partículas (polvo, fuego, humo de edificios destruidos, brillo de Dioses).
- [ ] Mapa de campaña horizontal y más vistoso.

### 3.3 Contenido y jugabilidad (P1)
- [ ] Más defensas: mortero (daño en área), torre mágica, trampas/bombas ocultas, defensa antiaérea (contra magos).
- [ ] Almacenes de oro (el botín se protege en ellos) y un segundo recurso (elixir/maná) para tropas y Dioses.
- [ ] Muros colocables por segmentos (ahora son un anillo fijo).
- [ ] Tiempo de entrenamiento de tropas (ahora es instantáneo).
- [ ] Mejoras de tropas por nivel (Herrería/laboratorio).
- [ ] Pathfinding real (las tropas ahora van en línea recta y solo esquivan murallas).
- [ ] Repeticiones de batallas (ver cómo te atacaron) y **venganza**.
- [ ] Tutorial guiado para jugadores nuevos.
- [ ] Más niveles de Ayuntamiento con edificios nuevos que se desbloquean.

### 3.4 Social y retención (P2)
- [ ] **Clanes**: crear/unirse, chat, donar tropas, guerras de clanes.
- [ ] Clasificaciones (global, por país, por clan).
- [ ] Temporadas de ligas con recompensas.
- [ ] Eventos semanales y misiones diarias que se renuevan.
- [ ] Logros.
- [ ] Notificaciones push (mejora terminada, mina llena, te atacaron).

### 3.5 Monetización (P2)
- [ ] Compras reales: integrar RevenueCat o Google Play Billing / App Store (ahora `IAPManager` es simulado).
- [ ] Anuncios reales con AdMob (ahora `AdsManager` es simulado; el `.env` tiene IDs de prueba).
- [ ] Pase de temporada (recompensas gratis y premium).
- [ ] Ofertas por tiempo limitado y paquetes de inicio.

### 3.6 Publicación (P2)
- [ ] Iconos y pantalla de carga definitivos (`assets/icon.png` y `splash.png` son JPG con extensión `.png`).
- [ ] Ficha de Google Play y App Store (capturas, descripción, política de privacidad).
- [ ] Analítica real (Firebase/PostHog) en lugar de `AnalyticsManager` en consola.
- [ ] Informes de errores (Sentry).
- [ ] Traducciones (hoy mezcla español e inglés en nombres de tropas).
- [ ] Pruebas automáticas del motor de combate y la economía.

---

## 4. Hoja de ruta propuesta

| Fase | Objetivo | Contenido |
|---|---|---|
| **1. Alfa cerrada** (siguiente) | Que el online sea seguro y estable | Cuentas, guardado en la nube, validación de batallas en servidor, probar con amigos |
| **2. Beta** | Que se vea y suene como un juego de verdad | Modelos 3D y animaciones, sonido y música, tutorial, 2–3 defensas nuevas, almacenes |
| **3. Lanzamiento suave** | Retener jugadores | Clanes y chat, clasificaciones, temporadas, notificaciones, compras y anuncios reales |
| **4. Lanzamiento global** | Crecer | Guerras de clanes, eventos, pase de temporada, más contenido cada mes |

---

## 5. Qué nos haría "el mejor de este tipo"

1. **Los Dioses como diferencia**: ningún rival tiene dioses con poderes activos en ataque y pasivos en defensa. Hay que hacerlos espectaculares (efectos, animaciones, voces) y darles más profundidad (árbol de habilidades, combinaciones entre Dioses).
2. **Partidas cortas**: batallas de 2 minutos y mejoras rápidas al principio, para jugar en ratos cortos.
3. **Justo con quien no paga**: gemas obtenibles jugando, sin muros de pago en el progreso.
4. **Buena comunidad**: clanes y guerras de clanes son lo que mantiene a los jugadores durante años.
5. **Contenido constante**: un Dios, tropa o evento nuevo cada mes.

---

## 6. Mapa del código

| Carpeta / archivo | Qué contiene |
|---|---|
| `src/App.tsx` | Estructura de la pantalla, paneles y aviso de rotación |
| `src/components/Hud.tsx` | HUD estilo Clash |
| `src/components/village/` | Escena 3D de la aldea, modelos de edificios, panel de edificio, tienda de construcción |
| `src/components/attack/` | Pantalla de ataque en tiempo real, tropas, proyectiles, efectos |
| `src/components/panels/` | Guarnición y defensa, Dioses, registro de defensa, entrenar tropas |
| `src/config/GameConfig.ts` | Tropas, mejoras, misiones, territorios, Dioses, reglas PvP |
| `src/config/BuildingsConfig.ts` | Edificios, costes, tiempos, defensas, mina |
| `src/core/GameState.ts` | Estado completo de la partida |
| `src/core/GameContext.tsx` | Acciones del juego y bucle principal |
| `src/core/VillageManager.ts` | Colocar, mover, construir, mejorar y la mina |
| `src/core/pvp/AttackSim.ts` | Motor de combate en tiempo real |
| `src/core/pvp/PvpBattle.ts` | Combate por rondas (ataques que recibes en modo local) |
| `src/core/pvp/PvpService.ts` | Backend (local o Supabase) |
| `supabase/schema.sql` | Tablas de la base de datos online |

Cómo ejecutarlo: `npm install` y luego `npm run dev`. Más detalles en `README.md`.
