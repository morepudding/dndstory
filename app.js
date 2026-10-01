const characters={
  lea:{name:"LÉA",img:"lea.webp",quote:"« T’inquiète, ça va bien se passer. »",traits:["spontanée","sincère","cash","imprudente"],bio:"Léa vient d’une petite ville en bord de mer. Elle parle facilement, déteste les grands discours et agit souvent avant d’avoir totalement réfléchi. Son côté léger masque surtout une vraie peur de rester immobile quand les choses deviennent sérieuses."},
  maya:{name:"MAYA",img:"maya.webp",quote:"« On se bouge plutôt que d’en parler ? »",traits:["déterminée","franche","compétitive","loyale"],bio:"Maya fait des études de STAPS et supporte mal l’inaction. Elle préfère tester un plan imparfait plutôt que débattre pendant une heure. Très indépendante, elle devient pourtant férocement loyale dès qu’elle considère quelqu’un comme faisant partie des siens."},
  elise:{name:"ÉLISE",img:"elise.webp",quote:"« On en parlera peut-être plus tard. »",traits:["réservée","observatrice","créative","humour noir"],bio:"Élise étudie les arts appliqués. Elle remarque les détails que les autres ratent et parle peu tant qu’elle ne connaît pas les gens. Son humour est sec, sa sensibilité bien plus forte qu’elle ne le montre, et elle semble étrangement calme lorsque tout devient anormal."}
};
const portraits={lea:"lea.webp",maya:"maya.webp",elise:"elise.webp"};
const feed=document.getElementById("feed");
const choices=document.getElementById("choices");
const objectiveText=document.getElementById("objectiveText");
const composer=document.getElementById("composer");
const playerInput=document.getElementById("playerInput");
const headline=document.getElementById("headline");
const timeLabel=document.getElementById("timeLabel");
const chapterNo=document.getElementById("chapterNo");
const chapterTitle=document.getElementById("chapterTitle");
const waterValue=document.getElementById("waterValue");
const foodValue=document.getElementById("foodValue");
const batteryValue=document.getElementById("batteryValue");
let active="lea";
let currentState=null;

const isChatGPT=()=>typeof window!=="undefined"&&!!window.openai;
const escapeHtml=v=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const narration=(text,time="")=>`<div class="entry narration"><small>${escapeHtml(time||"NARRATION")} · NARRATION</small>${escapeHtml(text)}</div>`;
const message=(id,text)=>`<div class="entry message"><img src="${portraits[id]}" alt=""><div class="bubble"><strong>${characters[id].name}</strong><p>${escapeHtml(text)}</p></div></div>`;
const player=text=>`<div class="entry message player"><div class="bubble"><strong>TOI</strong><p>${escapeHtml(text)}</p></div></div>`;
function scrollBottom(){feed.scrollTo({top:feed.scrollHeight,behavior:"smooth"})}

function setResource(id,value,pct){
  const el=document.getElementById(id);
  if(el) el.textContent=value;
  const bar=el?.closest(".resources>div")?.querySelector(":scope > i");
  if(bar&&pct!=null) bar.style.setProperty("--level",pct+"%");
}

function renderState(state){
  if(!state||state.mode!=="after_story") return false;
  currentState=state;
  chapterNo.textContent=state.chapter||"CHAPITRE 01";
  chapterTitle.textContent=state.chapterTitle||"LE CENTRE";
  timeLabel.textContent=state.timeLabel||"";
  headline.textContent=state.headline||"AFTER // 02:47";
  objectiveText.textContent=state.objective||"Survivre.";
  if(state.resources){
    const w=Number(state.resources.waterDays??0),f=Number(state.resources.foodDays??0),b=Number(state.resources.batteryPercent??0);
    setResource("waterValue",w+" JOURS",Math.min(100,w*16));
    setResource("foodValue",f+" JOURS",Math.min(100,f*16));
    setResource("batteryValue",b+"%",b);
  }
  feed.innerHTML=narration(state.narration||"",state.timeLabel||"");
  for(const d of state.dialogue||[]){
    if(d.speaker==="player") feed.insertAdjacentHTML("beforeend",player(d.text));
    else if(characters[d.speaker]) feed.insertAdjacentHTML("beforeend",message(d.speaker,d.text));
  }
  choices.innerHTML=(state.choices||[]).map((label,i)=>`<button class="choice" data-action="${escapeHtml(label)}"><span style="opacity:.55;margin-right:6px">0${i+1}</span>${escapeHtml(label)}</button>`).join("");
  window.openai?.setWidgetState?.({
    activeCharacter:active,
    sceneSummary:state.sceneSummary||"",
    objective:state.objective||"",
    headline:state.headline||""
  });
  scrollBottom();
  return true;
}

async function continueWithChatGPT(action){
  feed.insertAdjacentHTML("beforeend",player(action));
  choices.innerHTML='<button class="choice" disabled>ChatGPT continue l’histoire…</button>';
  scrollBottom();
  const summary=currentState?.sceneSummary||"Le groupe est isolé dans le centre sportif au début d’une épidémie.";
  const prompt=[
    'Dans AFTER // 02:47, mon action est : "'+action+'".',
    'Contexte persistant : '+summary,
    'Continue immédiatement l’histoire en français, sans décider à ma place au-delà de cette action.',
    'Garde Léa, Maya et Élise cohérentes et fais avancer concrètement la survie.',
    'À la fin, appelle obligatoirement l’outil render_after_turn pour afficher la nouvelle scène avec 2 à 4 choix.'
  ].join("\n");
  try{
    await window.openai.sendFollowUpMessage({prompt,scrollToBottom:true});
  }catch(e){
    choices.innerHTML='<button class="choice" disabled>Impossible d’envoyer la suite à ChatGPT.</button>';
  }
}

const fallbackScenes=[
  {objective:"Comprendre ce qui se passe dehors.",choices:["Barricader la porte","Monter sur le toit","Aller voir le parking"]},
  {objective:"Tenir jusqu’au lever du jour.",choices:["Organiser des tours de garde","Chercher des radios","Inspecter le sous-sol"]}
];
let fallbackScene=0;
function initFallback(){
  currentState=null;
  headline.textContent="Quelqu’un frappe à la porte.";
  timeLabel.textContent="JEUDI · 02:47 · EXTÉRIEUR INCONNU";
  feed.innerHTML=narration("Le courant saute d’un coup. Une seconde plus tard, un choc lourd résonne contre la porte principale du centre sportif. Puis un deuxième. Plus fort.","02:47")
    +message("lea","Dites-moi que c’est juste quelqu’un de bourré qui s’est paumé.")
    +message("maya","Non. J’ai vu des gens courir sur la route avant que le réseau tombe.")
    +message("elise","La porte arrière vient de bouger.");
  fallbackScene=0;
  renderFallbackChoices();
  scrollBottom();
}
function renderFallbackChoices(){
  const s=fallbackScenes[Math.min(fallbackScene,fallbackScenes.length-1)];
  objectiveText.textContent=s.objective;
  choices.innerHTML=s.choices.map(x=>`<button class="choice" data-action="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join("");
}
function fallbackAct(action){
  feed.insertAdjacentHTML("beforeend",player(action));
  const replies=[
    ["lea","Ok. C’est pas forcément brillant, mais au moins c’est un plan."],
    ["maya","Si on le fait, on le fait vite."],
    ["elise","Attends… écoute d’abord. Il y a encore ce bruit."]
  ];
  const r=replies[Math.floor(Math.random()*replies.length)];
  setTimeout(()=>{feed.insertAdjacentHTML("beforeend",message(r[0],r[1]));fallbackScene=Math.min(fallbackScene+1,fallbackScenes.length-1);renderFallbackChoices();scrollBottom()},220);
}

choices.addEventListener("click",e=>{
  const b=e.target.closest(".choice");
  if(!b||b.disabled)return;
  const action=b.dataset.action||b.textContent.trim();
  if(isChatGPT()&&window.openai?.sendFollowUpMessage) continueWithChatGPT(action);
  else fallbackAct(action);
});

composer.addEventListener("submit",e=>{
  e.preventDefault();
  const v=playerInput.value.trim();
  if(!v)return;
  playerInput.value="";
  if(isChatGPT()&&window.openai?.sendFollowUpMessage) continueWithChatGPT(v);
  else fallbackAct(v);
});

document.getElementById("resetBtn").addEventListener("click",()=>{
  if(isChatGPT()&&window.openai?.sendFollowUpMessage){
    window.openai.sendFollowUpMessage({prompt:"Recommence AFTER // 02:47 depuis le début et appelle open_after_story.",scrollToBottom:true});
  }else initFallback();
});

document.querySelectorAll(".character").forEach(btn=>btn.addEventListener("click",()=>{
  active=btn.dataset.character;
  document.querySelectorAll(".character").forEach(b=>b.classList.toggle("active",b===btn));
  window.openai?.setWidgetState?.({...window.openai.widgetState,activeCharacter:active});
}));

const modal=document.getElementById("profileModal");
const profileImg=document.getElementById("profileImg");
const profileName=document.getElementById("profileName");
const profileQuote=document.getElementById("profileQuote");
const profileTraits=document.getElementById("profileTraits");
const profileBio=document.getElementById("profileBio");
function openProfile(){
  const c=characters[active];
  profileImg.src=c.img;profileName.textContent=c.name;profileQuote.textContent=c.quote;profileBio.textContent=c.bio;
  profileTraits.innerHTML=c.traits.map(t=>`<span>${escapeHtml(t)}</span>`).join("");
  modal.classList.add("open");modal.setAttribute("aria-hidden","false");
}
document.getElementById("profileOpen").addEventListener("click",openProfile);
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}));
document.getElementById("selectPerson").addEventListener("click",()=>{modal.classList.remove("open");playerInput.focus()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")modal.classList.remove("open")});

window.addEventListener("openai:set_globals",e=>{
  const output=e.detail?.globals?.toolOutput;
  if(output) renderState(output);
});

const initialHostState=window.openai?.toolOutput;
if(!renderState(initialHostState)) initFallback();
