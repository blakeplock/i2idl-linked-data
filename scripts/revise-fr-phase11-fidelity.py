#!/usr/bin/env python3
"""Editorial draft revisions only. Never approves or publishes translations."""
import json
from pathlib import Path
p=Path('i18n/fr.proposals.json')
if not p.exists(): raise SystemExit('Run from repository root')
d=json.loads(p.read_text(encoding='utf-8'))
if d.get('sourcePublicationVersion')!='v0.0.90': raise SystemExit('Unexpected source version; no changes written')
revisions={
'electronic-learning': 'Apprentissage soutenu par des appareils électroniques, des logiciels ou des processus numériques, que sa mise en œuvre nécessite ou non une connexion à Internet.',
'learning-strategies': 'Approches, démarches ou techniques utilisées par les apprenants ou les éducateurs pour soutenir l’apprentissage dans différentes tâches et différents contextes.',
'blended-learning': 'Approche pédagogique combinant délibérément plusieurs modes de formation, notamment, mais pas exclusivement, des activités en présence et des activités soutenues par des technologies électroniques.',
'gamification': 'Application d’éléments de conception de jeux, tels que des points, des défis ou des mécanismes de rétroaction, à des contextes qui ne sont pas eux-mêmes des jeux.',
'instructional-design': 'Analyse et conception systématiques d’expériences d’apprentissage, d’activités, de ressources et de démarches d’évaluation visant à soutenir l’atteinte des résultats attendus.',
'instructional-systems': 'Ensembles coordonnés de personnes, de contenus, de processus, de ressources et de technologies qui soutiennent l’enseignement et ses objectifs visés.',
'learning-objectives': 'Énoncés décrivant les connaissances, les compétences ou les capacités que les apprenants sont censés acquérir ou démontrer dans le cadre d’une activité d’apprentissage.',
'game-based-learning': 'Approche dans laquelle la participation à des jeux ou à des activités de jeu sert à développer ou à appliquer des connaissances et des compétences.',
'adaptive-testing': 'Évaluation qui sélectionne ou adapte les questions suivantes en fonction des informations tirées des réponses précédentes de l’apprenant.',
'assessment-literacy': 'Connaissances et compétences nécessaires pour concevoir, sélectionner, interpréter et utiliser de manière appropriée les évaluations et leurs résultats dans la pratique éducative.',
'performance-based-assessment': 'Évaluation demandant aux apprenants de démontrer leurs connaissances ou leurs compétences par la réalisation d’un travail ou l’accomplissement d’une tâche, le processus, le produit ou les deux faisant l’objet de l’évaluation.',
'learning-trajectories': 'Descriptions de la manière dont les connaissances et les compétences peuvent se développer au fil d’étapes successives, utilisées pour éclairer les objectifs d’apprentissage, l’enseignement et l’évaluation.',
'transfer-of-training': 'Influence de connaissances ou de compétences acquises antérieurement sur l’apprentissage ou la réalisation d’une tâche dans un contexte ultérieur.',
'assistive-technology': 'Appareils, équipements, logiciels ou systèmes adaptés qui soutiennent les capacités fonctionnelles et la participation des personnes en situation de handicap.',
'information-literacy': 'Capacité à repérer, évaluer, interpréter et utiliser l’information de manière appropriée, à partir de diverses sources et dans différents contextes.',
'media-literacy': 'Capacité à accéder à des messages médiatiques, à les interpréter, à les évaluer et à en créer sous différentes formes de médias.',
'technological-literacy': 'Compréhension des technologies, de leurs usages et de leurs conséquences, ainsi que capacité à prendre des décisions éclairées quant à leur sélection et à leur utilisation.',
'natural-language-processing': 'Méthodes informatiques permettant d’analyser, d’interpréter, de générer ou de traiter de toute autre manière le langage humain.',
'instructional-effectiveness': 'Degré auquel l’enseignement, les ressources ou les programmes éducatifs soutiennent l’atteinte de leurs objectifs d’apprentissage visés.',
'educational-indicators': 'Mesures utilisées pour décrire les conditions, les activités ou les résultats en éducation et pour éclairer l’évaluation, la comparaison et les décisions de politique éducative.',
'semantic-interoperability': 'Capacité de systèmes développés indépendamment à échanger des données en préservant une signification commune, de sorte que des concepts équivalents et des descriptions d’activités puissent être interprétés de manière cohérente entre différentes mises en œuvre.',
'learning-record': 'Enregistrement lisible par machine représentant des éléments probants relatifs à un événement, à un état, à une étape ou à une réalisation en matière d’apprentissage, de formation ou de performance.',
'xapi-statement': 'Structure de données fondamentale de xAPI utilisée pour représenter une expérience, généralement autour d’un acteur, d’un verbe et d’un objet, avec, de façon facultative, un contexte, un résultat, une autorité et des pièces jointes.',
'xapi-profile': 'Documentation lisible par des personnes et/ou des machines décrivant les concepts, les modèles de déclarations, les motifs et les extensions propres à une application, utilisés lors de la mise en œuvre de xAPI dans un contexte particulier.',
'learning-engineering-process': 'Processus itératif et mené de façon concomitante pour répondre à des défis d’apprentissage : définir le contexte et les parties prenantes, concevoir et instrumenter une solution, la mettre en œuvre dans des situations authentiques, étudier les résultats à l’aide de données et améliorer continuellement la démarche.',
}
by={c['id']:c for c in d['concepts']}
if len(by)!=len(d['concepts']):raise SystemExit('Duplicate IDs; no changes written')
if not set(revisions).issubset(by):raise SystemExit('Unknown IDs; no changes written')
lines=['# Phase 11 — French definition fidelity review (editorial draft)','', 'No entries approved by this process. Proposed French definitions must be reviewed against the corresponding canonical English text.','']
changes=0
for id,new in revisions.items():
 c=by[id]
 if c.get('status')!='draft':raise SystemExit(f'{id} is not draft; no changes written')
 old=c['fr']['definition']
 if old!=new:
  changes+=1
  c['fr']['definition']=new
 c['reviewNotes']='Editorial fidelity revision: compare scope and conditions against canonical English; terminology and stylistic accuracy still require human approval.'
 lines+=['## '+c['en']['prefLabel']+' (`'+id+'`)', '', '**English:** '+c['en']['definition'], '', '**Proposed French:** '+new, '', '**Previous draft:** '+old, '']
report=Path('i18n/fr.phase11.fidelity-review.md')
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report.write_text('\n'.join(lines),encoding='utf-8')
print(f'PASS: {changes} French draft definitions revised; {len(revisions)} checked. No approvals changed.')
print(f'Wrote {report}')
