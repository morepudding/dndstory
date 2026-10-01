const characterBios={
  lea:{
    name:"LÉA",
    style:"PIXIE BLONDE · MINIMAL",
    meta:["19 ans","Communication","Petite ville côtière"],
    gallery:[
      {src:"lea.webp",position:"50% 28%",scale:1},
      {src:"lea.webp",position:"50% 8%",scale:1.38},
      {src:"lea.webp",position:"30% 36%",scale:1.6},
      {src:"lea.webp",position:"68% 45%",scale:1.48}
    ],
    bio:"Léa a grandi dans une petite ville au bord de la mer et a choisi ses études autant pour la communication que pour avoir enfin l'impression de vivre ailleurs. Elle se fait facilement des connaissances, mais donne rarement accès tout de suite à ce qu'elle pense vraiment. Elle préfère improviser plutôt que planifier longtemps et supporte très mal la sensation d'être coincée ou de dépendre d'une décision prise par quelqu'un d'autre. Son côté léger peut donner l'impression qu'elle ne prend rien au sérieux ; en réalité, elle remarque vite quand l'ambiance change et utilise souvent l'humour pour empêcher les autres — et elle-même — de paniquer.",
    tastes:[
      {label:"MUSIQUE",title:"Pop-rock, indie et vieux tubes 2000",text:"Elle fait des playlists bordéliques et assume totalement les morceaux un peu honteux."},
      {label:"SORTIES",title:"Mer le soir, terrasses, plans improvisés",text:"Elle préfère une sortie décidée au dernier moment à quelque chose prévu trois semaines avant."},
      {label:"À TABLE",title:"Café sucré, pizza, trucs simples à partager",text:"Pas difficile, mais elle pique systématiquement dans l'assiette des autres."},
      {label:"ELLE AIME",title:"Les longues discussions, conduire sans but, les vêtements simples",text:"Tout ce qui donne l'impression que la soirée peut encore partir dans une direction imprévue."}
    ]
  },
  maya:{
    name:"MAYA",
    style:"TOMBOY · SPORTIVE",
    meta:["20 ans","STAPS · L3","Ville moyenne"],
    gallery:[
      {src:"maya.webp",position:"50% 28%",scale:1},
      {src:"maya.webp",position:"50% 8%",scale:1.35},
      {src:"maya.webp",position:"32% 42%",scale:1.55},
      {src:"maya.webp",position:"70% 45%",scale:1.46}
    ],
    bio:"Maya est en troisième année de STAPS et fonctionne mieux quand elle a quelque chose de concret à faire. Elle court, grimpe, joue, démonte, porte, répare : rester assise à discuter d'un problème lui donne rapidement l'impression de perdre son temps. Elle n'a pourtant rien d'une caricature de fille invincible. Elle déteste montrer quand elle doute et transforme volontiers son stress en activité ou en compétition. Très autonome, elle peut paraître brusque avec les gens qu'elle connaît mal. En revanche, dès qu'elle considère quelqu'un comme faisant partie de son groupe, elle devient extrêmement fiable et attend la même loyauté en retour.",
    tastes:[
      {label:"MUSIQUE",title:"Rock énergique, rap et playlists de sport",text:"Elle écoute surtout ce qui donne envie de bouger plutôt que ce qui mérite d'être analysé."},
      {label:"ACTIVITÉS",title:"Escalade, foot, rando, défis inutiles",text:"Si quelqu'un dit « personne peut faire ça », elle considère généralement que c'est une invitation."},
      {label:"À TABLE",title:"Salé, copieux, café noir",text:"Elle mange vite, beaucoup après le sport, et se moque des portions minuscules."},
      {label:"ELLE AIME",title:"Le matériel pratique, les gens francs, gagner",text:"Elle préfère quelqu'un qui lui dit non clairement à quelqu'un qui tourne autour du pot."}
    ]
  },
  elise:{
    name:"ÉLISE",
    style:"GOTHIQUE · ALTERNATIVE",
    meta:["19 ans","Arts appliqués","Grande ville"],
    gallery:[
      {src:"elise.webp",position:"50% 28%",scale:1},
      {src:"elise.webp",position:"50% 8%",scale:1.36},
      {src:"elise.webp",position:"30% 40%",scale:1.55},
      {src:"elise.webp",position:"70% 46%",scale:1.47}
    ],
    bio:"Élise étudie les arts appliqués et observe presque toujours une pièce avant d'y prendre réellement part. Son style gothique la rend très visible alors qu'elle-même préfère souvent rester en périphérie des groupes. Elle dessine beaucoup, photographie des détails banals et possède un humour sec qui peut donner l'impression qu'elle se moque de tout. C'est faux : elle ressent énormément de choses, mais choisit soigneusement ce qu'elle montre et à qui. Elle supporte particulièrement bien les silences et les situations où les autres ressentent le besoin de parler pour se rassurer. Lorsqu'elle accorde sa confiance, elle devient beaucoup plus directe et étonnamment chaleureuse.",
    tastes:[
      {label:"MUSIQUE",title:"Post-punk, darkwave, metal alternatif",text:"Elle a aussi quelques morceaux pop qu'elle nierait probablement avoir ajoutés elle-même."},
      {label:"CRÉATION",title:"Dessin, photo, collages, vieux carnets",text:"Elle aime surtout capturer les petits détails que personne ne pense à regarder."},
      {label:"À TABLE",title:"Espresso, ramen épicé, chocolat noir",text:"Elle peut oublier de manger pendant des heures lorsqu'elle travaille sur quelque chose."},
      {label:"ELLE AIME",title:"Les nuits calmes, les friperies, les films d'horreur",text:"Et les conversations où personne ne ressent l'obligation de remplir tous les silences."}
    ]
  }
};

let bioActive="lea";
const shell=document.getElementById("appShell");
const charactersView=document.getElementById("charactersView");
const viewTabs=document.querySelectorAll(".view-tab");
const galleryMain=document.getElementById("galleryMain");
const galleryThumbs=document.getElementById("galleryThumbs");
const bioName=document.getElementById("bioName");
const bioStyle=document.getElementById("bioStyle");
const bioMeta=document.getElementById("bioMeta");
const bioLong=document.getElementById("bioLong");
const bioTastes=document.getElementById("bioTastes");

function renderGallery(character,selectedIndex=0){
  const selected=character.gallery[selectedIndex]||character.gallery[0];
  galleryMain.src=selected.src;
  galleryMain.alt="Galerie de "+character.name;
  galleryMain.style.objectPosition=selected.position;
  galleryMain.style.transform="scale("+selected.scale+")";
  galleryThumbs.innerHTML=character.gallery.map((photo,i)=>
    '<button class="gallery-thumb '+(i===selectedIndex?"active":"")+'" data-photo-index="'+i+'" aria-label="Vue '+(i+1)+' de '+character.name+'">'+
      '<img src="'+photo.src+'" alt="" style="object-position:'+photo.position+';transform:scale('+photo.scale+')">'+
    '</button>'
  ).join("");
}

function renderBio(id){
  const c=characterBios[id];
  if(!c)return;
  bioActive=id;
  bioName.textContent=c.name;
  bioStyle.textContent=c.style;
  bioMeta.innerHTML=c.meta.map(x=>"<span>"+x+"</span>").join("");
  bioLong.textContent=c.bio;
  bioTastes.innerHTML=c.tastes.map(t=>
    '<article class="taste-card"><span>'+t.label+'</span><strong>'+t.title+'</strong><p>'+t.text+'</p></article>'
  ).join("");
  renderGallery(c,0);

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

galleryThumbs.addEventListener("click",e=>{
  const btn=e.target.closest(".gallery-thumb");
  if(!btn)return;
  const index=Number(btn.dataset.photoIndex||0);
  renderGallery(characterBios[bioActive],index);
});

renderBio("lea");
