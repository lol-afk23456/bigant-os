# Collaudo Email marketing — 10 ottobre 2026

FUN-040 implementata: il registro contatti è dentro il servizio acquistato Email marketing, autonomo rispetto a Growth e Fidelity. Nessuna iscrizione o importazione implicita. Consenso manuale con fonte/data/informativa, revoca, nuovo consenso e storico immutabile; conflitti e richieste obsolete rifiutati. Soci e titolare modificano, collaboratori assegnati consultano; anteprima cliente in sola lettura.

16 nuove prove automatiche: dominio, HTTP e interfaccia. Suite completa: 755 prove, 754 superate; unica aspettativa storica del catalogo corretta perché il registro manuale non crea approvazioni di campagne. File interessato ricontrollato: 4/4 superate. Nessun difetto residuo rilevato dalle prove. Controllo progetto 5/5: 28 servizi, 32 agenti, dipendenze invariate. Non è stata ripetuta la suite dopo la sola correzione dell’aspettativa.

Browser su database in memoria e dati inventati: percorso cliente → servizio, inserimento, conferma obbligatoria, revoca e rinnovo, chiusura dei moduli, percorso socio dalla scheda servizi e ricarica con attività conservata, anteprima senza aggiunta/revoca e storico consultabile. Vista 390×844 senza scorrimento orizzontale, console senza errori. Corretti durante il collaudo la chiusura dopo salvataggio e l’attributo obbligatorio della casella. Screenshot locali in `.cache/riordino-browser/bigant-email-desktop.png` e `bigant-email-mobile.png`.

Revisione indipendente mirata: nessun difetto riproducibile nei controlli di ambito, prove del consenso e storico. La dichiarazione manuale non certifica il consenso effettivo. Invii, campagne, doppia conferma e statistiche del fornitore restano da collegare; nessuna chiamata o comunicazione esterna effettuata.
