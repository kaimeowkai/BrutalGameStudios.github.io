(() => {
  const section=document.getElementById('product-catalog');
  if(!section)return;
  const search=document.getElementById('catalog-search'),category=document.getElementById('catalog-category');
  const grid=document.getElementById('catalog-grid'),status=document.getElementById('catalog-status');
  const previous=document.getElementById('catalog-previous'),next=document.getElementById('catalog-next'),pageLabel=document.getElementById('catalog-page');
  const pageSize=24,failed=new Set();let items=[],page=1;
  const node=(tag,cls,value)=>{const element=document.createElement(tag);if(cls)element.className=cls;if(value)element.textContent=value;return element;};
  const filtered=()=>items.filter(item=>!failed.has(item.asin)&&(category.value==='all'||item.category===category.value)&&`${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(search.value.trim().toLowerCase()));
  function render(){
    const matches=filtered(),pages=Math.max(1,Math.ceil(matches.length/pageSize));page=Math.min(page,pages);
    grid.replaceChildren();
    matches.slice((page-1)*pageSize,page*pageSize).forEach(item=>{
      const card=node('article','catalog-card photo-pending');
      const image=node('img');image.alt=item.image.alt;image.width=400;image.height=300;image.decoding='async';
      image.addEventListener('load',()=>card.classList.remove('photo-pending'),{once:true});
      image.addEventListener('error',()=>{failed.add(item.asin);render();},{once:true});
      image.src=item.image.url;
      const body=node('div','catalog-card-body');body.append(node('p','eyebrow',item.category),node('h3','',item.title),node('p','',item.summary));
      const link=node('a','shop-link','View on Amazon ↗');link.href=item.link;link.target='_blank';link.rel='sponsored noopener';body.append(link,node('small','paid','Paid link · See Amazon for price, seller and delivery details'));
      card.append(image,body);grid.append(card);
    });
    status.textContent=matches.length?`${matches.length} photographed products. Showing ${(page-1)*pageSize+1}–${Math.min(page*pageSize,matches.length)}.`:'No products match. Try a different search or category.';
    pageLabel.textContent=`Page ${page} of ${pages}`;previous.disabled=page===1;next.disabled=page===pages||!matches.length;
  }
  search.addEventListener('input',()=>{page=1;render();});category.addEventListener('change',()=>{page=1;render();});
  previous.addEventListener('click',()=>{page--;render();});next.addEventListener('click',()=>{page++;render();});
  let refreshTimer;
  function refresh(){clearTimeout(refreshTimer);return fetch('/api/finds-catalog',{cache:'no-store',credentials:'omit'}).then(response=>{if(!response.ok)throw new Error('Catalog unavailable');return response.json();}).then(data=>{
    items=Array.isArray(data.items)?data.items:[];
    if(!items.length){section.hidden=true;return;}
    const selected=category.value;category.replaceChildren();const all=node('option','','All categories');all.value='all';category.append(all);
    [...new Set(items.map(item=>item.category))].sort().forEach(name=>{const option=node('option','',name);option.value=name;category.append(option);});
    category.value=[...category.options].some(option=>option.value===selected)?selected:'all';
    section.hidden=false;render();
    const expirations=items.map(item=>Date.parse(item.image.expiresAt)).filter(Number.isFinite);
    if(expirations.length)refreshTimer=setTimeout(refresh,Math.max(1000,Math.min(...expirations)-Date.now()));
  }).catch(()=>{section.hidden=true;});}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
  refresh();
})();
