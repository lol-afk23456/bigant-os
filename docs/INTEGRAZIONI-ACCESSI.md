# PARTE 3 — ACCESSI API (stato e requisiti; da salvare in docs/INTEGRAZIONI-ACCESSI.md)
### ACCESSI API PER BIGANT OS — cosa richiedere e in che ordine
**Preparato:** 08/10/2026 · **Per:** Raffaele e Alfonso
> Gli agenti e le dashboard di BigAnt OS leggono i dati dei clienti da Google e Meta tramite API. Alcuni accessi vanno **approvati** da Google o Meta e richiedono da qualche giorno a qualche settimana. Se li chiedi adesso, quando Codex ne avrà bisogno saranno già pronti.
> I requisiti cambiano spesso: prima di inviare ogni richiesta, controlla la pagina ufficiale linkata.

---

#### DECISIONE PRELIMINARE: quale account usare
Tutte le richieste devono partire dallo **stesso account aziendale**, non da quelli personali, perché resterà il "proprietario" tecnico di BigAnt OS.
- **Consigliato:** un account Google Workspace dell'agenzia (per esempio una casella tecnica dedicata sul dominio dell'agenzia). Workspace serve anche per avere una "Organization" su Google Cloud, che la richiesta GBP chiede.
- **Alternativa:** l'account Gmail personale già usato da Codex funziona per partire, ma un Gmail personale non ha una Organization e lega tutto a una persona.
- **Da decidere tra i soci:** [DA DECIDERE]

---

#### ORDINE CONSIGLIATO (dal più lento al più veloce)

| # | Accesso | Serve per | Tempi di approvazione | Difficoltà |
|---|---|---|---|---|
| 1 | **Verifica aziendale Meta** | Prerequisito per leggere gli account pubblicitari dei clienti | Giorni o settimane | Media: servono documenti di una delle due ditte |
| 2 | **Google Business Profile API** | Schede Google dei clienti: dati, post, recensioni | Da qualche giorno a qualche settimana; le richieste vengono spesso rifiutate se sono vaghe | Media |
| 3 | **Google Ads API: developer token "Basic"** | Spesa e risultati delle campagne Google Ads | Di solito qualche giorno | Bassa |
| 4 | **Meta Marketing API: ads_read in Advanced Access** | Spesa e risultati di Facebook e Instagram Ads dei clienti | Dopo la verifica aziendale; serve un video dimostrativo | Alta: conviene farlo quando la dashboard esiste |
| 5 | **Google Analytics 4 + Search Console API** | Visite al sito, conversioni, posizioni su Google | Nessuna approvazione per uso interno | Bassa |
| — | LinkedIn, TikTok | Statistiche social avanzate | Approvazioni lunghe e selettive | **Rimandare**: per partire basta lo strumento di programmazione social |

---

#### 1. Verifica aziendale Meta (Business Verification)
**Dove:** Meta Business Suite → Impostazioni → Centro sicurezza → Verifica dell'azienda
**Cosa serve:**
- una delle due ditte, consigliata quella che gestisce di più l'ADV (probabilmente La Manna Agency) [DA DECIDERE];
- documento con ragione sociale e P.IVA (visura o certificato di attribuzione P.IVA);
- un indirizzo e un telefono che coincidano con i documenti;
- un dominio verificato (bigantagency.it) oppure un'email su quel dominio.

**Attenzione:** BigAnt è un marchio e non una società. La verifica va fatta a nome di **una** ditta reale, con i suoi dati esatti: nomi diversi tra documento e Business Manager sono la causa più comune di rifiuto.

#### 2. Google Business Profile API
**Prerequisiti:**
- un progetto Google Cloud, con il suo numero (Project Number);
- un'email che sia **proprietaria o gestore** di una scheda Google;
- scheda completa e aggiornata, con il sito web. Alcune guide parlano anche di scheda verificata e attiva da più di 60 giorni: va verificato sulla pagina ufficiale.

**Come:**
1. Crea il progetto su Google Cloud e annota il Project Number.
2. Compila il modulo di contatto GBP API e scegli **"Application for Basic API Access"**.
3. Finché non arriva l'approvazione, le chiamate falliscono (quota a zero). È normale.

**Testo pronto per la richiesta** (in inglese, perché il modulo è in inglese):
> We are BigAnt Agency, a digital marketing agency in Caserta, Italy, managing the Google Business Profiles of about 15 local small businesses (healthcare clinics, restaurants, nautical and industrial companies), with the owners' explicit authorization. We are building an internal management tool used only by our agency and our clients. We need the Business Profile APIs to: (1) read profile information and performance metrics (views, calls, direction requests) to show them in each client's private dashboard; (2) read reviews and post owner replies that are approved by a human before publishing; (3) publish local posts prepared by our team after client approval. We do not sell API access, do not create or claim profiles in bulk, and do not post content without human approval. Contact: [EMAIL] — Website: https://bigantagency.it

#### 3. Google Ads API: developer token "Basic"
**Prerequisiti:**
- un **account amministratore (MCC)** Google Ads dell'agenzia, a cui collegare tutti gli account clienti attivi;
- un'email di contatto API aggiornata e controllata regolarmente.

**Come:**
1. Accedi all'MCC e apri il Centro API (`ads.google.com/aw/apicenter`).
2. Ottieni il token, che parte con un accesso di test o "Explorer".
3. Clicca **Apply for Basic Access** e compila il modulo.
4. Google valuta anche la verifica del brand del progetto Cloud: farla accelera la risposta.

**Descrizione d'uso pronta:**
> Internal reporting and campaign management tool for BigAnt Agency (Italy). It is used only by our agency staff to manage the Google Ads accounts of our own clients, all linked to our manager account. Features: performance reporting (spend, conversions, cost per lead) shown in a private client dashboard; budget and keyword recommendations reviewed and applied by a human. No external users, and no resale of API access.

#### 4. Meta Marketing API: ads_read in Advanced Access
**Quando:** dopo la verifica aziendale (punto 1), e quando BigAnt OS ha una schermata che mostra dati veri. Meta chiede un **video** che mostra il login con Facebook, il consenso e i dati delle campagne.

**Cosa richiedere:**
- **solo `ads_read`**, perché ci serve leggere i risultati;
- **non `ads_management`**: chiedere più del necessario è una causa frequente di rifiuto.

L'approvazione vale solo per quell'app: se in futuro se ne crea un'altra, si riparte da zero.

**Da fare oggi:**
- creare l'app su developers.facebook.com, collegata al Business Manager verificato;
- preparare un account pubblicitario reale con dati da mostrare (quello di BigAnt).

#### 5. Google Analytics 4 e Search Console
Non serve un'approvazione per uso interno, ma c'è un dettaglio importante:
- finché la schermata di consenso OAuth del progetto Google Cloud è in modalità **"Testing"**, gli accessi **scadono ogni 7 giorni** e le dashboard smettono di aggiornarsi;
- la soluzione è **pubblicarla in "Production"**. Per i dati di Analytics e Search Console Google può chiedere una verifica: senza verifica, chi collega il proprio account vede l'avviso "app non verificata".

**Da dire a Codex:** usare la modalità Production fin da subito e chiedere solo gli scope in sola lettura.

---

#### CHECKLIST DI OGGI
- [ ] Decidere quale account Google e quale ditta usare
- [ ] Avviare la verifica aziendale Meta
- [ ] Creare il progetto Google Cloud e annotare il Project Number
- [ ] Inviare la richiesta GBP API (testo pronto sopra)
- [ ] Controllare che esista l'MCC Google Ads con tutti i clienti collegati, poi richiedere l'accesso Basic
- [ ] Creare l'app Meta (la review ads_read si fa più avanti)
- [ ] Segnare qui le date di invio e di risposta

| Richiesta | Inviata il | Esito | Note |
|---|---|---|---|
| Verifica aziendale Meta | | | |
| GBP API Basic Access | | | |
| Google Ads API Basic | | | |
| Meta ads_read Advanced | | | |

#### FONTI
- Google Business Profile, prerequisiti: https://developers.google.com/my-business/content/prereqs
- Guida GBP API 2026 (terza parte): https://slashpost.ai/blogs/google-business-profile/google-business-profile-api-documentation-2026
- Google Ads API, livelli di accesso: https://developers.google.com/google-ads/api/docs/access-levels
- Google Ads API, developer token: https://developers.google.com/google-ads/api/docs/first-call/dev-token
- Meta Marketing API, accesso: https://developers.facebook.com/docs/marketing-api/access
- Google OAuth, verifica degli scope sensibili: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
