# T3 — Auth + rejestracja

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T1, T2.

```
Realizujesz ticket T3 (Auth + rejestracja). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. Strony (po polsku):
   - src/app/(auth)/login/page.tsx — email + hasło.
   - src/app/(auth)/register/page.tsx — email, hasło, nick.
   Formularze: react-hook-form + zod (walidacja: email, hasło min 8 znaków, nick 2–24).
   Czytelne komunikaty błędów po polsku.
2. Server Actions:
   - signIn: logowanie email/hasło przez Supabase Auth.
   - signUp (service_role):
       a) utwórz użytkownika (auth) + profil (nick).
     Nick musi być unikalny (kolizja -> błąd, NIE twórz konta).
   - signOut.
3. middleware.ts: chroń trasy (app)/* i (admin)/*; niezalogowani -> /login.
   Zalogowani na /login|/register -> redirect do strony głównej aplikacji.
4. Obsłuż sesję przez @supabase/ssr (cookies) zgodnie z konwencjami.

Bezpieczeństwo:
- Walidacja po stronie serwera (nie ufaj klientowi). Rate-limit nie wymagany w MVP,
  ale nie loguj sekretów ani haseł.

Kryteria akceptacji:
- Poprawne dane -> konto + profil.
- Nick unikalny (kolizja -> błąd). Chronione trasy przekierowują niezalogowanych.
- Logowanie i wylogowanie działa.

Definition of Done: test+build+commit "T3: auth + rejestracja".
```
