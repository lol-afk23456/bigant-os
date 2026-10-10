'use strict';
(() => {
 let loading;
 function loadReader(){
  if(window.ZXingBrowser)return Promise.resolve(window.ZXingBrowser);
  if(!loading)loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='/vendor/zxing-browser.min.js';
   script.onload=()=>window.ZXingBrowser?resolve(window.ZXingBrowser):reject(Error('Lettore non disponibile'));
   script.onerror=()=>{loading=null;script.remove();reject(Error('Lettore non disponibile'));};
   document.head.append(script);
  });
  return loading;
 }
 window.BigAntScanner=class {
  constructor({video,onCode,onError,readerLoader=loadReader,media=navigator.mediaDevices}){Object.assign(this,{video,onCode,onError,readerLoader,media});this.generation=0;}
  stop(){
   this.generation++;this.controls?.stop();this.controls=null;
   this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;
   this.video.pause();this.video.srcObject=null;this.video.hidden=true;
  }
  async start(){
   this.stop();const generation=this.generation;
   try{
    if(!this.media?.getUserMedia)throw Error('Fotocamera non disponibile');
    const library=await this.readerLoader();if(generation!==this.generation)return;
    const stream=await this.media.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    if(generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return;}
    this.stream=stream;this.video.srcObject=stream;this.video.hidden=false;await this.video.play();
    if(generation!==this.generation)return;
    const reader=new library.BrowserQRCodeReader();
    const controls=await reader.decodeFromStream(stream,this.video,result=>{
     if(result&&generation===this.generation){const code=result.getText();this.stop();this.onCode(code);}
    });
    if(generation!==this.generation)controls.stop();else this.controls=controls;
   }catch{
    if(generation!==this.generation)return;
    this.stop();this.onError('Fotocamera non disponibile. Controlla il permesso del browser oppure incolla il codice della tessera.');
   }
  }
 };
})();
