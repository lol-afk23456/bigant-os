export const marketingChannels=[
 ['instagram','Instagram'],['facebook','Facebook'],['linkedin-agency','LinkedIn agenzia'],['linkedin-raffaele','LinkedIn Raffaele'],['linkedin-alfonso','LinkedIn Alfonso'],['tiktok','TikTok'],['gbp','Google Business Profile'],['website','Sito BigAnt'],['reviews','Recensioni e reputazione']
].map(([id,name])=>({id,name,status:'Fonte non collegata',missing:'Obiettivo, dati autorizzati e misure da definire. Nessun account collegato.',metrics:null}));
export const marketingAreas=[
 ['dna','DNA BigAnt','dna','Compilare pubblico, offerta, tono, prove, CTA e parole da evitare. Il testo generico DEMO non è il DNA definitivo.'],
 ['strategy','Strategia a 90 giorni','strategy','Definire obiettivi per canale, iniziative, responsabilità, scadenze e criteri di verifica.'],
 ['calendar','Calendario e mese di contenuti',null,'Preparare il calendario mensile e un mese di contenuti approvabili; al momento solo il flusso comune.'],
 ['portfolio','Portfolio e case study',null,'Registrare autorizzazioni per materiale e canale, poi produrre casi studio basati su prove.'],
 ['local','Presenza Google e recensioni',null,'Acquisire fonti autorizzate, audit iniziale e priorità. Nessuna modifica alla scheda Google.'],
 ['website','Sito e SEO',null,'Importare audit autorizzato, assegnare correzioni e misurare risultati; nessun risultato inventato.'],
 ['acquisition','Ricerca e analisi gratuita',null,'Ricerca DEMO disponibile in Growth; manca ricerca reale e audit verificato.'],
 ['ads-plan','Piano ADV BigAnt',null,'Compilare brief, mappa leve, piano creatività, conversioni e budget proposto, da approvare.'],
 ['growth-plan','Due prossimi servizi e pacchetti',null,'Confrontare due business case con capacità, costi, partner e decisione dei soci.'],
 ['measurement','KPI e obiettivi',null,'Raccogliere baseline, obiettivi e confronti periodici da fonti autorizzate.']
].map(([id,name,memoryKind,missing])=>({id,name,memoryKind,status:'Solo struttura',missing}));
export const marketingContract={
 clientId:'demo-bigant',scope:'Cliente zero BigAnt',
 goals:['Nuovi contatti e preventivi locali','Portfolio e reputazione con prove','Notorietà del brand'],
 workflow:['Brief','DNA','Strategia','Calendario','Bozze','Verifica','Approvazione del socio'],
 states:['IDEA','IN PRODUZIONE','DA APPROVARE','APPROVATO','PROGRAMMATO','PUBBLICATO','RIUTILIZZABILE'],
 externalActions:false,approval:'Un socio identificato, versione e data; pubblicazione comunque disabilitata nella demo.'
};
