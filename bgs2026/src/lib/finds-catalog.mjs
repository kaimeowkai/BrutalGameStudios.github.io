export const MAX_CATALOG_ITEMS = 5000;
const AMAZON_IMAGE_HOSTS = new Set(['m.media-amazon.com','images-na.ssl-images-amazon.com']);
const text = (value,max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
export function validateCatalog(input,{now=Date.now()}={}) {
  const errors=[];
  if(input?.version!==1||!Array.isArray(input?.items)) return {ok:false,errors:['Expected version 1 and an items array.'],items:[]};
  if(input.items.length>MAX_CATALOG_ITEMS) errors.push(`Maximum ${MAX_CATALOG_ITEMS} items.`);
  const seen=new Set();
  input.items.forEach((item,index)=>{
    const prefix=`Item ${index+1}`;
    if(!/^[A-Z0-9]{10}$/.test(item?.asin||'')) errors.push(`${prefix}: valid ASIN required.`);
    if(seen.has(item?.asin)) errors.push(`${prefix}: duplicate ASIN.`);
    seen.add(item?.asin);
    for(const [key,max] of [['title',180],['category',60],['summary',500]]) if(!text(item?.[key],max))errors.push(`${prefix}: ${key} required (max ${max}).`);
    const photo=item?.image;
    if(!text(photo?.alt,250))errors.push(`${prefix}: descriptive photo alt text required.`);
    if(photo?.rightsConfirmed!==true)errors.push(`${prefix}: photo-use permission must be confirmed.`);
    if(!text(photo?.rightsNote,500))errors.push(`${prefix}: photo permission/source note required.`);
    if(!text(photo?.reference,500))errors.push(`${prefix}: product identity source required.`);
    if(photo?.source==='amazon-api') {
      let url;
      try{url=new URL(photo.url);}catch{}
      if(!url||url.protocol!=='https:'||!AMAZON_IMAGE_HOSTS.has(url.hostname)||url.username||url.password||!url.pathname.startsWith('/images/'))errors.push(`${prefix}: approved Amazon image URL required.`);
      const fetched=Date.parse(photo.fetchedAt),expiry=Date.parse(photo.expiresAt);
      if(!Number.isFinite(fetched)||!Number.isFinite(expiry)||fetched>now+60000||expiry<=now||expiry-fetched>86400000||expiry<=fetched)errors.push(`${prefix}: Amazon image URL must be fresh and expire within 24 hours of retrieval.`);
    }else if(photo?.source==='licensed-photo') {
      if(!/^\/assets\/finds\/[A-Za-z0-9/_-]+\.(?:webp|png|jpe?g)$/.test(photo.url||''))errors.push(`${prefix}: licensed photo must be a local /assets/finds/ image.`);
      if(!Number.isFinite(Date.parse(photo.verifiedAt))||Date.parse(photo.verifiedAt)>now+60000)errors.push(`${prefix}: photo verification date required.`);
    }else errors.push(`${prefix}: supported authorized photo source required.`);
  });
  return {ok:errors.length===0,errors,items:errors.length?[]:input.items};
}
export function referralUrl(asin) {
  if(!/^[A-Z0-9]{10}$/.test(asin))throw new Error('Invalid ASIN');
  return `https://www.amazon.com/dp/${asin}/ref=nosim?tag=brutalgamestu-20`;
}
export function availableCatalog(input,{now=Date.now()}={}) {
  const seen=new Set();
  return (Array.isArray(input?.items)?input.items:[]).slice(0,MAX_CATALOG_ITEMS).flatMap(item=>{
    const checked=validateCatalog({version:1,items:[item]},{now});
    if(!checked.ok||seen.has(item.asin))return [];
    seen.add(item.asin);
    return [{asin:item.asin,title:item.title,category:item.category,summary:item.summary,link:referralUrl(item.asin),image:{url:item.image.url,alt:item.image.alt,...(item.image.source==='amazon-api'?{expiresAt:item.image.expiresAt}:{})}}];
  });
}
