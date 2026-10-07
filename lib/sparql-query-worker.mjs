// SPDX-License-Identifier: Apache-2.0

import { parentPort, workerData } from 'node:worker_threads';
import { QueryEngine } from '@comunica/query-sparql-rdfjs';
import ParserJsonld from '@rdfjs/parser-jsonld';
import { Store, Writer } from 'n3';
import { Readable } from 'node:stream';

const engine = new QueryEngine();

class ResultLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ResultLimitError';
  }
}

function bindingTerm(term) {
  const result = {
    type:
      term.termType === 'Literal'
        ? 'literal'
        : term.termType === 'BlankNode'
          ? 'bnode'
          : 'uri',
    value: term.value
  };

  if (term.termType === 'Literal') {
    if (term.language) {
      result['xml:lang'] = term.language;
    }

    if (term.datatype?.value) {
      result.datatype = term.datatype.value;
    }
  }

  return result;
}

async function loadStore(graphUrl) {
  const response = await fetch(graphUrl);

  if (!response.ok) {
    throw new Error(
      `Unable to load glossary graph (${response.status})`
    );
  }

  const jsonldText = await response.text();
  const parser = new ParserJsonld();
  const quadStream = parser.import(
    Readable.from([jsonldText])
  );
  const store = new Store();

  for await (const quad of quadStream) {
    store.addQuad(quad);
  }

  return store;
}

async function bindingsToJson(
  result,
  maxResultRows
) {
  const bindings = [];
  let vars = [];

  for await (const binding of result) {
    if (bindings.length >= maxResultRows) {
      throw new ResultLimitError(
        `SELECT result exceeds the ${maxResultRows}-row limit.`
      );
    }

    const row = {};

    for (const [variable, term] of binding) {
      row[variable.value] =
        bindingTerm(term);
    }

    if (!vars.length) {
      vars = Object.keys(row);
    }

    bindings.push(row);
  }

  return {
    vars,
    bindings
  };
}

async function quadsToTurtle(
  result,
  maxGraphQuads
) {
  const writer = new Writer({
    format: 'text/turtle'
  });

  let count = 0;

  for await (const quad of result) {
    if (count >= maxGraphQuads) {
      throw new ResultLimitError(
        `Graph result exceeds the ${maxGraphQuads}-quad limit.`
      );
    }

    writer.addQuad(quad);
    count += 1;
  }

  return await new Promise(
    (resolve, reject) => {
      writer.end((error, output) => {
        if (error) {
          reject(error);
        } else {
          resolve(output);
        }
      });
    }
  );
}

async function execute() {
  const {
    query,
    type,
    graphUrl,
    maxResultRows,
    maxGraphQuads
  } = workerData;

  const store = await loadStore(graphUrl);

  if (type === 'SELECT') {
    const result = await engine.queryBindings(
      query,
      { sources: [store] }
    );

    return await bindingsToJson(
      result,
      maxResultRows
    );
  }

  if (type === 'ASK') {
    return {
      boolean:
        await engine.queryBoolean(
          query,
          { sources: [store] }
        )
    };
  }

  if (
    type === 'CONSTRUCT' ||
    type === 'DESCRIBE'
  ) {
    const result = await engine.queryQuads(
      query,
      { sources: [store] }
    );

    return {
      turtle:
        await quadsToTurtle(
          result,
          maxGraphQuads
        )
    };
  }

  throw new Error(
    'Unsupported query type.'
  );
}

try {
  const result = await execute();

  parentPort.postMessage({
    ok: true,
    result
  });
} catch (error) {
  parentPort.postMessage({
    ok: false,
    error: {
      name: error?.name || 'Error',
      message:
        error?.message ||
        'SPARQL query failed.'
    }
  });
}
