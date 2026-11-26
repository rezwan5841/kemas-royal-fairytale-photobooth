const frames = {
  purple: {
    portrait: {src:"assets/frame-purple-portrait.png", ratio:"434 / 523", win:[72/434,84/523,286/434,299/523]},
    landscape:{src:"assets/frame-purple-landscape.png",ratio:"759 / 523",win:[98/759,79/523,563/759,306/523]}
  },
  blue: {
    portrait: {src:"assets/frame-blue-portrait.png",ratio:"434 / 485",win:[71/434,79/485,287/434,281/485]},
    landscape:{src:"assets/frame-blue-landscape.png",ratio:"760 / 485",win:[99/760,53/485,563/760,304/485]}
  }
};
let theme="purple", orientation="portrait", stream=null, facing="user", galleryFile=null, deferredInstall=null, resultUrl=null;
const $=id=>document.getElementById(id);
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
$("zoom").oninput=()=>{const z=Number($("zoom").value);$("video").style.transform=`scale(${z})`;$("galleryPreview").style.transform=`scale(${z})`;};
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
  const sw=W/scale, sh=H/scale, sx=(pw-sw)/2, sy=(ph-sh)/2;
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
