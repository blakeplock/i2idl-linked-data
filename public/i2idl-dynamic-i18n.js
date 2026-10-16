/* SPDX-License-Identifier: Apache-2.0 — I2IDL Graph Explorer dynamic localization */
(()=>{'use strict';
const locale=()=>document.getElementById('i2idl-language')?.value==='fr'?'fr':'en';
const pairs={
 'researchHelp':['Search scholarly publications for this topic now.','Rechercher des publications scientifiques sur ce sujet.'],
 'clusterHelp':['Collect 2–5 concepts, then find papers that connect them.','Sélectionnez de 2 à 5 concepts, puis recherchez les publications qui les relient.'],
 'references':['Reference links','Liens de référence'],
 'broader':['Broader concepts','Concepts génériques'], 'narrower':['Narrower concepts','Concepts spécifiques'], 'related':['Related concepts','Concepts associés'],
 'noPath':['No path connects these concepts within the published SKOS graph.','Aucun chemin ne relie ces concepts dans le graphe SKOS publié.'],
 'pathNote':['Multiple equally short routes may exist. A path denotes a chain of editorially asserted relationships, not a causal or logical implication.','Plusieurs chemins de même longueur peuvent exister. Un chemin représente une suite de relations éditoriales explicites, sans implication causale ni logique.'],
 'different':['Choose two different concepts.','Choisissez deux concepts différents.'],
 'none':['none','aucune'], 'yes':['yes','oui'], 'no':['no','non'], 'noItems':[' None',' Aucun'],
 'concepts':['Concepts','Concepts'], 'links':['Unique links','Liens distincts'], 'components':['Connected components','Composantes connexes'], 'degree':['Mean degree','Degré moyen'],
 'mostConnected':['Most connected concepts','Concepts les plus connectés'], 'crossFields':['Cross-primary-field connections','Connexions entre domaines principaux'],
 'relation':['related','associé'], 'broaderRelation':['broader','générique'], 'narrowerRelation':['narrower','spécifique'],
 'searchChanged':['Search settings changed. Find papers again to export the updated results.','Les paramètres de recherche ont changé. Relancez la recherche pour exporter des résultats à jour.'],
 'noResults':['No results found.','Aucun résultat trouvé.']
};
function t(key){const pair=pairs[key];return pair?pair[locale()==='fr'?1:0]:key}
function pathCount(n){return locale()==='fr'?`Chemin le plus court : ${n} relation${n>1?'s':''}`:`Shortest path: ${n} relationship${n===1?'':'s'}`}
function comparison(a,b,neighbors,shared){return locale()==='fr'?`Relation directe : ${a}. Domaine principal commun : ${b}. Les voisins communs proviennent du graphe actuel.`:`Direct relationship: ${a}. Shared primary field: ${b}. Common neighbors are based on the current graph.`}
function componentNote(n){return locale()==='fr'?`Plus grande composante connexe : ${n} concepts. Ces mesures décrivent le graphe éditorial I2IDL et non l’importance scientifique objective. Seul le domaine principal est pris en compte.`:`Largest connected component: ${n} concepts. These metrics describe I2IDL's curated graph, not objective scholarly importance. Cross-field score uses primary field only; secondary memberships are not counted.`}
function paperFound(n,name,cluster){return locale()==='fr'?(cluster?`${n} publications contiennent au moins deux termes sélectionnés dans le texte indexé.`:`${n} publications trouvées pour ${name}.`):(cluster?`${n} publications with at least two selected labels in indexed text.`:`Found ${n} papers for ${name}.`)}
window.I2IDLDynamicI18n={t,pathCount,comparison,componentNote,paperFound,locale};
})();
