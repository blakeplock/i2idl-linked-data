// SPDX-License-Identifier: Apache-2.0
// Read-only text selection across legacy literals and language-tagged JSON-LD values.
export const SUPPORTED_LANGUAGES = Object.freeze(['en', 'fr']);
export function asArray(value) { return value == null ? [] : Array.isArray(value) ? value : [value]; }
export function languageOf(item, defaultLanguage = 'en') {
  if (typeof item === 'string') return defaultLanguage;
  if (item && typeof item === 'object' && typeof item['@value'] === 'string') return item['@language'] || defaultLanguage;
  return null;
}
export function textOf(item) {
  return typeof item === 'string' ? item : item && typeof item['@value'] === 'string' ? item['@value'] : null;
}
export function selectText(value, preferredLanguage = 'en', defaultLanguage = 'en') {
  const items = asArray(value).filter(item => typeof textOf(item) === 'string');
  const exact = items.find(item => languageOf(item, defaultLanguage) === preferredLanguage);
  const base = preferredLanguage.split('-')[0];
  const primary = items.find(item => languageOf(item, defaultLanguage) === base);
  const fallback = items.find(item => languageOf(item, defaultLanguage) === defaultLanguage);
  return textOf(exact ?? primary ?? fallback ?? items[0] ?? null);
}
export function selectTexts(value, preferredLanguage = 'en', defaultLanguage = 'en') {
  const items = asArray(value).filter(item => typeof textOf(item) === 'string');
  const selection = items.filter(item => languageOf(item, defaultLanguage) === preferredLanguage);
  return (selection.length ? selection : items.filter(item => languageOf(item, defaultLanguage) === defaultLanguage)).map(textOf);
}
export function labelFor(node, language = 'en') {
  return selectText(node?.['skos:prefLabel'], language) || node?.['dcterms:identifier'] || '';
}
export function definitionFor(definitionNode, language = 'en') {
  return selectText(definitionNode?.['rdf:value'] ?? definitionNode?.['skos:definition'], language);
}
export function normalizedSearchText(value, language = 'en') {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase(language);
}
