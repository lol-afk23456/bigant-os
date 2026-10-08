# Da fare per Raffaele — account e chiavi esterne

Aggiornato l'8 ottobre 2026. Nessuno di questi account è stato creato e nessuna chiave è nel repository. **Oggi lo sciame funziona già senza chiavi**, con il motore Claude Code di questa sessione. Le voci sotto servono per collegare le fonti reali o per far girare lo sciame anche fuori da Claude Code.

Dove si inseriscono le variabili: nelle impostazioni dell'ambiente cloud di Claude Code (claude.ai/code → ambiente → **Variabili d'ambiente**), una per riga nel formato `NOME=valore`. Non vanno mai scritte in file del repository, in chat o nei documenti.

| # | Cosa serve | Perché | Gratuito? | Variabili d'ambiente |
|---|---|---|---|---|
| 1 | Chiave API Anthropic (facoltativa) | Far lavorare gli agenti anche senza una sessione Claude Code aperta (per esempio su un server) | **No**: si paga a consumo | `BIGANT_MOTORE=api`, `BIGANT_ANTHROPIC_API_KEY`, `BIGANT_API_MODELLO`, facoltativa `BIGANT_API_COSTO_MAX_CENT` |
| 2 | Google Cloud + Google Business Profile API | Leggere le schede Google dei clienti e pubblicare post e risposte dopo l'ok | Sì (serve approvazione Google) | `BIGANT_GOOGLE_CLIENT_ID`, `BIGANT_GOOGLE_CLIENT_SECRET`, `BIGANT_GOOGLE_PROJECT_NUMBER` |
| 3 | Google Ads API, developer token "Basic" | Spesa, contatti e costo per contatto nella dashboard cliente | Sì | `BIGANT_GOOGLE_ADS_DEVELOPER_TOKEN`, `BIGANT_GOOGLE_ADS_LOGIN_CUSTOMER_ID` |
| 4 | Verifica aziendale Meta + app Meta con `ads_read` | Risultati di Facebook e Instagram Ads | Sì | `BIGANT_META_APP_ID`, `BIGANT_META_APP_SECRET` |
| 5 | GA4 e Search Console (stesso progetto Google Cloud del punto 2) | Visite, fonti e posizioni su Google | Sì | Le stesse del punto 2 |
| 6 | Postiz (programmazione social) | Programmare i post approvati senza copiarli a mano | Sì se installato da voi; la versione cloud è a pagamento | `BIGANT_POSTIZ_URL`, `BIGANT_POSTIZ_API_KEY` |

I connettori dei punti 2–6 **non sono ancora scritti**: in dashboard compaiono come COLLEGAMENTO MANCANTE. I nomi delle variabili sono già fissati, così le chiavi si potranno inserire senza cambiare il codice.

## 1. Chiave API Anthropic (facoltativa, a pagamento)

Oggi non serve: il motore Claude Code produce già output reali. Diventa utile quando lo sciame dovrà girare da solo su un server, senza una sessione Claude Code aperta.

1. Andare su console.anthropic.com e accedere con l'account aziendale scelto dai soci (vedi la decisione sull'account in `docs/INTEGRAZIONI-ACCESSI.md`).
2. Billing → aggiungere un metodo di pagamento e impostare un **limite di spesa mensile** coerente con il tetto di BigAnt OS (oggi 50 € in tutto).
3. API Keys → Create Key → nome `bigant-os`. Copiare la chiave una sola volta.
4. Scegliere il modello dalla pagina ufficiale "Models overview" della documentazione Anthropic.
5. Nelle variabili d'ambiente inserire `BIGANT_MOTORE=api`, `BIGANT_ANTHROPIC_API_KEY=<chiave>` e `BIGANT_API_MODELLO=<identificativo del modello>`. Facoltativo: `BIGANT_API_COSTO_MAX_CENT=25`, cioè il costo prudenziale contato per ogni chiamata nel tetto di spesa.
6. Riavviare l'app: nell'Ufficio virtuale il motore deve risultare "API Anthropic" con stato OPERATIVO.

Nota: si usa `BIGANT_ANTHROPIC_API_KEY` e non `ANTHROPIC_API_KEY`, perché quest'ultima cambierebbe l'account usato da Claude Code stesso.

## 2. Google Cloud e Google Business Profile API (gratuita, con approvazione)

1. Decidere l'account aziendale (consigliato un account Google Workspace dell'agenzia, per esempio `tech@bigantagency.it`) [DA DECIDERE tra i soci].
2. console.cloud.google.com → nuovo progetto `bigant-os` → annotare il **Project Number**.
3. API e servizi → Schermata di consenso OAuth → tipo "Esterno" → pubblicarla in **Production** (in modalità Testing gli accessi scadono ogni 7 giorni).
4. Credenziali → Crea credenziali → ID client OAuth → "Applicazione web". Annotare ID client e segreto.
5. Compilare il modulo di richiesta della GBP API scegliendo "Application for Basic API Access". Il testo in inglese è pronto in `docs/INTEGRAZIONI-ACCESSI.md`, sezione 2.
6. Inserire `BIGANT_GOOGLE_CLIENT_ID`, `BIGANT_GOOGLE_CLIENT_SECRET` e `BIGANT_GOOGLE_PROJECT_NUMBER`.

## 3. Google Ads API (gratuita)

1. Verificare che esista l'account amministratore (MCC) di BigAnt con tutti i clienti collegati.
2. Nell'MCC: Strumenti → Centro API (`ads.google.com/aw/apicenter`) → ottenere il developer token → **Apply for Basic Access**. La descrizione d'uso è pronta in `docs/INTEGRAZIONI-ACCESSI.md`, sezione 3.
3. Inserire `BIGANT_GOOGLE_ADS_DEVELOPER_TOKEN` e `BIGANT_GOOGLE_ADS_LOGIN_CUSTOMER_ID` (il numero dell'MCC, senza trattini).

## 4. Meta (gratuita, richiede tempo)

1. Meta Business Suite → Impostazioni → Centro sicurezza → **Verifica dell'azienda**, a nome di **una** delle due ditte, con i dati identici ai documenti [DA DECIDERE quale ditta].
2. developers.facebook.com → Crea app collegata al Business Manager verificato.
3. Chiedere solo `ads_read` (non `ads_management`), quando la dashboard mostrerà dati veri: Meta chiede un video dimostrativo.
4. Inserire `BIGANT_META_APP_ID` e `BIGANT_META_APP_SECRET`.

## 5. GA4 e Search Console

Usano lo stesso progetto e le stesse credenziali OAuth del punto 2. Non serve un'approvazione per l'uso interno: basta che la schermata di consenso sia in Production e che si chiedano solo gli scope in sola lettura.

## 6. Postiz

1. Scegliere tra installazione propria (gratuita, ma da mantenere) e servizio cloud (a pagamento) [DA DECIDERE].
2. Creare una chiave API dalle impostazioni di Postiz.
3. Inserire `BIGANT_POSTIZ_URL` e `BIGANT_POSTIZ_API_KEY`.

## Altre cose che solo i soci possono fare

- **Abbonamento Claude**: il motore Claude Code mostra un costo "equivalente a listino" per ogni agente. Verificare con il proprio piano Claude se questi consumi sono inclusi o conteggiati a parte [DA VERIFICARE].
- **Software di fatturazione elettronica** usato dalle due ditte [DA DEFINIRE]: serve per preparare le bozze di fattura.
- **Canale per gli avvisi ai soci** (email o WhatsApp) quando un automatismo si blocca [DA DECIDERE]. Nessun invio è attivo.
- **Sicurezza delle dipendenze**: `npm audit` segnala vulnerabilità alte in `sharp` 0.34.5, la libreria usata per i loghi. La correzione richiede `sharp` 0.35.x: va aggiornata con un collaudo dei loghi Fidelity prima di qualunque messa online.
