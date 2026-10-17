/* I2IDL Graph Explorer — additive UI localization, development preview. SPDX-License-Identifier: Apache-2.0 */
(()=>{'use strict';
const copy={
'header .eyebrow':['I2IDL · KNOWLEDGE GRAPH EXPLORER','I2IDL · EXPLORATEUR DU GRAPHE DE CONNAISSANCES'],
'header h1':['Explore digital learning concepts','Explorer les concepts de l’apprentissage numérique'],
'header > p:first-of-type':["A navigable view of the glossary's actual SKOS relationships. Explore the I2IDL knowledge graph through verified editorial relationships. No new relationships are inferred.","Parcourez les relations SKOS du glossaire dans le graphe de connaissances I2IDL. Seules les relations éditoriales vérifiées sont présentées ; aucune nouvelle relation n’est déduite."],
'label[for="depth"]':['Depth','Profondeur'],
'label[for="collection"]':['Field','Domaine'],
'label.clusteropt':['Cluster by field','Regrouper par domaine'],
'#share':['Copy view link','Copier le lien de cette vue'],
'#back':['← Back','← Retour'],
'#reset':["Start at today's concept",'Afficher le concept du jour'],
'.legend span:nth-child(1)':['Related','Associé'],
'.legend span:nth-child(2)':['Broader','Générique'],
'.legend span:nth-child(3)':['Narrower','Spécifique'],
'.advanced[aria-label="Research tools"] .panel-title b':['Research tools','Outils de recherche'],
'#path-tab':['Shortest path','Chemin le plus court'],
'#compare-tab':['Compare concepts','Comparer des concepts'],
'#analytics-tab':['Graph analytics','Analyse du graphe'],
'#path-panel > p:first-child':['Find a shortest route through the curated SKOS network. Related links are traversed in both directions; broader/narrower links retain their meaning.','Trouvez le chemin le plus court dans le réseau SKOS éditorial. Les relations associatives se parcourent dans les deux sens ; les relations hiérarchiques conservent leur signification.'],
'#path-panel .pair-grid label:first-child':['Starting concept','Concept de départ'],
'#path-panel .pair-grid label:last-child':['Destination','Destination'],
'#find-path':['Find shortest path','Trouver le chemin le plus court'],
'#compare-panel > p:first-child':['Compare direct neighbors and editorial collection memberships. Shared neighbors are not inferred semantic equivalence.','Comparez les concepts voisins et leur appartenance aux collections éditoriales. Des voisins communs ne prouvent pas une équivalence sémantique.'],
'#compare-panel .pair-grid label:first-child':['First concept','Premier concept'],
'#compare-panel .pair-grid label:last-child':['Second concept','Deuxième concept'],
'#run-compare':['Compare concepts','Comparer les concepts'],
'#analytics-panel > p:first-child':['Measured on the published graph: network connectivity, cited-source coverage, and recurring terminology in concept names. Reciprocal concept links count once.','Mesures fondées sur le graphe publié : connectivité, couverture des sources citées et récurrence des termes dans les noms des concepts. Les liens réciproques ne sont comptés qu’une fois.'],
'#research-discovery .panel-title b':['Research Discovery','Découverte de publications'],
'#research-discovery .panel-title .caption':['Experimental · Scholarly discovery, not I2IDL endorsement','Expérimental · Découverte bibliographique, sans approbation d’I2IDL'],
'.research-cluster-header b':['Research cluster','Groupe de recherche'],
'#research-clear':['Clear cluster','Effacer le groupe'],
'#research-discovery .research-quality label:first-child':['From year','Depuis l’année'],
'#research-discovery .research-quality label:nth-child(2)':['Through year','Jusqu’à l’année'],
'#research-discovery .research-oa-label':['Open access only','Accès ouvert uniquement'],
'label[for="research-sort"]':['Ranking','Classement'],
'#research-run':['Find papers','Rechercher des publications'],
'#research-export-csv':['Download CSV','Télécharger le CSV'],
'#research-export-bib':['Download BibTeX','Télécharger le BibTeX']
};
Object.assign(copy,{"header p:nth-of-type(2) a:first-child": ["Return to the I2IDL Glossary", "Retour au glossaire I2IDL"], "header p:nth-of-type(2) a:last-child": ["JSON-LD dataset", "Jeu de données JSON-LD"], "#research-add": ["Add selected concept", "Ajouter le concept sélectionné"]});

Object.assign(copy,{".advanced[aria-label=\"Research tools\"] .panel-title .small": ["Pathfinder · Compare · Graph, source, and term analytics", "Recherche de chemins · Comparaison · Analyse du graphe, des sources et des termes"], ".research-cluster > .muted-note": ["Add two to five concepts from the Explorer. The search reports which selected labels appear in each paper’s title or indexed abstract; it does not establish semantic relationships.", "Ajoutez de deux à cinq concepts depuis l’explorateur. La recherche identifie les termes sélectionnés présents dans les titres ou les résumés indexés des publications, sans établir de relations sémantiques."], ".cluster-mode-label": ["Search intersection (2–5 concepts)", "Intersection des recherches (2 à 5 concepts)"]});

Object.assign(copy,{"#research-discovery .research-quality + p.muted-note": ["Total citations show accumulated citations. Citations per year is total citations divided by inclusive years since publication (including the current year), not a field-normalized impact score.", "Le nombre total de citations est cumulatif. Les citations par an correspondent au total divisé par le nombre d’années depuis la publication, année en cours comprise. Ce chiffre n’est pas normalisé par discipline."], "#research-scholar": ["Search Google Scholar ↗", "Rechercher dans Google Scholar ↗"], ".research-export > span.small": ["Export displayed papers", "Exporter les publications affichées"], ".research-export + p.muted-note": ["Downloads include the selected I2IDL concept IDs and labels, DOI identifiers, and the search settings. Exports contain only the current results, not the entire scholarly index.", "Les téléchargements comprennent les identifiants et libellés des concepts I2IDL sélectionnés, les DOI et les paramètres de recherche. Les exports contiennent uniquement les résultats actuels."], "#research-discovery .workspace > p.muted-note:last-child": ["Results originate in OpenAlex and are not curated I2IDL sources. Bibliographic metadata and citation counts can be incomplete or change over time. Check each publication before relying on it.", "Les résultats proviennent d’OpenAlex et ne constituent pas des sources validées par l’I2IDL. Les métadonnées et les citations peuvent être incomplètes ou évoluer. Vérifiez chaque publication avant de l’utiliser."]});

Object.assign(copy,{"footer a:first-child": ["Public Explorer Activity ↗", "Activité publique de l’explorateur ↗"], "footer a:last-child": ["I2IDL published JSON-LD", "JSON-LD publié par l’I2IDL"]});

const attrs={
'#search':{placeholder:['Search 420 concepts…','Rechercher parmi 420 concepts…'],'aria-label':['Find a concept','Rechercher un concept']},
'#share':{title:['Copy the current explorer URL','Copier l’URL de cette vue']},
'#i2idl-language':{'aria-label':['Explorer display language','Langue d’affichage de l’explorateur']}
};
Object.assign(attrs,{'#research-from-year':{placeholder:['Any','Indifférent']},'#research-to-year':{placeholder:['Any','Indifférent']}});

const options={
'#depth option[value="1"]':['1 hop','1 degré'],
'#depth option[value="2"]':['2 hops','2 degrés'],
'#research-sort option[value="relevant"]':['Most relevant','Les plus pertinents'],
'#research-sort option[value="foundational"]':['Highly cited','Les plus cités'],
'#research-sort option[value="recent"]':['Recent','Récents'],
'#research-sort option[value="annual"]':['Citations per year','Citations par an']
};
function translateLeaf(selector,lang,pair){const el=document.querySelector(selector);if(!el)return;
 const value=pair[lang==='fr'?1:0];
 const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.nodeValue.trim());
 if(node)node.nodeValue=node.nodeValue.replace(node.nodeValue.trim(),value);
 else if(!el.children.length)el.textContent=value;
}
function translateFooter(lang){const footer=document.querySelector('footer');if(!footer)return;const nodes=[...footer.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&n.nodeValue.trim());if(nodes.length!==1)return;nodes[0].nodeValue=lang==='fr'?' · Prototype de recherche · Exploration à un ou deux degrés · Chemins les plus courts · Comparaison de concepts · Analyse du graphe · Aucune association CTDL · Source : ':' · Research prototype · One- and two-hop exploration · Shortest paths · Concept comparison · Graph analytics · No CTDL associations · Source: ';}

function translateResearchIntro(lang){const p=document.querySelector('#research-discovery .workspace > p:first-child');if(!p)return;const nodes=[...p.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE);const bold=p.querySelector('b');if(nodes.length!==2||!bold)return;nodes[0].nodeValue=lang==='fr'?'Sélectionnez un concept dans l’explorateur et cliquez sur ':'Select a concept in the Explorer and click ';bold.textContent=lang==='fr'?'Rechercher des publications':'Find research';nodes[1].nodeValue=lang==='fr'?' pour découvrir des publications dans OpenAlex. Le nombre de citations indique l’attention reçue, sans constituer une preuve de qualité.':' to discover publications in OpenAlex. Citation counts are indicators of attention, not proof of quality.';}

function updateCopyright() {
  const notice = document.querySelector(".i2idl-copyright");
  if (!notice) return;
  const lang = document.getElementById("i2idl-language")?.value;
  notice.setAttribute("lang", lang === "fr" ? "fr" : "en");
}
function apply(){updateCopyright();const select=document.getElementById('i2idl-language');const lang=select?.value==='fr'?'fr':'en';
 for(const [selector,pair] of Object.entries(copy))translateLeaf(selector,lang,pair);
  translateFooter(lang);
  translateResearchIntro(lang);
 for(const [selector,pair] of Object.entries(options)){const el=document.querySelector(selector);if(el)el.textContent=pair[lang==='fr'?1:0]}
 for(const [selector,fields] of Object.entries(attrs)){const el=document.querySelector(selector);if(!el)continue;for(const [attr,pair] of Object.entries(fields))el.setAttribute(attr,pair[lang==='fr'?1:0])}
}
function init(){const select=document.getElementById('i2idl-language');if(!select)return;
 const requested=new URLSearchParams(window.location.search).get('lang');
 select.value=requested==='fr'?'fr':'en';
 select.addEventListener('change',apply);apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
