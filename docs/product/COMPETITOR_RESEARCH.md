# Competitor Research — Nightclub SaaS Market

> Investigación realizada en sesión inicial. Resumen de competidores activos en el sector nightlife/nightclub management.

## Plataformas investigadas

| # | Producto | Origen | Foco | Pricing público |
|---|---|---|---|---|
| 1 | **SevenRooms** | US | Guest-experience CRM para nightlife premium | Quote-only, ~$500-1000+/mo |
| 2 | **Toast** | US | POS para restaurantes/bares con módulo nightclub | $0 Starter, $69/mo Point of Sale, $399/mo enterprise + 2.49% + $0.15 procesamiento |
| 3 | **Lightspeed Hospitality** | Canadá | POS hospitality con config nightclub | $69 Starter, $189 Essential, $399 Premium/mo |
| 4 | **Fourvenues** | España | All-in-one nightlife (LATAM-friendly) | Quote-only, ~$200-800/mo estimado |
| 5 | **Discotech** | US | Marketplace consumer + tools venue (front-of-house) | Sin SaaS fee, comisión por reserva |
| 6 | **TablelistPro** | US | Tables, guest list, ticketing, promoter | Quote-only "cost-efficient" |
| 7 | **Tixr** | US | Ticketing premium para nightlife | Sin fee mensual, ~3-5% por ticket |
| 8 | **UrVenue** | US | Nightlife/daylife suite | Quote-only enterprise |
| 9 | **Vēmos** | US | AI loyalty para nightclubs | Quote-only |
| 10 | **VenueBoss** | UK | All-in-one nightlife | Quote-only |
| 11 | **Tripleseat** | US | Eventos privados (no específico nightlife) | Quote-only |

## Tabla comparativa de features

| Feature | SevenRooms | Toast | Lightspeed | Fourvenues | Discotech | TablelistPro | Tixr | NightClubmgmt (objetivo) |
|---|---|---|---|---|---|---|---|---|
| POS integrado | — | ✅ | ✅ | — | — | — | — | ❌ (fuera de scope) |
| Reservas mesa VIP | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Fase 5 |
| Guest list + check-in | ✅ | — | — | ✅ | ✅ | ✅ | ✅ | ✅ Fase 4 |
| Ticketing | — | — | — | ✅ | ✅ | ✅ | ✅✅ | ❌ (fuera MVP) |
| Aforo en vivo | ✅ | — | ✅ | ✅ | — | ✅ | — | ✅ Fase 0 |
| Loyalty + puntos | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅✅ Fase 3 (diferencial) |
| QR check-in | ✅ | — | — | ✅ | ✅ | ✅ | ✅ | ✅ Fase 0 (existe) |
| Promoter tracking | — | — | — | ✅ | — | ✅ | — | ✅ Fase 5 |
| ID/age scanning | ✅ | — | — | — | — | — | — | ❌ post-MVP |
| SMS marketing | ✅ | ✅ | — | ✅ | — | — | ✅ | ✅ Fase 6 |
| Analytics avanzado | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ Fase 4-6 |
| Multi-idioma | parcial | ✅ | ✅ | ✅ | parcial | parcial | ✅ | ✅ Fase 4 (diferencial) |
| Vistas por rol nativas | — | parcial | parcial | ✅ | — | parcial | — | ✅✅ ya existe (diferencial) |
| Mid-market pricing (<$100/mo) | ❌ | ✅ (Toast $69) | ✅ ($69 Starter) | — | gratis (rev share) | — | gratis (rev share) | ✅ Starter $49 (objetivo) |
| Incident logs | — | — | — | parcial | — | — | — | ✅✅ Fase 0 (diferencial) |
| Self-serve onboarding | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ Fase 2 |

## Features comunes del mercado (table stakes)

Estas son las features que **TODO** competidor serio tiene:

1. Gestión de reservas (mesa VIP, eventos)
2. Guest list con check-in
3. Loyalty básico (puntos o visitas)
4. Aforo / capacity management
5. Dashboard de métricas básicas (revenue, visits)
6. Roles para staff (admin, manager, door, bar)
7. QR codes para check-in y/o tickets
8. Integración con email/SMS para confirmar reservas

**Conclusión**: cualquier SaaS para nightclubs DEBE tener estas. Si falta alguna, no es vendible.

## Features diferenciales (de top players)

Estas son las features que los **MEJORES** competidores tienen y diferencian:

1. **SevenRooms**: lifetime guest profile, AI-powered targeting, integraciones con POS existentes (Toast, Aloha, etc.).
2. **Toast**: native POS + payments + KDS + online ordering. Toda la stack.
3. **Fourvenues**: Spanish-first UX (excelente para LATAM/España), promoter commission tracking refinado.
4. **Tixr**: ticketing nightlife-native con bottle packages, VIP cabanas, tiered hospitality.
5. **Vēmos**: AI loyalty (recomendaciones personalizadas, predicción de churn).
6. **UrVenue**: nightlife + daylife (pool clubs) en una sola plataforma.
7. **ID/age scanning** (varios): 50 estados US + 230 pasaportes, detección de fraude.

## Gaps detectados en el mercado

Estas son oportunidades reales:

1. **Mid-market sub-$100/mo con features reales**: Toast/Lightspeed bloated, SevenRooms premium-priced. Fourvenues más cercano pero quote-only.
2. **Spanish-first / LATAM market**: la mayoría son US-centric. Fourvenues es la excepción pero LATAM-friendly limitado.
3. **Vistas por rol nativas**: bar / security / door / admin / member cada uno con UI tailored, mobile-first para staff. Casi nadie lo hace bien (es siempre "una app de admin con permisos limitados").
4. **Incident logging built-in**: usualmente en papel o app separada (Bouncer.app, etc.).
5. **Loyalty card como universal entry pass**: combinar door pass + loyalty + tab + wallet en un solo QR. Raro.
6. **Multi-idioma genuino global**: la mayoría tiene UI en inglés y "soporta" otros idiomas con traducciones parciales.
7. **Real-time occupancy / dancefloor heatmap**: emerging, casi nadie lo tiene en mid-market.
8. **Affordable analytics**: las métricas RevPASH, CLV, cohort retention son enterprise-only hoy.

## Ideas aplicables a NightClubmgmt

### Copiar / adaptar (table stakes en MVP)
- ✅ Reservas VIP, guest list, QR check-in, loyalty (todos los tienen)
- ✅ Aforo en vivo (diferencial mid-market)
- ✅ Vistas por rol mobile-first (gran diferencial UX)

### Inspirarse pero simplificar
- 🔄 Promoter commissions (Fourvenues lo hace bien — copiar lógica)
- 🔄 Multi-idioma real (next-intl bien hecho)
- 🔄 Loyalty con ledger auditable (Vēmos lo tiene en AI pero versión simple ya es competitiva)

### No construir todavía
- ❌ POS / payments processing (decisión tomada: fuera de scope)
- ❌ Ticketing (Tixr es especialista, no competir)
- ❌ AI predictions (mucho más adelante, requiere data acumulada)
- ❌ ID/age scanning (legal complejo, post-MVP)
- ❌ Mobile app nativa (PWA es suficiente para MVP)

## Recomendaciones para MVP

**El MVP debe ser vendible para un club mid-market** con estas features mínimas:

1. Multi-tenant con subdominio propio
2. ABM clientes + tarjeta de fidelidad con QR
3. **Loyalty ledger auditable** (diferencial)
4. ABM empleados con roles (admin/manager/door/bar/security)
5. **Vistas operativas mobile-first** por rol (door/bar/security cada una pulida)
6. Eventos + guest list + check-in
7. Aforo en vivo
8. Incident log
9. Analytics básico (revenue, visits, retention)
10. **Tres planes**: $49 Starter / $149 Pro / $349 Business
11. **Multi-idioma es/en** desde MVP+
12. Self-serve onboarding

**Precio competitivo**: Starter $49/mo apunta directo al hueco que Toast cubre con $69 pero con features de nightlife reales (no POS).

## Recomendaciones para fases futuras

- **Fase 5**: VIP tables visuales (no obligatorio pero atractivo para upselling) + promoter portal (necesario para clubes con red de PRs).
- **Fase 6**: campañas email/SMS con segmentación. Marketing es donde el mid-market paga bien.
- **Fase 7+**: integraciones con POS existentes (Toast/Lightspeed API) para no competir directo sino complementar.
- **Roadmap futuro**: AI loyalty predictions (à la Vēmos), real-time occupancy heatmap, ID scanning para clubes US (legal varies).

## Pricing benchmark detallado

| Competidor | Tier entrada | Tier medio | Tier alto | Procesamiento |
|---|---|---|---|---|
| Toast | $0 (con %fee) | $69/mo | $399/mo | 2.49% + $0.15 |
| Lightspeed | $69 Starter | $189 Essential | $399 Premium | ~2.6% |
| SevenRooms | — | $500+/mo | $1000+/mo | — |
| Tixr | $0 + 3-5% por ticket | — | — | incluido |
| Discotech | $0 + comisión reserva | — | — | — |
| TablelistPro | "cost-efficient" quote-only | | | — |
| **NightClubmgmt (objetivo)** | **$49 Starter** | **$149 Pro** | **$349 Business** | sin processing (no POS) |

## Sources

- [Top 10 Nightclub Software 2026 — ZipDo](https://zipdo.co/best/nightclub-software/)
- [SevenRooms Nightclubs](https://sevenrooms.com/nightclubs-bars/)
- [Toast Pricing 2026 — UpMenu](https://www.upmenu.com/blog/toast-pricing/)
- [Lightspeed Pricing 2026](https://checkthat.ai/brands/lightspeed/pricing)
- [Tixr Creators](https://creators.tixr.com/products/tixr)
- [Fourvenues](https://www.fourvenues.com/en/nightclubs-management-software)
- [Vēmos](https://vemos.io/industry-nightclubs)
- [UrVenue](https://www.urvenue.com/who-we-serve/nightlife-daylife/)
- [TablelistPro](https://www.tablelistpro.com/)
- [Building Multi-Tenant SaaS with Stripe Connect 2026 — DEV](https://dev.to/diven_rastdus_c5af27d68f3/building-a-multi-tenant-saas-with-stripe-connect-in-2026-jjn)
