#!/usr/bin/env python3
"""Apply editorially requested SKOS associative relationship enrichment to I2IDL JSON-LD.

Run from repository root: python3 apply_i2idl_semantic_bridges.py
Uses public/glossary.jsonld; makes a .bak backup; preserves all existing assertions;
checks existence, reciprocity, hierarchy conflicts, and graph connectivity.
Does NOT modify publicationVersion, semanticProfileVersion, definitions or other files.
"""
import argparse
import json
import shutil
from collections import defaultdict, deque
from pathlib import Path

PAIRS = '''
retrieval-practice|learning-sciences
spaced-repetition|mastery-learning
knowledge-retention|learning-sciences
long-term-memory|working-memory
learning-record-store-lrs|experience-api-xapi
learning-record-store-lrs|xapi-document
learning-record-store-lrs|learning-analytics
experience-api-xapi|learning-analytics
remote-learning|learning-sciences
remote-learning|scaffolding
remote-learning|learner-agency
remote-learning|digital-divide
remote-learning|cognitive-load
asynchronous-learning|self-regulated-learning
synchronous-learning|social-learning
virtual-classroom|learning-community
multimedia-learning|online-learning-modality
mobile-learning|ubiquitous-learning
shareable-competency-definition-scd|assessment
shareable-competency-definition-scd|competency
shareable-competency-definition-scd|formative-assessment
shareable-competency-definition-scd|digital-credential
shareable-competency-definition-scd|competency-based-learning
shareable-competency-definition-scd|ieee-1484-20-3-2022-shareable-competency-definitions
formative-assessment|learner-feedback-loop
formative-assessment|self-regulated-learning
minimum-proficiency-level|summative-assessment
assessment|competency
learning-sciences|human-centered-design
learning-sciences|learning-experience-design-lxd
learning-engineering|learning-analytics
instructional-designer|learning-sciences
co-design|learner-agency
equitable-co-design|accessibility
learning-environment|technology-affordance
contextual-factor|learner-variability
iterative-design|usability-testing
learning-sciences|evidence-based-practice
data-privacy|learning-analytics
learning-analytics|formative-assessment
data-instrumentation|learning-event
education-data-integration|semantic-interoperability
data-stewardship|data-quality
adaptive-instructional-system|learner-variability
ai-explainability-in-education|learner-agency
responsible-ai|privacy-by-design
ai-pedagogy|learning-sciences
intelligent-tutoring-system|scaffolding
digital-divide|equity
open-educational-resources-oer|digital-divide
data-culture|learning-organization
learning-ecosystem-governance|data-stewardship
systems-thinking|total-learning-architecture-tla
learning-poverty|educational-attainment
learner-model|personalization
community-of-practice|social-learning
cognitive-load|working-memory
technology-affordance|technology-constraint
ai-competency-framework-for-teachers-ai-cft|ai-for-professional-development
ai-for-professional-development|ai-assisted-teaching
empathy|user-centered-design
digital-divide|digital-literacies
ethics-of-ai|human-centred-approach-to-ai
ethics-by-design|human-centred-approach-to-ai
metacognitive-monitoring|self-monitoring
data-use|data-informed-decision-making
social-learning|networked-community
statement-template|xapi-pattern
engineering-design|learning-environment-engineering
linked-data|metadata-tagging
continuous-improvement|formative-assessment
ieee-1484-2-2024-learning-employment-record-ecosystems|learning-record
intelligent-tutoring-system|learner-model
competency-based-learning|formative-assessment
human-centered-design|usability-testing
learning-experience-design-lxd|user-centered-design
evidence-based-practice|learning-engineering-process
unesco-educational-evaluation|learning-assessment
evidence-based-decision-making|evidence-based-practice
learner-model|personalized-learning
continuous-improvement|feedback-loop
data-reporting|review-and-monitoring
administrative-data|education-data-integration
digital-engineering-for-learning-systems|human-systems-integration-hsi
decision-support|machine-learning
unesco-educational-policy|strategic-planning
interoperability|learning-metadata
learning-metadata|resource-description-framework-rdf
linked-data|xapi-profile
agile-development|continuous-integration
lean-agile|scrum
kanban|scrum
ai-literacy-for-teachers|ai-pedagogy
ai-competency-progression|ai-literacy-for-teachers
ai-enhanced-pedagogical-innovation|ai-pedagogy-integration
safe-and-responsible-use-of-ai|trustworthy-ai-for-education
ethics-by-design|safe-and-responsible-use-of-ai
design-build-cycle|learning-experience-design-lxd
'''

def as_list(value):
    return [] if value is None else (value if isinstance(value, list) else [value])

def uri(ref):
    return ref if isinstance(ref, str) else ref['@id']

def links(node, key):
    return {uri(x) for x in as_list(node.get(key))}

def components(concepts):
    adj = {uri: set() for uri in concepts}
    for u, n in concepts.items():
        for predicate in ('skos:related', 'skos:broader', 'skos:narrower'):
            for v in links(n, predicate):
                if v in adj:
                    adj[u].add(v)
                    adj[v].add(u)
    remaining = set(adj)
    sizes = []
    while remaining:
        start = next(iter(remaining))
        queue = [start]
        remaining.remove(start)
        count = 0
        for u in queue:
            count += 1
            new = adj[u] & remaining
            queue.extend(sorted(new))
            remaining.difference_update(new)
        sizes.append(count)
    return sorted(sizes, reverse=True)

def run(path: Path, dry_run: bool):
    data = json.loads(path.read_text(encoding='utf-8'))
    concepts = {n['@id']: n for n in data['@graph'] if 'skos:Concept' in as_list(n.get('@type'))}
    prefix = 'https://id.i2idl.org/concepts/'
    before = components(concepts)
    added, existing = [], []
    for line in PAIRS.splitlines():
        if not line.strip():
            continue
        a, b = line.strip().split('|')
        u, v = prefix+a, prefix+b
        if u == v or u not in concepts or v not in concepts:
            raise ValueError(f'Invalid or missing concept: {a} | {b}')
        A, B = concepts[u], concepts[v]
        if v in links(A,'skos:broader') | links(A,'skos:narrower') or u in links(B,'skos:broader') | links(B,'skos:narrower'):
            raise ValueError(f'Hierarchy conflict, cannot add related: {a} | {b}')
        if v in links(A,'skos:related') and u in links(B,'skos:related'):
            existing.append((a,b))
            continue
        for node,target in ((A,v),(B,u)):
            old = as_list(node.get('skos:related'))
            if target not in {uri(item) for item in old}:
                node['skos:related'] = old + [{'@id':target}]
        added.append((a,b))
    for u,n in concepts.items():
        related = [uri(item) for item in as_list(n.get('skos:related'))]
        if len(related) != len(set(related)) or u in related:
            raise ValueError(f'Duplicate/self-related assertion: {u}')
        for v in related:
            if v not in concepts or u not in links(concepts[v], 'skos:related'):
                raise ValueError(f'Unresolved/nonreciprocal assertion: {u} -> {v}')
            if v in links(n,'skos:broader') | links(n,'skos:narrower'):
                raise ValueError(f'Overlapping related/hierarchy: {u} -> {v}')
    after = components(concepts)
    print(f'Concepts: {len(concepts)} | New reciprocal pairs: {len(added)} | Already present: {len(existing)}')
    print(f'Connected components before: {before} | after: {after}')
    if after != [len(concepts)]:
        raise ValueError('The graph has not become one connected component; inspect current baseline.')
    if not dry_run and added:
        backup = path.with_name(path.name+'.bak')
        shutil.copy2(path, backup)
        path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n', encoding='utf-8')
        print(f'Updated {path} (original backed up to {backup})')
    else:
        print('No file changed.' if dry_run else 'No additions needed.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--path',type=Path,default=Path('public/glossary.jsonld'))
    parser.add_argument('--dry-run',action='store_true')
    args=parser.parse_args()
    run(args.path,args.dry_run)
