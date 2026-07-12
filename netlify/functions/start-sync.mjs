import { launchBackgroundSync } from "../lib/launch-sync.mjs";

const zagrebHour=date=>Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Zagreb",hour:"2-digit",hourCycle:"h23"}).format(date));

export default async request=>{
  const hour=zagrebHour(new Date());
  if(hour!==9){
    console.log(`Preskočen UTC okidač jer je u Zagrebu ${hour}:00`);
    return;
  }
  await launchBackgroundSync(request);
  console.log("Pokrenuta jutarnja pozadinska sinkronizacija");
};

// Dva UTC termina pokrivaju 09:00 u Zagrebu i tijekom CET-a i tijekom CEST-a.
export const config={schedule:"0 7,8 * * *"};
