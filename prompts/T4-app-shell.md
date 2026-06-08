# T4 — App shell + nawigacja + theme

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T0, T3.

```
Realizujesz ticket T4 (App shell + nawigacja). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. src/app/(app)/layout.tsx — wspólny layout aplikacji dla zalogowanych:
   - Górny pasek / nawigacja: Typy, Ranking, Mistrz, Admin*.
   - Element "Admin" renderowany TYLKO gdy profiles.is_admin (sprawdzenie server-side,
     nie tylko ukrycie w CSS).
   - Header: nick zalogowanego + przycisk wyloguj + ThemeToggle.
2. Responsywność mobilna: na wąskich ekranach menu typu hamburger / dolna nawigacja.
3. Stylistyka spójna z dark mode (domyślny), komponenty z shadcn/ui.
4. Strona główna aplikacji (np. /  -> redirect do /predictions lub krótki dashboard).

Kryteria akceptacji:
- Nawigacja działa na mobile i desktop; aktywna zakładka wyróżniona.
- Link "Admin" widoczny i dostępny tylko dla is_admin (zwykły user nie wejdzie nawet po URL —
  guard po stronie serwera).
- Wylogowanie działa; dark mode toggle działa.

Definition of Done: test+build+commit "T4: app shell + nawigacja".
```
