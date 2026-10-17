/* SPDX-License-Identifier: Apache-2.0 */
(() => {
  "use strict";

  const STORAGE_KEY = "i2idl-language";
  const translations = {
    "Glossary / Developers": "Glossaire / Développeurs",
    "Graph Explorer": "Explorateur du graphe",
    "API Docs": "Documentation API",
    "Open knowledge infrastructure / Developer portal": "Infrastructure ouverte de connaissances / Portail des développeurs",
    "Build with the language": "Développez avec le vocabulaire",
    "of digital learning.": "de l’apprentissage numérique.",
    "Connect an AI assistant ↗": "Connecter un assistant IA ↗",
    "Explore interfaces ↓": "Explorer les interfaces ↓",
    "Public & read-only": "Public et en lecture seule",
    "Canonical glossary v0.0.91": "Glossaire canonique v0.0.91",
    "Persistent HTTPS identifiers": "Identifiants HTTPS pérennes",
    "Choose your interface": "Choisissez votre interface",
    "Five ways into the graph.": "Cinq façons d’accéder au graphe.",
    "Linked Data": "Données liées",
    "Tools available": "Outils disponibles",
    "Connection": "Connexion",
    "Copy": "Copier",
    "Search concepts": "Rechercher des concepts",
    "Example query": "Exemple de requête",
    "Query endpoint": "Point d’accès aux requêtes",
    "Resource": "Ressource",
    "Example": "Exemple",
    "Use": "Utilisation",
    "Start with your application, not an export format.": "Partez des besoins de votre application, plutôt que d’un format d’exportation.",
    "AI / SEMANTIC GROUNDING": "IA / ANCRAGE SÉMANTIQUE",
    "Connect AI assistants to the published glossary through four bounded, citation-aware, read-only tools. Public remote Streamable HTTP; no credentials required.": "Connectez des assistants IA au glossaire publié grâce à quatre outils en lecture seule, avec des limites de requête et une prise en charge des citations. Accès distant public via Streamable HTTP, sans authentification.",
    "Set up MCP →": "Configurer MCP →",
    "Search concepts, retrieve definitions, traverse relationships, and request compact AI context bundles.": "Recherchez des concepts, consultez leurs définitions, parcourez leurs relations et obtenez des ensembles de contexte compacts pour l’IA.",
    "Explore REST →": "Explorer REST →",
    "Use canonical concept URIs and machine-readable JSON-LD or Turtle representations.": "Utilisez les URI canoniques des concepts et leurs représentations lisibles par machine en JSON-LD ou Turtle.",
    "Explore Linked Data →": "Explorer les données liées →",
    "Query the published RDF graph using familiar semantic-web query patterns.": "Interrogez le graphe RDF publié à l’aide des méthodes de requête du Web sémantique.",
    "Explore SPARQL →": "Explorer SPARQL →",
    "Inspect concepts, sources, and relationships visually before building a query or integration.": "Examinez visuellement les concepts, les sources et les relations avant de construire une requête ou une intégration.",
    "Open Explorer →": "Ouvrir l’explorateur →",
    "Give an assistant a reliable reference.": "Fournissez à un assistant une référence fiable.",
    "MCP clients supporting remote Streamable HTTP can discover and invoke the glossary's tools. The endpoint is POST-only; opening it in a browser returns HTTP 405 by design.": "Les clients MCP prenant en charge Streamable HTTP distant peuvent découvrir et appeler les outils du glossaire. Le point d’accès accepte uniquement POST ; son ouverture dans un navigateur renvoie volontairement HTTP 405.",
    "Add a remote MCP server in your AI client's settings, select Streamable HTTP, and use no authentication.": "Ajoutez un serveur MCP distant dans les paramètres de votre client IA, sélectionnez Streamable HTTP et n’utilisez aucune authentification.",
    "Register the URL as a remote Streamable HTTP MCP server.": "Enregistrez l’URL comme serveur MCP distant utilisant Streamable HTTP.",
    "Discover the four read-only tools.": "Découvrez les quatre outils en lecture seule.",
    "Preserve citations and canonical identifiers when generating an answer.": "Conservez les citations et les identifiants canoniques lors de la génération d’une réponse.",
    "MCP Quick Start ↗": "Guide de démarrage MCP ↗",
    "AI Integration Guide ↗": "Guide d’intégration de l’IA ↗",
    "Each tool retrieves only published reference material and declares itself read-only.": "Chaque outil récupère uniquement des ressources de référence publiées et se déclare en lecture seule.",
    "Find published terms and canonical IDs.": "Rechercher les termes publiés et leurs identifiants canoniques.",
    "Retrieve a concept, definition, and metadata.": "Récupérer un concept, sa définition et ses métadonnées.",
    "Retrieve asserted broader, narrower, and related concepts.": "Récupérer les concepts génériques, spécifiques et associés explicitement déclarés.",
    "Retrieve a bounded semantic context bundle with provenance.": "Récupérer un ensemble limité de contexte sémantique avec sa provenance.",
    "Verified with ChatGPT and MCP Inspector. Other client support depends on transport and protocol compatibility.": "Vérifié avec ChatGPT et MCP Inspector. La prise en charge par d’autres clients dépend de la compatibilité des transports et des protocoles.",
    "EXAMPLE / TOOL ARGUMENTS": "EXEMPLE / ARGUMENTS DE L’OUTIL",
    "Straightforward JSON for applications.": "Du JSON simple pour les applications.",
    "Use the public versioned API to retrieve a bounded search result.": "Utilisez l’API publique versionnée pour obtenir un ensemble limité de résultats de recherche.",
    "Interactive API docs →": "Documentation interactive de l’API →",
    "OpenAPI 3.1 specification ↗": "Spécification OpenAPI 3.1 ↗",
    "Retrieve grounded context": "Récupérer un contexte documenté",
    "Get a single concept's definition, evidence, neighbors, and provenance.": "Obtenez la définition, les éléments de preuve, les concepts voisins et la provenance d’un concept.",
    "View live JSON ↗": "Consulter le JSON en direct ↗",
    "Durable identifiers. Open formats.": "Des identifiants pérennes. Des formats ouverts.",
    "The canonical graph uses JSON-LD and RDF vocabularies including SKOS, Dublin Core Terms, Schema.org, and PROV-O. Concepts resolve via stable HTTPS identifiers.": "Le graphe canonique utilise JSON-LD et des vocabulaires RDF, notamment SKOS, Dublin Core Terms, Schema.org et PROV-O. Les concepts sont accessibles au moyen d’identifiants HTTPS stables.",
    "Canonical identifier": "Identifiant canonique",
    "Persistent concept URI": "URI pérenne du concept",
    "Machine-readable concept graph": "Graphe de concepts lisible par machine",
    "RDF serialisation": "Sérialisation RDF",
    "Full graph": "Graphe complet",
    "Complete publication": "Publication complète",
    "URI and content negotiation guide ↗": "Guide des URI et de la négociation de contenu ↗",
    "Ask questions of the RDF graph.": "Interrogez le graphe RDF.",
    "The hosted endpoint supports bounded, read-only SELECT, ASK, CONSTRUCT, and DESCRIBE queries.": "Le point d’accès hébergé prend en charge les requêtes SELECT, ASK, CONSTRUCT et DESCRIBE en lecture seule, avec des limites d’exécution.",
    "Open query interface →": "Ouvrir l’interface de requête →",
    "SPARQL documentation ↗": "Documentation SPARQL ↗",
    "Read operations only. Query execution is bounded by the service.": "Opérations de lecture uniquement. L’exécution des requêtes est limitée par le service.",
    "Visual investigation": "Exploration visuelle",
    "See the connections before you query.": "Visualisez les connexions avant d’interroger le graphe.",
    "The Knowledge Graph Explorer lets you inspect semantic relationships, compare concepts, study source coverage, and discover scholarship linked to glossary topics. Research discovery results are separate from editorially curated graph assertions.": "L’explorateur du graphe de connaissances permet d’examiner les relations sémantiques, de comparer les concepts, d’étudier la couverture des sources et de découvrir des publications scientifiques liées aux thèmes du glossaire. Les résultats de découverte scientifique restent distincts des assertions du graphe validées sur le plan éditorial.",
    "Launch Knowledge Graph Explorer →": "Lancer l’explorateur du graphe de connaissances →",
    "Read the human glossary ↗": "Consulter le glossaire destiné aux lecteurs ↗",
    "Editorial & operational boundaries": "Limites éditoriales et opérationnelles",
    "Reference data with a clear provenance trail.": "Des données de référence dont la provenance est traçable.",
    "I2IDL concept records identify published definitions, relationships, citations, and source evidence. AI-generated explanations should distinguish explicit graph assertions from model interpretation. The public MCP service is unauthenticated and read-only; request bounds, upstream timeouts, and edge rate limiting protect service availability.": "Les fiches de concepts de l’I2IDL identifient les définitions publiées, les relations, les citations et les preuves documentaires. Les explications générées par l’IA doivent distinguer les assertions explicites du graphe des interprétations du modèle. Le service MCP public est accessible sans authentification et en lecture seule ; des limites de requête, des délais d’expiration des services externes et une limitation du débit protègent sa disponibilité.",
    "Security documentation ↗": "Documentation de sécurité ↗",
    "Licensing and attribution ↗": "Licences et attribution ↗",
    "Source": "Code source",
    "API reference": "Référence de l’API",
    "Copy MCP endpoint": "Copier le point d’accès MCP",
    "Copy SPARQL endpoint": "Copier le point d’accès SPARQL",
    "Copied": "Copié",
    "Select URL to copy": "Sélectionnez l’URL à copier",
    "Primary": "Navigation principale",
    "© I2IDL · Glossary of Digital Learning · Developer resources": "© Institut pour l’infrastructure et les données interopérables dans l’apprentissage (I2IDL) · Glossaire de l’apprentissage numérique · Ressources pour les développeurs",
    "QUERY": "REQUÊTE",
    "VISUAL": "VISUEL",
    "Query curated concepts, navigate semantic relationships, and ground AI applications in source-attributed knowledge. One public glossary, five interoperable interfaces.": "Interrogez des concepts sélectionnés et validés, explorez leurs relations sémantiques et fondez les applications d’IA sur des connaissances accompagnées de leurs sources. Un glossaire public, cinq interfaces interopérables."
};

  const originals = new WeakMap();
  const originalAttributes = new WeakMap();
  const originalTitle = document.title;
  const metaDescription = document.querySelector("meta[name=description]");
  const originalDescription = metaDescription?.content || "";

  function translate(value, lang) {
    return lang === "fr" ? (translations[value] || value) : value;
  }

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.title = lang === "fr"
      ? "Ressources pour les développeurs | Glossaire I2IDL de l’apprentissage numérique"
      : originalTitle;

    if (metaDescription) {
      metaDescription.content = lang === "fr"
        ? "Intégrez le Glossaire I2IDL de l’apprentissage numérique avec MCP, REST, les données liées, SPARQL et l’explorateur du graphe de connaissances."
        : originalDescription;
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest("code,pre,script,style")) continue;
      if (!originals.has(node)) originals.set(node, node.nodeValue);
      const original = originals.get(node);
      const value = original.trim();
      if (translations[value]) {
        node.nodeValue = original.replace(value, translate(value, lang));
      }
    }

    for (const element of document.querySelectorAll("[aria-label]")) {
      if (element.id === "i2idl-language-selector") continue;
      if (!originalAttributes.has(element)) {
        originalAttributes.set(element, element.getAttribute("aria-label"));
      }
      const original = originalAttributes.get(element);
      element.setAttribute("aria-label", translate(original, lang));
    }
  }

  function initialize() {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    const selector = document.createElement("select");
    selector.id = "i2idl-language-selector";
    selector.setAttribute("aria-label", "Language / Langue");
    selector.innerHTML = `<option value="en">English</option><option value="fr">Français</option>`;

    const control = document.createElement("div");
    control.className = "i2idl-language-control";

    const label = document.createElement("label");
    label.htmlFor = selector.id;
    label.textContent = "Language / Langue";

    control.append(label, selector);
    nav.appendChild(control);

    let lang = "en";
    try {
      lang = localStorage.getItem(STORAGE_KEY) === "fr" ? "fr" : "en";
    } catch {}

    selector.value = lang;
    applyLanguage(lang);

    selector.addEventListener("change", () => {
      try { localStorage.setItem(STORAGE_KEY, selector.value); } catch {}
      applyLanguage(selector.value);
    });
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
