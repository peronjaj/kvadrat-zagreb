import { listingsPayload } from "../../lib/api-data.js";
import { loadBlobData } from "../lib/blob-store.mjs";

export default async request=>{
  const data=await loadBlobData(request);
  const params=new URL(request.url).searchParams;
  return Response.json(listingsPayload(data,params),{headers:{"Cache-Control":"no-store"}});
};

export const config={path:"/api/listings",method:"GET"};
