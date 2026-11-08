const filters = [...document.querySelectorAll('[data-filter]')];
const products = [...document.querySelectorAll('[data-category]')];
filters.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  let count = 0;
  products.forEach(product => {
    product.hidden = category !== 'all' && product.dataset.category !== category;
    if (!product.hidden) count++;
  });
  filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.getElementById('filter-status').textContent = `Showing ${count} product guide${count === 1 ? '' : 's'}.`;
}));

// Enhancement only: every guide remains readable and linked without JavaScript.
const guideCards=[...document.querySelectorAll('[data-guide-category]')];
if(guideCards.length){
  const controls=document.getElementById('guide-controls');
  const input=document.getElementById('guide-search');
  const guideFilters=[...document.querySelectorAll('[data-guide-filter]')];
  const reset=document.getElementById('guide-reset');
  let selected='all';
  function updateGuides(){
    const query=input.value.trim().toLowerCase();let count=0;
    guideCards.forEach(card=>{card.hidden=(selected!=='all'&&card.dataset.guideCategory!==selected)||!card.textContent.toLowerCase().includes(query);if(!card.hidden)count++;});
    guideFilters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.guideFilter===selected)));
    document.getElementById('guide-status').textContent=`Showing ${count} of ${guideCards.length} buying guides.`;
    document.getElementById('guide-empty').hidden=count!==0;
  }
  guideFilters.forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.guideFilter;updateGuides();}));
  input.addEventListener('input',updateGuides);
  reset.addEventListener('click',()=>{selected='all';input.value='';updateGuides();input.focus();});
  controls.hidden=false;
}
