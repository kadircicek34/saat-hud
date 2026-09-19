const { randomUUID } = require('node:crypto');
const defaults = () => ({cities:['Europe/Istanbul','Europe/London','America/New_York','Asia/Tokyo'],alarms:[], timers:[], stopwatch:{elapsed:0,running:false,startedAt:null,laps:[]},pomodoro:{phase:'focus',session:1,completed:0,work:25,short:5,long:15,running:false,remaining:1500000,deadline:null},hud:true,hudMode:'clock',hudPosition:null});
function nextAlarm(time, days=[], now=Date.now()) {
  const [h,m]=time.split(':').map(Number);
  for(let i=0;i<8;i++){const d=new Date(now);d.setDate(d.getDate()+i);d.setHours(h,m,0,0);if(d.getTime()>now && (!days.length||days.includes(d.getDay())))return d.getTime();}
}
class Engine {
 constructor(saved={},clock=()=>Date.now(),mono=()=>performance.now()){this.clock=clock;this.mono=mono;this.state={...defaults(),...saved};this.alerts=[];this.swBase=this.state.stopwatch.elapsed;this.swMark=mono();if(this.state.stopwatch.running)this.swBase+=Math.max(0,clock()-this.state.stopwatch.startedAt);}
 elapsed(){return this.swBase+(this.state.stopwatch.running?this.mono()-this.swMark:0);}
 snapshot(){return {...this.state,stopwatch:{...this.state.stopwatch,elapsed:this.elapsed(),startedAt:this.clock()},alerts:this.alerts};}
 ring(title,kind,id){this.alerts.push({id:randomUUID(),source:id,title,kind,at:this.clock()});}
 tick(){const now=this.clock();for(const a of this.state.alarms){if(a.enabled&&a.next<=now){this.ring(a.label||'Günaydın', 'alarm',a.id);if(a.days.length)a.next=nextAlarm(a.time,a.days,now);else a.enabled=false;}if(a.snoozeAt&&a.snoozeAt<=now){a.snoozeAt=null;this.ring(a.label||'Alarm','alarm',a.id);}}
 for(const t of this.state.timers)if(t.running&&t.deadline<=now){t.running=false;t.remaining=0;this.ring(t.label||'Zaman doldu','timer',t.id);}
 const p=this.state.pomodoro;if(p.running&&p.deadline<=now){p.running=false;if(p.phase==='focus'){p.completed++;p.phase=p.completed%4===0?'long':'short';this.ring('Harika iş! Mola zamanı.','pomodoro');}else{p.phase='focus';p.session++;this.ring('Yeni bir odak seansı seni bekliyor.','pomodoro');}p.remaining=p[p.phase==='focus'?'work':p.phase]*60000;p.deadline=null;}}
 action(type,data={}){const s=this.state,now=this.clock(),p=s.pomodoro;
 switch(type){
 case 'city-add':if(!s.cities.includes(data.zone)){new Intl.DateTimeFormat('tr',{timeZone:data.zone}).format();s.cities.push(data.zone);}break;
 case 'city-remove':s.cities=s.cities.filter(x=>x!==data.zone);break;
 case 'alarm-add':if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time))throw Error('Geçerli bir saat girin.');{const days=(data.days||[]).filter(x=>Number.isInteger(x)&&x>=0&&x<=6);s.alarms.push({id:randomUUID(),time:data.time,label:String(data.label||'Alarm').slice(0,80),days,enabled:true,next:nextAlarm(data.time,days,now)});}break;
 case 'alarm-toggle':{const a=s.alarms.find(x=>x.id===data.id);if(a){a.enabled=!a.enabled;a.snoozeAt=null;if(a.enabled)a.next=nextAlarm(a.time,a.days,now);}}break;
 case 'alarm-delete':s.alarms=s.alarms.filter(x=>x.id!==data.id);break;
 case 'dismiss':{const a=this.alerts.find(x=>x.id===data.id);if(a&&data.snooze&&a.kind==='alarm'){const alarm=s.alarms.find(x=>x.id===a.source);if(alarm)alarm.snoozeAt=now+300000;}this.alerts=this.alerts.filter(x=>x.id!==data.id);}break;
 case 'timer-add':{const ms=Number(data.seconds)*1000;if(!Number.isFinite(ms)||ms<1000||ms>604800000)throw Error('Süre 1 saniye ile 7 gün arasında olmalı.');s.timers.push({id:randomUUID(),label:String(data.label||'Zamanlayıcı').slice(0,80),duration:ms,remaining:ms,deadline:now+ms,running:true});}break;
 case 'timer-toggle':{const t=s.timers.find(x=>x.id===data.id);if(t){if(t.running){t.remaining=Math.max(0,t.deadline-now);t.running=false;}else{t.remaining=t.remaining||t.duration;t.deadline=now+t.remaining;t.running=true;}}}break;
 case 'timer-delete':s.timers=s.timers.filter(x=>x.id!==data.id);break;
 case 'sw-toggle':this.swBase=this.elapsed();this.swMark=this.mono();s.stopwatch.running=!s.stopwatch.running;break;
 case 'sw-reset':s.stopwatch={elapsed:0,running:false,startedAt:null,laps:[]};this.swBase=0;this.swMark=this.mono();break;
 case 'sw-lap':if(s.stopwatch.running)s.stopwatch.laps.unshift(this.elapsed());break;
 case 'pomo-toggle':if(p.running){p.remaining=Math.max(0,p.deadline-now);p.running=false;}else{p.deadline=now+p.remaining;p.running=true;}break;
 case 'pomo-reset':p.running=false;p.remaining=p[p.phase==='focus'?'work':p.phase]*60000;p.deadline=null;break;
 case 'pomo-settings':for(const k of ['work','short','long']){const n=Number(data[k]);if(!Number.isInteger(n)||n<1||n>180)throw Error('Süreleri 1–180 dakika arasında girin.');}Object.assign(p,{work:+data.work,short:+data.short,long:+data.long,running:false,phase:'focus',remaining:+data.work*60000,deadline:null});break;
 case 'hud-mode':if(['clock','timer','pomodoro','stopwatch'].includes(data.mode))s.hudMode=data.mode;break;
 default:throw Error('Bilinmeyen işlem');
 }return this.snapshot();}
}
module.exports={Engine,nextAlarm};
