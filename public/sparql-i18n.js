/* SPDX-License-Identifier: Apache-2.0 */
(() => {
  "use strict";

  const STORAGE_KEY = "i2idl-language";
  const translations = {
  "I2IDL / Developer resources": "I2IDL / Ressources pour les développeurs",
  "I2IDL SPARQL Endpoint": "Point d’accès SPARQL de l’I2IDL",
  "Read-only SPARQL access to the I2IDL Glossary of Digital Learning.": "Accès SPARQL en lecture seule au Glossaire I2IDL de l’apprentissage numérique.",
  "Developer Portal": "Portail des développeurs",
  "Graph Explorer": "Explorateur du graphe",
  "REST API Docs": "Documentation de l’API REST",
  "Glossary": "Glossaire",
  "Supported query forms: SELECT, ASK, CONSTRUCT, and DESCRIBE. SPARQL Update, SERVICE, and remote-dataset clauses are disabled. Queries are subject to execution, result, request-size, and rate limits.": "Formes de requêtes prises en charge : SELECT, ASK, CONSTRUCT et DESCRIBE. SPARQL Update, SERVICE et les clauses utilisant des jeux de données distants sont désactivés. Les requêtes sont soumises à des limites d’exécution, de résultats, de taille et de fréquence.",
  "SPARQL query": "Requête SPARQL",
  "Run query": "Exécuter la requête",
  "Example SELECT query": "Exemple de requête SELECT",
  "Example ASK query": "Exemple de requête ASK",
  "Example CONSTRUCT query": "Exemple de requête CONSTRUCT",
  "Example DESCRIBE query": "Exemple de requête DESCRIBE",
  "Full JSON-LD graph:": "Graphe JSON-LD complet :",
  "Human-readable glossary:": "Glossaire destiné aux lecteurs :",
  "© 2026 Institute for Infrastructure and Interoperable Data in Learning (I2IDL) · Developer resources": "© 2026 Institute for Infrastructure and Interoperable Data in Learning (I2IDL) · Ressources pour les développeurs"
};
  const originals = new WeakMap();
  const originalTitle = document.title;

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.title = lang === "fr"
      ? "Point d’accès SPARQL | Glossaire I2IDL"
      : originalTitle;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest("textarea,pre,code,script,style,select")) {
        continue;
      }

      if (!originals.has(node)) {
        originals.set(node, node.nodeValue);
      }

      const original = originals.get(node);
      const value = original.trim();

      if (Object.hasOwn(translations, value)) {
        node.nodeValue = lang === "fr"
          ? original.replace(value, translations[value])
          : original;
      }
    }
  }

  function initialize() {
    const header = document.querySelector(".i2-sparql-wrap");
    if (!header) return;

    if (document.getElementById("i2idl-language-selector")) return;

    const selector = document.createElement("select");
    selector.id = "i2idl-language-selector";
    selector.setAttribute("aria-label", "Language / Langue");
    selector.innerHTML =
      `<option value="en">English</option><option value="fr">Français</option>`;

    const control = document.createElement("div");
    control.className = "i2idl-language-control";

    const label = document.createElement("label");
    label.htmlFor = selector.id;
    label.textContent = "Language / Langue";

    control.append(label, selector);
    header.prepend(control);

    let lang = "en";
    try {
      lang = localStorage.getItem(STORAGE_KEY) === "fr" ? "fr" : "en";
    } catch {}

    selector.value = lang;
    applyLanguage(lang);

    selector.addEventListener("change", () => {
      try {
        localStorage.setItem(STORAGE_KEY, selector.value);
      } catch {}
      applyLanguage(selector.value);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
