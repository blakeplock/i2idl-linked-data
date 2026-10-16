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
 'rateUnavailable':['Annual rate unavailable','Taux annuel indisponible'], 'perYear':['citations/year','citations par an'], 'totalCitations':['total citations','citations au total'], 'openAccess':['Open access','Accès ouvert'], 'untitled':['Untitled publication','Publication sans titre'], 'publication':['Publication','Publication'],
 'noResults':['No results found.','Aucun résultat trouvé.']
};
function t(key){const pair=pairs[key];return pair?pair[locale()==='fr'?1:0]:key}
function pathCount(n){return locale()==='fr'?`Chemin le plus court : ${n} relation${n>1?'s':''}`:`Shortest path: ${n} relationship${n===1?'':'s'}`}
function comparison(a,b,neighbors,shared){return locale()==='fr'?`Relation directe : ${a}. Domaine principal commun : ${b}. Les voisins communs proviennent du graphe actuel.`:`Direct relationship: ${a}. Shared primary field: ${b}. Common neighbors are based on the current graph.`}
function componentNote(n){return locale()==='fr'?`Plus grande composante connexe : ${n} concepts. Ces mesures décrivent le graphe éditorial I2IDL et non l’importance scientifique objective. Seul le domaine principal est pris en compte.`:`Largest connected component: ${n} concepts. These metrics describe I2IDL's curated graph, not objective scholarly importance. Cross-field score uses primary field only; secondary memberships are not counted.`}
function paperFound(n,name,cluster){return locale()==='fr'?(cluster?`${n} publications contiennent au moins deux termes sélectionnés dans le texte indexé.`:`${n} publications trouvées pour ${name}.`):(cluster?`${n} publications with at least two selected labels in indexed text.`:`Found ${n} papers for ${name}.`)}

function researchReady(n,name){return locale()==='fr'?`Recherche prête pour ${n} concepts sélectionnés.`:`Ready to search ${n}-concept intersection.`}
function researchTopic(name){return locale()==='fr'?`Concept sélectionné : ${name}`:`Selected concept: ${name}`}
function researchStatus(name,count){return locale()==='fr'?(name?`Recherche prête pour ${name}.`:'Sélectionnez un concept pour effectuer une recherche.'):(name?`Ready to search ${name}.`:'Select a concept to search.')}
function researchCount(n){return locale()==='fr'?`${n} sur 5 sélectionnés`:`${n} of 5 selected`}
function researchSearching(cluster){return locale()==='fr'?(cluster?'Recherche parmi les concepts sélectionnés…':'Recherche de publications scientifiques…'):(cluster?'Searching across selected concepts…':'Searching scholarly metadata…')}
function researchError(message){return locale()==='fr'?`Service de recherche indisponible : ${message}. Essayez Google Scholar.`:`Research search unavailable: ${message}. Try Google Scholar instead.`}
function researchYears(year){return locale()==='fr'?`Saisissez des années valides (1900–${year}), avec une année de début antérieure à l’année de fin.`:`Enter valid publication years (1900–${year}) with the start year before the end year.`}
function researchOutcome(works,selectedName,cluster){return locale()==='fr'?(cluster?paperFound(works.length,selectedName,true):works.length?paperFound(works.length,selectedName,false):t('noResults')):(cluster?paperFound(works.length,selectedName,true):works.length?paperFound(works.length,selectedName,false):t('noResults'))}
function researchFooter(){return locale()==='fr'?' Les résultats ne font pas l’objet d’une validation éditoriale.':' Discovery results are not editorially reviewed.'}
function publicationMeta(work){const citations=(Number(work.citations)||0).toLocaleString(locale()==='fr'?'fr-FR':'en-US');const rate=work.citationsPerYear==null?t('rateUnavailable'):Number(work.citationsPerYear).toLocaleString(locale()==='fr'?'fr-FR':'en-US',{maximumFractionDigits:2})+' '+t('perYear');return citations+' '+t('totalCitations')+' (OpenAlex) · '+rate+(work.openAccess?' · '+t('openAccess'):'')}
function matchedText(work,total){const n=work.matchedTerms?.length||0;return locale()==='fr'?`${n} sur ${total} concepts trouvés dans le texte indexé : ${(work.matchedTerms||[]).join(', ')}`:`${n} of ${total} concepts matched in indexed text: ${(work.matchedTerms||[]).join(', ')}`}

window.I2IDLDynamicI18n={t,pathCount,comparison,componentNote,paperFound,locale,researchReady,researchTopic,researchStatus,researchCount,researchSearching,researchError,researchYears,researchOutcome,researchFooter,publicationMeta,matchedText};
})();
