const $=s=>document.querySelector(s);let state;
const pad=n=>String(Math.floor(n)).padStart(2,'0');
function duration(ms){ms=Math.max(0,ms);const h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;return h?`${pad(h)}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`;}
function render(){if(!state)return;const mode=state.hudMode,now=Date.now();let value,detail,label;
if(mode==='clock'){value=new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());detail=new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());label='YEREL SAAT · İSTANBUL';}
if(mode==='timer'){const t=state.timers.find(x=>x.running)||state.timers[0];value=t?duration(t.running?t.deadline-now:t.remaining):'--:--';detail=t?t.label:'Aktif zamanlayıcı yok';label='ZAMANLAYICI';}
if(mode==='pomodoro'){const p=state.pomodoro;value=duration(p.running?p.deadline-now:p.remaining);detail=p.phase==='focus'?`${p.session}. odak seansı`:p.phase==='short'?'Kısa mola':'Uzun mola';label='POMODORO';}
if(mode==='stopwatch'){value=duration(state.stopwatch.elapsed);detail=state.stopwatch.running?'Ölçüm sürüyor':'Kronometre bekliyor';label='KRONOMETRE';}
$('#value').textContent=value;$('#detail').textContent=detail;$('#modeLabel').textContent=label;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));}
document.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)window.saat.action('hud-mode',{mode:b.dataset.mode})});$('#open').addEventListener('click',()=>window.saat.window('main'));$('#close').addEventListener('click',()=>window.saat.window('hud'));window.saat.subscribe(s=>{state=s;render()});window.saat.snapshot().then(s=>{state=s;render()});setInterval(render,250);
