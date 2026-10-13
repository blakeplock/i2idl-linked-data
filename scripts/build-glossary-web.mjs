#!/usr/bin/env node
// I2IDL presentation-index generator. Canonical JSON-LD remains the source of truth.
// Run from the repository root: node scripts/build-glossary-web.mjs
import fs from 'node:fs';
const source = 'public/glossary.jsonld';
const target = 'public/glossary-web.json';
const semanticModel = JSON.parse(fs.readFileSync(source, 'utf8'));
const scheme = semanticModel['@graph']?.find(n => n['@id'] === 'https://id.i2idl.org/scheme');
if (!scheme?.['gs:publicationVersion']) throw new Error('Missing publication version');
    const semanticNodes = semanticModel['@graph'];
    const nodeById = new Map(semanticNodes.map(node => [node['@id'], node]));
    const conceptNodes = semanticNodes.filter(node => Array.isArray(node['@type']) && node['@type'].includes('skos:Concept'));

    function projectEvidence(ev) {
      const sourceRef = ev['dcterms:source'];
      const sourceNode = sourceRef && nodeById.get(sourceRef['@id']);
      const projected = { name: ev['gs:sourceLabel'] || (sourceNode && sourceNode['dcterms:title']) || '' };
      if (ev['gs:citationDetail']) projected.detail = ev['gs:citationDetail'];
      if (ev['schema:url']) projected.url = ev['schema:url'];
      if (ev['gs:evidenceRelation']) projected.relation = ev['gs:evidenceRelation'];
      if (ev['gs:pdfPage'] !== undefined) projected.pdfPage = ev['gs:pdfPage'];
      if (ev['gs:pdfPrintedPage'] !== undefined) projected.pdfPrintedPage = ev['gs:pdfPrintedPage'];
      if (ev['gs:host']) projected.host = ev['gs:host'];
      return projected;
    }

    function collectionLabel(ref) {
      const node = ref && nodeById.get(ref['@id']);
      return node ? node['skos:prefLabel'] : '';
    }

    const allCollections = semanticNodes
      .filter(node => (Array.isArray(node['@type']) ? node['@type'] : [node['@type']]).includes('skos:Collection'))
      .map(node => ({
        id: node['@id'],
        slug: node['@id'].split('/').pop(),
        label: node['skos:prefLabel'] || '',
        description: node['dcterms:description'] || '',
        members: (Array.isArray(node['skos:member']) ? node['skos:member'] : (node['skos:member'] ? [node['skos:member']] : []))
          .map(ref => ref && ref['@id'])
          .filter(Boolean)
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const featuredIds = ['learning-engineering','learning-sciences','standards-and-interoperability'].map(slug => `https://id.i2idl.org/collections/field/${slug}`);
    const curatedCollections = featuredIds.map(id => allCollections.find(c => c.id === id)).filter(Boolean);
    const curatedByConcept = new Map();
    allCollections.forEach(collection => {
      collection.members.forEach(conceptId => {
        if (!curatedByConcept.has(conceptId)) curatedByConcept.set(conceptId, []);
        curatedByConcept.get(conceptId).push(collection.id);
      });
    });

    const externalLabels = {
      'http://vocabularies.unesco.org/thesaurus/concept1050':'Student evaluation','http://vocabularies.unesco.org/thesaurus/concept49':'Curriculum',
      'http://vocabularies.unesco.org/thesaurus/concept8237':'Distance education','http://vocabularies.unesco.org/thesaurus/concept97':'Educational technology',
      'http://vocabularies.unesco.org/thesaurus/concept16979':'Electronic learning','http://vocabularies.unesco.org/thesaurus/concept17093':'Open educational resources',
      'http://vocabularies.unesco.org/thesaurus/concept5081':'Early childhood education','http://vocabularies.unesco.org/thesaurus/concept9':'Educational policy',
      'http://vocabularies.unesco.org/thesaurus/concept21':'Educational administration','http://vocabularies.unesco.org/thesaurus/concept14':'Educational planning',
      'http://vocabularies.unesco.org/thesaurus/concept31':'Educational management','http://vocabularies.unesco.org/thesaurus/concept9261':'Educational management information systems',
      'https://schema.org/DefinedTerm':'DefinedTerm','https://schema.org/DefinedTermSet':'DefinedTermSet','https://schema.org/EducationalOccupationalCredential':'EducationalOccupationalCredential',
      'https://schema.org/LearningResource':'LearningResource','https://schema.org/Course':'Course'
    };
    function externalRefs(concept, prop, strength) {
      const raw = concept[prop]; const refs = Array.isArray(raw) ? raw : (raw ? [raw] : []);
      return refs.filter(r => r && r['@id']).map(ref => {
        const id = ref['@id'];
        const unesco = id.startsWith('http://vocabularies.unesco.org/thesaurus/concept');
        return { targetId:id, strength, vocabulary:unesco ? 'UNESCO Thesaurus' : id.startsWith('https://schema.org/') ? 'Schema.org' : 'External vocabulary',
          label:externalLabels[id] || id, href:unesco ? `https://vocabularies.unesco.org/unesco/en/page/${id.split('/').pop()}` : (id.startsWith('https://') ? id : '') };
      });
    }
    const entries = conceptNodes.map(concept => {
      const definitionRef = concept['gs:activeDefinition'];
      const definitionNode = definitionRef && nodeById.get(definitionRef['@id']);
      const rawAliases = concept['skos:altLabel'];
      const aliases = Array.isArray(rawAliases) ? rawAliases : (rawAliases ? [rawAliases] : []);
      return {
        term: concept['skos:prefLabel'],
        definition: definitionNode ? definitionNode['rdf:value'] : concept['skos:definition'],
        why: concept['gs:editorialExplanation'] || '',
        field: collectionLabel(concept['gs:fieldCollection']),
        type: collectionLabel(concept['gs:typeCollection']),
        aka: aliases.join('; '),
        id: concept['dcterms:identifier'],
        broader: (Array.isArray(concept['skos:broader']) ? concept['skos:broader'] : (concept['skos:broader'] ? [concept['skos:broader']] : [])).map(ref => ref && ref['@id']).filter(Boolean),
        narrower: (Array.isArray(concept['skos:narrower']) ? concept['skos:narrower'] : (concept['skos:narrower'] ? [concept['skos:narrower']] : [])).map(ref => ref && ref['@id']).filter(Boolean),
        related: (Array.isArray(concept['skos:related']) ? concept['skos:related'] : (concept['skos:related'] ? [concept['skos:related']] : [])).map(ref => ref && ref['@id']).filter(Boolean),
        externalMappings: [...externalRefs(concept,'skos:exactMatch','Exact match'),...externalRefs(concept,'skos:closeMatch','Close match'),...externalRefs(concept,'skos:relatedMatch','Related match')],
        collections: curatedByConcept.get(concept['@id']) || [],
        sources: definitionNode ? (definitionNode['gs:evidence'] || []).map(projectEvidence) : []
      };
    });


if (!entries.length || !allCollections.length) throw new Error('Glossary index has no concepts or collections');
const payload = { publicationVersion: scheme['gs:publicationVersion'], semanticProfileVersion: scheme['gs:semanticProfileVersion'], entries, allCollections };
const serialized = JSON.stringify(payload);
fs.writeFileSync(target, serialized + '\n');
console.log(`Wrote ${target}: ${(Buffer.byteLength(serialized)/1024).toFixed(0)} KB, ${entries.length} concepts, ${allCollections.length} collections`);
