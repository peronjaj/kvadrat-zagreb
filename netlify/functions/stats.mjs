import { statsPayload } from "../../lib/api-data.js";
import { loadBlobData } from "../lib/blob-store.mjs";

export default async request=>{
  const data=await loadBlobData(request);
  return Response.json(statsPayload(data),{headers:{"Cache-Control":"no-store"}});
};

export const config={path:"/api/stats",method:"GET"};
