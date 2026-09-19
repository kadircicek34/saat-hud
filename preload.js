const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('saat',{snapshot:()=>ipcRenderer.invoke('snapshot'),action:(type,data)=>ipcRenderer.invoke('action',type,data),window:action=>ipcRenderer.send('window',action),subscribe:fn=>{const listener=(_,state)=>fn(state);ipcRenderer.on('state',listener);return ()=>ipcRenderer.removeListener('state',listener);}});
