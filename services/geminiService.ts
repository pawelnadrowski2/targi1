import { TradeOrder } from "../types";

// Expanded database of offline templates
const OFFLINE_TEMPLATES = [
  "Gratulacje dla firmy {client}! Wasze zamówienie u wystawcy {exhibitor} przyniosło Wam szczęście!",
  "Mamy zwycięzcę! {client} wygrywa nagrodę dzięki współpracy z {exhibitor}!",
  "Fantastyczna wiadomość dla {client}! Bilet od {exhibitor} okazał się tym szczęśliwym!",
  "Wielkie brawa dla {client}! Dziękujemy za zaufanie okazane firmie {exhibitor}!",
  "To jest Wasz dzień! {client} wygrywa losowanie! Podziękowania dla stoiska {exhibitor}.",
  "Ależ emocje! Zwycięża {client}. Udana transakcja z {exhibitor} procentuje!",
  "Szczęście uśmiechnęło się do firmy {client}! Gratulujemy świetnego wyboru dostawcy: {exhibitor}!",
  "Brawa! {client} zgarnia nagrodę. Dziękujemy za zamówienie złożone u {exhibitor}.",
  "Zwycięstwo! {client} - ten dzień należy do Was! Partnerstwo z {exhibitor} to strzał w dziesiątkę.",
  "Mamy to! {client} wygrywa nagrodę główną. Gratulacje dla wystawcy {exhibitor} za skuteczność!",
  "Niesamowite szczęście firmy {client}! Zamówienie u {exhibitor} okazało się przepustką do nagrody.",
  "Halo Targi! Zwycięża {client}! Dziękujemy wystawcy {exhibitor} za udział w sukcesie.",
  "Co za niespodzianka! Firma {client} dołącza do grona zwycięzców dzięki {exhibitor}!",
  "Los uśmiechnął się do {client}. Dziękujemy za wizytę na stoisku {exhibitor}!",
  "Mamy werdykt! Nagroda wędruje do {client}. Brawo dla wystawcy {exhibitor}!",
  "Targowy sukces! {client} wygrywa w wielkim stylu. Transakcja z {exhibitor} się opłaciła.",
  "Idealny wybór! {client} postawił na {exhibitor} i wygrał nagrodę!",
  "To musi być dobry dzień dla {client}! Gratulujemy wygranej i współpracy z {exhibitor}.",
  "Znakomity strzał! {client} wygrywa. Pozdrawiamy ekipę ze stoiska {exhibitor}.",
  "Wielka wygrana dla {client}! Dziękujemy, że jesteście z nami i z firmą {exhibitor}."
];

const getLocalMessage = (winner: TradeOrder): string => {
  const template = OFFLINE_TEMPLATES[Math.floor(Math.random() * OFFLINE_TEMPLATES.length)];
  return template
    .replace("{client}", winner.clientName)
    .replace("{exhibitor}", winner.createdBy || "Dostawca");
};

// Simplified service - purely sync/local now, keeping Promise for interface consistency
export const generateCongratulationMessage = async (winner: TradeOrder): Promise<string> => {
  // Simulate a tiny delay just for UI smoothness (optional)
  await new Promise(resolve => setTimeout(resolve, 300));
  return getLocalMessage(winner);
};