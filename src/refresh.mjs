export const REFRESH_INTERVAL=30*60*1000;
// Selection keys change whenever the store, city or branch changes.
export function createCatalogRefresh({selection,refresh,now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout,interval=REFRESH_INTERVAL}){
 let timer,active=null,lastKey=null,lastAttempt=0;
 function schedule(){clearTimer(timer);if(selection()!=null)timer=setTimer(()=>run(),Math.max(0,interval-(now()-lastAttempt)));}
 async function run(force=false){const key=selection();if(key==null){clearTimer(timer);lastKey=null;return;}if(active?.key===key)return;if(!force&&lastKey===key&&now()-lastAttempt<interval){schedule();return;}
  const job={key};active=job;lastKey=key;lastAttempt=now();clearTimer(timer);
  try{for(const kind of ['price','promo']){if(selection()!==key)break;try{await refresh(kind);}catch{ /* Keep the previous successful data; still try the other feed. */ }}}
  finally{if(active===job){active=null;if(selection()===key)schedule();else if(selection()!=null)run(true);}}
 }
 function stop(){clearTimer(timer);lastKey=null;}
 return {run,stop};
}
