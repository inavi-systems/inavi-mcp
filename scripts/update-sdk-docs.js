/**
 * Scrapes the iNavi Maps Web JS SDK docs and converts them to JSON files for MCP tools
 *
 * The source is a Docma-generated SPA that exposes parsed JSDoc data at
 * window.docma.apis. Instead of scraping rendered HTML, this reads that structured
 * data directly and emits per-symbol JSON.
 *
 * Pipeline:
 * 1. extractDoclets     - Read parsed JSDoc doclets from window.docma.apis
 * 2. buildDocs          - Assemble per-symbol structured docs (derive categories)
 * 3. buildIndexes       - Build per-category summary indexes and metadata
 * 4. writeAllFiles      - Write per-symbol JSON, category indexes, metadata
 * 5. generateSchemaFile - Generate list-sdk-docs input schema TS file
 *
 * Automation-safe (GitHub Actions): no snapshot-coupled hardcoding (SDK version,
 * symbol-name lists). Categories are derived from structure/naming rules.
 *
 * Usage: npm run update-sdk-docs
 */

const puppeteer = require('puppeteer');
const prettier = require('prettier');
const fs = require('fs');
const path = require('path');
const { logger } = require('./lib/logger');

// Configuration

const BASE_URL = 'https://mapsapi.inavisys.com/docs/';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'sdk-docs');
const INDEX_DIR = path.join(OUTPUT_DIR, 'index');
const SCHEMA_OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'src',
  'tools',
  'sdk-docs',
  'schema',
  'list-sdk-docs.input.schema.ts',
);
const CONTENT_SELECTOR = '#docma-main';
const WAIT_MS = 3000;

// Single anchor class treated as `map`. If the SDK renames it, the warning surfaces it.
const CORE_CLASS = 'inavi.maps.Map';

// Per-category label/guidance used in the auto-generated schema describe text.
// (Human-facing guidance shown to the AI — not a hardcoded symbol-name list.)
const CATEGORY_META = {
  map: {
    label: '지도 본체',
    guidance:
      '지도 인스턴스 생성 및 제어(중심 좌표, 줌, 기울기, 회전, 화면 이동, 이벤트 바인딩). ' +
      '지도 위에 얹는 요소는 overlay, UI 컨트롤은 control 사용',
  },
  overlay: {
    label: '오버레이',
    guidance:
      '지도 위에 표시하는 시각 요소(마커, 마커 클러스터, 원, 폴리곤, 폴리라인, 라벨, 정보창). ' +
      '생성 옵션 타입은 options, 스타일 타입은 style 사용',
  },
  control: {
    label: '지도 컨트롤',
    guidance: '지도 UI 컨트롤 클래스. 각 컨트롤의 옵션 타입은 options 사용',
  },
  coordinates: {
    label: '좌표/기하',
    guidance:
      '좌표·경계 표현과 좌표계 변환(정규화/픽셀/팅크웨어 좌표 및 상호 변환), 유연한 입력 타입(*Like)',
  },
  options: {
    label: '옵션 타입',
    guidance: '클래스·메서드 생성/설정에 사용하는 옵션 객체 타입(*Options)',
  },
  style: {
    label: '스타일 타입',
    guidance: '오버레이의 시각 스타일 정의 및 값 타입(색상 등)',
  },
};
const CATEGORY_ORDER = ['map', 'overlay', 'control', 'coordinates', 'options', 'style'];

/**
 * Measured supplement, not present in the source JSDoc.
 *
 * Every emitter passes `target` to its event callbacks, and for all of them but one it is the
 * emitter instance itself — nothing to read out of it. `MarkerClusterer` is the exception: it
 * hands over a separate object for the clicked cluster or marker, and without the properties
 * below there is no way to tell the two apart or to trace a marker back to its source data.
 * Verified in a browser against the live SDK (2026-09-08); the source docs describe none of it.
 *
 * This is the one place the pipeline carries a symbol name on purpose. `applyEventTargetSpecs`
 * warns when a target symbol is missing so a renamed or newly documented symbol surfaces
 * instead of silently dropping the supplement.
 */
const EVENT_TARGET_SPECS = {
  'inavi.maps.MarkerClusterer': {
    description:
      '이 클래스의 이벤트 콜백에서 `target` 은 MarkerClusterer 인스턴스가 아니라, ' +
      '클릭·호버한 클러스터 또는 개별 마커를 나타내는 별도 객체입니다. ' +
      'Marker 와 같은 메서드를 가지며, 아래 속성으로 둘을 구분합니다.',
    properties: [
      {
        name: 'cluster',
        type: ['boolean'],
        description: '클러스터이면 `true`. 개별 마커에는 이 속성 자체가 없습니다.',
        optional: true,
      },
      {
        name: 'cluster_count',
        type: ['number'],
        description: '클러스터에 묶인 마커 개수. 개별 마커에는 이 속성 자체가 없습니다.',
        optional: true,
      },
      {
        name: 'id',
        type: ['string'],
        description:
          '`cluster_<소스ID>_<인덱스>` 형태의 식별자입니다. 개별 마커는 끝에 `s` 가 붙습니다 ' +
          '(예: 클러스터 `cluster_9757289586_21`, 개별 마커 `cluster_9757289586_6s`). ' +
          '`<인덱스>` 는 생성자에 넘긴 markers 배열의 인덱스라 원본 데이터를 되찾는 데 쓸 수 있습니다.',
      },
    ],
  },
};

/**
 * Caveats appended to a documented property, keyed by symbol id then property name.
 *
 * `EventPayload.target` reads "the object the event fired on", which holds for every emitter
 * but `MarkerClusterer`. That correction lives on the class itself (EVENT_TARGET_SPECS), yet
 * every emitter now links `EventPayload` from its `relatedTypes` — so a reader arriving from
 * `Marker` lands here and never sees it. The caveat has to be visible from this side too.
 */
const PROPERTY_NOTES = {
  EventPayload: {
    target:
      ' 단, `MarkerClusterer` 는 예외입니다. 클러스터러 인스턴스가 아니라 클릭·호버한 ' +
      '클러스터 또는 개별 마커를 나타내는 별도 객체가 전달되며, `cluster`·`cluster_count`·`id` ' +
      '속성으로 둘을 구분합니다. `inavi.maps.MarkerClusterer` 문서의 "Event callback `target`" 절을 보세요.',
  },
};

// Step 1: Extract Structured Data

/** Navigate to the SPA and wait for the Docma content + data to be ready */
async function loadAndWait(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  try {
    await page.waitForSelector(CONTENT_SELECTOR, { timeout: 10000 });
  } catch (_) {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, WAIT_MS));
}

/**
 * Discover the SDK version string from the page. Returns null if not exposed
 * (no hardcoding — an absent version is simply omitted from metadata).
 */
async function readVersion(page) {
  return await page.evaluate(() => {
    const text = document.body ? document.body.innerText : '';
    const m = text.match(/\bv?(\d+\.\d+\.\d+)\b/);
    return m ? m[1] : null;
  });
}

/**
 * Walk the window.docma.apis documentation tree into a flat, serializable list of
 * doclets, keeping only the fields we need (circular refs are avoided).
 */
async function extractDoclets(page) {
  return await page.evaluate(() => {
    const api = window.docma.apis._def_;
    const typeNames = (t) => (t && Array.isArray(t.names) ? t.names : undefined);
    const mapParam = (p) => ({
      name: p.name,
      type: typeNames(p.type),
      optional: p.optional || undefined,
      defaultvalue: p.defaultvalue !== undefined ? String(p.defaultvalue) : undefined,
      description: p.description || undefined,
    });

    const byLongname = {};
    const seen = new Set();
    const walk = (node, depth) => {
      if (!node || typeof node !== 'object' || depth > 6) return;
      if (Array.isArray(node)) return node.forEach((n) => walk(n, depth));
      if (seen.has(node)) return;
      seen.add(node);
      if (typeof node.longname === 'string' && typeof node.kind === 'string') {
        const mapped = {
          longname: node.longname,
          name: node.name,
          kind: node.kind,
          scope: node.scope,
          memberof: node.memberof,
          classdesc: node.classdesc || undefined,
          description: node.description || undefined,
          augments: Array.isArray(node.augments) ? node.augments : undefined,
          type: typeNames(node.type),
          params: Array.isArray(node.params) ? node.params.map(mapParam) : undefined,
          returns: Array.isArray(node.returns)
            ? node.returns.map((r) => ({ type: typeNames(r.type), description: r.description || undefined }))
            : undefined,
          properties: Array.isArray(node.properties) ? node.properties.map(mapParam) : undefined,
          examples: Array.isArray(node.examples) ? node.examples : undefined,
          constructorParams:
            node.$constructor && Array.isArray(node.$constructor.params)
              ? node.$constructor.params.map(mapParam)
              : undefined,
        };
        const existing = byLongname[node.longname];
        if (!existing) {
          byLongname[node.longname] = mapped;
        } else {
          // The source splits some accessors into separate getter/setter doclets that
          // share a longname (setter carries the param type, getter carries the value
          // type). Backfill any field the first-seen doclet left undefined so neither
          // half is lost to the dedup.
          Object.keys(mapped).forEach((k) => {
            if (existing[k] === undefined && mapped[k] !== undefined) existing[k] = mapped[k];
          });
        }
      }
      Object.keys(node).forEach((k) => {
        const v = node[k];
        if (v && typeof v === 'object') walk(v, depth + 1);
      });
    };
    walk(api.documentation, 0);
    return Object.values(byLongname);
  });
}

// Step 2: Build Structured Docs

/**
 * Assemble the flat doclet list into per-symbol structured docs (class/typedef only;
 * the namespace stub is dropped, methods/members are nested under their class).
 */
function buildDocs(doclets) {
  // documented symbol name -> docId, so referenced types can be linked by docId
  const documentedMap = {};
  doclets
    .filter((d) => d.kind === 'class' || d.kind === 'typedef')
    .forEach((d) => {
      documentedMap[d.name] = d.longname;
    });

  const styleValueTypeNames = collectStyleValueTypeNames(doclets);

  const docs = doclets
    .filter((d) => d.kind === 'class' || d.kind === 'typedef')
    .map((d) =>
      d.kind === 'class'
        ? buildClassDoc(d, doclets, documentedMap)
        : buildTypedefDoc(d, documentedMap, styleValueTypeNames),
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  return applyPropertyNotes(applyEventTargetSpecs(docs));
}

/** Attach the measured `EVENT_TARGET_SPECS` supplement to the classes it describes */
function applyEventTargetSpecs(docs) {
  const byId = new Map(docs.map((d) => [d.id, d]));
  Object.keys(EVENT_TARGET_SPECS).forEach((id) => {
    const doc = byId.get(id);
    if (!doc) {
      logger.warn(`event target spec has no matching symbol (renamed?): ${id}`);
      return;
    }
    doc.eventTarget = EVENT_TARGET_SPECS[id];
  });
  return docs;
}

/** Append the measured `PROPERTY_NOTES` caveats to the properties they qualify */
function applyPropertyNotes(docs) {
  const byId = new Map(docs.map((d) => [d.id, d]));
  Object.keys(PROPERTY_NOTES).forEach((id) => {
    const doc = byId.get(id);
    if (!doc) {
      logger.warn(`property note has no matching symbol (renamed?): ${id}`);
      return;
    }
    Object.keys(PROPERTY_NOTES[id]).forEach((name) => {
      const prop = (doc.properties || []).find((p) => p.name === name);
      if (!prop) {
        logger.warn(`property note has no matching property: ${id}.${name}`);
        return;
      }
      prop.description = `${prop.description}${PROPERTY_NOTES[id][name]}`;
    });
  });
  return docs;
}

/**
 * Names used as property types by `*Style` typedefs (e.g. `Color`). These are style value
 * types even though their own name carries no suffix, so they must not hit the default.
 */
function collectStyleValueTypeNames(doclets) {
  return new Set(
    doclets
      .filter((d) => d.kind === 'typedef' && /Style$/.test(d.longname))
      .flatMap((d) => d.properties || [])
      .flatMap((p) => p.type || [])
      .flatMap((t) => extractTypeNames(t)),
  );
}

/** Class doc: description + constructor + methods (signature/params/returns) + members + events */
function buildClassDoc(cls, doclets, documentedMap) {
  // Own longname first, then ancestors (nearest first) so inherited methods/members/events
  // are included — the source declares e.g. `CustomInfoWindow extends InfoWindow` and keeps
  // the child's own doclet lists empty.
  const ancestors = resolveAncestors(cls, doclets, documentedMap);
  const ancestry = [cls.longname, ...ancestors];
  const methodDoclets = mergeInheritedDoclets(ancestry, doclets, 'function');
  const memberDoclets = mergeInheritedDoclets(ancestry, doclets, 'member');

  const methods = methodDoclets.map((m) => ({
    name: m.name,
    signature: buildSignature(m),
    description: m.description || '',
    params: (m.params || []).map(cleanParam),
    returns: (m.returns || []).map((r) => ({ type: r.type, description: r.description || '' })),
  }));

  const doc = {
    id: cls.longname,
    category: '',
    kind: 'class',
    name: cls.name,
    description: cls.classdesc || cls.description || '',
    ctor: {
      signature: buildSignature(
        { name: `new ${cls.name}`, params: cls.constructorParams || cls.params },
        true,
      ),
      params: (cls.constructorParams || cls.params || []).map(cleanParam),
    },
    methods,
    members: memberDoclets.map((m) => ({
      name: m.name,
      type: memberType(m),
      description: m.description || '',
    })),
    events: extractEvents(methodDoclets),
  };
  if (ancestors.length) {
    const classByLongname = new Map(
      doclets.filter((d) => d.kind === 'class').map((d) => [d.longname, d]),
    );
    doc.augments = ancestors.map((ln) => {
      const parent = classByLongname.get(ln);
      return parent ? parent.name : ln.split('.').pop();
    });
  }
  doc.category = assignCategory(doc);
  doc.relatedTypes = collectRelatedTypes(doc, documentedMap);
  return sanitizeDescriptions(doc);
}

/** Resolve the chain of documented ancestor class longnames via `augments` (nearest first) */
function resolveAncestors(cls, doclets, documentedMap) {
  const classByLongname = new Map(
    doclets.filter((d) => d.kind === 'class').map((d) => [d.longname, d]),
  );
  const ancestors = [];
  const seen = new Set([cls.longname]);
  let current = cls;
  while (current && Array.isArray(current.augments) && current.augments.length) {
    const raw = current.augments[0];
    const parentId = classByLongname.has(raw) ? raw : documentedMap[raw];
    if (!parentId || seen.has(parentId)) break;
    seen.add(parentId);
    ancestors.push(parentId);
    current = classByLongname.get(parentId);
  }
  return ancestors;
}

/** Collect a class's own + inherited doclets of a kind; nearest declaration wins by name */
function mergeInheritedDoclets(ancestry, doclets, kind) {
  const byName = new Map();
  ancestry.forEach((longname) => {
    dedupeByName(doclets.filter((d) => d.kind === kind && d.memberof === longname)).forEach((d) => {
      if (!byName.has(d.name)) byName.set(d.name, d);
    });
  });
  return [...byName.values()];
}

/** Typedef doc: option object (properties) or value type (type union) + kept examples */
function buildTypedefDoc(td, documentedMap, styleValueTypeNames) {
  const doc = {
    id: td.longname,
    category: '',
    kind: 'type',
    name: td.name,
    description: td.description || '',
    type: td.type,
    properties: (td.properties || []).map(cleanParam),
    examples: td.examples || [],
  };
  doc.category = assignCategory(doc, styleValueTypeNames);
  doc.relatedTypes = collectRelatedTypes(doc, documentedMap);
  return sanitizeDescriptions(doc);
}

/**
 * Derive a category from the symbol id/structure (no symbol-name lists; naming and
 * structure rules + a safe default so new symbols never silently vanish).
 */
function assignCategory(doc, styleValueTypeNames = new Set()) {
  const { id, kind } = doc;
  if (kind === 'type') {
    if (/Options$/.test(id)) return 'options';
    if (/Style$/.test(id)) return 'style';
    if (/Like$/.test(id)) return 'coordinates';
    // A type consumed by `*Style` properties is a style value type (e.g. Color).
    if (styleValueTypeNames.has(id)) return 'style';
    logger.warn(`unmatched typedef -> map (default): ${id}`);
    return 'map';
  }
  // class
  if (id === CORE_CLASS) return 'map';
  if (/Control$/.test(id)) return 'control';
  if (doc.methods.some((m) => /^convertTo/.test(m.name))) return 'coordinates';
  return 'overlay';
}

/**
 * Build a `name(p1, p2?, p3?=default) ⇒ ReturnType` signature string.
 * Pass `omitReturn` for constructors, which yield the instance and carry no `@return`.
 */
function buildSignature(m, omitReturn = false) {
  const params = (m.params || [])
    .map((p) => {
      let s = p.name;
      if (p.optional) s += '?';
      if (p.defaultvalue !== undefined) s += `=${p.defaultvalue}`;
      return s;
    })
    .join(', ');
  // A doclet with no `@return` means the method returns nothing. The Docma template the
  // official site renders from prints `void` in that case, so mirror it — omitting the
  // arrow entirely reads as "return type unknown" rather than "returns nothing".
  if (omitReturn) return `${m.name}(${params})`;

  const types =
    Array.isArray(m.returns) && m.returns.length && m.returns[0].type ? m.returns[0].type : [];
  return `${m.name}(${params}) ⇒ ${types.length ? types.join(' | ') : 'void'}`;
}

/**
 * Resolve a member's value type. The source splits accessors into a setter doclet (its
 * param carries the input type) and a getter doclet (`type`/`returns` carries the value
 * type); prefer the value type, then the matching param, so a member never falls back
 * to `any`.
 */
function memberType(m) {
  if (m.type) return m.type;
  if (Array.isArray(m.returns) && m.returns[0] && m.returns[0].type) return m.returns[0].type;
  const params = m.params || [];
  const named = params.find((p) => p.name === m.name) || params[0];
  return named ? named.type : undefined;
}

/** Parse the event-type list from an emitter's on() method eventType param description */
function extractEvents(methodDoclets) {
  const on = methodDoclets.find((m) => m.name === 'on');
  if (!on || !Array.isArray(on.params)) return [];
  const evtParam = on.params.find((p) => /event/i.test(p.name || ''));
  if (!evtParam || !evtParam.description) return [];
  const tokens = evtParam.description.match(/`([^`]+)`/g) || [];
  return tokens.map((t) => t.replace(/`/g, '').trim()).filter(Boolean);
}

/**
 * Drop duplicate doclets sharing a name (the source declares some both as instance `#`
 * and static `.`). Prefer the instance-scoped one.
 */
function dedupeByName(doclets) {
  const byName = new Map();
  doclets.forEach((d) => {
    const existing = byName.get(d.name);
    if (!existing || (d.scope === 'instance' && existing.scope !== 'instance')) {
      byName.set(d.name, d);
    }
  });
  return [...byName.values()];
}

/** Normalize a param (drop undefined fields) */
function cleanParam(p) {
  const out = { name: p.name, type: p.type, description: p.description || '' };
  if (p.optional) out.optional = true;
  if (p.defaultvalue !== undefined) out.default = p.defaultvalue;
  return out;
}

/**
 * Resolve JSDoc inline tags in description text: `{@link X}`, `{@link X|text}`,
 * `{@link X text}` → the display text (or the namepath). Also `{@tutorial X}` → X.
 * (JSDoc leaves these as raw macros; we render plain text.)
 */
function stripJsdocLinks(text) {
  return text
    .replace(/\{@link(?:code|plain)?\s+([^}]+)\}/g, (_, body) => {
      const b = body.trim();
      const pipe = b.indexOf('|');
      if (pipe !== -1) return b.slice(pipe + 1).trim();
      const sp = b.search(/\s/);
      return sp !== -1 ? b.slice(sp + 1).trim() : b;
    })
    .replace(/\{@tutorial\s+([^}]+)\}/g, '$1');
}

/** Recursively clean JSDoc inline tags in every `description` field of a doc. */
function sanitizeDescriptions(node) {
  if (Array.isArray(node)) {
    node.forEach(sanitizeDescriptions);
  } else if (node && typeof node === 'object') {
    Object.keys(node).forEach((k) => {
      if (k === 'description' && typeof node[k] === 'string') node[k] = stripJsdocLinks(node[k]);
      else sanitizeDescriptions(node[k]);
    });
  }
  return node;
}

/**
 * Collect the documented types a doc references as name -> docId, so the renderer can
 * link them (excluding the doc itself).
 */
function collectRelatedTypes(doc, documentedMap) {
  const refs = {};
  gatherReferencedNames(doc).forEach((n) => {
    if (documentedMap[n] && documentedMap[n] !== doc.id) refs[n] = documentedMap[n];
  });
  return refs;
}

/** Gather every referenced type name across a doc's params/properties/returns */
function gatherReferencedNames(doc) {
  const names = new Set();
  const scan = (list) =>
    (list || []).forEach((p) => (p.type || []).forEach((t) => extractTypeNames(t).forEach((n) => names.add(n))));
  scan(doc.params);
  scan(doc.properties);
  scan(doc.members);
  (doc.methods || []).forEach((m) => {
    scan(m.params);
    scan(m.returns);
  });
  if (doc.ctor) scan(doc.ctor.params);
  (doc.augments || []).forEach((n) => names.add(n));
  gatherLinkedNames(doc).forEach((n) => names.add(n));
  return names;
}

/**
 * Names referenced from `{@link X}` inside description text. The source puts some type
 * references in prose rather than in a type field (e.g. the `EventPayload` callback
 * payload), and this runs before descriptions are flattened, so the tags are still intact.
 */
function gatherLinkedNames(node, names = new Set()) {
  if (Array.isArray(node)) {
    node.forEach((n) => gatherLinkedNames(n, names));
  } else if (node && typeof node === 'object') {
    Object.keys(node).forEach((k) => {
      if (k === 'description' && typeof node[k] === 'string') {
        extractLinkTargets(node[k]).forEach((n) => names.add(n));
      } else {
        gatherLinkedNames(node[k], names);
      }
    });
  }
  return names;
}

/** Extract the namepath from `{@link X}` / `{@link X|text}` / `{@link X text}` tags */
function extractLinkTargets(text) {
  return (text.match(/\{@link(?:code|plain)?\s+([^}]+)\}/g) || [])
    .map((tag) => tag.replace(/^\{@link(?:code|plain)?\s+/, '').replace(/\}$/, ''))
    .map((body) => body.trim().split(/[|\s]/)[0])
    .filter(Boolean)
    .map((namepath) => namepath.split('.').pop());
}

/** Extract identifiers from a type string like `Array.<LngLatLike>` */
function extractTypeNames(typeStr) {
  return (typeStr.match(/[A-Za-z_][\w.]*/g) || []).map((s) => s.split('.').pop());
}

// Step 3: Build Indexes and Metadata

/** Build per-category summary indexes (id, category, kind, name, summary, method names) */
function buildIndexes(docs) {
  return CATEGORY_ORDER.map((category) => {
    const summaries = docs
      .filter((d) => d.category === category)
      .map((d) => ({
        id: d.id,
        category,
        kind: d.kind,
        name: d.name,
        summary: firstSentence(d.description),
        methods: (d.methods || []).map((m) => m.name),
      }));
    return { category, docs: summaries, totalCount: summaries.length };
  }).filter((index) => index.totalCount > 0);
}

/** Build the metadata object (version omitted when not detected) */
function buildMetadata(docs, categories, version) {
  const metadata = {
    generatedAt: new Date().toISOString(),
    sourceUrl: BASE_URL,
    totalDocs: docs.length,
    categories,
    categoryMeta: CATEGORY_META,
  };
  if (version) metadata.version = version;
  return metadata;
}

/** First sentence of a description (used as the list summary) */
function firstSentence(text) {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const m = cleaned.match(/^(.*?[.。])(\s|$)/);
  return (m ? m[1] : cleaned).slice(0, 160);
}

// Step 4: Write Output Files

/** Write per-symbol JSON, per-category indexes, and metadata */
function writeAllFiles(docs, indexes, metadata) {
  prepareDirectories(indexes.map((i) => i.category));
  writeDocFiles(docs);
  writeIndexFiles(indexes);
  writeJsonFile(path.join(OUTPUT_DIR, 'metadata.json'), metadata);
}

/** Reset the output tree and (re)create the per-category directories */
function prepareDirectories(categories) {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(INDEX_DIR, { recursive: true });
  categories.forEach((c) => fs.mkdirSync(path.join(OUTPUT_DIR, c), { recursive: true }));
}

/** Write each structured doc to {category}/{id}.json */
function writeDocFiles(docs) {
  docs.forEach((doc) => {
    writeJsonFile(path.join(OUTPUT_DIR, doc.category, sanitizeFilename(doc.id) + '.json'), doc);
  });
}

/** Write each category index to index/{category}-sdk-index.json */
function writeIndexFiles(indexes) {
  indexes.forEach((index) => {
    writeJsonFile(path.join(INDEX_DIR, `${index.category}-sdk-index.json`), index);
  });
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function sanitizeFilename(name) {
  return name
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1f#]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim()
    .substring(0, 120);
}

// Step 5: Generate Schema File

/**
 * Generate the list-sdk-docs input schema TS file (category enum + per-category
 * symbol inventory in the describe text). Formatted with the project prettier config
 * so it is written lint-clean.
 */
async function generateSchemaFile(indexes) {
  const enumValues = indexes.map((i) => `      '${i.category}',`).join('\n');
  const describeLines = indexes.map((index, i, arr) => {
    const isLast = i === arr.length - 1;
    const trailing = isLast ? '.' : ', ';
    const continuation = isLast ? ',' : ' +';
    return "        '" + buildCategoryDescription(index) + trailing + "'" + continuation;
  });

  const lines = [
    '/**',
    ' * @generated by scripts/update-sdk-docs.js — DO NOT EDIT',
    ' */',
    "import { z } from 'zod';",
    '',
    'export const listSdkDocsInputSchema = {',
    '  category: z',
    '    .enum([',
    enumValues,
    '    ])',
    '    .optional()',
    '    .describe(',
    "      'Optional category filter. Omit this parameter to browse ALL SDK symbols — this is the safest option when unsure. ' +",
    "        'Available categories: ' +",
    ...describeLines,
    '    ),',
    '};',
    '',
  ];

  const formatted = await prettier.format(lines.join('\n'), {
    ...(await prettier.resolveConfig(SCHEMA_OUTPUT_PATH)),
    parser: 'typescript',
  });
  fs.writeFileSync(SCHEMA_OUTPUT_PATH, formatted, 'utf-8');
}

/** Build a single category's describe fragment: label/guidance + symbol (short-name) inventory */
function buildCategoryDescription(index) {
  const meta = CATEGORY_META[index.category] || { label: index.category };
  const symbols = index.docs.map((d) => d.name);
  let desc = `${index.category} (${meta.label}: `;
  if (meta.guidance) desc += `${meta.guidance}. `;
  desc += `심볼: ${symbols.join(', ')})`;
  return desc;
}

// Main Pipeline

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await loadAndWait(page, BASE_URL);

    const version = await readVersion(page);
    const doclets = await extractDoclets(page);
    const docs = buildDocs(doclets);
    const indexes = buildIndexes(docs);
    const metadata = buildMetadata(
      docs,
      indexes.map((i) => i.category),
      version,
    );
    writeAllFiles(docs, indexes, metadata);
    await generateSchemaFile(indexes);

    logger.info(`Generated ${docs.length} SDK symbol docs in ${indexes.length} categories`);
  } catch (error) {
    logger.error(`Pipeline failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
