const characters={
  lea:{
    name:"LÉA",img:"lea.webp",quote:"« T’inquiète, ça va bien se passer. »",
    traits:["spontanée","sincère","cash","imprudente"],
    bio:"Léa vient d’une petite ville en bord de mer. Sa coupe pixie blonde et son énergie légère la rendent facile à repérer dans un groupe, mais elle n’aime pas être réduite à ça. Elle parle facilement, agit vite et déteste rester immobile quand quelque chose l’inquiète."
  },
  maya:{
    name:"MAYA",img:"maya.webp",quote:"« On se bouge plutôt que d’en parler ? »",
    traits:["déterminée","franche","compétitive","loyale"],
    bio:"Maya est en STAPS. Tomboy, sportive et très à l’aise physiquement, elle supporte mal l’inaction. Elle préfère tester un plan imparfait plutôt que débattre pendant une heure. Son indépendance cache une loyauté presque excessive envers les gens qu’elle considère comme les siens."
  },
  elise:{
    name:"ÉLISE",img:"elise.webp",quote:"« On en parlera peut-être plus tard. »",
    traits:["réservée","observatrice","créative","humour noir"],
    bio:"Élise étudie les arts appliqués. Son style gothique attire plus vite l’attention que sa personnalité : elle parle peu avec les inconnus, dessine constamment et remarque les détails que les autres ratent. Son humour est sec, sa sensibilité bien plus forte qu’elle ne le montre."
  }
};

const portraits={lea:"lea.webp",maya:"maya.webp",elise:"elise.webp"};

const nodes={
  opening:{
    chapter:"PROLOGUE",chapterName:"AVANT LE SILENCE",
    meta:"JEUDI · 21:18 · CAMPUS RÉSIDENTIEL",title:"La soirée devait être banale.",
    objective:"Profiter de la soirée.",
    location:["Campus résidentiel","Bâtiment sportif · salle commune"],
    signal:"RÉSEAU STABLE",
    resources:[["RÉSEAU","100",100],["ÉLECTRICITÉ","OK",100],["TÉLÉPHONE","82%",82]],
    log:["Aucune alerte en cours.","21:18 · réseau local"],
    intro:[
      {type:"n",time:"21:18",text:"Une semaine de projet inter-filières a laissé une trentaine d’étudiants dormir sur le petit campus annexe. Les cours sont terminés. Dans la salle commune du bâtiment sportif, quelqu’un a mis de la musique trop fort, des pizzas refroidissent sur une table et personne n’a encore la moindre raison de penser à demain."},
      {type:"m",id:"lea",text:"Si quelqu’un remet cette playlist une quatrième fois, je coupe moi-même le Wi-Fi."},
      {type:"m",id:"maya",text:"C’est toi qui chantais dessus il y a dix minutes."},
      {type:"m",id:"elise",text:"Je confirme. J’ai malheureusement des témoins dessinés."}
    ],
    choices:[
      {label:"Aller chercher un café avec Léa",player:"Tu rejoins Léa près du distributeur.",rel:{lea:2},result:[
        {type:"m",id:"lea",text:"Merci. Deux minutes de plus avec leur débat sur le projet et je simulais un malaise."},
        {type:"n",time:"21:26",text:"Elle te tend un gobelet beaucoup trop chaud et reste adossée au mur avec toi, à l’écart du bruit. La conversation n’a rien d’important. C’est justement pour ça qu’elle est agréable."}
      ],next:"alert"},
      {label:"Aider Maya à ranger le gymnase",player:"Tu suis Maya pour ranger le matériel laissé dans le gymnase.",rel:{maya:2},result:[
        {type:"m",id:"maya",text:"Enfin quelqu’un d’utile. Prends les tapis, je m’occupe du reste."},
        {type:"n",time:"21:27",text:"Elle transforme évidemment le rangement en compétition idiote. Tu comprends assez vite qu’elle déteste perdre, même quand personne n’a officiellement commencé à jouer."}
      ],next:"alert"},
      {label:"Demander à Élise ce qu’elle dessine",player:"Tu t’assieds à côté d’Élise et regardes son carnet.",rel:{elise:2},result:[
        {type:"m",id:"elise",text:"Tu peux regarder. Mais si tu dis “c’est joli”, je ferme le carnet."},
        {type:"n",time:"21:28",text:"Ce ne sont pas vraiment des portraits. Plutôt des fragments de la soirée : une main autour d’un verre, des chaussures sous une chaise, le reflet d’une fenêtre. Elle a même dessiné des gens qui ne savaient pas qu’elle les observait."}
      ],next:"alert"}
    ]
  },

  alert:{
    chapter:"PROLOGUE",chapterName:"AVANT LE SILENCE",
    meta:"JEUDI · 21:43 · CAMPUS RÉSIDENTIEL",title:"Tous les téléphones vibrent en même temps.",
    objective:"Comprendre l’alerte.",
    location:["Campus résidentiel","Bâtiment sportif · salle commune"],
    signal:"ALERTE NATIONALE",
    resources:[["RÉSEAU","71%",71],["ÉLECTRICITÉ","OK",100],["TÉLÉPHONE","79%",79]],
    log:["« Incident majeur en cours. Restez à l’intérieur. Évitez les déplacements. »","21:43 · alerte publique"],
    intro:[
      {type:"n",time:"21:43",text:"La musique continue pendant deux secondes avant que tout le monde comprenne que la vibration vient de presque tous les téléphones de la pièce. Le message ne donne ni lieu précis, ni cause, ni durée. Seulement l’ordre de rester à l’intérieur."},
      {type:"m",id:"lea",text:"C’est une alerte test ? Ils font ça à cette heure-là ?"},
      {type:"m",id:"maya",text:"Non. Et regarde le réseau. Il vient de tomber d’un coup."},
      {type:"m",id:"elise",text:"Le vigile verrouille la grille extérieure."}
    ],
    choices:[
      {label:"Regarder dehors avec Maya",player:"Tu rejoins Maya devant les grandes baies du gymnase.",rel:{maya:1},flags:["road_seen"],result:[
        {type:"n",time:"21:48",text:"La départementale qui longe le campus est encore visible entre les arbres. Trois voitures passent beaucoup trop vite dans le même sens. Une quatrième est arrêtée en travers du fossé, warnings allumés."},
        {type:"m",id:"maya",text:"Ça, c’est pas une alerte test."}
      ],next:"gate"},
      {label:"Essayer d’appeler avec Léa",player:"Tu restes avec Léa pendant qu’elle tente de joindre sa famille.",rel:{lea:1},flags:["calls_failed"],result:[
        {type:"n",time:"21:49",text:"L’appel sonne une fois puis coupe. Les messages restent bloqués sur “envoi…”. Autour de vous, la même frustration gagne toute la salle."},
        {type:"m",id:"lea",text:"OK. Là, j’aime beaucoup moins la blague."}
      ],next:"gate"},
      {label:"Suivre Élise jusqu’au hall",player:"Tu suis Élise vers le hall pour comprendre pourquoi le vigile ferme tout.",rel:{elise:1},flags:["guard_seen"],result:[
        {type:"n",time:"21:49",text:"À travers la porte vitrée, vous voyez le vigile parler très vite dans sa radio. Il vous aperçoit et fait un geste sec : reculez. Derrière lui, quelqu’un court le long de la grille."},
        {type:"m",id:"elise",text:"Il a peur. Pas juste l’air inquiet. Il a peur."}
      ],next:"gate"}
    ]
  },

  gate:{
    chapter:"PROLOGUE",chapterName:"AVANT LE SILENCE",
    meta:"JEUDI · 22:06 · GRILLE PRINCIPALE",title:"Quelqu’un percute la grille.",
    objective:"Éloigner les étudiants des accès.",
    location:["Campus résidentiel","Hall · accès principal"],
    signal:"RÉSEAU DÉGRADÉ",
    resources:[["RÉSEAU","34%",34],["ÉLECTRICITÉ","OK",100],["TÉLÉPHONE","73%",73]],
    log:["« …restez confinés… ne tentez pas de rejoindre… »","22:03 · message incomplet"],
    intro:[
      {type:"n",time:"22:06",text:"Un homme surgit sur le parking et se jette contre la grille verrouillée. Une fois. Deux fois. Il ne demande pas qu’on ouvre. Il ne semble même pas voir les étudiants qui filment derrière les vitres."},
      {type:"m",id:"maya",text:"Reculez des portes. Sérieusement."},
      {type:"m",id:"lea",text:"Il saigne… quelqu’un devrait appeler une ambulance."},
      {type:"m",id:"elise",text:"Regarde ses yeux. Il ne suit rien du regard."}
    ],
    choices:[
      {label:"Aider Maya à bloquer le hall",player:"Tu aides Maya à déplacer deux tables contre les portes vitrées.",rel:{maya:2},flags:["hall_blocked"],result:[
        {type:"m",id:"maya",text:"Encore une. Là. Si la vitre casse, on gagne au moins quelques secondes."},
        {type:"n",time:"22:11",text:"Certains se moquent encore de la barricade. Plus personne ne rit quand un deuxième individu apparaît au bout du parking et se met à courir vers la grille."}
      ],next:"blackout"},
      {label:"Éloigner Léa des fenêtres",player:"Tu tires Léa en arrière quand tout le monde se presse contre les vitres.",rel:{lea:2},flags:["lea_pulled_back"],result:[
        {type:"m",id:"lea",text:"Je peux marcher toute seule… mais merci."},
        {type:"n",time:"22:11",text:"Au même moment, l’homme dehors frappe sa tête contre le métal avec une violence absurde. Léa ne cherche plus à s’approcher."}
      ],next:"blackout"},
      {label:"Chercher les caméras avec Élise",player:"Tu suis Élise vers le petit bureau de surveillance.",rel:{elise:2},flags:["cctv_clue"],result:[
        {type:"n",time:"22:12",text:"Six caméras fonctionnent encore. Sur l’une d’elles, une femme immobile au milieu de la route réagit brusquement lorsqu’un klaxon retentit, puis se met à courir vers le son."},
        {type:"m",id:"elise",text:"Elle n’a pas réagi à la voiture. Elle a réagi au bruit."}
      ],next:"blackout"}
    ]
  },

  blackout:{
    chapter:"PROLOGUE",chapterName:"AVANT LE SILENCE",
    meta:"JEUDI · 22:19 · BÂTIMENT CENTRAL",title:"Le campus s’éteint.",
    objective:"Quitter le bâtiment central.",
    location:["Campus résidentiel","Couloir central · éclairage secours"],
    signal:"SIGNAL PERDU",
    resources:[["RÉSEAU","0%",0],["ÉLECTRICITÉ","SECOURS",18],["TÉLÉPHONE","68%",68]],
    log:["Aucun service. Appels d’urgence indisponibles.","22:19 · téléphone"],
    intro:[
      {type:"n",time:"22:19",text:"La lumière disparaît. Les blocs de secours passent au rouge une seconde plus tard. Un cri éclate dans l’escalier, suivi d’une masse d’étudiants qui remonte en courant. Au milieu d’eux, un garçon avance de travers, le regard vide, puis se jette sur le premier étudiant qui tente de l’arrêter."},
      {type:"m",id:"lea",text:"C’est quoi ce bordel ?"},
      {type:"m",id:"maya",text:"On sort de ce couloir. Maintenant."},
      {type:"m",id:"elise",text:"Pas par le hall. J’ai entendu la grille céder."}
    ],
    choices:[
      {label:"Passer par le gymnase avec Maya",player:"Tu suis Maya vers le gymnase et les sorties techniques.",rel:{maya:2},flags:["noise_clue"],result:[
        {type:"n",time:"22:26",text:"Vous coupez à travers le gymnase plongé dans le noir. Derrière les portes, une silhouette heurte le battant chaque fois que quelqu’un parle trop fort, puis s’immobilise lorsque vous vous taisez."},
        {type:"m",id:"maya",text:"D’accord. À partir de maintenant, on chuchote."}
      ],next:"refuge"},
      {label:"Passer par l’infirmerie avec Léa",player:"Tu entraînes Léa vers l’infirmerie et la sortie de service.",rel:{lea:2},flags:["fever_clue"],result:[
        {type:"n",time:"22:27",text:"Une étudiante est allongée derrière le comptoir, consciente mais brûlante de fièvre. Elle répète qu’elle allait parfaitement bien une heure plus tôt. Quand quelqu’un fait tomber un plateau dans le couloir, elle se redresse d’un coup, paniquée."},
        {type:"m",id:"lea",text:"Une heure ? Ça va beaucoup trop vite."}
      ],next:"refuge"},
      {label:"Prendre le passage technique avec Élise",player:"Tu suis Élise dans le couloir de maintenance.",rel:{elise:2},flags:["radio_clue"],result:[
        {type:"n",time:"22:27",text:"Une radio oubliée sur un établi grésille encore : « …réaction agressive… stimuli sonores… ne les laissez pas rejoindre les zones de regroupement… » Puis la fréquence meurt."},
        {type:"m",id:"elise",text:"Ils savent ce que c’est. Ou au moins ils savent déjà plus de choses que nous."}
      ],next:"refuge"}
    ]
  },

  refuge:{
    chapter:"PROLOGUE",chapterName:"AVANT LE SILENCE",
    meta:"JEUDI · 23:37 · ANNEXE SPORTIVE",title:"À quatre.",
    objective:"Sécuriser l’annexe sportive.",
    location:["Annexe sportive","Aile nord · porte coupe-feu"],
    signal:"SIGNAL PERDU",
    resources:[["EAU","5 JOURS",82],["NOURRITURE","4 JOURS",66],["BATTERIE","62%",62]],
    log:["Dernière radio : « évitez les zones de regroupement »","22:27 · fréquence sécurité"],
    intro:[
      {type:"n",time:"23:37",text:"Le campus s’est fragmenté en moins d’une heure. Certains étudiants ont pris leurs voitures. D’autres se sont enfermés dans les résidences. Vous avez rejoint l’ancienne annexe sportive par un passage de service et verrouillé la porte coupe-feu derrière vous. Pour l’instant, il n’y a plus que vous quatre."},
      {type:"m",id:"lea",text:"On sait même pas où sont les autres."},
      {type:"m",id:"maya",text:"On ne les aidera pas si on se fait coincer dehors."},
      {type:"m",id:"elise",text:"Alors on tient ici cette nuit. Et on écoute."}
    ],
    choices:[
      {label:"Prendre le premier tour avec Léa",player:"Tu proposes de prendre le premier tour de garde avec Léa.",rel:{lea:2},flags:["watch_lea"],result:[
        {type:"n",time:"00:24",text:"Vous restez tous les deux près des fenêtres condamnées, parlant à voix basse pour ne pas réveiller les autres. Léa plaisante beaucoup moins qu’en début de soirée."},
        {type:"m",id:"lea",text:"Si je commence à dire que tout va bien, rappelle-moi que j’en sais rien du tout."}
      ],next:"knock"},
      {label:"Faire l’inventaire avec Maya",player:"Tu aides Maya à fouiller les réserves du bâtiment.",rel:{maya:2},flags:["inventory_maya"],result:[
        {type:"n",time:"00:31",text:"Vous trouvez des bouteilles, des barres énergétiques, une trousse de secours et deux lampes. Maya compte tout deux fois, comme si transformer la peur en chiffres la rendait plus supportable."},
        {type:"m",id:"maya",text:"Quatre personnes. Si on rationne, on a quelques jours. C’est déjà ça."}
      ],next:"knock"},
      {label:"Chercher une fréquence avec Élise",player:"Tu restes avec Élise près du vieux poste radio.",rel:{elise:2},flags:["radio_elise"],result:[
        {type:"n",time:"00:38",text:"Pendant presque une heure, vous ne captez que du souffle. Puis une voix automatique apparaît quelques secondes sur une fréquence universitaire : « point de rassemblement campus principal… » avant de disparaître."},
        {type:"m",id:"elise",text:"Trente et un kilomètres. Si le message est récent, il y a peut-être encore quelqu’un là-bas."}
      ],next:"knock"}
    ]
  },

  knock:{
    chapter:"CHAPITRE 01",chapterName:"LE CENTRE",
    meta:"VENDREDI · 02:47 · ANNEXE SPORTIVE",title:"Quelqu’un frappe à la porte.",
    objective:"Identifier la personne dehors sans exposer le groupe.",
    location:["Annexe sportive","Salle commune · aile nord"],
    signal:"SIGNAL PERDU",
    resources:[["EAU","5 JOURS",80],["NOURRITURE","4 JOURS",64],["BATTERIE","56%",56]],
    log:["« Point de rassemblement campus principal… »","00:38 · transmission automatique"],
    intro:[
      {type:"n",time:"02:47",text:"Les matelas ont été rapprochés dans la seule salle dont les deux accès peuvent être barricadés. Personne ne dort vraiment. Trois coups lents frappent soudain la porte extérieure. Pas des chocs désordonnés. Trois coups volontaires. Puis une voix d’homme : « S’il vous plaît… je sais que vous êtes là. »"},
      {type:"m",id:"maya",text:"Personne n’ouvre."},
      {type:"m",id:"lea",text:"S’il parle, il est pas comme ceux de tout à l’heure."},
      {type:"m",id:"elise",text:"Ça ne veut pas dire qu’il n’est pas contaminé."}
    ],
    choices:[
      {label:"Répondre sans ouvrir",player:"Tu t’approches de la porte sans toucher à la barricade et demandes qui est là.",rel:{lea:1},flags:["guard_spoke"],result:[
        {type:"n",time:"02:49",text:"La voix répond immédiatement. Borel, le vigile du campus. Il dit avoir les clés maîtres, un badge d’accès et une radio encore fonctionnelle. Il insiste surtout sur une chose : il ne veut pas rester dehors."},
        {type:"m",id:"lea",text:"C’est bien lui. Je reconnais sa voix."}
      ],next:"guard"},
      {label:"Observer avec Maya par la fenêtre",player:"Tu suis Maya jusqu’à une fenêtre latérale qui donne sur l’entrée.",rel:{maya:1},flags:["guard_seen_injured"],result:[
        {type:"n",time:"02:50",text:"Le vigile est seul, lampe à la main. Sa veste est déchirée et il a du sang sur l’avant-bras. Impossible de voir si la peau est mordue ou seulement coupée."},
        {type:"m",id:"maya",text:"Il est blessé. Donc on considère qu’il peut tourner jusqu’à preuve du contraire."}
      ],next:"guard"},
      {label:"Vérifier les caméras avec Élise",player:"Tu rejoins Élise devant l’ancien terminal de vidéosurveillance.",rel:{elise:1},flags:["parking_threat"],result:[
        {type:"n",time:"02:50",text:"Une caméra extérieure fonctionne encore par intermittence. Le vigile attend devant la porte. Plus loin, près du parking, deux silhouettes immobiles semblent tourner la tête chaque fois qu’il parle."},
        {type:"m",id:"elise",text:"S’il continue à appeler, il va les amener jusqu’ici."}
      ],next:"guard"}
    ]
  },

  guard:{
    chapter:"CHAPITRE 01",chapterName:"LE CENTRE",
    meta:"VENDREDI · 02:54 · ANNEXE SPORTIVE",title:"Le premier vrai choix.",
    objective:"Décider du sort du vigile.",
    location:["Annexe sportive","Entrée de service · barricadée"],
    signal:"SIGNAL PERDU",
    resources:[["EAU","5 JOURS",80],["NOURRITURE","4 JOURS",64],["BATTERIE","54%",54]],
    log:["Deux silhouettes repérées près du parking.","02:50 · caméra extérieure"],
    intro:[
      {type:"n",time:"02:54",text:"Borel affirme s’être ouvert le bras en escaladant une clôture. Il peut mentir. Il peut aussi être la première personne depuis des heures à posséder des informations utiles. Entre l’extérieur et la salle commune, l’ancien vestiaire forme un sas qu’il serait possible de verrouiller des deux côtés."},
      {type:"m",id:"maya",text:"Le sas. On le garde isolé jusqu’au matin."},
      {type:"m",id:"lea",text:"On peut pas juste le laisser crever dehors."},
      {type:"m",id:"elise",text:"On peut l’aider sans lui donner accès à nous."}
    ],
    choices:[
      {label:"Le faire entrer dans le sas",player:"Tu proposes d’ouvrir uniquement la porte extérieure du vestiaire et d’enfermer Borel dans le sas.",rel:{maya:1,elise:1},flags:["guard_quarantine"],result:[
        {type:"n",time:"03:02",text:"Le plan fonctionne. Borel entre dans le vestiaire, pose son trousseau et sa radio au sol, puis recule sans discuter. La porte intérieure reste verrouillée. Pour la première fois, vous avez un moyen de parler à quelqu’un de l’extérieur sans partager la même pièce."},
        {type:"m",id:"maya",text:"Ça, je peux vivre avec."}
      ],next:"after"},
      {label:"Ouvrir et le faire entrer avec vous",player:"Tu décides de faire entrer Borel dans l’aile nord.",rel:{lea:2,maya:-1,elise:-1},flags:["guard_inside"],result:[
        {type:"n",time:"03:01",text:"La barricade s’ouvre juste assez longtemps pour le laisser passer. Borel s’effondre contre le mur, épuisé. Sa blessure ressemble bien à une longue coupure, mais personne ne sait encore si cela suffit à vous rassurer."},
        {type:"m",id:"lea",text:"On le surveille. Mais au moins il est vivant."},
        {type:"m",id:"maya",text:"Et maintenant on a quelqu’un de blessé dans notre seule zone sûre."}
      ],next:"after"},
      {label:"Refuser d’ouvrir",player:"Tu refuses d’ouvrir et demandes à Borel de s’éloigner du bâtiment.",rel:{maya:1,lea:-1},flags:["guard_refused"],result:[
        {type:"n",time:"03:00",text:"Un silence suit ta décision. Borel pose finalement sa radio contre la porte, glisse son trousseau dessous par l’espace du seuil, puis disparaît vers le parking sans se retourner."},
        {type:"m",id:"lea",text:"J’espère vraiment qu’on vient pas de faire une énorme connerie."}
      ],next:"after"}
    ]
  },

  after:{
    chapter:"CHAPITRE 01",chapterName:"LE CENTRE",
    meta:"VENDREDI · 03:12 · SALLE COMMUNE",title:"La nuit ne fait que commencer.",
    objective:"Tenir jusqu’au matin et comprendre l’infection.",
    location:["Annexe sportive","Salle commune · refuge"],
    signal:"SIGNAL PERDU",
    resources:[["EAU","5 JOURS",79],["NOURRITURE","4 JOURS",63],["BATTERIE","51%",51]],
    log:["Campus principal : transmission automatique reçue.","03:12 · état local"],
    intro:[
      {type:"n",time:"03:12",text:"Le bâtiment retombe dans le silence. Pour la première fois depuis l’alerte, il n’y a plus de décision urgente à prendre. Seulement quatre étudiants épuisés, quelques lampes, des portes barricadées et une question que personne n’ose formuler clairement : combien de temps le monde dehors va-t-il rester comme ça ?"},
      {type:"m",id:"lea",text:"Je vote pour cinq minutes sans catastrophe."},
      {type:"m",id:"maya",text:"Cinq. Après on prépare le matin."},
      {type:"m",id:"elise",text:"Optimiste. J’aurais dit trois."}
    ],
    choices:[
      {label:"T’asseoir près de Léa",player:"Tu t’installes près de Léa, contre le mur, pendant que les autres soufflent un peu.",rel:{lea:1},result:[
        {type:"m",id:"lea",text:"Tu sais ce qui est vraiment nul ? J’avais prévu de me plaindre de cette semaine jusqu’à vendredi. Maintenant j’aimerais bien récupérer mes problèmes d’hier."},
        {type:"n",time:"03:16",text:"Elle baisse la voix pour ne pas réveiller le peu de calme que vous venez de gagner. La conversation devient enfin personnelle, sans urgence immédiate pour l’interrompre."}
      ],next:null},
      {label:"Rejoindre Maya pour l’inventaire",player:"Tu rejoins Maya qui recommence déjà à vérifier les sacs.",rel:{maya:1},result:[
        {type:"m",id:"maya",text:"Je sais. J’ai déjà compté deux fois. Mais si je m’arrête, je réfléchis trop."},
        {type:"n",time:"03:16",text:"Pour la première fois de la soirée, son assurance paraît un peu forcée. Elle te laisse quand même rester à côté d’elle sans te trouver une tâche à faire."}
      ],next:null},
      {label:"Rester avec Élise près de la radio",player:"Tu t’assieds près d’Élise et du poste radio.",rel:{elise:1},result:[
        {type:"m",id:"elise",text:"J’arrive pas à savoir si j’espère entendre quelqu’un… ou si j’ai peur que quelqu’un réponde."},
        {type:"n",time:"03:17",text:"Elle garde les yeux sur la fréquence morte. Le silence entre vous n’est pas gênant. Après cette nuit, c’est presque un luxe."}
      ],next:null}
    ]
  }
};

const feed=document.getElementById("feed");
const choices=document.getElementById("choices");
const objectiveText=document.getElementById("objectiveText");
const composer=document.getElementById("composer");
const playerInput=document.getElementById("playerInput");

let active="lea";
let state=loadState();
let hostState=null;
const chatGPTMode=()=>typeof window!=="undefined"&&!!window.openai;

function freshState(){
  return {node:"opening",transcript:[],relations:{lea:0,maya:0,elise:0},flags:[]};
}
function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem("after0247_save"));
    if(parsed&&nodes[parsed.node]&&Array.isArray(parsed.transcript)) return parsed;
  }catch(e){}
  return freshState();
}
function saveState(){localStorage.setItem("after0247_save",JSON.stringify(state))}
function esc(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function narration(text,time){return '<div class="entry narration"><small>'+esc(time||"—")+' · NARRATION</small>'+esc(text)+'</div>'}
function message(id,text){return '<div class="entry message"><img src="'+portraits[id]+'" alt=""><div class="bubble"><strong>'+characters[id].name+'</strong><p>'+esc(text)+'</p></div></div>'}
function player(text){return '<div class="entry message player"><div class="bubble"><strong>TOI</strong><p>'+esc(text)+'</p></div></div>'}

function addEntry(entry){
  state.transcript.push(entry);
}
function addEntries(entries){
  (entries||[]).forEach(addEntry);
}
function applyRelations(delta){
  if(!delta)return;
  Object.keys(delta).forEach(k=>state.relations[k]=(state.relations[k]||0)+delta[k]);
}
function applyFlags(flags){
  (flags||[]).forEach(f=>{if(!state.flags.includes(f))state.flags.push(f)});
}

function enterNode(id){
  state.node=id;
  const node=nodes[id];
  addEntries(node.intro);
  saveState();
  render();
}

function renderTranscript(){
  feed.innerHTML=state.transcript.map(e=>{
    if(e.type==="n")return narration(e.text,e.time);
    if(e.type==="m")return message(e.id,e.text);
    return player(e.text);
  }).join("");
}

function setResource(index,data){
  const [label,value,level]=data;
  document.getElementById("res"+index+"Label").textContent=label;
  document.getElementById("res"+index+"Value").textContent=value;
  document.getElementById("res"+index+"Bar").style.setProperty("--level",level+"%");
}

function renderNode(){
  const n=nodes[state.node];
  document.getElementById("chapterNumber").textContent=n.chapter;
  document.getElementById("chapterName").textContent=n.chapterName;
  document.getElementById("storyMeta").textContent=n.meta;
  document.getElementById("storyTitle").textContent=n.title;
  document.getElementById("signalText").textContent=n.signal;
  document.getElementById("locationName").textContent=n.location[0];
  document.getElementById("locationDetail").textContent=n.location[1];
  objectiveText.textContent=n.objective;
  document.getElementById("worldLog").textContent=n.log[0];
  document.getElementById("worldTime").textContent=n.log[1];
  n.resources.forEach((r,i)=>setResource(i+1,r));

  const chapterOne=n.chapter==="CHAPITRE 01";
  document.getElementById("timeline0").classList.toggle("current",!chapterOne);
  document.getElementById("timeline1").classList.toggle("current",chapterOne);

  choices.innerHTML=n.choices.map((c,i)=>'<button class="choice" data-index="'+i+'">'+esc(c.label)+'</button>').join("");
}

function renderHostState(s){
  hostState=s;
  document.getElementById("chapterNumber").textContent=s.chapter||"PROLOGUE";
  document.getElementById("chapterName").textContent=s.chapterName||"AVANT LE SILENCE";
  document.getElementById("storyMeta").textContent=s.meta||"";
  document.getElementById("storyTitle").textContent=s.title||"AFTER // 02:47";
  document.getElementById("signalText").textContent=s.signal||"SIGNAL PERDU";
  document.getElementById("locationName").textContent=(s.location&&s.location[0])||"Campus résidentiel";
  document.getElementById("locationDetail").textContent=(s.location&&s.location[1])||"";
  objectiveText.textContent=s.objective||"Survivre.";
  document.getElementById("worldLog").textContent=(s.log&&s.log[0])||"";
  document.getElementById("worldTime").textContent=(s.log&&s.log[1])||"";
  (s.resources||[]).slice(0,3).forEach((r,i)=>setResource(i+1,r));

  const chapterOne=s.chapter==="CHAPITRE 01";
  document.getElementById("timeline0").classList.toggle("current",!chapterOne);
  document.getElementById("timeline1").classList.toggle("current",chapterOne);

  feed.innerHTML=narration(s.narration||"",s.meta||"");
  (s.dialogue||[]).forEach(d=>{
    if(d.speaker==="player") feed.insertAdjacentHTML("beforeend",player(d.text));
    else if(characters[d.speaker]) feed.insertAdjacentHTML("beforeend",message(d.speaker,d.text));
  });
  choices.innerHTML=(s.choices||[]).map((label,i)=>
    '<button class="choice" data-action="'+esc(label)+'"><span style="opacity:.55;margin-right:6px">0'+(i+1)+'</span>'+esc(label)+'</button>'
  ).join("");

  if(s.relations) state.relations={...state.relations,...s.relations};
  window.openai?.setWidgetState?.({
    activeCharacter:active,
    sceneSummary:s.sceneSummary||"",
    objective:s.objective||"",
    relations:s.relations||state.relations,
    flags:s.flags||[]
  });
  requestAnimationFrame(()=>feed.scrollTo({top:feed.scrollHeight,behavior:"smooth"}));
}

function render(){
  if(chatGPTMode()&&hostState){renderHostState(hostState);return}
  renderTranscript();
  renderNode();
  requestAnimationFrame(()=>feed.scrollTo({top:feed.scrollHeight,behavior:"smooth"}));
}

function choose(index){
  const node=nodes[state.node];
  const c=node.choices[index];
  if(!c)return;
  addEntry({type:"p",text:c.player||c.label});
  applyRelations(c.rel);
  applyFlags(c.flags);
  addEntries(c.result);
  if(c.next){
    state.node=c.next;
    addEntries(nodes[c.next].intro);
  }
  saveState();
  render();
}

function contextualReply(id,nodeId,text){
  const lower=text.toLowerCase();
  if(/peur|flipp|stress|panique/.test(lower)){
    return {
      lea:"Ouais. Moi aussi. J’essaie juste de pas trop y penser.",
      maya:"Avoir peur change rien au plan. Mais oui, évidemment que j’ai peur.",
      elise:"Ce serait plus inquiétant si on n’avait pas peur."
    }[id];
  }
  if(/radio|signal|campus/.test(lower)){
    return {
      lea:"Si quelqu’un répond, j’espère qu’il dira autre chose que “restez à l’intérieur”.",
      maya:"Une info fiable vaut plus que dix suppositions. On continue d’écouter.",
      elise:"Le signal du campus principal est la seule chose qu’on ait captée deux fois."
    }[id];
  }
  if(/sort|partir|voiture|route/.test(lower)){
    return {
      lea:"Je veux sortir d’ici autant que toi. Mais pas juste pour courir au hasard.",
      maya:"On peut partir, mais seulement avec un trajet, du matériel et une raison.",
      elise:"Dehors, le bruit attire ces trucs. Une voiture n’est pas forcément une solution."
    }[id];
  }
  if(nodeId==="opening")return {
    lea:"Tu réfléchis déjà trop. Pour l’instant, profite juste de la soirée.",
    maya:"On verra demain. Là, j’ai surtout envie de finir ce qu’on faisait.",
    elise:"Tu peux continuer. Je t’écoute, même si j’en ai pas l’air."
  }[id];
  if(nodeId==="after")return {
    lea:"Reste un peu. J’ai pas spécialement envie d’être seule là tout de suite.",
    maya:"Parle si tu veux. Je peux faire deux choses en même temps.",
    elise:"Continue. Le silence est bien, mais pas obligé qu’il dure toute la nuit."
  }[id];
  return {
    lea:"OK… explique-moi ce que t’as en tête.",
    maya:"Si t’as un plan, donne-moi la version courte.",
    elise:"Je t’écoute. Mais évite de partir du principe qu’on sait ce qu’il y a dehors."
  }[id];
}

async function continueWithChatGPT(action){
  feed.insertAdjacentHTML("beforeend",player(action));
  choices.innerHTML='<button class="choice" disabled>ChatGPT continue l’histoire…</button>';
  requestAnimationFrame(()=>feed.scrollTo({top:feed.scrollHeight,behavior:"smooth"}));
  const summary=hostState?.sceneSummary||"Le groupe est au début d’une catastrophe zombie et doit survivre ensemble.";
  const prompt=[
    'Dans AFTER // 02:47, mon action est : "'+action+'".',
    'Contexte persistant : '+summary,
    'Continue immédiatement l’histoire en français. Ne décide pas à ma place au-delà de cette action.',
    'Garde Léa, Maya et Élise cohérentes et fais avancer concrètement la survie.',
    'Termine la scène avec 2 à 4 choix courts, puis appelle obligatoirement render_after_turn avec le nouvel état de l’interface.'
  ].join("\n");
  try{
    await window.openai.sendFollowUpMessage({prompt,scrollToBottom:true});
  }catch(e){
    choices.innerHTML='<button class="choice" disabled>Impossible d’envoyer la suite à ChatGPT.</button>';
  }
}

choices.addEventListener("click",e=>{
  const b=e.target.closest(".choice");
  if(!b)return;
  if(chatGPTMode()&&hostState){
    const action=b.dataset.action||b.textContent.trim();
    continueWithChatGPT(action);
  }else{
    choose(Number(b.dataset.index));
  }
});

composer.addEventListener("submit",e=>{
  e.preventDefault();
  const v=playerInput.value.trim();
  if(!v)return;
  playerInput.value="";
  if(chatGPTMode()&&hostState){
    continueWithChatGPT(v);
    return;
  }
  addEntry({type:"p",text:v});
  addEntry({type:"m",id:active,text:contextualReply(active,state.node,v)});
  saveState();
  render();
});

document.getElementById("resetBtn").addEventListener("click",()=>{
  if(chatGPTMode()&&hostState){
    window.openai.sendFollowUpMessage({
      prompt:"Recommence AFTER // 02:47 depuis le prologue, avant le silence, puis appelle open_after_story.",
      scrollToBottom:true
    });
    return;
  }
  if(!confirm("Recommencer l’histoire depuis 21:18 ?"))return;
  localStorage.removeItem("after0247_save");
  state=freshState();
  enterNode("opening");
});

document.querySelectorAll(".character").forEach(btn=>btn.addEventListener("click",()=>{
  active=btn.dataset.character;
  document.querySelectorAll(".character").forEach(b=>b.classList.toggle("active",b===btn));
}));

const modal=document.getElementById("profileModal");
const profileImg=document.getElementById("profileImg");
const profileName=document.getElementById("profileName");
const profileQuote=document.getElementById("profileQuote");
const profileTraits=document.getElementById("profileTraits");
const profileBio=document.getElementById("profileBio");

function openProfile(){
  const c=characters[active];
  profileImg.src=c.img;
  profileName.textContent=c.name;
  profileQuote.textContent=c.quote;
  const trust=hostState?.relations?.[active]??state.relations[active]??0;
  profileBio.textContent=c.bio+" Confiance actuelle : "+trust+".";
  profileTraits.innerHTML=c.traits.map(t=>'<span>'+esc(t)+'</span>').join("");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
}
document.getElementById("profileOpen").addEventListener("click",openProfile);
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>{
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
}));
document.getElementById("selectPerson").addEventListener("click",()=>{
  modal.classList.remove("open");
  playerInput.focus();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")modal.classList.remove("open")});

window.addEventListener("openai:set_globals",e=>{
  const output=e.detail?.globals?.toolOutput;
  if(output?.mode==="after_story"){hostState=output;render()}
});

if(chatGPTMode()&&window.openai?.toolOutput?.mode==="after_story"){
  hostState=window.openai.toolOutput;
  render();
}else if(!state.transcript.length){
  enterNode("opening");
}else{
  render();
}