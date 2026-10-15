# MINI KINGDOM — Documento maestro del proyecto

> Estado del proyecto, qué está hecho y qué falta para que sea el mejor juego de su tipo (estrategia de aldea + batallas multijugador, estilo Clash of Clans).
>
> Última actualización: 15 de octubre de 2026.

---

## 1. Resumen

| | |
|---|---|
| **Género** | Estrategia móvil: construir aldea + atacar a otros jugadores |
| **Plataformas** | Web (Vercel), Android e iOS (Capacitor) |
| **Tecnología** | React 19 + TypeScript + Vite, Three.js (React Three Fiber), Supabase |
| **Orientación** | Horizontal (bloqueada en Android/iOS) |
| **Repositorio** | `JhonCusme/mini-3d-game`, rama `master` |
| **Estado general** | **Alfa avanzada**. Bucle completo, cuentas y guardado en la nube, gráficos y sonido mejorados, amigos y campaña 3D. Falta sobre todo seguridad online (anti-trampas), contenido de fin de juego, música y monetización real. |

**Bucle de juego actual:** recoger oro de la mina y comida de la granja → mejorar edificios con constructores → entrenar y mejorar tropas → atacar aldeas (multijugador, amistosas o campaña) con el héroe → ganar botín, trofeos y gemas → despertar Dioses → volver a mejorar.

---

## 2. Lo que ya está hecho ✅

### Aldea (base)
- [x] Aldea 3D a pantalla completa con cámara estilo Clash (arrastrar para mover, pellizcar para zoom, sin rotación).
- [x] Cuadrícula de 24×24 rodeada de montañas, con murallas de bloques 1×1 que se colocan y mejoran una a una.
- [x] Edificios: Ayuntamiento, Mina de Oro, Granja (con campesinos y molino), Almacén de Oro, Almacén de Comida, Cuartel, Herrería, Armería, Arena, Altar de los Dioses, Cañón, Torre de Arqueros y Muralla.
- [x] Aspecto de los edificios por niveles: de madera tribal a castillo de piedra y oro imperial.
- [x] Dos recursos (oro y comida) con capacidad limitada por los almacenes y barras de progreso en el HUD.
- [x] Mineros 3D con cansancio que se alimentan de la granja; soldados y Rey Héroe patrullando la aldea; campamento militar con el ejército entrenando.
- [x] Seleccionar edificio → Info, Mejorar, Terminar con gemas, Mover.
- [x] Mover edificios arrastrando (verde = cabe, rojo = choca).
- [x] Constructores: 2 iniciales, se pueden contratar más con gemas (máx. 5).
- [x] Mejoras con temporizador y andamio visible; se pueden terminar al instante con gemas.
- [x] El nivel del Ayuntamiento limita el resto de edificios y el número de defensas.
- [x] Mina de oro que produce con el tiempo (también con el juego cerrado) y se recoge tocando la moneda.
- [x] Construir defensas nuevas desde el botón 🔨.
- [x] Guarnición: tropas que se quedan defendiendo la aldea.
- [x] El tiempo sigue corriendo en segundo plano y al cambiar de pestaña.
- [x] **Biomas 3D dinámicos según el Reino elegido**:
  - **Montaña de Hielo**: cumbres montañosas nevadas en el horizonte, pinos alpinos nevados, ventisca de nieve cayendo en 3D, murallas glaciares y atributos (+25% HP a defensas/murallas y aura helada que ralentiza un 15% a los invasores).
  - **Desierto Dorado**: océano de dunas de arena, monolitos de arenisca roja, palmeras, tormenta de arena dorada flotante y atributos (+30% producción/capacidad de oro en la mina y +20% de botín extra en saqueos).
  - **Bosque Esmeralda**: colinas verdes, árboles ancestrales colosales, brisa de esporas mágicas y atributos (20% de reducción en tiempo de constructores y +30% de velocidad de regeneración de energía).

### Tropas, héroe y Dioses
- [x] 8 tropas: Bárbaro, Arquera, Caballero (modelo 3D con armadura y mandoble), Jinete, Bruja voladora en escoba (modelo 3D), Catapulta, Curandera y Esqueletos (horda de 3, modelo 3D animado).
- [x] Desbloqueo progresivo de tropas por territorios de campaña o nivel del Cuartel.
- [x] Mejora de tropas por niveles (vida y daño) y visor 3D de tropas con giro de 360° y animaciones (baile, correr, atacar).
- [x] Héroe con niveles: se despliega en batalla con la habilidad **Puño de Hierro** y tiene tiempo de recuperación si cae.
- [x] 4 Dioses desbloqueables y con niveles: **Tharok** (trueno), **Aurelia** (sol/curación), **Morvath** (tierra/murallas) y **Nyx** (noche/críticos).
- [x] Cada Dios se equipa en ataque (poder que se lanza una vez sobre el mapa) y/o en defensa (efecto pasivo).

### Combate
- [x] **Ataque multijugador en tiempo real**: ver la aldea del rival en 3D, "Siguiente" rival pagando oro, soltar tropas fuera de la zona roja (×1 o ×5 por toque).
- [x] Las tropas buscan objetivos, rompen murallas y pelean; cañones y torres disparan proyectiles; la guarnición rival sale a defender.
- [x] 3 estrellas (50 %, Ayuntamiento, 100 %), temporizador de 2 minutos, botín según destrucción, trofeos y ligas (Bronce → Leyenda).
- [x] **Campaña** de 20 territorios jugada en 3D sobre aldeas predefinidas, con jefes, que desbloquea tropas y Dioses.
- [x] Flechas orientadas, balas y rocas con texturas, números de daño flotantes y humo en la aldea.
- [x] **Venganza**: contraatacar a quien te atacó.
- [x] Efectos de sonido generados por código (cañones, flechas, despliegue, monedas, victoria).
- [x] Golpes críticos (mejora de la Arena) con efecto visual.

### Multijugador online
- [x] Capa de servicio intercambiable: modo local (rivales simulados) y **Supabase** (ya configurado en `.env`).
- [x] Cada jugador publica su aldea (distribución, guarnición, murallas, Dios defensor).
- [x] Registro de defensa: ves quién te atacó, qué perdiste y recibes un escudo de 30 min.
- [x] Si hay pocos jugadores reales, se completa con aldeas del sistema (marcadas claramente como tales).
- [x] No se puede atacar a uno mismo; la aldea se bloquea mientras otro jugador la ataca; protección del jugador conectado.
- [x] **Amigos**: buscar jugadores, solicitudes de amistad y batallas amistosas.
- [x] Solo una aldea activa por cuenta (las duplicadas de la misma cuenta se retiran).

### Interfaz y plataforma
- [x] HUD estilo Clash: perfil y trofeos, constructores, recursos, botón ¡Atacar!, menús.
- [x] Pantalla de carga inicial con descarga animada de recursos, barra de progreso estilo Clash, consejos rotativos y precarga de assets.
- [x] Autenticación de jugadores (Supabase Auth) con inicio de sesión, registro, modo invitado, recuperación de contraseña con código de 6 dígitos y sincronización de partida en la nube.
- [x] Adaptación a la zona segura del iPhone (notch).
- [x] Gráficos: texturas PBR generadas por código, tone mapping ACES y luz de contorno.
- [x] Menús como paneles sobre la aldea (Misiones, Tienda, Ajustes, Registro, Campaña).
- [x] Aviso "Gira tu dispositivo" en vertical; Android e iOS bloqueados en horizontal.
- [x] Creación de personaje (6 héroes, 3 reinos).
- [x] Misiones (9), recompensa diaria, cofres, prestigio.
- [x] Guardado automático local y sincronización con la nube (Cloud Save).
- [x] Publicado en Vercel desde `master`.

---

## 3. Lo que falta 🚧

Prioridad: **P0** = imprescindible antes de publicar, **P1** = muy importante, **P2** = mejora, **P3** = a futuro.

### 3.1 Técnico y seguridad (P0)
- [ ] **Anti-trampas**: ahora cada teléfono calcula su batalla y escribe directo en la base de datos. Mover la validación de batallas a una Edge Function de Supabase (el motor `AttackSim` ya es determinista y se puede reutilizar en el servidor).
- [x] **Cuentas de usuario** con Supabase Auth (email/contraseña + sesión persistente y opción de jugar como invitado).
- [x] **Guardado en la nube**: sincronización de partida en Supabase (`player_saves`) con fallback a almacenamiento local.
- [ ] **Permisos de la base de datos (RLS)**: hoy cualquiera puede modificar o borrar cualquier aldea (`villages`) y cualquier amistad (`friendships`). Restringir a `auth.uid()` y decidir qué pueden hacer los invitados.
- [ ] **Probar el modo online real** con varios jugadores y dispositivos.
- [ ] Ejecutar `supabase/schema.sql` en el proyecto (si no se ha hecho) y revocar la clave secreta expuesta.
- [x] Modelos 3D reducidos de ~113 MB a ~22 MB (texturas WebP de 1024 px).
- [ ] Cargar los modelos de tropas solo cuando se usan (hoy se precargan todos al abrir el juego) y comprimir la geometría del Esqueleto (6 MB).
- [ ] Partir el JavaScript (1,8 MB en un solo archivo) para que el juego arranque antes.
- [ ] Rendimiento en móviles de gama baja (sombras, número de tropas, calidad gráfica ajustable).

### 3.2 Arte y sensación de juego (P1)
- [x] Personajes y edificios rediseñados; Bruja, Caballero y Esqueletos con modelos 3D.
- [ ] Modelos 3D de calidad para el resto de tropas (Bárbaro, Arquera, Jinete, Catapulta, Curandera) y para los Dioses.
- [ ] Animaciones de muerte de tropas y de destrucción de edificios.
- [ ] Iconos y retratos de edificios, tropas y Dioses con estilo unificado.
- [x] Efectos de sonido de batalla y economía.
- [ ] **Música** de aldea y de batalla.
- [ ] Efectos de partículas (polvo, fuego, humo de edificios destruidos, brillo de Dioses).
- [ ] Mapa de campaña horizontal y más vistoso.

### 3.3 Contenido y jugabilidad (P1)
- [ ] Más defensas: mortero (daño en área), torre mágica, trampas/bombas ocultas, defensa antiaérea (contra magos).
- [x] Almacenes de oro y comida, y comida como segundo recurso.
- [x] Murallas colocables bloque a bloque.
- [x] Mejoras de tropas por nivel.
- [ ] Tiempo de entrenamiento de tropas (ahora es instantáneo).
- [ ] Pathfinding real (las tropas ahora van en línea recta y solo esquivan murallas).
- [x] Venganza.
- [ ] Repeticiones de batallas (ver cómo te atacaron).
- [ ] Tutorial guiado para jugadores nuevos.
- [ ] Más niveles de Ayuntamiento con edificios nuevos que se desbloquean.

### 3.4 Social y retención (P2)
- [x] Amigos y batallas amistosas.
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
| **1. Alfa cerrada** (en curso) | Que el online sea seguro y estable | ✅ Cuentas y guardado en la nube · Pendiente: permisos RLS, validación de batallas en servidor, probar con amigos |
| **2. Beta** | Que se vea y suene como un juego de verdad | Parcial: gráficos, sonido y almacenes hechos · Pendiente: música, tutorial, 2–3 defensas nuevas, resto de modelos 3D |
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
| `src/components/panels/` | Guarnición y defensa, Dioses, registro de defensa, entrenar y mejorar tropas (visor 3D) |
| `src/components/common/StylizedCharacters.tsx` | Modelos y animaciones de tropas y héroe |
| `src/components/social/` | Amigos y batallas amistosas |
| `src/components/AuthScreen.tsx`, `src/core/AuthContext.tsx` | Inicio de sesión, registro, recuperación y guardado en la nube |
| `src/config/GameConfig.ts` | Tropas, mejoras, misiones, territorios, Dioses, reglas PvP |
| `src/config/BuildingsConfig.ts` | Edificios, costes, tiempos, defensas, mina |
| `src/core/GameState.ts` | Estado completo de la partida |
| `src/core/GameContext.tsx` | Acciones del juego y bucle principal |
| `src/core/VillageManager.ts` | Colocar, mover, construir, mejorar y la mina |
| `src/core/pvp/AttackSim.ts` | Motor de combate en tiempo real |
| `src/core/pvp/PvpBattle.ts` | Combate por rondas (ataques que recibes en modo local) |
| `src/core/pvp/PvpService.ts` | Backend (local o Supabase) |
| `src/core/campaign/` | Aldeas predefinidas de la campaña |
| `src/core/textures/` | Texturas PBR generadas por código |
| `public/models/` | Modelos 3D (.glb) de Bruja, Escoba, Caballero y Esqueleto |
| `supabase/schema.sql` | Tablas de la base de datos online |

Cómo ejecutarlo: `npm install` y luego `npm run dev`. Más detalles en `README.md`.
