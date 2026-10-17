
import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/research.mjs';

const currentYear = new Date().getUTCFullYear();

const concepts = {
  entries: [
    { id: 'learning-engineering', term: 'Learning Engineering' },
    { id: 'learning-sciences', term: 'Learning Sciences' }
  ]
};

function paper(title, citations, year, score = 100) {
  return {
    id: `https://openalex.org/W${Buffer.from(title).toString("hex")}`,
    title,
    publication_year: year,
    cited_by_count: citations,
    relevance_score: score,
    authorships: [],
    primary_location: {},
    open_access: { is_oa: false }
  };
}

const papers = [
  paper('Learning Engineering: Foundational Methods', 100, 2018, 100),
  paper('Learning Engineering: Contemporary Practice', 20, 2024, 90),
  paper('Learning Engineering and Learning Sciences', 50, 2022, 80),
  paper('Learning Engineering: Future Research', 200, currentYear + 2, 70),
  paper('Deep Learning for Image Recognition', 100000, 2017, 60)
];

async function request(sort, ids = ['learning-engineering']) {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async input => {
    const url = new URL(input);
    calls.push(url);

    if (url.pathname === '/glossary-web.json') {
      return { ok: true, json: async () => concepts };
    }

    assert.equal(url.hostname, 'api.openalex.org');

    return {
      ok: true,
      json: async () => ({ results: papers })
    };
  };

  const req = {
    method: 'GET',
    query: { concepts: ids.join(','), sort }
  };

  const res = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  try {
    await handler(req, res);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    return { body: res.body, calls };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('Most Relevant preserves upstream relevance ordering', async () => {
  const { body, calls } = await request('relevant');

  assert.deepEqual(
    body.works.map(w => w.title),
    papers.map(w => w.title)
  );

  assert.equal(
    calls.find(c => c.hostname === 'api.openalex.org')
      .searchParams.get('per_page'),
    '15'
  );
});

test('Highly Cited ranks relevant publications by citations', async () => {
  const { body, calls } = await request('foundational');

  assert.deepEqual(
    body.works.map(w => w.citations),
    [100, 50, 20]
  );

  assert.ok(body.works.every(w => w.title.includes('Learning Engineering')));
  assert.equal(
    calls.find(c => c.hostname === 'api.openalex.org')
      .searchParams.get('sort'),
    'relevance_score:desc'
  );
  assert.equal(
    calls.find(c => c.hostname === 'api.openalex.org')
      .searchParams.get('per_page'),
    '100'
  );
});

test('Recent ranks relevant publications by year', async () => {
  const { body } = await request('recent');

  assert.deepEqual(
    body.works.map(w => w.year),
    [2024, 2022, 2018]
  );
});

test('Citations per Year uses citation rate, not total citations', async () => {
  const { body } = await request('annual');

  const rates = body.works.map(w => w.citationsPerYear);

  assert.ok(
    rates.every((rate, i) => i === 0 || rates[i - 1] >= rate)
  );

  assert.equal(body.works.length, 3);
});

test('Multi-concept research requires both concept labels', async () => {
  const { body } = await request('foundational', [
    'learning-engineering',
    'learning-sciences'
  ]);

  assert.equal(body.works.length, 1);
  assert.equal(
    body.works[0].title,
    'Learning Engineering and Learning Sciences'
  );
});

test('Alternative rankings do not fill gaps with irrelevant papers', async () => {
  const { body } = await request('foundational');

  assert.equal(body.works.length, 3);
  assert.ok(
    body.works.every(w => w.title !== 'Deep Learning for Image Recognition')
  );
});

