function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15, t|1);t^=t+Math.imul(t^t>>>7, t|61);return ((t^t>>>14)>>>0)/4294967296}}
function seededSample(arr, k, rng){ if(arr.length<=k) return [...arr]; const out=new Set(); while(out.size<k){ out.add(arr[(rng()*arr.length)|0]); } return [...out]; }
function toCSV(rows){return rows.map(r=>`"${String(r).replaceAll('"','""')}"`).join("\n");}
function downloadFile(name, content, type="text/plain"){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
function normNFC(s){return s.normalize('NFC')}

const RISKY_PATTERNS = [/\b(?:slur1|slur2|slur3)\b/i]; // placeholders — replace with your own list
function isRiskyTerm(s){return RISKY_PATTERNS.some(p=>p.test(s))}

const VOWELS = new Set('aeiouAEIOU');
const SEPARATORS = ['', '.', '-', '_', ' ', '·', '\u200d'];
const LEET_MAP = {
  a:["4","@","α","ä","à","á","â","ã","å"], b:["8","ß","Ƅ"], c:["(","<","¢","ç"], d:[")","|)","đ"],
  e:["3","€","ë","è","é","ê"], f:["ƒ"], g:["9","ɢ"], h:["#","]-[","|-|","ħ"],
  i:["1","!","|","í","ì","î","ï"], j:["_]"], k:["|<","κ"], l:["1","|","£","ł"],
  m:["^^","|v|"], n:["~","η","ñ"], o:["0","°","ö","ò","ó","ô","õ","ø"],
  p:["|*","¶"], q:["9","(,)"], r:["2","Я","ř"], s:["5","$","§","ş"], t:["7","+","†"],
  u:["ü","ù","ú","û"], v:["\\/"], w:["\\^/","\\/\\/","ω"], x:["><","×"], y:["¥","ÿ"], z:["2","ž"]
};
const HOMO_MAP = { a:["а"], e:["е"], i:["і","ɪ"], o:["о","ο","ọ"], p:["р"], c:["с"], y:["у"], x:["х"], k:["κ"], h:["һ"], m:["ｍ"], n:["ո"], s:["ѕ"], t:["т"], r:["ʀ"], l:["ⅼ"] };
const NEIGHBORS = { q:["w","a"], w:["q","e","s"], e:["w","r","d"], r:["e","t","f"], t:["r","y","g"], y:["t","u","h"], u:["y","i","j"], i:["u","o","k"], o:["i","p","l"], p:["o"], a:["q","s","z"], s:["a","d","w","x"], d:["s","f","e","c"], f:["d","g","r","v"], g:["f","h","t","b"], h:["g","j","y","n"], j:["h","k","u","m"], k:["j","l","i"], l:["k","o"], z:["a","x"], x:["z","c","s"], c:["x","v","d"], v:["c","b","f"], b:["v","n","g"], n:["b","m","h"], m:["n","j"] };

function charSubs(ch, opt, rng){
  const subs = new Set([ch]);
  const low = ch.toLowerCase();
  if(opt.useLeet && LEET_MAP[low]) LEET_MAP[low].forEach(v=>subs.add(v));
  if(opt.useHomo && HOMO_MAP[low]) HOMO_MAP[low].forEach(v=>subs.add(v));
  if(opt.useCase){ subs.add(low); subs.add(low.toUpperCase()); }
  let arr=[...subs];
  if(arr.length>opt.maxPerChar){ arr = seededSample(arr, opt.maxPerChar, rng); }
  return arr;
}

function applyPerChar(s, opt, rng){
  const pools = [...s].map(ch=>charSubs(ch,opt,rng));
  let total = 1; for(const p of pools){ total *= Math.max(1,p.length); if(total>1e7) break; }
  const maxSamples = Math.min(opt.maxVariants, 5000);
  const out = new Set();
  if(total>maxSamples){
    for(let i=0;i<maxSamples;i++){
      out.add(pools.map(p=>p[(rng()*p.length)|0]).join(""));
    }
  }else{
    (function rec(i, acc){
      if(i===pools.length){ out.add(acc); return; }
      for(const v of pools[i]){ rec(i+1, acc+v); if(out.size>=opt.maxVariants) break; }
    })(0,"");
  }
  return out;
}

function diacriticize(s){
  const acute = "\u0301";
  let out=""; for(const ch of s){ out += VOWELS.has(ch)? (ch+acute) : ch; }
  return out.normalize('NFC');
}
function vowelDrop(s){ return s.split('').filter(ch=>!VOWELS.has(ch)).join('') || s; }
function duplicateChars(s){ const out=new Set([s]); for(let i=0;i<s.length;i++){ out.add(s.slice(0,i)+s[i]+s[i]+s.slice(i+1)); } return out; }
function omitChars(s){ const out=new Set(); for(let i=0;i<s.length;i++){ out.add(s.slice(0,i)+s.slice(i+1)); } return out.size?out:new Set([s]); }
function transposeAdj(s){ const out=new Set([s]); for(let i=0;i<s.length-1;i++){ out.add(s.slice(0,i)+s[i+1]+s[i]+s.slice(i+2)); } return out; }
function kbdNeighbors(s){ const out=new Set([s]); [...s].forEach((ch,i)=>{ const low=ch.toLowerCase(); if(NEIGHBORS[low]) for(const n of NEIGHBORS[low]) out.add(s.slice(0,i)+n+s.slice(i+1)); }); return out; }
function phoneticRewrites(s){ const rules=[["ph","f"],["ck","k"],["c","k"],["oo","u"],["ee","i"],["you","u"],["ou","u"],["gh","g"]]; const out=new Set([s]); for(const [src,dst] of rules){ if(s.includes(src)) out.add(s.replaceAll(src,dst)); } return out; }
function insertSeps(s, maxIns){
  if(maxIns<=0 || s.length<2) return new Set([s]);
  const out=new Set([s]);
  for(let k=1;k<=maxIns;k++){
    const idx=[...Array(s.length-1)].map((_,i)=>i+1);
    (function comb(arr, k, start=0, path=[]){
      if(path.length===k){
        for(const sep of SEPARATORS){
          if(!sep) continue;
          let t=[...s];
          path.forEach((pos,j)=> t.splice(pos+j,0,sep));
          out.add(t.join(''));
        }
        return;
      }
      for(let i=start;i<arr.length;i++){
        path.push(arr[i]);
        comb(arr,k,i+1,path);
        path.pop();
      }
    })(idx,k);
  }
  return out;
}
function smartCaseVariants(s, limit){
  if(s.length>limit) return new Set([s.toLowerCase(), s.toUpperCase(), s[0].toUpperCase()+s.slice(1).toLowerCase()]);
  const pools=[...s].map(ch=>/[a-z]/i.test(ch)?[ch.toLowerCase(), ch.toUpperCase()]:[ch]);
  const out=new Set();
  (function rec(i,acc){ if(i===pools.length){ out.add(acc); return;} for(const v of pools[i]) rec(i+1,acc+v); })(0,"");
  return out;
}

async function generate(word, opt, onProgress){
  const rng = mulberry32(Number(opt.seed)>>>0);
  if(!opt.allowRisk && isRiskyTerm(word)) throw new Error("Refusing risky term. Enable 'Allow risky' only for moderation use.");
  let candidates = new Set([normNFC(word)]);

  if(opt.usePhon) phoneticRewrites(word).forEach(v=>candidates.add(v));
  if(opt.useKeys) kbdNeighbors(word).forEach(v=>candidates.add(v));
  if(opt.useTrans) transposeAdj(word).forEach(v=>candidates.add(v));

  const perChar = new Set();
  for(const c of candidates){ applyPerChar(c,opt,rng).forEach(v=>perChar.add(v)); }
  candidates = perChar; onProgress?.(0.1,candidates.size);

  const baseLayer = new Set(candidates);
  if(opt.useDia){ for(const s of baseLayer){ candidates.add(diacriticize(s)); } }
  onProgress?.(0.2,candidates.size);
  if(opt.useVow){ for(const s of baseLayer){ candidates.add(vowelDrop(s)); } }
  onProgress?.(0.3,candidates.size);
  if(opt.useDup){ for(const s of baseLayer){ duplicateChars(s).forEach(v=>candidates.add(v)); } }
  onProgress?.(0.4,candidates.size);
  if(opt.useOmit){ for(const s of baseLayer){ omitChars(s).forEach(v=>candidates.add(v)); } }
  onProgress?.(0.5,candidates.size);

  if(opt.maxSeps>0){
    const seps=new Set();
    for(const s of candidates){ insertSeps(s, opt.maxSeps).forEach(v=>seps.add(v)); }
    seps.forEach(v=>candidates.add(v));
  }
  onProgress?.(0.7,candidates.size);

  if(opt.useCase){
    const sample=[...candidates];
    const subset = seededSample(sample, Math.min(1000, sample.length), rng);
    const cas = new Set();
    subset.forEach(s=> smartCaseVariants(s, 16).forEach(v=>cas.add(v)));
    cas.forEach(v=>candidates.add(v));
  }
  onProgress?.(0.85,candidates.size);

  if(opt.useAff){
    const aff = new Set();
    const prefixes=["","","","_","x","the","i"];
    const suffixes=["","","","1","123","_","x","0","69"];
    for(const s of candidates){
      const p = prefixes[(rng()*prefixes.length)|0];
      const f = suffixes[(rng()*suffixes.length)|0];
      aff.add(p+s+f);
    }
    aff.forEach(v=>candidates.add(v));
  }
  onProgress?.(0.95,candidates.size);

  const out = [];
  const seen = new Set();
  for(const s of candidates){
    const t = normNFC(s);
    if(seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if(out.length>=opt.maxVariants) break;
  }
  onProgress?.(1.0,out.length);
  return out;
}

document.addEventListener('DOMContentLoaded', () => {
  const el = id=>document.getElementById(id);
  const tbody = el('tbody');
  const bar = el('bar');
  const status = el('status');
  const counts = el('counts');
  const stageCount = el('stageCount');

  function getOpts(){
    return {
      maxVariants: Number(el('maxVariants').value)||50,
      maxPerChar: Number(el('maxPerChar').value)||4,
      maxSeps: Number(el('maxSeps').value)||0,
      seed: Number(el('seed').value)||42,
      useLeet: el('useLeet').checked,
      useHomo: el('useHomo').checked,
      useCase: el('useCase').checked,
      useDia: el('useDia').checked,
      useDup: el('useDup').checked,
      useOmit: el('useOmit').checked,
      useVow: el('useVow').checked,
      useTrans: el('useTrans').checked,
      useKeys: el('useKeys').checked,
      usePhon: el('usePhon').checked,
      useAff: el('useAff').checked,
      allowRisk: el('allowRisk').checked,
    };
  }

  function setProgress(p,label){
    bar.style.width = Math.max(2, Math.floor(p*100))+'%';
    status.textContent = label || status.textContent;
  }

  function renderRows(list){
    tbody.innerHTML='';
    const frag=document.createDocumentFragment();
    list.forEach((v,i)=>{
      const tr=document.createElement('tr');
      const td1=document.createElement('td'); td1.textContent=String(i+1);
      const td2=document.createElement('td'); td2.textContent=v;
      tr.append(td1,td2);
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
    counts.textContent = `${list.length} shown`;
  }

  let lastOutput=[];

  async function onGenerate(){
    const word = el('word').value.trim();
    if(!word){ status.textContent='Enter a word to start'; return; }
    const opt = getOpts();
    if(!opt.allowRisk && isRiskyTerm(word)){
      status.textContent = 'Blocked: risky term (toggle Allow risky to proceed for moderation use only)';
      return;
    }
    setProgress(0.02, 'Generating…'); stageCount.textContent='stages: —';
    try{
      const started = performance.now();
      const list = await generate(word, opt, (p, n)=>{ setProgress(p, `Working… ${n.toLocaleString()} candidates`)});
      const ms = Math.max(1, performance.now()-started|0);
      lastOutput = list;
      renderRows(list);
      setProgress(1,'Done'); stageCount.textContent=`stages: ok`; status.textContent = `Done in ${ms} ms — ${list.length.toLocaleString()} variants`;
    }catch(e){
      status.textContent = e.message || 'Error';
    }
  }

  el('btnGen').addEventListener('click', onGenerate);
  el('word').addEventListener('keydown', e=>{ if(e.key==='Enter') onGenerate(); });
  el('btnClear').addEventListener('click', ()=>{
    tbody.innerHTML=''; lastOutput=[]; counts.textContent='0 shown'; status.textContent='Cleared'; setProgress(0,'Cleared');
  });
  el('btnCopy').addEventListener('click', async ()=>{
    if(!lastOutput.length) return;
    try{ await navigator.clipboard.writeText(lastOutput.join('\n')); status.textContent='Copied to clipboard'; }
    catch{ status.textContent='Clipboard blocked'; }
  });
  el('btnCSV').addEventListener('click', ()=>{
    if(!lastOutput.length) return; downloadFile('variants.csv', toCSV(lastOutput), 'text/csv');
  });
  el('btnJSON').addEventListener('click', ()=>{
    if(!lastOutput.length) return; downloadFile('variants.json', JSON.stringify(lastOutput, null, 2), 'application/json');
  });

  el('word').value='I am watching you';
});
