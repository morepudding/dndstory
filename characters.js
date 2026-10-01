
const characterBios={
  lea:{
    index:"01",
    name:"LÉA",
    image:"lea.webp",
    style:"PIXIE BLONDE · MINIMAL",
    quote:"« T’inquiète, ça va bien se passer. »",
    meta:["19 ans","Communication","Petite ville côtière","Célibataire"],
    traits:["Spontanée","Sociable","Sincère","Impatiente","Plus sensible qu'elle ne le montre"],
    details:[
      "Coupe pixie blonde, aucun tatouage",
      "Piercing discret au nombril",
      "S'habille simplement : jean, débardeur, hoodie",
      "Parle beaucoup quand elle essaie de masquer son stress"
    ],
    bio:"Léa a grandi dans une petite ville au bord de la mer et a choisi ses études autant pour la communication que pour avoir enfin l'impression de vivre ailleurs. Elle se fait facilement des connaissances, mais donne rarement accès tout de suite à ce qu'elle pense vraiment. Elle préfère improviser plutôt que planifier longtemps et supporte très mal la sensation d'être coincée ou de dépendre d'une décision prise par quelqu'un d'autre. Son côté léger peut donner l'impression qu'elle ne prend rien au sérieux ; en réalité, elle remarque très vite quand l'ambiance change et utilise souvent l'humour pour empêcher les autres — et elle-même — de paniquer.",
    before:"Avant l'alerte, Léa connaissait déjà vaguement Romain de l'école sans qu'ils soient particulièrement proches. Elle pouvait venir discuter dix minutes, disparaître pendant trois jours, puis reprendre la conversation comme si de rien n'était. Le séjour sur le campus est la première fois qu'ils passent réellement du temps ensemble."
  },
  maya:{
    index:"02",
    name:"MAYA",
    image:"maya.webp",
    style:"TOMBOY · SPORTIVE",
    quote:"« On se bouge plutôt que d'en parler ? »",
    meta:["20 ans","STAPS · L3","Sportive","Indépendante"],
    traits:["Déterminée","Franche","Compétitive","Pratique","Loyale"],
    details:[
      "Cheveux bruns souvent attachés à la va-vite",
      "Petit tatouage montagne sur le haut du bras",
      "Aucun piercing visible",
      "Cargo, débardeur, chemise ouverte, vieilles baskets"
    ],
    bio:"Maya est en troisième année de STAPS et fonctionne mieux quand elle a quelque chose de concret à faire. Elle court, grimpe, joue, démonte, porte, répare : rester assise à discuter d'un problème lui donne rapidement l'impression de perdre son temps. Elle n'a pourtant rien d'une caricature de fille invincible. Elle déteste montrer quand elle doute et transforme volontiers son stress en activité ou en compétition. Très autonome, elle peut paraître brusque avec les gens qu'elle connaît mal. En revanche, dès qu'elle considère quelqu'un comme faisant partie de son groupe, elle devient extrêmement fiable et attend la même loyauté en retour.",
    before:"Avant la catastrophe, Maya et Romain se connaissaient surtout de vue. Elle l'avait catalogué comme quelqu'un d'un peu trop cérébral, lui la trouvait facile à lire alors qu'elle ne l'est pas vraiment. Le séjour commence à casser ces deux premières impressions."
  },
  elise:{
    index:"03",
    name:"ÉLISE",
    image:"elise.webp",
    style:"GOTHIQUE · ALTERNATIVE",
    quote:"« On en parlera peut-être plus tard. »",
    meta:["19 ans","Arts appliqués","Créative","Observatrice"],
    traits:["Réservée","Lucide","Curieuse","Humour noir","Intense"],
    details:[
      "Longs cheveux noirs et frange droite",
      "Septum fin et plusieurs piercings d'oreille",
      "Tatouage botanique sur l'épaule",
      "Carnet de dessin presque toujours avec elle"
    ],
    bio:"Élise étudie les arts appliqués et observe presque toujours une pièce avant d'y prendre réellement part. Son style gothique la rend très visible alors qu'elle-même préfère souvent rester en périphérie des groupes. Elle dessine beaucoup, photographie des détails banals et possède un humour sec qui peut donner l'impression qu'elle se moque de tout. C'est faux : elle ressent énormément de choses, mais choisit soigneusement ce qu'elle montre et à qui. Elle supporte particulièrement bien les silences et les situations où les autres ressentent le besoin de parler pour se rassurer. Lorsqu'elle accorde sa confiance, elle devient beaucoup plus directe et étonnamment chaleureuse.",
    before:"Avant l'alerte, Élise avait déjà remarqué Romain bien plus souvent qu'elle ne lui avait parlé. Ils partageaient quelques cours et conversations courtes, sans vraie proximité. Pendant la première soirée du séjour, il devient l'une des rares personnes à s'intéresser à ce qu'elle dessine plutôt qu'à son look."
  }
};

let bioActive="lea";
const shell=document.getElementById("appShell");
const charactersView=document.getElementById("charactersView");
const viewTabs=document.querySelectorAll(".view-tab");
const bioImage=document.getElementById("bioImage");
const bioIndex=document.getElementById("bioIndex");
const bioName=document.getElementById("bioName");
const bioStyle=document.getElementById("bioStyle");
const bioQuote=document.getElementById("bioQuote");
const bioMeta=document.getElementById("bioMeta");
const bioLong=document.getElementById("bioLong");
const bioTraits=document.getElementById("bioTraits");
const bioDetails=document.getElementById("bioDetails");
const bioBefore=document.getElementById("bioBefore");
const bioRelationLabel=document.getElementById("bioRelationLabel");
const bioRelationBar=document.getElementById("bioRelationBar");
const bioRelationValue=document.getElementById("bioRelationValue");

function currentRelations(){
  const fromHost=window.openai?.widgetState?.relations||window.openai?.toolOutput?.relations;
  if(fromHost)return fromHost;
  try{
    const local=JSON.parse(localStorage.getItem("after0247_save"));
    return local?.relations||{};
  }catch(e){
    return {};
  }
}

function relationPresentation(value){
  const n=Number(value||0);
  if(n<=0)return {label:"Neutre",width:8};
  if(n<=2)return {label:"Curiosité",width:24};
  if(n<=5)return {label:"Confiance naissante",width:42};
  if(n<=8)return {label:"Confiance",width:61};
  if(n<=11)return {label:"Proche",width:79};
  return {label:"Très proche",width:96};
}

function renderBio(id){
  const c=characterBios[id];
  if(!c)return;
  bioActive=id;
  bioImage.src=c.image;
  bioImage.alt="Portrait de "+c.name;
  bioIndex.textContent=c.index;
  bioName.textContent=c.name;
  bioStyle.textContent=c.style;
  bioQuote.textContent=c.quote;
  bioMeta.innerHTML=c.meta.map(x=>"<span>"+x+"</span>").join("");
  bioLong.textContent=c.bio;
  bioTraits.innerHTML=c.traits.map(x=>"<span>"+x+"</span>").join("");
  bioDetails.innerHTML=c.details.map(x=>"<li>"+x+"</li>").join("");
  bioBefore.textContent=c.before;

  const relationValue=currentRelations()[id]||0;
  const presentation=relationPresentation(relationValue);
  bioRelationLabel.textContent=presentation.label;
  bioRelationValue.textContent=relationValue;
  bioRelationBar.style.width=presentation.width+"%";

  document.querySelectorAll(".character-pill").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.profile===id);
    btn.setAttribute("aria-selected",btn.dataset.profile===id?"true":"false");
  });
}

function setView(view){
  const charactersMode=view==="characters";
  shell.classList.toggle("characters-mode",charactersMode);
  charactersView.setAttribute("aria-hidden",charactersMode?"false":"true");
  viewTabs.forEach(btn=>btn.classList.toggle("active",btn.dataset.view===view));
  if(charactersMode)renderBio(bioActive);
}

viewTabs.forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));

document.querySelectorAll(".character-pill").forEach(btn=>{
  btn.addEventListener("click",()=>renderBio(btn.dataset.profile));
});

document.querySelectorAll(".character[data-character]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    if(shell.classList.contains("characters-mode"))renderBio(btn.dataset.character);
  });
});

window.addEventListener("openai:set_globals",()=>{
  if(shell.classList.contains("characters-mode"))renderBio(bioActive);
});

renderBio("lea");
