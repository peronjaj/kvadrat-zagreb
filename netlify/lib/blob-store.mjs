import { getStore } from "@netlify/blobs";

const EMPTY_DATA={listings:[],lastSync:null,sourceStatus:[],usingDemo:false,usingCached:false,usingSnapshot:false};

function store(){return getStore("kvadrat-data");}

export async function loadBlobData(request){
  try{
    const data=await store().get("current",{type:"json",consistency:"strong"});
    if(data?.listings)return data;
  }catch(error){
    console.warn(`Netlify Blob nije dostupan: ${error.message}`);
  }
  if(request){
    try{
      const response=await fetch(new URL("/data.json",request.url),{headers:{Accept:"application/json"}});
      if(response.ok){const data=await response.json();if(data?.listings)return data;}
    }catch(error){
      console.warn(`Početni data.json nije dostupan: ${error.message}`);
    }
  }
  return structuredClone(EMPTY_DATA);
}

export async function saveBlobData(data){
  await store().setJSON("current",data);
}
