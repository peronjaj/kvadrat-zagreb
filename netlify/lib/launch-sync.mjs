export async function launchBackgroundSync(request){
  const secret=process.env.SYNC_SECRET;
  if(!secret)throw new Error("SYNC_SECRET nije postavljen u Netlify postavkama");
  const url=new URL("/api/admin/sync",request.url);
  const response=await fetch(url,{method:"POST",headers:{Authorization:`Bearer ${secret}`}});
  if(response.status!==202&&!response.ok)throw new Error(`Pokretanje sinkronizacije nije uspjelo (${response.status})`);
  return response;
}
