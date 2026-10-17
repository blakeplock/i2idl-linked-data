/* SPDX-License-Identifier: Apache-2.0 */
(() => {
  "use strict";
  const STORAGE_KEY = "i2idl-language";
  const translations = {
  "I2IDL · Developer resources": "I2IDL · Ressources pour les développeurs",
  "Glossary REST API": "API REST du glossaire",
  "Search and navigate the I2IDL Glossary of Digital Learning with simple JSON requests. API v1 is read-only, public, and backed by the canonical Linked Data publication.": "Recherchez et explorez le Glossaire I2IDL de l’apprentissage numérique à l’aide de requêtes JSON simples. L’API v1 est publique, en lecture seule et fondée sur la publication canonique des données liées.",
  "API contract v1 and glossary publication versions are independent.": "Le contrat de l’API v1 et les versions de publication du glossaire sont indépendants.",
  "OpenAPI 3.1 specification": "Spécification OpenAPI 3.1",
  "Canonical JSON-LD": "JSON-LD canonique",
  "Try an endpoint": "Tester un point d’accès",
  "Endpoint": "Point d’accès",
  "Send GET request": "Envoyer une requête GET",
  "Copy URL": "Copier l’URL",
  "Select an endpoint and send a request.": "Sélectionnez un point d’accès et envoyez une requête.",
  "JSON result": "Résultat JSON",
  "Use it in your application": "Utilisez l’API dans votre application",
  "Semantic identifiers": "Identifiants sémantiques",
  "Each concept retains its permanent URI. Use the JSON-LD and Turtle links in concept responses when you need RDF, and the historical versions endpoint for immutable revision metadata.": "Chaque concept conserve son URI permanent. Utilisez les liens JSON-LD et Turtle des réponses lorsque vous avez besoin de RDF, ainsi que le point d’accès aux versions historiques pour obtenir les métadonnées immuables des révisions.",
  " (required)": " (obligatoire)",
  "Fill in required identifiers first.": "Renseignez les identifiants obligatoires.",
  "Loading…": "Chargement…",
  " · Success": " · Succès",
  " · Error": " · Erreur",
  "Request failed. Check network or endpoint.": "Échec de la requête. Vérifiez le réseau ou le point d’accès.",
  "URL copied": "URL copiée",
  "Copy from the URL shown above": "Copiez l’URL affichée ci-dessus",
  "Unable to load OpenAPI specification": "Impossible de charger la spécification OpenAPI",
  "List concepts": "Lister les concepts",
  "Retrieve concept": "Récupérer un concept",
  "Concept relationships": "Relations du concept",
  "Concept revision history": "Historique des révisions du concept",
  "List collections": "Lister les collections",
  "Collection members": "Membres de la collection",
  "List sources": "Lister les sources",
  "Retrieve source": "Récupérer une source"
};
  const originals = new WeakMap();
  const originalAttributes = new WeakMap();
  const originalTitle = document.title;

  function currentLanguage() {
    return document.documentElement.lang === "fr" ? "fr" : "en";
  }

  function translate(text, lang) {
    return lang === "fr" ? (translations[text] || text) : text;
  }

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.title = lang === "fr"
      ? "Documentation de l’API REST | Glossaire I2IDL"
      : originalTitle;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest("pre,code,script,style,select")) continue;
      if (!originals.has(node)) originals.set(node, node.nodeValue);
      const original = originals.get(node);
      const trimmed = original.trim();
      if (translations[trimmed]) {
        node.nodeValue = lang === "fr"
          ? original.replace(trimmed, translations[trimmed])
          : original;
      }
    }

    for (const element of document.querySelectorAll("[aria-label]")) {
      if (!originalAttributes.has(element)) {
        originalAttributes.set(element, element.getAttribute("aria-label"));
      }
      const original = originalAttributes.get(element);
      element.setAttribute("aria-label", translate(original, lang));
    }
  }

  function initialize() {
    const header = document.querySelector("header .wrap");
    if (!header) return;

    if (document.getElementById("i2idl-language-selector")) return;
    const selector = document.createElement("select");
    selector.id = "i2idl-language-selector";
    selector.setAttribute("aria-label", "Language / Langue");
    selector.style.cssText =
      "width:auto;min-width:78px;min-height:38px;padding:6px 10px;" +
      "background:white;color:#30103e;border:1px solid #ded6e1;" +
      "border-radius:6px;margin:0 0 16px;";
    selector.innerHTML = `<option value="en">EN</option><option value="fr">FR</option>`;
    header.prepend(selector);

    let lang = "en";
    try {
      lang = localStorage.getItem(STORAGE_KEY) === "fr" ? "fr" : "en";
    } catch {}

    selector.value = lang;
    applyLanguage(lang);

    selector.addEventListener("change", () => {
      try { localStorage.setItem(STORAGE_KEY, selector.value); } catch {}
      applyLanguage(selector.value);
      document.dispatchEvent(new CustomEvent("i2idl-language-change", {
        detail: { language: selector.value }
      }));
    });
  }

  window.I2IDLDocsI18n = { translate, currentLanguage };
  document.addEventListener("DOMContentLoaded", initialize);
})();
