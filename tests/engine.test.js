const test=require('node:test');
const assert=require('node:assert/strict');
const {Engine,nextAlarm}=require('../engine');

test('nextAlarm chooses the next future occurrence',()=>{
  const now=new Date(2026,8,19,9,30).getTime();
  assert.equal(nextAlarm('10:00',[],now),new Date(2026,8,19,10,0).getTime());
  assert.equal(nextAlarm('09:00',[],now),new Date(2026,8,20,9,0).getTime());
});

test('repeating alarms respect selected weekdays',()=>{
  const saturday=new Date(2026,8,19,12).getTime();
  const monday=nextAlarm('07:30',[1,2,3,4,5],saturday);
  assert.equal(new Date(monday).getDay(),1);
  assert.equal(new Date(monday).getHours(),7);
});

test('timer pauses and resumes without losing remaining time',()=>{
  let now=1_000_000,mono=0;
  const engine=new Engine({},()=>now,()=>mono);
  engine.action('timer-add',{label:'Çay',seconds:60});
  now+=20_000;
  engine.action('timer-toggle',{id:engine.state.timers[0].id});
  assert.equal(engine.state.timers[0].remaining,40_000);
  now+=20_000;
  engine.action('timer-toggle',{id:engine.state.timers[0].id});
  assert.equal(engine.state.timers[0].deadline,now+40_000);
});

test('elapsed stopwatch uses a monotonic clock',()=>{
  let mono=100;
  const engine=new Engine({},()=>5000,()=>mono);
  engine.action('sw-toggle');mono=1134;
  assert.equal(engine.snapshot().stopwatch.elapsed,1034);
  engine.action('sw-lap');
  assert.equal(engine.state.stopwatch.laps[0],1034);
});

test('pomodoro moves from focus to break when due',()=>{
  let now=10_000;
  const engine=new Engine({},()=>now,()=>0);
  engine.action('pomo-settings',{work:1,short:2,long:3});
  engine.action('pomo-toggle');now+=60_001;engine.tick();
  assert.equal(engine.state.pomodoro.phase,'short');
  assert.equal(engine.state.pomodoro.completed,1);
  assert.equal(engine.alerts[0].kind,'pomodoro');
});

test('invalid durations and times are rejected',()=>{
  const engine=new Engine();
  assert.throws(()=>engine.action('timer-add',{seconds:0}));
  assert.throws(()=>engine.action('alarm-add',{time:'25:70'}));
  assert.throws(()=>engine.action('pomo-settings',{work:0,short:5,long:15}));
});
