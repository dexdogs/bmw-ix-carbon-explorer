# Car's Carbon Complexities // dexdogs

An interactive carbon data explorer for the BMW iX xDrive45 — mapping 80 Product Category Rules (PCRs) across 15 vehicle zones, covering ~3,000 estimated Product Carbon Footprints (PCFs) across ~30,000 parts.

Built to make one thing viscerally clear: the most data-intensive consumer product on the planet still has 90%+ of its supply chain carbon estimated from industry averages. One part — the kidney grille — has a verified footprint via Catena-X. The rest is inference.

## What it shows

- **Front and rear angled views** of the BMW iX xDrive45 with interactive zone dots
- **Hover any dot** to see the zone name and part count
- **Click any zone** to open the full carbon data panel — CO₂e in kg and lb, data quality tier, PCR count, weight, and zone detail
- **Data quality legend** — from Primary (Catena-X verified) to Estimate
- **The Catena-X moment** — the kidney grille is the only component in this dataset with a primary, digitally verified Product Carbon Footprint

## Data sources

- BMW Group Vehicle Footprint Report (2023)
- TÜV Rheinland verified, ISO 14040/44 compliant
- Catena-X Product Carbon Footprint Rulebook v2.0
- worldsteel 2022, GREET 2023, European Aluminium, ecoinvent

## Stack

- React + Next.js 14
- Deployed on Vercel
- No external dependencies for the core explorer

## Vehicle specs

| Stat | Value |
|------|-------|
| Kerb weight | 2,510 kg |
| Battery (gross) | 111.5 kWh |
| Motors | Dual, 313 kW total |
| Lifecycle CO₂e (EU grid) | 32.9t |
| Cradle-to-gate CO₂e | ~20.2t |
| Total parts | ~30,000 |
| PCRs mapped | 80 |
| Verified PCFs | 1 (kidney grille, Catena-X) |

## Context

This is Demo #11 in a series of interactive carbon data tools built by [dexdogs](https://dexdogs.earth) — a company building measurement infrastructure for industrial decarbonization.

The gap this demo illustrates — between estimated and verified emissions data — is the core problem dexdogs is working on.
