# V1 — Fundament designu (tokeny, prymitywy UI, TeamFlag, Sonner)

> Najpierw zastosuj `prompts/v2/00-orchestrator.md` i przeczytaj `prompts/v2/PLAN.md`.
> Następnie wykonaj poniższe. **Ta faza blokuje V2–V6.**

**Zależności:** brak (fundament).

```
Realizujesz fazę V1 (Fundament designu). Pracuj wg 00-orchestrator.md i PLAN.md.

Cel: ustanowić nowy system wizualny i wspólne prymitywy, na których oprą się kolejne fazy.
NIE przebudowuj jeszcze stron funkcjonalnych (predictions/leaderboard/dashboard) — to V2–V5.

Zadanie:
1. Paleta i tokeny — src/app/globals.css:
   - Zmień motyw na "nowoczesny sportowy/mundialowy": primary w odcieniu murawy (zieleń),
     akcent kontrastowy (ciepły żółty/złoty do wyróżnień: podium, bonus mistrza).
   - Zaktualizuj zmienne oklch w :root i .dark (background, foreground, card, primary,
     secondary, muted, accent, border, ring, destructive). Zachowaj nazwy zmiennych
     (kontrakt z Tailwind/shadcn) — zmieniasz wartości, nie klucze.
   - Dodaj semantyczne tokeny statusu punktów jako zmienne (np. --points-exact zielony,
     --points-result niebieski/żółty, --points-zero = muted) oraz odpowiadające klasy/util.
   - Spójność light i dark; kontrast WCAG AA dla tekstu.
2. Prymitywy UI — src/components/ui/ (wzór: istniejący button.tsx → CVA + @base-ui/react + cn):
   - card.tsx (Card, CardHeader, CardTitle, CardContent, CardFooter),
   - input.tsx (stylizowany input z wariantami rozmiaru),
   - badge.tsx (warianty: default/success/info/muted/warning — pod statusy punktów),
   - tabs.tsx (na bazie @base-ui/react Tabs — do filtrów/sekcji),
   - skeleton.tsx (animowany placeholder).
   Każdy: typowany, forwarduje propsy, używa tokenów (zero hardkodów koloru).
3. TeamFlag — src/components/team-flag.tsx:
   - Zastępuje inline <img> z eslint-disable w match-prediction-card.tsx.
   - Renderuje flagę z next/image gdy flag_url to poprawny http(s) URL; w przeciwnym razie
     fallback: 2-literowy placeholder z short_name na tle muted (jak obecnie).
   - Propsy: { flagUrl: string; name: string; size?: "sm"|"md" }. Dostępność: alt=name.
   - Skonfiguruj next.config.ts (images.remotePatterns) dla domeny(domen) flag, jeśli trzeba.
4. Toasty — Sonner:
   - Dodaj zależność sonner (pnpm add sonner).
   - Zamontuj <Toaster /> raz w src/app/layout.tsx (wewnątrz ThemeProvider, position
     bottom-right, richColors, theme zsynchronizowany z next-themes).
   - Udostępnij prostą konwencję użycia (import { toast } from "sonner") — bez własnego wrappera,
     chyba że potrzebny do motywu.

Architektura:
- Prymitywy są czysto prezentacyjne, bez logiki domenowej. Eksport nazwany.
- TeamFlag i prymitywy będą reużywane w V2–V5 — projektuj API stabilnie.
- Żadnych zmian w stronach funkcjonalnych ani Server Actions w tej fazie.

Testy (vitest + @testing-library/react + jsdom):
- team-flag.test.tsx: renderuje <img> dla http(s) URL (alt=name); renderuje placeholder
  z inicjałami dla pustego/emoji flag_url.
- badge.test.tsx (lub łączony ui.test.tsx): wariant mapuje się na właściwą klasę tokenu.
- Smoke render każdego prymitywu (montuje się bez błędu, przekazuje children/className).

Kryteria akceptacji:
- Aplikacja buduje się i działa z nową paletą; light i dark spójne, czytelne.
- Prymitywy ui/ dostępne i używalne; TeamFlag działa dla URL i fallbacku.
- <Toaster /> zamontowany; przykładowe toast.success/error wyświetla się poprawnie.
- Brak surowych hexów w nowych komponentach (tylko tokeny).
- pnpm test / lint / build zielone.

Definition of Done: testy+lint+build+commit "V1: fundament designu (tokeny, ui, TeamFlag, Sonner)".
Podsumuj, które tokeny/prymitywy dziedziczą kolejne fazy.
```
