(function(){
  'use strict';
  var cfg=window.OESouvenirPublic||{};
  if(!cfg.resolveUrl)return;

  function safeDecodeGuest(value){
    value=String(value||'').replace(/\+/g,' ');
    for(var i=0;i<4;i++){
      try{
        var decoded=decodeURIComponent(value);
        if(decoded===value)break;
        value=decoded;
      }catch(e){break;}
    }
    return value.replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
  }

  function pickParams(){
    var out={guest:'',token:'',parent_url:''};
    try{
      var here=new URL(window.location.href);
      out.guest=safeDecodeGuest(here.searchParams.get('to')||'');
      out.token=here.searchParams.get('souvenir')||here.searchParams.get('kepada')||'';
    }catch(e){}
    try{
      if(document.referrer){
        out.parent_url=document.referrer;
        var parent=new URL(document.referrer);
        if(!out.guest)out.guest=safeDecodeGuest(parent.searchParams.get('to')||'');
        if(!out.token)out.token=parent.searchParams.get('souvenir')||parent.searchParams.get('kepada')||'';
      }
    }catch(e){}
    return out;
  }

  function hydrate(el){
    if(!el||el.getAttribute('data-oe-hydrated')==='1')return;
    el.setAttribute('data-oe-hydrated','1');
    var state=el.querySelector('.oe-souvenir-hydrate-state');
    var p=pickParams();
    var body=new URLSearchParams();
    body.set('source_id',el.getAttribute('data-source-id')||'0');
    body.set('guest',p.guest||'');
    body.set('token',p.token||'');
    body.set('parent_url',p.parent_url||'');
    body.set('settings',el.getAttribute('data-settings')||'{}');
    fetch(cfg.resolveUrl,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Cache-Control':'no-cache'},body:body.toString(),cache:'no-store'})
      .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
      .then(function(data){
        if(state&&data&&typeof data.html==='string')state.innerHTML=data.html;
      })
      .catch(function(){
        el.removeAttribute('data-oe-hydrated');
      });
  }

  function run(){document.querySelectorAll('.oe-souvenir-hydrate').forEach(hydrate);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  document.addEventListener('elementor/popup/show',function(){window.setTimeout(run,0);});
})();
