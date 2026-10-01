const characters={
lea:{name:"LÉA",img:"/lea.webp",quote:"« T’inquiète, ça va bien se passer. »",traits:["spontanée","sincère","cash","imprudente"],bio:"Léa vient d’une petite ville en bord de mer. Elle parle facilement, déteste les grands discours et agit souvent avant d’avoir totalement réfléchi. Son côté léger masque surtout une vraie peur de rester immobile quand les choses deviennent sérieuses."},
maya:{name:"MAYA",img:"/maya.webp",quote:"« On se bouge plutôt que d’en parler ? »",traits:["déterminée","franche","compétitive","loyale"],bio:"Maya fait des études de STAPS et supporte mal l’inaction. Elle préfère tester un plan imparfait plutôt que débattre pendant une heure. Très indépendante, elle devient pourtant férocement loyale dès qu’elle considère quelqu’un comme faisant partie des siens."},
elise:{name:"ÉLISE",img:"/elise.webp",quote:"« On en parlera peut-être plus tard. »",traits:["réservée","observatrice","créative","humour noir"],bio:"Élise étudie les arts appliqués. Elle remarque les détails que les autres ratent et parle peu tant qu’elle ne connaît pas les gens. Son humour est sec, sa sensibilité bien plus forte qu’elle ne le montre, et elle semble étrangement calme lorsque tout devient anormal."}
};
const portraits={lea:"/lea.webp",maya:"/maya.webp",elise:"/elise.webp"};
let active="lea",scene=0;
const scenes=[
{objective:"Comprendre ce qui se passe dehors.",choices:[["Barricader la porte","barrier"],["Monter sur le toit","roof"],["Aller voir le parking","parking"]]},
{objective:"Tenir jusqu’au lever du jour.",choices:[["Organiser des tours de garde","watch"],["Chercher des radios","radio"],["Inspecter le sous-sol","basement"]]},
{objective:"Décider s’il faut quitter le centre.",choices:[["Préparer une sortie à l’aube","dawn"],["Rester cachés ici","stay"],["Chercher le minibus","van"]]}
];
const results={
barrier:[["n","Vous poussez les bancs et deux armoires métalliques contre l’entrée. Quelque chose gratte déjà de l’autre côté."],["maya","Là au moins, s’il entre, il devra vraiment le vouloir."],["elise","Évite de dire ça comme si c’était rassurant."]],
roof:[["n","L’escalier de service mène au toit plat. Au loin, trois colonnes de fumée montent au-dessus de la départementale."],["lea","Ok… là je retire ce que j’ai dit sur le mec bourré."],["elise","Il n’y a aucune lumière dans le village. Aucune."]],
parking:[["n","Vous entrouvrez la sortie latérale. Sur le parking, un minibus est resté moteur tournant, portière conducteur ouverte."],["maya","On peut atteindre le bus en quinze secondes."],["lea","Et mourir en douze. Excellent plan."]],
watch:[["n","Vous répartissez la nuit en binômes. Personne ne proteste quand les matelas sont rapprochés dans la même salle."],["lea","Je prends le premier tour. De toute façon je dormirai pas."],["elise","Moi non plus. Je viens avec toi."]],
radio:[["n","Dans le local du gardien, Maya retrouve deux talkies et un vieux poste radio à piles."],["maya","Enfin un truc utile."],["elise","Chut. Il y a une voix sur la fréquence."]],
basement:[["n","Le sous-sol sent l’humidité et le chlore. Une porte coupe-feu est verrouillée de l’intérieur."],["elise","Quelqu’un est descendu avant nous."],["lea","Ou quelque chose. Désolée, fallait que quelqu’un la fasse."]],
dawn:[["n","Vous préparez quatre sacs légers. Eau, nourriture, lampe, trousse de secours. L’aube est encore à deux heures."],["maya","À la première lumière, on bouge."],["lea","Alors on reste ensemble. Pas de héros solitaire."]],
stay:[["n","Vous condamnez l’aile nord et déplacez tout le groupe vers le gymnase. Le centre devient une petite forteresse."],["elise","On va finir par connaître chaque bruit de ce bâtiment."],["maya","Tant qu’ils restent dehors, ça me va."]],
van:[["n","Les clés du minibus ne sont pas au tableau. Mais une étiquette indique : bureau du directeur."],["lea","Évidemment. Rien n’est jamais simple."],["maya","Bureau du directeur. On y va."]]
};
const feed=document.getElementById("feed"),choices=document.getElementById("choices"),objectiveText=document.getElementById("objectiveText"),composer=document.getElementById("composer"),playerInput=document.getElementById("playerInput");
const escapeHtml=v=>v.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const narration=(text,time="02:47")=>`<div class="entry narration"><small>${time} · NARRATION</small>${text}</div>`;
const message=(id,text)=>`<div class="entry message"><img src="${portraits[id]}" alt=""><div class="bubble"><strong>${characters[id].name}</strong><p>${text}</p></div></div>`;
const player=text=>`<div class="entry message player"><div class="bubble"><strong>TOI</strong><p>${escapeHtml(text)}</p></div></div>`;
function scrollBottom(){feed.scrollTo({top:feed.scrollHeight,behavior:"smooth"})}
function renderChoices(){const s=scenes[Math.min(scene,scenes.length-1)];objectiveText.textContent=s.objective;choices.innerHTML=s.choices.map(([label,key])=>`<button class="choice" data-key="${key}">${label}</button>`).join("")}
function init(){feed.innerHTML=narration("Le courant saute d’un coup. Une seconde plus tard, un choc lourd résonne contre la porte principale du centre sportif. Puis un deuxième. Plus fort.")+message("lea","Dites-moi que c’est juste quelqu’un de bourré qui s’est paumé.")+message("maya","Non. J’ai vu des gens courir sur la route avant que le réseau tombe.")+message("elise","La porte arrière vient de bouger.");scene=0;renderChoices();scrollBottom()}
function act(key,label){const r=results[key];feed.insertAdjacentHTML("beforeend",player(label));choices.innerHTML="";setTimeout(()=>{for(const item of r){feed.insertAdjacentHTML("beforeend",item[0]==="n"?narration(item[1],scene===0?"02:53":scene===1?"03:21":"04:08"):message(item[0],item[1]))}scene=Math.min(scene+1,2);renderChoices();scrollBottom()},180)}
choices.addEventListener("click",e=>{const b=e.target.closest(".choice");if(b)act(b.dataset.key,b.textContent.trim())});
composer.addEventListener("submit",e=>{e.preventDefault();const v=playerInput.value.trim();if(!v)return;feed.insertAdjacentHTML("beforeend",player(v));playerInput.value="";scrollBottom();const reply=[["lea","Ok. C’est pas forcément brillant, mais au moins c’est un plan."],["maya","Si on le fait, on le fait vite."],["elise","Attends… écoute d’abord. Il y a encore ce bruit."]][Math.floor(Math.random()*3)];setTimeout(()=>{feed.insertAdjacentHTML("beforeend",message(reply[0],reply[1]));scrollBottom()},300)});
document.getElementById("resetBtn").addEventListener("click",init);
document.querySelectorAll(".character").forEach(btn=>btn.addEventListener("click",()=>{active=btn.dataset.character;document.querySelectorAll(".character").forEach(b=>b.classList.toggle("active",b===btn))}));
const modal=document.getElementById("profileModal"),profileImg=document.getElementById("profileImg"),profileName=document.getElementById("profileName"),profileQuote=document.getElementById("profileQuote"),profileTraits=document.getElementById("profileTraits"),profileBio=document.getElementById("profileBio");
function openProfile(){const c=characters[active];profileImg.src=c.img;profileName.textContent=c.name;profileQuote.textContent=c.quote;profileBio.textContent=c.bio;profileTraits.innerHTML=c.traits.map(t=>`<span>${t}</span>`).join("");modal.classList.add("open");modal.setAttribute("aria-hidden","false")}
document.getElementById("profileOpen").addEventListener("click",openProfile);
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}));
document.getElementById("selectPerson").addEventListener("click",()=>{modal.classList.remove("open");playerInput.focus()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")modal.classList.remove("open")});
init();