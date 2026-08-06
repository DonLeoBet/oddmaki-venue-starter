# Brand architecture for OddMaki prediction market module

> Goal: keep Poly.Football as the prediction market engine, then reuse the same deployment as **DonLeo Market**, **Topclass Market** and **VB10 Prediction Market**.

## Deployment model

**Preferred option:** one shared Vercel project with host-based branding.

- `market.donleo.bet`
- `market.topclass.bet`
- `market.vb10.pro`
- `poly.football` (current)

All hosts serve the same build, so the brand resolution must be **runtime**. The brand switch cannot rely on a static `theme.config.json` or build-time env only.

## What is already in place

- `config/venue.config.ts` resolves `NEXT_PUBLIC_VENUE_ID` and `NEXT_PUBLIC_CHAIN_ID`.
- `theme.config.json` and `lib/tokens.ts` drive the HeroUI/Tailwind v4 color tokens, but only at build time.
- `config/site.ts`, `app/layout.tsx` and `components/navbar.tsx` are hardcoded to `Poly.Football`.
- `features/markets`, `features/market-creation`, `features/trading`, `features/realtime` and `lib/oddmaki` are fully generic and brand-agnostic.

## What is missing for multi-brand

1. **Host-driven brand object** — similar to `topclass-bet`'s `helpers/brandConfig.ts`.
2. **Runtime brand-colored tokens** — a way to inject CSS variables in the DOM because `theme.config.json` cannot change per request without rebuilding.
3. **Brand-agnostic shell components** — `Navbar`, `Footer`, `Layout` and `Metadata` must read from the brand object.
4. **Per-brand venue routing** — each brand may want a different `NEXT_PUBLIC_VENUE_ID` and/or on-chain venue.

## Proposed `config/brand.config.ts`

```ts
export type BrandId = 'poly' | 'donleo' | 'topclass' | 'vb10'

export interface BrandConfig {
  id: BrandId
  host: RegExp
  name: string
  displayName: string
  tagline: string
  logo: string          // public/ asset path
  favicon: string       // public/ asset path
  defaultLocale: string
  primary: string       // hex, for CSS variable --color-primary
  secondary: string     // hex, for CSS variable --color-secondary
  background: string    // hex, for CSS variable --color-background
  foreground: string    // hex, for CSS variable --color-foreground
  navLinks: Array<{ label: string; href: string }>
  theme: 'dark' | 'light'
}

export function resolveBrand(reqHost?: string): BrandConfig {
  const host = (reqHost ?? '').toLowerCase().split(':')[0]

  if (host.includes('donleo') || process.env.NEXT_PUBLIC_BRAND_NAME === 'donleo') {
    return BRANDS.donleo
  }
  if (host.includes('topclass') || process.env.NEXT_PUBLIC_BRAND_NAME === 'topclass') {
    return BRANDS.topclass
  }
  if (host.includes('vb10') || process.env.NEXT_PUBLIC_BRAND_NAME === 'vb10') {
    return BRANDS.vb10
  }

  return BRANDS.poly
}
```

The function should accept a host (from `headers().get('host')` on the server) and fall back to `NEXT_PUBLIC_BRAND_NAME` for local preview.

## Server-first resolution

All brand data must be resolved on the server so it is available for `generateMetadata()` and the initial HTML.

- `app/layout.tsx` uses `headers()` to get the host, calls `resolveBrand(host)`, and:
  - writes `<style>:root { ...color vars }</style>` in `<head>`
  - passes the brand object to `Navbar` and `Footer` (or reads it again client-side via context)
- `components/navbar.tsx` uses the brand's `logo` and `displayName`.
- `app/layout.tsx` footer uses the brand's `displayName` and `tagline`.
- `config/venue.config.ts` can also be keyed off `brand.id` if each brand needs its own `NEXT_PUBLIC_VENUE_ID`:
  - `NEXT_PUBLIC_VENUE_ID_POLY`, `NEXT_PUBLIC_VENUE_ID_DONLEO`, etc.
  - or one shared `NEXT_PUBLIC_VENUE_ID` if every brand trades on the same venue.

## Runtime colors with HeroUI + Tailwind v4

HeroUI's `heroui()` plugin in `hero.ts` reads `theme.config.json` at build time. For runtime brand colors we should:

1. Keep `theme.config.json` as a safe fallback.
2. In `app/layout.tsx`, generate a small `<style>` block that sets CSS variables:
   ```css
   :root {
     --color-primary: <brand.primary>;
     --color-secondary: <brand.secondary>;
     --color-background: <brand.background>;
     --color-foreground: <brand.foreground>;
   }
   ```
3. Update `styles/globals.css` to use those variables for the color token overrides HeroUI already exposes. This is the least invasive way to keep the same Tailwind v4 setup while allowing per-request brand colors.

Note: if a brand needs a completely different component layout (not just colors), create a `BrandShell` wrapper that is selected by `brand.id` instead of only changing CSS variables.

## Integration points from parent brands

| Parent site | Link target | Header component to update |
| --- | --- | --- |
| DonLeo.bet | `https://market.donleo.bet` | `DonLeoHeader` in `topclass-bet` — add a "Market" or "Prediction Market" item next to livescores/odds |
| VB10.bet | `https://market.vb10.pro` | `SiteFeatureNav` or `WideTopBar` in `topclass-bet` — add a "Prediction Market" link |
| Topclass.bet | `https://market.topclass.bet` | `WideTopBar` or left sidebar in `topclass-bet` — add a "Market" link |

Those links should open in the same tab. The user can return via the parent brand's logo or a back link.

## Auth / wallet considerations

The OddMaki app currently supports RainbowKit or Privy via `NEXT_PUBLIC_AUTH_PROVIDER`. To share the wallet session with the sportsbook (topclass-bet / DonLeo / VB10):

- **Same Privy app:** if `NEXT_PUBLIC_PRIVY_APP_ID` is shared and `market.*` domain is in Privy's allowed origins, the user stays logged in across domains.
- **Different Privy app or RainbowKit:** the user will have to connect the wallet again on the market site. The wallet state can still be the same because it is on-chain.

For launch, a separate or shared Privy app on the same parent domain is the cleanest path.

## Open questions to resolve before implementation

1. Does each brand get its own `NEXT_PUBLIC_VENUE_ID` on the same OddMaki Diamond, or do they share one Poly.Football venue?
2. Are brand logos and color hex values already available as assets, or do they need to be generated?
3. Should the market app also support `topclass-bet`'s existing `poly-preview`/`poly-topclass` brand mode from the sportsbook repo, or is that being replaced by this new module?
4. Is the Vercel project already configured for `market.donleo.bet`, `market.topclass.bet` and `market.vb10.pro`, or do those domains need to be added?

## Recommended next steps

1. Gather the brand assets for DonLeo, Topclass and VB10.
2. Implement `config/brand.config.ts` and wire it into `app/layout.tsx`, `components/navbar.tsx` and the metadata.
3. Convert the color layer to runtime CSS variables so the same build can serve multiple brands.
4. Add the Vercel domains and `NEXT_PUBLIC_*` env vars.
5. Add market links to the `topclass-bet` headers.
