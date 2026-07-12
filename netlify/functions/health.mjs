export default async()=>Response.json({ok:true,platform:"netlify"},{headers:{"Cache-Control":"no-store"}});
export const config={path:"/api/health",method:"GET"};
