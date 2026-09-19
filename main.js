const {app,BrowserWindow,ipcMain,Tray,Menu,Notification,screen,globalShortcut,powerMonitor}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {Engine}=require('./engine');
if(process.env.SAAT_DATA_DIR)app.setPath('userData',process.env.SAAT_DATA_DIR);
app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
app.setName('Saat');
if(process.platform==='linux')app.setDesktopName('saat.desktop');
let main,hud,tray,engine,quitting=false,file;
if(!app.requestSingleInstanceLock()){app.quit();}else{
app.on('second-instance',()=>showMain());
app.whenReady().then(()=>{
 file=path.join(app.getPath('userData'),'state.json');let saved={};try{saved=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}engine=new Engine(saved);
 createMain();createHud();
 tray=new Tray(path.join(__dirname,'assets/icon.png'));tray.setToolTip('Saat • Zamanın sana ait');tray.setContextMenu(Menu.buildFromTemplate([{label:'Saat’i aç',click:showMain},{label:'HUD göster / gizle',click:toggleHud},{type:'separator'},{label:'Uygulamadan çık',click:()=>app.quit()}]));tray.on('click',showMain);
 globalShortcut.register('CommandOrControl+Shift+H',toggleHud);
 ipcMain.handle('snapshot',()=>engine.snapshot());
 ipcMain.handle('action',(_,type,data)=>{try{const out=engine.action(type,data);save();broadcast();return {ok:true,state:out};}catch(e){return {ok:false,error:e.message};}});
 ipcMain.on('window',(_,action)=>{if(action==='hud')toggleHud();if(action==='main')showMain();if(action==='minimize')main.minimize();if(action==='close')main.hide();if(action==='quit')app.quit();});
 setInterval(()=>{const before=engine.alerts.length;engine.tick();if(engine.alerts.length>before){save();showMain();for(const a of engine.alerts.slice(before))if(Notification.isSupported())new Notification({title:'Saat',body:a.title,silent:true}).show();}broadcast();},200);
 setInterval(save,5000);powerMonitor.on('resume',()=>{engine.tick();broadcast();});
});}
function prefs(){return {preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false};}
function guard(win){win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());}
function createMain(){main=new BrowserWindow({title:'Saat',width:1120,height:720,minWidth:850,minHeight:640,frame:false,show:false,backgroundColor:'#10141c',icon:path.join(__dirname,'assets/icon.png'),webPreferences:prefs()});guard(main);main.loadFile('index.html');main.once('ready-to-show',()=>main.show());main.on('close',e=>{if(!quitting){e.preventDefault();main.hide();}});}
function createHud(){const area=screen.getPrimaryDisplay().workArea;const pos=engine.state.hudPosition;const valid=pos&&screen.getAllDisplays().some(d=>pos.x>=d.workArea.x&&pos.y>=d.workArea.y&&pos.x+300<=d.workArea.x+d.workArea.width&&pos.y+165<=d.workArea.y+d.workArea.height);hud=new BrowserWindow({title:'Saat HUD',width:300,height:165,x:valid?pos.x:area.x+area.width-324,y:valid?pos.y:area.y+30,frame:false,transparent:true,alwaysOnTop:true,resizable:false,skipTaskbar:true,show:false,webPreferences:prefs()});guard(hud);hud.setVisibleOnAllWorkspaces(true);hud.loadFile('hud.html');hud.once('ready-to-show',()=>{if(engine.state.hud)hud.showInactive();});hud.on('moved',()=>{const [x,y]=hud.getPosition();engine.state.hudPosition={x,y};save();});hud.on('close',e=>{if(!quitting){e.preventDefault();toggleHud();}});}
function showMain(){if(main){main.show();main.restore();main.focus();}}
function toggleHud(){engine.state.hud=!engine.state.hud;if(engine.state.hud)hud.showInactive();else hud.hide();save();broadcast();}
function broadcast(){for(const w of [main,hud])if(w&&!w.isDestroyed())w.webContents.send('state',engine.snapshot());}
function save(){if(!engine||!file)return;const state=engine.snapshot();delete state.alerts;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(state));fs.renameSync(file+'.tmp',file);}
app.on('before-quit',()=>{quitting=true;save();globalShortcut.unregisterAll();});
app.on('window-all-closed',()=>{});
