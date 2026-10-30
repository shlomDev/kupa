export function nearestBranch(rows){
 const local=rows.filter(b=>b.sameCity);
 if(local.length===1)return local[0];
 // Never mistake an unknown distance for zero or select an arbitrary branch.
 const located=local.filter(b=>Number.isFinite(b.distance)&&b.distance>=0);
 return located.sort((a,b)=>a.distance-b.distance)[0]||null;
}
