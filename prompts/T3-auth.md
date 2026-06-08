# T3 — Auth + rejestracja na kod

> Najpierw zastosuj `prompts/00-orchestrator.md`. Następnie wykonaj poniższe.

**Zależności:** T1, T2.

```
Realizujesz ticket T3 (Auth + rejestracja na kod). Pracuj wg 00-orchestrator.md i PLAN.md.

Zadanie:
1. Strony (po polsku):
   - src/app/(auth)/login/page.tsx — email + hasło.
   - src/app/(auth)/register/page.tsx — email, hasło, nick, kod zaproszenia.
   Formularze: react-hook-form + zod (walidacja: email, hasło min 8 znaków, nick 2–24,
   kod wymagany). Czytelne komunikaty błędów po polsku.
2. Server Actions:
   - signIn: logowanie email/hasło przez Supabase Auth.
   - signUp: TRANSAKCYJNIE (service_role):
       a) sprawdź invite_code istnieje i used_by IS NULL,
       b) utwórz użytkownika (auth) + profil (nick), 
       c) oznacz invite_code.used_by = nowy user, used_at = now().
     Jeśli kod zły/zużyty -> błąd, NIE twórz konta. Nick musi być unikalny.
   - signOut.
3. middleware.ts: chroń trasy (app)/* i (admin)/*; niezalogowani -> /login.
   Zalogowani na /login|/register -> redirect do strony głównej aplikacji.
4. Obsłuż sesję przez @supabase/ssr (cookies) zgodnie z konwencjami.

Bezpieczeństwo:
- Walidacja po stronie serwera (nie ufaj klientowi). Rate-limit nie wymagany w MVP,
  ale nie loguj sekretów ani haseł. Kod zaproszenia weryfikowany server-side.

Kryteria akceptacji:
- Zły/zużyty kod -> czytelny błąd, brak konta.
- Poprawny kod -> konto + profil + kod oznaczony jako used (used_by/used_at).
- Nick unikalny (kolizja -> błąd). Chronione trasy przekierowują niezalogowanych.
- Logowanie i wylogowanie działa.

Definition of Done: test+build+commit "T3: auth + rejestracja na kod".
```
