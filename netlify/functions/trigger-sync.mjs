import { launchBackgroundSync } from "../lib/launch-sync.mjs";

export default async request=>{
  const expected=process.env.SYNC_SECRET;
  if(!expected||request.headers.get("authorization")!==`Bearer ${expected}`)return Response.json({error:"Nedopušteno"},{status:401});
  await launchBackgroundSync(request);
  return Response.json({ok:true,status:"pokrenuto"},{status:202});
};

export const config={path:"/api/admin/trigger",method:"POST"};
