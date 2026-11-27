const frames = {
  purple: {
    portrait: {
      src:"frame-purple-portrait.png",
      ratio:"434 / 523",
      win:[72/434,84/523,286/434,299/523]
    },
    landscape: {
      src:"frame-purple-landscape.png",
      ratio:"759 / 523",
      win:[98/759,79/523,563/759,306/523]
    }
  },
  blue: {
    portrait: {
      src:"frame-blue-portrait.png",
      ratio:"434 / 485",
      win:[71/434,79/485,287/434,281/485]
    },
    landscape: {
      src:"frame-blue-landscape.png",
      ratio:"760 / 485",
      win:[99/760,53/485,563/760,304/485]
    }
  }
};
let theme="purple", orientation="portrait", stream=null, facing="user", galleryFile=null, deferredInstall=null, resultUrl=null;
const $=id=>document.getElementById(id);
let panX=0, panY=0, zoomLevel=1;
const activePointers=new Map();
let gesture=null;

function applyPhotoTransform(){
  const t=`translate(${panX}px,${panY}px) scale(${zoomLevel})`;
  $("video").style.transform=t;
  $("galleryPreview").style.transform=t;
}

function limitPan(){
  const win=$("photoWindow");
  const maxX=win.clientWidth*(zoomLevel-1)/2;
  const maxY=win.clientHeight*(zoomLevel-1)/2;
  panX=Math.max(-maxX,Math.min(maxX,panX));
  panY=Math.max(-maxY,Math.min(maxY,panY));
}

function resetPhotoPosition(){
  panX=0;
  panY=0;
  zoomLevel=1;
  $("zoom").value=1;
  applyPhotoTransform();
}

const photoWindow=$("photoWindow");

photoWindow.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse" && e.button!==0)return;
  photoWindow.setPointerCapture(e.pointerId);
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

  if(activePointers.size===1){
    gesture={mode:"drag",x:e.clientX,y:e.clientY,panX,panY};
  }else if(activePointers.size===2){
    const p=[...activePointers.values()];
    gesture={
      mode:"pinch",
      distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),
      zoom:zoomLevel
    };
  }
});

photoWindow.addEventListener("pointermove",e=>{
  if(!activePointers.has(e.pointerId))return;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

  if(activePointers.size===1 && gesture?.mode==="drag"){
    panX=gesture.panX+e.clientX-gesture.x;
    panY=gesture.panY+e.clientY-gesture.y;
    limitPan();
    applyPhotoTransform();
  }

  if(activePointers.size===2 && gesture?.mode==="pinch"){
    const p=[...activePointers.values()];
    const distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
    zoomLevel=Math.max(1,Math.min(2.5,
      gesture.zoom*distance/Math.max(1,gesture.distance)
    ));
    $("zoom").value=zoomLevel;
    limitPan();
    applyPhotoTransform();
  }
});

function endPhotoPointer(e){
  activePointers.delete(e.pointerId);

  if(activePointers.size===1){
    const p=[...activePointers.values()][0];
    gesture={mode:"drag",x:p.x,y:p.y,panX,panY};
  }else{
    gesture=null;
  }
}

photoWindow.addEventListener("pointerup",endPhotoPointer);
photoWindow.addEventListener("pointercancel",endPhotoPointer);
function selected(){return frames[theme][orientation]}
function frameUrl(){return selected().src}
function show(id){["home","camera","result"].forEach(x=>$(x).classList.toggle("hidden",x!==id))}
function updateFrame(){
  $("homeFrame").src=frameUrl(); $("cameraFrame").src=frameUrl();
  $("stage").style.aspectRatio=selected().ratio;
  const [x,y,w,h]=selected().win, win=$("photoWindow");
  win.style.left=(x*100)+"%"; win.style.top=(y*100)+"%"; win.style.width=(w*100)+"%"; win.style.height=(h*100)+"%";
}
document.querySelectorAll("[data-theme]").forEach(b=>b.addEventListener("click",()=>{theme=b.dataset.theme;document.querySelectorAll("[data-theme]").forEach(x=>x.classList.toggle("active",x===b));updateFrame();}));
document.querySelectorAll("[data-orientation]").forEach(b=>b.addEventListener("click",()=>{orientation=b.dataset.orientation;document.querySelectorAll("[data-orientation]").forEach(x=>x.classList.toggle("active",x===b));updateFrame();}));
async function startCamera(){
  stopCamera(); galleryFile=null; $("galleryPreview").classList.add("hidden"); $("video").classList.remove("hidden");
  if(!navigator.mediaDevices?.getUserMedia){$("cameraStatus").textContent="Kamera tidak disokong. Sila buka pautan melalui Chrome atau Safari menggunakan HTTPS.";return;}
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1920},height:{ideal:1440}},audio:false});
    $("video").srcObject=stream; $("cameraStatus").textContent="Kamera sedia. Pastikan wajah berada di dalam ruang bingkai.";
  }catch(e){$("cameraStatus").textContent="Tidak dapat membuka kamera. Semak kebenaran kamera pada pelayar telefon anda.";}
}
function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}}
$("startBtn").onclick=async()=>{show("camera");updateFrame();await startCamera();};
$("backBtn").onclick=()=>{stopCamera();show("home");};
$("switchBtn").onclick=async()=>{facing=facing==="user"?"environment":"user";await startCamera();};
$("galleryBtn").onclick=()=>$("galleryInput").click();
$("galleryInput").onchange=e=>{const f=e.target.files[0];if(!f)return;galleryFile=f;const u=URL.createObjectURL(f);$("galleryPreview").src=u;$("galleryPreview").classList.remove("hidden");$("video").classList.add("hidden");$("cameraStatus").textContent="Foto galeri dipilih.";};
$("zoom").oninput=()=>{
  zoomLevel=Number($("zoom").value)||1;
  limitPan();
  applyPhotoTransform();
};
function loadImage(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
async function makeComposite(){
  const cfg=selected(), frame=await loadImage(cfg.src);
  const canvas=document.createElement("canvas");canvas.width=frame.naturalWidth;canvas.height=frame.naturalHeight;
  const ctx=canvas.getContext("2d");
  const [x,y,w,h]=cfg.win, X=x*canvas.width,Y=y*canvas.height,W=w*canvas.width,H=h*canvas.height;
  let photo;
  if(galleryFile){photo=await loadImage(URL.createObjectURL(galleryFile));}
  else {
    const v=$("video"); if(!v.videoWidth) throw new Error("Kamera belum bersedia.");
    photo=v;
  }
  // Match the preview: fill the photo window, preserving the 4:3 source and centered crop.
  const pw=photo.videoWidth||photo.naturalWidth, ph=photo.videoHeight||photo.naturalHeight;
  const scale=Math.max(W/pw,H/ph)*Number($("zoom").value);
  const sw=W/scale, sh=H/scale;
const win=$("photoWindow");
const sx=(pw-sw)/2 - panX*(W/win.clientWidth)/scale;
const sy=(ph-sh)/2 - panY*(H/win.clientHeight)/scale;
  ctx.drawImage(photo,sx,sy,sw,sh,X,Y,W,H);
  ctx.drawImage(frame,0,0,canvas.width,canvas.height);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.94));
}
$("captureBtn").onclick=async()=>{
  $("captureBtn").disabled=true;
  try{
    if(!galleryFile && (!stream || !$("video").videoWidth)) throw new Error("Kamera belum sedia. Cuba benarkan akses kamera.");
    $("countdown").classList.remove("hidden");
    for(let n=3;n>0;n--){$("countdown").textContent=n;await new Promise(r=>setTimeout(r,1000));}
    $("countdown").textContent="✦";
    const blob=await makeComposite(); if(!blob)throw new Error("Gagal menyediakan gambar.");
    if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl=URL.createObjectURL(blob);
    $("resultImage").src=resultUrl; $("saveStatus").textContent="Gambar siap! Tekan Muat Turun untuk menyimpan.";
    show("result");stopCamera();
  }catch(e){$("cameraStatus").textContent=e.message||"Ada masalah semasa mengambil gambar.";}
  finally{$("countdown").classList.add("hidden");$("captureBtn").disabled=false;}
};
$("downloadBtn").onclick=()=>{
  if(!resultUrl)return;
  const a=document.createElement("a");const now=new Date();const stamp=now.toISOString().replace(/[-:T]/g,"").slice(0,14);
  a.href=resultUrl;a.download=`KEMAS2026_${theme}_${orientation}_${stamp}.jpg`;a.click();
};
$("retakeBtn").onclick=async()=>{show("camera");await startCamera();};
$("homeBtn").onclick=()=>{stopCamera();show("home");};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").classList.remove("hidden");});
$("installBtn").onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null;}};
if(/iphone|ipad|ipod/i.test(navigator.userAgent))$("iosHelp").classList.remove("hidden");
updateFrame();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
