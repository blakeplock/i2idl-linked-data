#!/usr/bin/env python3
"""Apply seven approved Phase 14 French editorial resolutions, non-destructively."""
import json
from pathlib import Path

folder = Path('i18n/fr-phase13')
source = folder / 'all-386.fr.phase14-reviewed-draft.json'
output = folder / 'all-386.fr.phase14-final-draft.json'
report = folder / 'phase14-final-resolutions.json'

if not source.is_file():
    raise SystemExit('STOP: Missing input: ' + str(source))
if output.exists() or report.exists():
    raise SystemExit('STOP: Final output or report already exists; refusing to overwrite.')

data = json.loads(source.read_text(encoding='utf-8'))
concepts = {c['id']: c for c in data['concepts']}
assert len(concepts) == len(data['concepts']) == 386

# (expected existing preferred label, approved preferred label, approved French definition)
changes = {
    'minimum-proficiency-level': (
        'Seuil minimal de compétence',
        'Niveau de compétence minimal',
        'Repère indiquant les connaissances ou compétences de base attendues dans un domaine, comme la lecture ou les mathématiques, à un âge ou niveau scolaire donné.'
    ),
    'review-and-monitoring': (
        'Examen et suivi',
        'Examen et suivi',
        'Publication, examen et suivi systématiques des informations éducatives par rapport aux plans, indicateurs, cibles et valeurs de référence, afin de favoriser la transparence, la responsabilité et l’amélioration continue.'
    ),
    'unesco-basic-and-general-study-subjects': (
        'Disciplines d’études fondamentales et générales',
        'Matières de l’enseignement de base et général',
        'Domaines d’études fondamentaux et généraux visant à développer les connaissances générales, les littératies, la compréhension culturelle et les compétences scolaires essentielles dans des domaines tels que les langues, les mathématiques, les sciences, les sciences humaines, les arts, la santé et l’éducation à la citoyenneté.'
    ),
    'unesco-educational-sciences-and-environment': (
        'Sciences de l’éducation et environnement éducatif',
        'Sciences de l’éducation et milieu éducatif',
        'Étude interdisciplinaire de l’éducation et des milieux dans lesquels se déroulent l’enseignement et l’apprentissage, intégrant les influences pédagogiques, psychologiques, sociales, historiques, philosophiques, culturelles et contextuelles.'
    ),
    'xapi-concurrency-control': (
        'Contrôle de concurrence xAPI',
        'Contrôle de concurrence xAPI',
        'Utilisation par xAPI des étiquettes d’entité HTTP (ETags) et des en-têtes de requête conditionnelle, notamment If-Match et If-None-Match, pour empêcher que des mises à jour ou des suppressions de ressources State, Agent Profile ou Activity Profile reposent sur des données périmées.'
    ),
    'profile-based-statement-conformance': (
        'Conformité des déclarations à un profil',
        'Conformité des déclarations à un profil',
        'Conformité selon laquelle les Statements respectent les Statement Templates et les Patterns applicables définis par une version d’un profil xAPI. Lorsqu’un Learning Record Provider indique cette version au moyen d’une category context activity, les Statements doivent respecter les exigences correspondantes. Les fournisseurs conformes devraient indiquer la version conforme la plus récente du profil lorsqu’ils produisent des Statements respectant ses modèles et motifs.'
    ),
    'unesco-technical-and-vocational-study-subjects': (
        'Domaines d’études techniques et professionnels',
        'Matières de l’enseignement technique et professionnel',
        'Domaines d’études axés sur les connaissances et compétences techniques et professionnelles, y compris la préparation à des métiers qualifiés et à des professions spécifiques.'
    ),
}

snapshot = {c['id']: (c['canonicalUri'], json.dumps(c['en'], ensure_ascii=False, sort_keys=True)) for c in data['concepts']}
resolutions = []
for concept_id, (expected, label, definition) in changes.items():
    concept = concepts[concept_id]
    fr = concept['fr']
    if fr['prefLabel'] != expected:
        raise SystemExit('STOP: Unexpected preferred label for {}: {!r}'.format(concept_id, fr['prefLabel']))
    before = {'prefLabel': fr['prefLabel'], 'definition': fr['definition']}
    fr['prefLabel'] = label
    fr['definition'] = definition
    resolutions.append({'id': concept_id, 'previous': before, 'approved': {'prefLabel': label, 'definition': definition}, 'resolution': 'editorial-decision-applied'})

for concept in data['concepts']:
    concept_id = concept['id']
    assert (concept['canonicalUri'], json.dumps(concept['en'], ensure_ascii=False, sort_keys=True)) == snapshot[concept_id]
    assert concept['fr']['prefLabel'].strip()
    assert concept['fr']['definition'].strip()
    assert concept['status'] == 'draft'

output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
report.write_text(json.dumps({'phase': 14, 'status': 'editorial-resolutions-applied', 'resolvedCount': len(resolutions), 'remainingHolds': [], 'resolutions': resolutions, 'publicationStatus': 'not-published'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('PASS: 386 complete French drafts')
print('PASS: 7 final editorial resolutions applied')
print('PASS: 0 outstanding verification holds')
print('PASS: English definitions and canonical URIs unchanged')
print('PASS: No publication or automatic promotion')
print('Wrote:', output)
print('Wrote:', report)
