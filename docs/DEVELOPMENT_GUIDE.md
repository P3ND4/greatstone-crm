# Guía de desarrollo — Greatstone CRM

Esta guía explica **cómo está construido el proyecto y por qué**, para dos usos:

1. Seguir desarrollando este CRM.
2. **Hacer un fork y crear una plantilla más básica** a partir de él (la sección [19](#19-crear-una-plantilla-básica-a-partir-de-este-repo) es el paso a paso).

> Documentos relacionados: `README.md` (cómo correrlo), `STRUCTURE.md` (mapa de carpetas y rutas), `DECISIONS.md` (decisiones de diseño), `docs/API_INTEGRATION.md` (cómo conectar un backend real), `src/data/schema.md` (modelo de datos), `DEPLOY.md` (Railway).

---

## Índice

1. [Stack y comandos](#1-stack-y-comandos)
2. [Mapa del proyecto](#2-mapa-del-proyecto)
3. [Arquitectura en capas y reglas de oro](#3-arquitectura-en-capas-y-reglas-de-oro)
4. [Arranque: providers y rutas](#4-arranque-providers-y-rutas)
5. [Sistema de diseño: tokens, CSS y temas](#5-sistema-de-diseño-tokens-css-y-temas)
6. [Layout: sidebar, topbar, navegación y contenido](#6-layout-sidebar-topbar-navegación-y-contenido)
7. [Responsive: viewport vs container queries](#7-responsive-viewport-vs-container-queries)
8. [Patrón híbrido Modal / Página](#8-patrón-híbrido-modal--página)
9. [Formularios](#9-formularios)
10. [Datos: services, mocks y estados de carga](#10-datos-services-mocks-y-estados-de-carga)
11. [Listas, tablas y estado en la URL](#11-listas-tablas-y-estado-en-la-url)
12. [Catálogo de componentes UI](#12-catálogo-de-componentes-ui)
13. [Idiomas (i18n) y formato](#13-idiomas-i18n-y-formato)
14. [Sesión, login, roles y permisos](#14-sesión-login-roles-y-permisos)
15. [Overlays, atajos y feedback](#15-overlays-atajos-y-feedback)
16. [Gráficas](#16-gráficas)
17. [PWA (app instalable)](#17-pwa-app-instalable)
18. [Accesibilidad, QA y deploy](#18-accesibilidad-qa-y-deploy)
19. [Crear una plantilla básica a partir de este repo](#19-crear-una-plantilla-básica-a-partir-de-este-repo)
20. [Recetas rápidas](#20-recetas-rápidas)

---

## 1. Stack y comandos

| Pieza | Versión | Para qué |
|---|---|---|
| React | 18.3 | UI |
| Vite | 6 | dev server + build |
| React Router | 6.30 (data router: `createBrowserRouter`) | rutas, `useBlocker` (avisar antes de salir), `ScrollRestoration` |
| lucide-react | 0.468 | iconos (solo los que se importan entran al bundle) |
| date-fns | 4 | fechas |
| recharts | 2.15 | gráficas (Dashboard, reportes, IA) |
| @dnd-kit/core | 6 | drag & drop accesible (Kanban, agenda) |
| @fontsource/inter, work-sans | 5 | fuentes self-hosted (sin Google Fonts → funciona offline y con CSP estricta) |
| vite-plugin-pwa | 1.0.3 | manifest + service worker (Workbox) |

**Sin librería de UI pesada**: todo el CSS es propio sobre tokens. **JavaScript**, no TypeScript (requisito del brief).

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/
npm run preview      # http://localhost:4173 (build de producción + service worker)
npm run qa:audit     # auditoría responsive + consola (ver §18)
npm run qa:shot -- /crm/leads out.png 1440 900
npm run icons        # regenera los iconos PWA (ver §17)
```

Node 20–24 (`engines` en `package.json`). Los scripts `qa:*` e `icons` usan Playwright, que **no** es dependencia del proyecto. Instálalo una vez con `npm i -D playwright && npx playwright install chromium`.

---

## 2. Mapa del proyecto

```
src/
├─ main.jsx               orden de providers (pwa → i18n → session → toasts → router)
├─ app/                   configuración global
│  ├─ router.jsx          TODAS las rutas
│  ├─ navigation.js       módulos y submódulos (sidebar, topbar, paleta, permisos)
│  ├─ SessionProvider.jsx usuario, rol, permisos, tema, color de marca
│  ├─ pwa.js              instalación, online/offline, notificaciones locales
│  └─ theme.js            presets de color de marca
├─ styles/                tokens.css · base.css · components.css · layout.css
├─ i18n/                  en.js · es.js · index.jsx (useT)
├─ hooks/                 lógica reutilizable sin UI
├─ lib/                   funciones puras (format, money, color, random, cx)
├─ services/              ÚNICA capa que toca datos (hoy mock, mañana API)
├─ data/                  mock/ (datos ficticios) · constants.js · schema.md
├─ components/
│  ├─ ui/                 átomos: Button, Field, Input, Table, Tabs, Menu, Toast…
│  ├─ shells/             estructura de formularios y páginas: ModalShell, FormShell, PageShell…
│  ├─ layout/             AppLayout, Sidebar, Topbar, ModuleNav, CommandPalette, Access, PwaStatus
│  ├─ list/               ListToolbar (búsqueda, filtros, vista tabla/tarjetas)
│  ├─ quick/              modales de creación rápida (+ Nuevo)
│  └─ crm/ finance/ comms/ charts/ ai/   componentes de dominio (comms: inbox de chat compartido WhatsApp/SMS, ConsentBadge, ChannelBadge)
└─ pages/                 una carpeta por módulo; cada archivo = una ruta
scripts/                  qa/ (auditoría y capturas) · make-icons.cjs
public/                   favicon, icons/ (PWA), screenshots/ (diálogo de instalación)
docs/                     guías, brief, capturas
```

**Regla de imports:** `pages → components → hooks/lib/services`. Nunca al revés. `data/mock` solo lo importa `services/`.

---

## 3. Arquitectura en capas y reglas de oro

```
pages/ (pantallas)  ──usa──►  components/ (UI reutilizable)
      │                              │
      └──────► hooks/ (useResource, useForm, useListState…) ──► services/ ──► client.js (mock | API)
```

1. **Los componentes nunca saben que los datos son falsos.** Llaman a un service, que siempre devuelve una `Promise`. Cambiar a backend real = reescribir services.
2. **Todo estado de vista que importe al volver va en la URL** (filtros, página, orden, pestaña, vista). Así "← Atrás" restaura exactamente lo que el usuario veía.
3. **Cada vista maneja 4 estados**: cargando (skeleton), error (reintentar), vacío (con acción) y sin permiso. Usa `DataState`.
4. **Un solo patrón de formulario** (`FormShell`) para modales y páginas.
5. **Cero texto hardcodeado**: todo pasa por `t('clave')`, con las mismas claves en `en.js` y `es.js`.
6. **Cero colores sueltos**: todo sale de variables de `tokens.css`. Cambiar la marca = editar un archivo.
7. **Nunca scroll horizontal de la página**: tablas y filas de pestañas scrollean dentro de su caja. Lo verifica `npm run qa:audit`.
8. **Accesible por defecto**: foco visible, labels reales, `aria-*` en los componentes base, teclado en todo (menús, tabs, kanban, modales).
9. **Navegación desde un solo config** (`navigation.js`): sidebar, topbar, paleta y permisos leen de ahí.
10. **Nada se repite entre sidebar y topbar** (ver §6).

---

## 4. Arranque: providers y rutas

`src/main.jsx`:

```jsx
import './app/pwa.js';               // primero: captura el evento de instalación antes de que React monte
<I18nProvider>                        // idioma (useT, useI18n)
  <SessionProvider>                   // usuario, rol, permisos, tema, acento
    <ToastProvider>                   // avisos
      <RouterProvider router={router} />
```

`src/app/router.jsx`:

```jsx
createBrowserRouter([
  { path: '/login', element: <LoginPage /> },                  // públicas
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,         // todo lo demás requiere sesión
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'crm', element: <Navigate to="/crm/communications" replace /> },  // módulo → primer submódulo
      { path: 'crm/leads', element: <LeadsPage /> },
      { path: 'crm/leads/new', element: <LeadFormPage /> },      // formulario largo = página
      { path: 'crm/leads/:id', element: <LeadDetailPage /> },
      // …
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
```

- `RequireAuth` redirige a `/login?next=<ruta actual>` y, tras iniciar sesión, vuelve ahí (solo acepta rutas internas).
- `AppLayout` contiene `ScrollRestoration`, que restaura el scroll al volver atrás.
- Las rutas con varias variantes del mismo componente usan `key` (`<DocsListPage key="inv" kind="invoice" />`) para resetear el estado al cambiar.

---

## 5. Sistema de diseño: tokens, CSS y temas

### `src/styles/tokens.css`: la única fuente de valores

| Grupo | Variables | Notas |
|---|---|---|
| Neutros | `--bg --surface --surface-2 --surface-3 --border --border-strong --text --text-muted --text-subtle` | fondo crema, superficies blancas |
| Marca | `--brand --brand-2 --brand-3 --brand-contrast --brand-muted` | sidebar oscuro |
| Acento | `--accent --accent-hover --accent-strong --accent-soft --accent-contrast` | botón primario, links, activo |
| Estados | `--success --warning --danger --info` + `*-soft` | todos AA sobre blanco |
| Gráficas | `--chart-1 --chart-2 --chart-grid --chart-axis` | validados para daltonismo |
| Tipografía | `--font-sans --font-display --fs-12…32 --fw-* --lh-* --tracking-caps` | Inter + Work Sans |
| Espaciado | `--sp-1…12` | grid de 4 px |
| Forma | `--radius-sm/--radius/--radius-lg/--radius-pill --shadow-1/2/3 --focus-ring` | |
| Layout | `--sidebar-w --topbar-row-h --subbar-h --topbar-h --content-max` | `--topbar-h` cambia en `.app` |
| Modales | `--modal-sm/md/lg --modal-max-h` | 480 / 640 / 840 |
| Capas | `--z-sticky 10 · --z-sidebar 30 · --z-topbar 40 · --z-dropdown 50 · --z-modal 100 · --z-toast 200` | no inventes z-index |

**Tema oscuro:** `[data-theme='dark']` redefine las mismas variables. `SessionProvider` pone `data-theme` en `<html>` según la preferencia (claro / oscuro / sistema), guardada en `localStorage: gs.theme`.

**Color de marca dinámico:** Settings → Organización elige un color. `lib/color.js → accentVars(hex, dark)` deriva hover, strong y soft, y `SessionProvider` los escribe como variables en `<html>`. En oscuro lo aclara hasta lograr contraste 4.5:1.

### Archivos CSS

| Archivo | Contenido |
|---|---|
| `base.css` | reset, tipografía, utilidades (`.row`, `.stack`, `.grid-2/3/4`, `.truncate`, `.sr-only`, `.muted`, `.hide-mobile`) |
| `components.css` | un bloque por componente (`.btn`, `.field`, `.table`, `.badge`, `.modal`, `.kanban`, finanzas, IA, settings, PWA…) |
| `layout.css` | `.app`, sidebar, topbar, contenido, shells de formulario, paleta, dashboard, login |

Convención de nombres tipo BEM: `.bloque`, `.bloque__elemento`, `.bloque--variante`, estados con `.is-*` / `.has-*` (`.is-collapsed`, `.has-subbar`, `.is-running`). Sin CSS-in-JS. `style={{}}` inline solo para valores puntuales (anchos dinámicos, `--i` de animaciones).

---

## 6. Layout: sidebar, topbar, navegación y contenido

### `src/app/navigation.js`

```js
export const NAV = [
  { id: 'dashboard', labelKey: 'nav.dashboard', to: '/', icon: LayoutDashboard, end: true },
  {
    id: 'crm', labelKey: 'nav.crm', to: '/crm', icon: Users,
    children: [
      { id: 'leads', labelKey: 'nav.leads', to: '/crm/leads', icon: UserPlus },
      { id: 'communications', …, badge: 'unread' },   // badge = clave de `counts` (AppLayout)
    ],
  },
];
export const NAV_FOOTER = [ { id: 'settings', …, children: [...] } ];  // va abajo del sidebar
```

- El `id` del módulo es también la **clave de permisos** (`dashboard`, `crm`, `projects`, `finance`, `ai`, `settings`).
- `useActiveModule()` (en `ModuleNav.jsx`) devuelve el módulo dueño de la URL actual.

### Comportamiento

| | Escritorio, sidebar abierto | Escritorio, sidebar oculto | Teléfono / tablet (<1024) |
|---|---|---|---|
| Sidebar | fijo 248 px con módulos y submódulos | se desliza fuera (no ocupa espacio) | drawer con ☰ (foco atrapado, Esc, bloquea scroll) |
| Topbar fila 1 | búsqueda ancha · + Nuevo · campana · usuario | botón expandir · "G." · iconos de módulos (entran animados) · búsqueda · acciones | ☰ · nombre del módulo · acciones |
| Topbar fila 2 | — | submódulos del módulo activo | submódulos como texto |

- **Colapsar / expandir**: botón en la esquina superior izquierda (el mismo lugar en ambos estados) o **Ctrl/⌘ + B**. El estado se guarda en `localStorage: gs.sidebarCollapsed`. Las animaciones solo corren tras un clic (`.app.nav-anim`) y respetan *reduce motion*.
- `--topbar-h` vale 60 px o 104 px (con fila 2). Todo lo sticky (cabeceras de tabla, formularios en página, intro de settings) usa `top: var(--topbar-h)`.
- **`AppLayout`** también renderiza: `ViewAsBanner` + `NoAccess` (permisos), `CommandPalette`, `AssistantLauncher` (botón IA flotante), `PwaStatus` (offline / nueva versión), `QuickActionsProvider` y el *skip link* "Skip to content".

### Contenido

`.content` tiene márgenes de 16 / 24 / 32 px (móvil / tablet / escritorio), un máximo de 2400 px y **es un container** (`container: page / inline-size`). Ver §7.

Cabecera de página estándar:

```jsx
<div className="page-head">
  <div>
    <p className="page-head__eyebrow">{t('nav.finance')}</p>
    <h1 className="page-title">{t('invoices.title')}</h1>
    <p className="page-subtitle">{t('invoices.subtitle')}</p>
  </div>
  <div className="page-head__actions"><Button variant="primary" icon={Plus} to="/finance/invoices/new">…</Button></div>
</div>
```

---

## 7. Responsive: viewport vs container queries

- **Mobile-first** siempre: estilos base para teléfono, `min-width` para crecer.
- **Chrome de la app** (sidebar, topbar, modales, toasts) → `@media` por ancho de pantalla: 480 / 640 / 768 / **1024** (aparece el sidebar) / 1280 / 1440.
- **Contenido de las páginas** → `@container page (…)` por el ancho **real** disponible. Así, al ocultar el sidebar, las páginas ganan columnas sin tocar márgenes.

| Ancho del contenedor | Uso |
|---|---|
| < 560 | ocultar columnas `hide: 'md'` |
| ≥ 700 | `.grid-2/3/4` a 2 columnas, KPIs a 3, editor de líneas en una fila |
| ≥ 720 | vistas divididas (bandeja + conversación, detalle + panel, settings 2 columnas), mostrar columnas `lg` |
| ≥ 960 | `.grid-3/4` completas, KPIs del dashboard a 5, documento + vista previa, columnas `xl` |
| ≥ 1120 · 1216 · 1600 | KPIs ×6 · columnas `xxl` · columnas `3xl` |
| ≥ 2200 | 10 KPIs en una fila |

- **Ojo:** un `@container page` no aplica dentro de modales (se renderizan fuera de `.content`). Para formularios en modal usa `@media` (ej.: `.field-grid--2`).
- Prefiere `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))` para tarjetas: se adaptan solas.
- `min-width: 0` en hijos de flex y grid (ya está en `.grow`, `.row` y `.page-head > *`) evita desbordes por textos largos.

---

## 8. Patrón híbrido Modal / Página

**Regla:** acción corta y autocontenida (≤ ~6 campos, confirmar, elegir) → **modal**. Flujo largo, con secciones o pestañas → **página** con "← Atrás". La tabla completa está en `STRUCTURE.md`.

```jsx
// Modal (ej. components/quick/TaskModal.jsx)
<ModalShell open={open} onClose={onClose} size="sm" dirty={form.dirty}>
  {({ titleId, requestClose }) => (
    <FormShell titleId={titleId} title={t('task.new')} onCancel={requestClose}
               onSubmit={form.submit} dirty={form.dirty} saving={form.saving}>
      <Field label={t('task.title')} error={form.errors.title} required><Input {...form.bind('title')} /></Field>
    </FormShell>
  )}
</ModalShell>

// Página (ej. pages/crm/leads/LeadFormPage.jsx)
<FormPage fallback="/crm/leads" breadcrumbs={[{ label: t('leads.title'), to: '/crm/leads' }, { label: t('leads.new') }]}
          title={t('leads.new')} onSubmit={form.submit} dirty={form.dirty} saving={form.saving}>
  …campos…
</FormPage>
```

| Shell | Qué hace |
|---|---|
| `ModalShell` | tamaños fijos (sm / md / lg), Esc y clic fuera (pregunta si hay cambios), foco atrapado, bloqueo de scroll, portal a `body` |
| `FormShell` | la ÚNICA estructura de formulario: cabecera fija · cuerpo con scroll · pie fijo (Cancelar / Guardar + estado). **Ctrl/⌘ + Enter** envía |
| `FormPage` | `PageShell` + `FormShell variant="page"` + `useBlocker` (avisa al salir con cambios) |
| `PageShell` | botón Atrás + migas discretas para páginas de detalle |
| `useGoBack(fallback)` | vuelve en el historial si vienes de la app; si entraste por link directo va al `fallback` |
| `ConfirmDialog` | `alertdialog` pequeño (descartar, eliminar, revocar) |

Los modales de creación rápida se abren desde cualquier sitio con `useQuickActions().open('task', { projectId })` (`QuickActionsProvider`).

---

## 9. Formularios

`useForm(initial, { validate, onSubmit })` (`src/hooks/useForm.js`):

```js
const form = useForm({ email: '', role: 'designer' }, {
  validate: (v) => ({ email: !v.email ? t('validation.required') : !isEmail(v.email) && t('validation.email') }),
  onSubmit: async (v) => { await settingsService.invite(v); toast.show(t('…')); onClose(); },
});
// form.values · form.errors · form.set(name, value) · form.bind(name) → { name, value, onChange }
// form.submit (valida, enfoca el primer error) · form.saving · form.dirty · form.reset() · form.replace(next)
```

- `Field` conecta label, hint y error con `id`, `aria-describedby` y `aria-invalid` automáticamente; basta con poner el control dentro.
- Los errores salen **inline** bajo el campo, en el idioma activo, y el primer campo inválido recibe el foco.
- Para valores anidados (`{ whatsapp: { … } }`) usa `setIn(form, 'whatsapp', 'displayName', v)` (en `pages/settings/shared.jsx`).
- **Formularios que se quedan abiertos tras guardar** (Settings): `SettingsForm` = `useForm` + barra fija "Guardar cambios / Descartar" que solo aparece si hay cambios + `useBlocker` + modo solo lectura (`<fieldset disabled>`).

---

## 10. Datos: services, mocks y estados de carga

### `src/services/client.js`: el adaptador

- `tables`: arrays en memoria creados desde `src/data/mock/*` (generados con `createRandom(seed)`, siempre iguales en cada carga).
- `delay(value)`: devuelve un `structuredClone` tras 180–420 ms (simula red y evita mutaciones accidentales).
- `createCrudService(name, { searchFields, defaultSort })` → `list / get / create / update / remove`.
- `settings`: objetos de configuración mutables (finanzas, organización, permisos…).
- `auth.userId` / `currentUserId()`: usuario actual para servicios que firman autoría.

### Contrato de listas

```js
leadsService.list({ q, page, pageSize, sort: 'createdAt:desc', where: { status: 'new', type: ['a','b'], unread: { gt: 0 } } })
// → { items, total }
```

`where` solo admite valores serializables, para que mapee 1:1 a query strings o filtros de Supabase. Los services de dominio (`crmService`, `financeService`, `projectsService`…) agregan joins y cálculos (totales, métricas). Cuando haya backend, esos cálculos van al servidor. **Todo el mapa está en `docs/API_INTEGRATION.md`.**

### Consumir datos en una página

```jsx
const { data, loading, error, refetch } = useResource(() => leadsService.list(params), [deps]);
return (
  <DataState loading={loading} error={error} onRetry={refetch} empty={!data?.items.length}
             skeleton={<SkeletonList rows={6} />} emptyTitle={t('leads.empty')} emptyAction={<Button …/>}>
    <Table rows={data?.items} … />
  </DataState>
);
```

`DataState` muestra error (con Reintentar), "sin permiso" si `forbidden` o `error.status === 403`, el skeleton mientras carga y el vacío con acción.

**Mock → API sin tocar pantallas:** reescribe el cuerpo de las funciones de `services/*` devolviendo la misma forma (ver `docs/API_INTEGRATION.md`).

---

## 11. Listas, tablas y estado en la URL

```jsx
const list = useListState({ sort: 'createdAt:desc', filters: ['status', 'source'] });
// list.q · list.page · list.sort · list.view · list.filters.status · list.setQ · list.setFilter('status', v) · list.clear() · list.activeFilters

<ListToolbar
  search={<SearchInput value={list.q} onChange={list.setQ} />}
  filters={<FilterSelect label={t('list.status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={…} />}
  activeFilters={list.activeFilters} onClear={list.clear}
  end={<ViewToggle value={list.view} onChange={list.setView} />}
/>
<Table
  caption={t('leads.title')} rows={items} sort={list.sort} onSort={list.setSort}
  onRowClick={(r) => navigate(`/crm/leads/${r.id}`)}
  columns={[
    { key: 'name', header: t('list.name'), sortable: true, render: (r) => <PersonCell name={r.name} sub={r.email} /> },
    { key: 'source', header: t('list.source'), hide: 'lg' },           // se oculta si el contenedor < 720 px
    { key: 'budget', header: t('…'), align: 'right', render: (r) => money(r.budget) },
    { key: 'menu', header: <span className="sr-only">{t('common.actions')}</span>, render: (r) => <RowMenu items={[…]} /> },
  ]}
/>
<Pagination page={list.page} pageSize={list.pageSize} total={data.total} onChange={list.setPage} />
```

- **Siempre** paginar del lado del service (nunca renderizar cientos de filas).
- Un clic en la fila abre la **página** del registro; las acciones secundarias van en `RowMenu` ("⋯").
- `useUrlState('tab', 'overview')` sirve para pestañas y vistas sueltas (los valores por defecto no se escriben en la URL).

---

## 12. Catálogo de componentes UI

`src/components/ui` (se importan desde `components/ui/index.js`):

| Componente | Props clave |
|---|---|
| `Button` | `variant` primary\|secondary\|dark\|ghost\|danger · `size="sm"` · `icon` / `iconRight` · `block` · `plain` · `to` (se vuelve `<Link>`) |
| `IconButton` | `icon`, `label` (obligatorio, es el nombre accesible), `size`, `dot` |
| `Field` | `label`, `hint`, `error`, `required`, `optional`, `full` (ocupa toda la fila en `.field-grid--2`) |
| `Input` | `icon` (izquierda), `suffix` (texto a la derecha, ej. "USD") |
| `Select` | `options=[{value,label}]`, `placeholder` (select nativo: accesible y cómodo en móvil) |
| `Textarea` | crece solo entre `minRows` y `maxRows` |
| `DatePicker` | input nativo de fecha; `withTime` |
| `Switch` | `checked`, `onChange`, `label`, `description` (`role="switch"`) |
| `Card` | `title`, `subtitle`, `actions`, `footer`, `flush` (sin padding, para tablas) |
| `Badge` | `tone` neutral\|success\|warning\|danger\|info\|accent · `dot` · `icon` (el estado nunca va solo en color: siempre con texto) |
| `Avatar` | `name` (iniciales), `size` sm\|md\|lg, `dark` |
| `Tabs` / `SegmentedControl` | `tabs` u `options`, `value`, `onChange`, `label` (flechas, Home y End) |
| `Table` · `Pagination` | ver §11 |
| `Menu` | `trigger={(props) => <Button {...props}/>}` · `children={(close) => items}` (`.menu__item` con `role="menuitem"`) |
| `Toast` | `const toast = useToast(); toast.show(msg, { tone, duration })` |
| `EmptyState` · `Skeleton` / `SkeletonList` · `DataState` | estados de vista |
| `Kpi` | `label`, `value`, `meta`, `icon` (sin deltas inventados) |
| `Kanban` | `columns`, `items`, `groupBy`, `renderCard`, `onMove` (mouse, táctil y teclado) |
| `RichTextEditor` | HTML básico (negrita, listas, links); reemplazable por TipTap con las mismas props |

Shells: §8. Listas: `components/list/ListToolbar.jsx`. Celdas comunes: `components/crm/bits.jsx` (`PersonCell`, `StatusBadge`, `RowMenu`, `UserChip`, mapas de colores por estado).

---

## 13. Idiomas (i18n) y formato

```jsx
const t = useT();                        // o const { t, locale, setLocale } = useI18n();
t('leads.title');                        // 'Leads'
t('settings.users.invited', { email });  // 'Invitation sent to {email}'
```

- `src/i18n/en.js` y `es.js` tienen **exactamente las mismas claves**, agrupadas por módulo (`nav`, `common`, `list`, `states`, `validation`, `leads`, `finance`, `settings`, `auth`, `pwa`…).
- En desarrollo, una clave que falta muestra `[i18n] missing key: …` en consola. `npm run qa:audit` con `BASE=http://localhost:5173` lo detecta.
- Los enums se traducen con claves dinámicas: `t(\`leadStatus.${lead.status}\`)`.
- Formato (`src/lib/format.js`): `money`, `moneyCompact`, `number`, `percent`, `date(value, 'MMM d, yyyy')`, `time`, `dayLabel`, `ago`, `initials`. Usa siempre estas funciones; nunca `toFixed` en la UI.
- Dinero exacto (`src/lib/money.js`): cálculo en centavos, redondeando una vez por línea (`lineAmounts`, `documentTotals`).
- SMS (`src/lib/sms.js`): `smsInfo(text)` → segmentos GSM-7/Unicode, `composeSms` (prefijo + pie de baja en el primer SMS), palabras clave STOP/START/HELP, `minutesInZone` para las horas de silencio.

---

## 14. Sesión, login, roles y permisos

`useSession()` (`src/app/SessionProvider.jsx`):

| Campo | Qué es |
|---|---|
| `isAuthenticated`, `user` | usuario actual (de `authService`) |
| `signIn({ email, password, remember })`, `signOut()` | login y logout; los errores llegan con `code` (`invalid_credentials`, `user_inactive`, `too_many_attempts`) |
| `realRole`, `role`, `viewAs`, `setViewAs(role)` | rol real y rol previsualizado ("Ver como", solo UI) |
| `access(moduleId)` | `'none' \| 'view' \| 'full'` según la matriz de Settings → Usuarios y roles |
| `theme`, `resolvedTheme`, `setTheme` | claro / oscuro / sistema |
| `assistantEnabled` | Settings → IA |
| `refresh()` | fuerza re-render tras guardar ajustes globales (permisos, acento) |

- **Login mock:** `authService` (contrato real, ver `API_INTEGRATION.md`). Hay cuentas demo, una por rol, todas con la contraseña `greatstone`, listadas en `docs/DEMO_ACCOUNTS.md` (no en la pantalla de login, que se ve como en producción). "Mantener sesión" usa localStorage (30 días); si no, sessionStorage (12 h).
- **Permisos:** `AppLayout` cambia el contenido por `NoAccess` si `access(módulo) === 'none'`. Settings queda en solo lectura si no es `full`. El botón de IA se oculta sin acceso a IA. **El servidor debe aplicar la misma matriz** (RLS).

---

## 15. Overlays, atajos y feedback

| Pieza | Dónde | Notas |
|---|---|---|
| Paleta de comandos | `layout/CommandPalette.jsx` | **Ctrl/⌘ + K**; busca páginas (de `navigation.js`) y registros (`searchService`) |
| Atajos | `hooks/useHotkey('mod+b', fn, { allowInInputs: false })` | `mod` = Ctrl o ⌘ |
| Foco | `useFocusTrap(ref, active)` | enfoca el primer campo (o `[data-autofocus]`) y devuelve el foco al cerrar |
| Scroll | `useScrollLock(active)` | con contador, para modales apilados |
| Pull-to-refresh | `usePullToRefresh(appRef)` (en `AppLayout`) | solo táctil; el documento no rebota (`overscroll-behavior-y: none`), así la topbar no se mueve en iPhone; el contenido baja bajo la topbar y recarga al soltar |
| Toasts | `useToast()` | `aria-live`, tono success o danger |
| Barra de guardado | `pages/settings/shared.jsx → SaveBar` | sticky abajo; mueve el botón de IA hacia arriba con `body.has-savebar` |
| PWA | `layout/PwaStatus.jsx` | "Listo para funcionar sin conexión", "Nueva versión → Recargar" |

---

## 16. Gráficas

- Recharts no puede leer `var(--x)` en atributos SVG: usa `useCssVars(['--chart-1', '--chart-grid'])`, que además se actualiza al cambiar de tema.
- Envuelve cada gráfica en `ChartCard` (título, leyenda y botón **"Ver tabla de datos"**, para no depender solo del color).
- Colores: `--chart-1` (serie principal) y `--chart-2` (comparación), validados para daltonismo. Para más series, valida la paleta antes de añadirla.

---

## 17. PWA (app instalable)

- `vite.config.js → VitePWA`: manifest (nombre, colores, iconos, atajos, capturas) + Workbox (precache del shell, chunks, iconos y fuentes latinas; fallback SPA; `/health` excluido).
- `registerType: 'prompt'`: **nunca recarga sola**; `PwaStatus` muestra "Nueva versión → Recargar" y busca actualizaciones cada hora.
- `src/app/pwa.js`: `usePwa()` → `{ canInstall, installed, online, isIOS, install() }`. También tiene helpers de notificaciones locales.
- iPhone: `viewport-fit=cover` + tokens `--safe-top/right/bottom/left`; topbar `fixed` bajo 1024 px (sticky en escritorio); `100dvh`; campos a 16 px en iOS (sin zoom); pantallas de arranque con `npm run splash` (imprime los `<link>` para `index.html`).
- Iconos: `npm run icons` (o con variables `MARK="A" BG="#111" FG="#fff" ACCENT="#38BDF8"`) genera `public/icons/*`. El manifest y `index.html` ya apuntan ahí.
- Caddy sirve `sw.js` y el manifest con `no-cache`, y la CSP permite `worker-src` y `manifest-src 'self'`.

---

## 18. Accesibilidad, QA y deploy

**Checklist de accesibilidad** (los componentes base ya lo cumplen; mantenlo en lo nuevo):

- [ ] Todo control tiene nombre accesible (label, `aria-label` en `IconButton`).
- [ ] Foco visible (`--focus-ring`) y orden lógico; modales atrapan el foco y lo devuelven.
- [ ] Estados con texto, no solo color (Badge con texto, gráficas con tabla).
- [ ] Contraste AA (los tokens ya lo cumplen; revisa si cambias colores).
- [ ] Teclado: menús (↑↓ Esc), tabs (←→), kanban (Espacio y flechas), Ctrl/⌘ + Enter para guardar.
- [ ] `prefers-reduced-motion` respetado en animaciones nuevas.

**QA automática:**

```bash
npm run build && npm run preview                 # en otra terminal
npm run qa:audit                                 # todas las rutas × 10 anchos (320 → 2560): desborde + consola
COLLAPSED=1 npm run qa:audit                     # igual, con el sidebar oculto
BASE=http://localhost:5173 npm run qa:audit      # contra dev: detecta claves i18n faltantes
SIGNED_OUT=1 npm run qa:shot -- /login login.png 1440 900
```

- Añade cada ruta nueva a `scripts/qa/routes.cjs`. Los scripts inician sesión solos como admin demo (`scripts/qa/session.cjs`).
- Comprobación de dinero: 3 × $19.99 con impuesto + $0.10 con impuesto al 7 % = **$64.28**.

**Deploy:** Railway con Railpack (`railpack.json` + `Caddyfile`, healthcheck `/health`) o Vercel (`vercel.json`). Ver `DEPLOY.md`.

---

## 19. Crear una plantilla básica a partir de este repo

Objetivo: quedarte con **el esqueleto** (layout, shells, componentes, hooks, services, i18n, auth, PWA, QA) y quitar el dominio de Greatstone y el diseño específico.

### 19.1 Qué conservar y qué quitar

| Carpeta / archivo | Plantilla básica | Notas |
|---|---|---|
| `src/styles/tokens.css` | **conservar y simplificar** | paleta neutra, ver 19.3 |
| `src/styles/base.css`, `layout.css` | conservar | quita bloques `.dash-*`, `.auth__arches` si no los usas |
| `src/styles/components.css` | conservar lo genérico | quita secciones de dominio: finanzas (`.paper`, `.line*`), comms (`.comms`, `.mail`, `.bubble`), IA (`.ai-*`), proyectos (`.gantt`, `.project-card`), calendario (`.cal-*`, `.tg-*`) |
| `src/components/ui`, `shells`, `list`, `layout` | **conservar** | núcleo de la plantilla |
| `src/components/crm/bits.jsx` | conservar `PersonCell`, `RowMenu`, `UserChip`, `StatusBadge` | muévelos a `components/ui` o a `components/common` |
| `src/components/quick` | conservar `QuickActionsProvider` + 1 modal de ejemplo | borra los de dominio |
| `src/components/finance`, `comms`, `ai`, `charts` | quitar (o conservar `charts/ChartCard` si habrá dashboard) | si la plantilla necesita mensajería, `pages/crm/communications/MessagingPage.jsx` + `components/comms` + `lib/sms.js` son reutilizables tal cual |
| `src/hooks`, `src/lib` (`format`, `color`, `cx`, `random`) | **conservar** | `money.js` solo si hay dinero |
| `src/i18n` | conservar `app`, `nav`, `topbar`, `common`, `list`, `states`, `validation`, `auth`, `pwa`, `settings` (parcial), `roles` | borra claves de dominio en **ambos** archivos |
| `src/services` | conservar `client.js`, `index.js`, `authService`, `settingsService` (recortado), `searchService`, `lookupService` | borra los de dominio |
| `src/data/mock` | dejar `users.js`, `settings.js` + 1 tabla de ejemplo | |
| `src/pages` | conservar `auth/`, `system/`, `settings/` (profile, organization, users, notifications), 1 módulo de ejemplo (lista + detalle + formulario) y un dashboard simple | |
| `src/app/*` | **conservar** | edita `navigation.js` y `router.jsx` |
| `docs/API_INTEGRATION.md` | conservar y reducir al nuevo dominio | |
| `docs/brief`, `docs/screenshots`, `src/data/schema.md` | reemplazar | |
| `scripts/`, `vite.config.js`, `Caddyfile`, `railpack.json`, `vercel.json` | **conservar** | cambia nombre y colores del manifest; regenera iconos y splash con tu marca (`npm run icons`, `npm run splash`) |

### 19.2 Paso a paso

1. **Fork** en GitHub, clona y cambia `name` en `package.json`, `<title>` en `index.html` y `name` / `short_name` / `description` en el manifest (`vite.config.js`).
2. **Marca:** edita `tokens.css` (19.3), `app/theme.js` (`DEFAULT_ACCENT` y presets) y el wordmark (`Sidebar.jsx`, `Topbar.jsx → .topbar__brand`, `pages/auth/AuthLayout.jsx`). Corre `npm run icons` con tu marca y reemplaza `public/favicon.svg` y `public/screenshots/*`.
3. **Navegación:** deja en `navigation.js` solo Dashboard + 1 módulo de ejemplo + Settings. Ajusta `PERMISSION_MODULES` y la matriz en `data/mock/settings.js`.
4. **Rutas:** en `router.jsx` borra las de dominio; deja auth, dashboard, el módulo de ejemplo, settings y 404.
5. **Borra páginas, componentes, services y mocks de dominio.** Arregla los imports con `npm run build`, que falla en el primer import roto.
6. **QuickActions:** deja un modal de ejemplo (por ejemplo `TaskModal`) y ajusta el menú "+ Nuevo" del `Topbar` y la paleta.
7. **Settings:** en `SettingsPage.jsx` deja `profile`, `organization`, `users` y `notifications` (y sus hijos en `navigation.js`). Quita las secciones de canales, plantillas, catálogo, facturación, integraciones e IA, y sus funciones en `settingsService`.
8. **i18n:** borra las claves de dominio en `en.js` y `es.js`. Corre el dev server con `BASE=http://localhost:5173 npm run qa:audit` para detectar claves faltantes.
9. **CSS:** quita los bloques de dominio de `components.css` (lista en 19.1).
10. **Dependencias:** si no hay gráficas, `npm rm recharts` (y borra `useCssVars`, `charts/`, el `manualChunks.charts` de `vite.config.js`). Sin kanban: `npm rm @dnd-kit/core` y borra `ui/Kanban.jsx`. Sin fuente de marca: quita `@fontsource/work-sans` y usa `--font-display: var(--font-sans)`.
11. **Docs:** reescribe `README.md`, `DECISIONS.md` y `STRUCTURE.md`, y deja esta guía actualizada.
12. **QA:** actualiza `scripts/qa/routes.cjs` y corre `npm run qa:audit` y `COLLAPSED=1 npm run qa:audit`.

### 19.3 Un diseño "más básico"

- **Paleta neutra:** `--bg #F8FAFC`, `--surface #FFFFFF`, `--border #E2E8F0`, `--text #0F172A`, `--text-muted #475569`, `--brand #0F172A` (sidebar), `--accent` = un solo color de marca con contraste AA sobre blanco (comprueba con `contrast()` de `lib/color.js`). Ajusta `--focus-ring` al nuevo acento.
- **Tipografía única:** solo Inter (o la fuente del sistema): `--font-display: var(--font-sans)`. Quita `text-transform: uppercase` de `.btn` si quieres botones más sobrios.
- **Menos sombra y radio:** `--shadow-1: none`, `--radius: 8px`.
- **Sidebar claro** (opcional): `--brand: var(--surface)`, `--brand-contrast: var(--text)`, `--brand-muted: var(--text-muted)`, `--brand-2/3` en grises claros, y añade `border-right` a `.sidebar`.
- Conserva la estructura (espaciado de 4 px, z-index, tamaños de modal, `--topbar-h`): es lo que mantiene todo alineado.

---

## 20. Recetas rápidas

### Añadir un módulo nuevo (ej. "Proveedores")

1. **Datos mock:** `src/data/mock/vendors.js` (`export const vendors = [...]`) y regístralo en `tables` de `services/client.js`.
2. **Service:** en `services/index.js`, `export const vendorsService = createCrudService('vendors', { searchFields: ['name', 'email'], defaultSort: 'name:asc' });`
3. **Páginas:** `pages/vendors/VendorsPage.jsx` (patrón §11), `VendorDetailPage.jsx` (`PageShell` + `DataState`) y `VendorFormPage.jsx` (`FormPage`) o un modal si son ≤ 6 campos.
4. **Rutas:** en `router.jsx`, `vendors`, `vendors/new`, `vendors/:id` y `vendors/:id/edit`.
5. **Navegación:** `{ id: 'vendors', labelKey: 'nav.vendors', to: '/vendors', icon: Truck }` en `NAV`.
6. **Permisos:** añade `'vendors'` a `PERMISSION_MODULES` y una fila en `permissions` (`data/mock/settings.js`), y la clave `nav.vendors` (la matriz usa `t('nav.<id>')`).
7. **i18n:** bloque `vendors: { … }` en `en.js` **y** `es.js`.
8. **Esquema:** documenta la tabla en `src/data/schema.md` y el endpoint en `docs/API_INTEGRATION.md`.
9. **QA:** añade las rutas a `scripts/qa/routes.cjs` y corre la auditoría.

### Añadir un submódulo

Añade un hijo en `children` del módulo en `navigation.js`, más su ruta. Aparece solo en el sidebar, la fila 2 del topbar y la paleta.

### Añadir un modal de creación rápida

Crea `components/quick/XModal.jsx` (patrón §8), regístralo en `MODALS` de `QuickActionsProvider` y añade la entrada en el menú "+ Nuevo" de `Topbar.jsx`.

### Añadir una sección de Settings

Crea `pages/settings/XSettings.jsx` con `SettingsHeader` + `SettingsForm` + `SettingsSection`, regístrala en `SETTINGS_SECTIONS` (`SettingsPage.jsx`), añade el hijo `/settings/x` en `navigation.js` y las funciones `x()` / `saveX()` en `settingsService`.

### Añadir un estado "sin permiso" en una vista concreta

`<DataState forbidden={access('finance') === 'none'} …>`, o deja que el service lance `{ status: 403 }`.

### Añadir una columna que solo cabe en pantallas anchas

`{ key: 'service', header: …, hide: 'xl' }` en la tabla. Se mostrará cuando el contenido mida ≥ 960 px, por ejemplo al ocultar el sidebar.
