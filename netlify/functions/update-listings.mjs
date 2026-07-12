import { syncListings } from "../../lib/sync-service.js";
import { loadBlobData,saveBlobData } from "../lib/blob-store.mjs";

export default async request=>{
  const expected=process.env.SYNC_SECRET;
  const supplied=request.headers.get("authorization");
  if(!expected||supplied!==`Bearer ${expected}`){
    console.warn("Odbijen neovlašten pokušaj sinkronizacije");
    return;
  }
  const startedAt=Date.now();
  const data=await syncListings({loadData:()=>loadBlobData(request),saveData:saveBlobData});
  console.log(JSON.stringify({event:"kvadrat-sync-complete",count:data.listings.length,durationMs:Date.now()-startedAt,sources:data.sourceStatus}));
};

export const config={background:true,path:"/api/admin/sync",method:"POST"};
