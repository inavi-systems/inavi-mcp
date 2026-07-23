/**
 * Fetches OpenAPI Specification and converts it to JSON files for MCP tools
 *
 * Pipeline:
 * 1. fetchOpenApiSpec    - Fetch OpenAPI spec from URL
 * 2. dereferenceSpec     - Dereference $ref to actual schemas
 * 3. extractOperations   - Extract and transform API operations
 * 4. buildOutputData     - Build output data structure
 * 5. writeAllFiles       - Write all JSON files
 * 6. generateSchemaFile  - Generate list-api-specs input schema TS file
 */

const $RefParser = require('@apidevtools/json-schema-ref-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');
const dotenv = require('dotenv');
const { logger } = require('./lib/logger');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const INAVI_DOMAIN = process.env.INAVI_DOMAIN || 'https://imaps.inavi.com';

// Configuration

const CONFIG = {
  sourceUrl: `${INAVI_DOMAIN}/v3/api-docs`,
  outputDir: path.join(__dirname, '../public/api-docs'),
  apiIndexDir: path.join(__dirname, '../public/api-docs/index'),
  apiInfoDir: path.join(__dirname, '../public/api-docs/information'),
  apiExampleDir: path.join(__dirname, '../public/api-docs/example'),
  maxRetries: 3,
  ignoredTags: ['WEB(JS)', 'StaticMap'],
  tagToCategory: {
    '장소/주소 검색': 'search-place',
    '지오코딩': 'search-geocoding',
    '공간 검색': 'search-spatial',
    'W3W': 'search-w3w',
    '탐색': 'route-directions',
    '최적화': 'route-optimization',
    '복원': 'route-map-matching',
    '매트릭스': 'route-matrix',
  },
  categoryMeta: {
    'search-place': {
      label: '장소/주소 검색',
      guidance: '키워드·상호명·전화번호 등으로 POI나 주소를 찾을 때 사용. 입력 기반 연관 검색어 제안, 좌표·반경 기반 카테고리별 주변 POI 조회, 도로 네트워크 기반 최적 진출입 지점 탐색도 포함. 좌표→주소 변환은 search-geocoding 사용',
    },
    'search-geocoding': {
      label: '지오코딩',
      guidance: '주소→좌표 또는 좌표→주소 변환이 목적일 때 사용. 키워드 기반 장소 검색은 search-place 사용',
    },
    'search-spatial': {
      label: '공간 검색',
      guidance: '행정구역 경계 폴리곤 조회, 좌표→행정구역 매핑, 좌표계 변환에 사용. 주소 텍스트 변환은 search-geocoding 사용',
    },
    'search-w3w': {
      label: 'what3words',
      guidance: '3단어 주소 체계(what3words) 전용. 일반 주소·좌표 변환은 search-geocoding 사용',
    },
    'route-directions': {
      label: '경로 탐색',
      guidance: '자동차·도보·PM 실제 경로 좌표와 상세 정보를 반환. 경유지 포함 경로(최대 100개), 출발·도착 예정시간 기반 예측 탐색, 경로 요약 조회가 필요하면 이 카테고리 사용',
    },
    'route-optimization': {
      label: '경유지 방문 순서 최적화',
      guidance: '경로 자체가 아닌 순서 최적화가 목적일 때만 사용',
    },
    'route-map-matching': {
      label: '복원',
      guidance: 'GPS 좌표열을 도로 네트워크에 보정하거나, 속도·각도·시간 등 부가 정보를 활용해 실제 주행 경로를 추론할 때 사용',
    },
    'route-matrix': {
      label: '매트릭스',
      guidance: '복수 출발지·도착지 간 거리·시간 요약 정보만 행렬로 반환(경로 좌표 없음). N:1, 1:N, M:N 조합 지원. 1:1 단일 경로나 실제 경로 좌표가 필요하면 route-directions 사용',
    },
  },
  schemaOutputPath: path.join(
    __dirname,
    '../src/tools/api-specs/schema/list-api-specs.input.schema.ts',
  ),
};

// Step 1: Fetch OpenAPI Spec

/** Fetch OpenAPI Spec from URL with retry logic */
async function fetchOpenApiSpec() {
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const data = await httpGet(CONFIG.sourceUrl);
      return JSON.parse(data);
    } catch (error) {
      if (attempt === CONFIG.maxRetries) {
        throw new Error(`Failed to fetch OpenAPI spec after ${CONFIG.maxRetries} attempts: ${error.message}`);
      }
      const delay = Math.pow(2, attempt - 1) * 1000;
      await sleep(delay);
    }
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      })
      .on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Step 2: Dereference Spec

/** Dereference $ref to actual schemas */
async function dereferenceSpec(spec) {
  try {
    return await $RefParser.dereference(spec);
  } catch (error) {
    throw new Error(`Failed to dereference OpenAPI spec: ${error.message}`);
  }
}

// Step 3: Extract Operations

/**
 * Extract and transform API operations
 * If both GET/POST exist, merge into POST with method "GET, POST"
 */
function extractOperations(spec) {
  const pathOperations = groupOperationsByPath(spec.paths || {});
  return mergeAndFilterOperations(pathOperations);
}

function groupOperationsByPath(paths) {
  return Object.entries(paths).reduce((result, [pathStr, pathItem]) => {
    result[pathStr] = extractHttpMethods(pathItem);
    return result;
  }, {});
}

function extractHttpMethods(pathItem) {
  const httpMethods = ['get', 'post', 'put', 'delete', 'patch'];
  return Object.entries(pathItem).reduce((methods, [method, operation]) => {
    if (httpMethods.includes(method.toLowerCase()) && operation.operationId) {
      methods[method.toLowerCase()] = operation;
    }
    return methods;
  }, {});
}

function mergeAndFilterOperations(pathOperations) {
  return Object.entries(pathOperations)
    .flatMap(([pathStr, methods]) => toOperations(pathStr, methods))
    .filter((op) => op !== null);
}

function toOperations(pathStr, methods) {
  const hasGet = 'get' in methods;
  const hasPost = 'post' in methods;

  if (hasGet && hasPost) {
    return [buildOperation(methods['post'], 'GET, POST', pathStr)];
  }

  // GET 또는 POST 중 하나만 있음
  const method = hasGet ? 'get' : 'post';
  return [buildOperation(methods[method], method.toUpperCase(), pathStr)];
}

function buildOperation(operation, method, pathStr) {
  const category = getCategoryFromTag(operation.tags?.[0]);
  if (!category) return null;

  const responses = operation.responses || {};

  return {
    operationId: operation.operationId,
    method,
    path: pathStr,
    category,
    tags: operation.tags || [],
    summary: operation.summary || '',
    description: operation.description || '',
    deprecated: operation.deprecated || false,
    parameters: operation.parameters || [],
    requestBody: operation.requestBody,
    responses: cleanResponses(responses),
    _responseExamples: extractResponseExamples(responses),
  };
}

/** Extract examples from all response status codes */
function extractResponseExamples(responses) {
  const examples = {};

  for (const [statusCode, response] of Object.entries(responses)) {
    const content = response?.content?.['application/json'];
    if (!content?.examples) continue;

    examples[statusCode] = content.examples;
  }

  return Object.keys(examples).length > 0 ? examples : null;
}

/** Remove schema.example and examples from responses (extracted separately) */
function cleanResponses(responses) {
  const cleaned = {};

  for (const [statusCode, response] of Object.entries(responses)) {
    cleaned[statusCode] = cleanResponse(response);
  }

  return cleaned;
}

function cleanResponse(response) {
  if (!response?.content?.['application/json']) {
    return response;
  }

  const result = { ...response };
  const appJson = { ...result.content['application/json'] };

  if (appJson.schema?.example !== undefined) {
    appJson.schema = { ...appJson.schema };
    delete appJson.schema.example;
  }

  delete appJson.examples;

  result.content = { ...result.content, 'application/json': appJson };
  return result;
}

function getCategoryFromTag(tag) {
  if (!tag || CONFIG.ignoredTags.includes(tag)) return null;
  return CONFIG.tagToCategory[tag] || null;
}

// Step 3.5: Transform Reference APIs (error codes, category codes)

const UNKNOWN_ERROR_MESSAGE = 'Unknown Error';
const ERROR_TABLE_HEADER = ['| resultCode | message |', '|-----------:|---------|'];

/**
 * Transform reference APIs (error codes, category codes) in place so they follow
 * the same list/get pattern as regular APIs: a brief `listDescription` is shown by
 * list_api_specs, while the full `description` (detail) is served by get_api_spec.
 * Reference docs are not callable endpoints, so their `path` is emptied.
 *
 * - Error codes: detail = cleaned table (Unknown Error rows dropped);
 *   summary = "{tag} 에러 코드"; list description = summary.
 * - Category codes: detail = original table (kept as-is);
 *   list description = "{tag}에서 사용되는 {summary}".
 *
 * Mutates operations. `listDescription` is consumed by toApiSummary and stripped
 * from the spec (detail) file by writeSpecFile.
 */
function transformReferenceApis(operations) {
  operations
    .filter((op) => isErrorCodeApi(op.operationId))
    .forEach((op) => {
      op.description = buildErrorTable(parseErrorTable(op.description));
      op.summary = `${op.tags?.[0] || ''} 에러 코드`;
      op.listDescription = op.summary;
      op.path = '';
    });

  operations
    .filter((op) => isCategoryCodeApi(op.operationId))
    .forEach((op) => {
      op.listDescription = `${op.tags?.[0] || ''}에서 사용되는 ${op.summary}`;
      op.path = '';
    });
}

/** Check if an operationId is an error-code reference API */
function isErrorCodeApi(operationId) {
  return operationId.endsWith('ErrorCodes');
}

/** Check if an operationId is the category-code reference API */
function isCategoryCodeApi(operationId) {
  return operationId === 'CategoryCodes';
}

/**
 * Parse a markdown error-code table into { code: message }.
 * Rows whose message is "Unknown Error" are dropped (they carry no information).
 */
function parseErrorTable(description) {
  return (description || '')
    .split('\n')
    .map((line) => line.match(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|$/))
    .filter((match) => match !== null && match[2] !== UNKNOWN_ERROR_MESSAGE)
    .reduce((map, [, code, message]) => {
      map[code] = message;
      return map;
    }, {});
}

/** Build a markdown error-code table string from { code: message } (sorted by code) */
function buildErrorTable(map) {
  const rows = Object.keys(map)
    .sort((a, b) => Number(a) - Number(b))
    .map((code) => `| ${code} | ${map[code]} |`);
  return [...ERROR_TABLE_HEADER, ...rows].join('\n');
}

// Step 4: Build Output Data

/** Build output data structure */
function buildOutputData(operations, spec) {
  const categories = [...new Set(operations.map((op) => op.category))];
  const baseUrl = spec.servers?.[0]?.url || INAVI_DOMAIN;

  return {
    categories,
    indexes: buildIndexes(operations, categories),
    specs: buildSpecs(operations, baseUrl),
    metadata: buildMetadata(spec, operations.length, categories),
  };
}

function buildIndexes(operations, categories) {
  return categories.reduce((indexes, category) => {
    indexes[category] = toCategoryIndex(operations, category);
    return indexes;
  }, {});
}

function toCategoryIndex(operations, category) {
  const categoryOps = operations.filter((op) => op.category === category);
  return {
    category,
    apis: categoryOps.map(toApiSummary),
    totalCount: categoryOps.length,
  };
}

function toApiSummary(op) {
  return {
    operationId: op.operationId,
    method: op.method,
    path: op.path,
    category: op.category,
    tags: op.tags,
    summary: op.summary,
    // Reference APIs expose a brief listDescription; regular APIs use their full description.
    description: op.listDescription ?? op.description,
    deprecated: op.deprecated,
  };
}

function buildSpecs(operations, baseUrl) {
  return operations.map((op) => toApiSpec(op, baseUrl));
}

function toApiSpec(operation, baseUrl) {
  return { ...operation, baseUrl };
}

function buildMetadata(spec, totalApis, categories) {
  return {
    generatedAt: new Date().toISOString(),
    sourceUrl: CONFIG.sourceUrl,
    openapiVersion: spec.openapi || 'unknown',
    apiVersion: spec.info?.version || 'unknown',
    totalApis,
    categories,
    tagMapping: CONFIG.tagToCategory,
    ignoredTags: CONFIG.ignoredTags,
  };
}

// Step 5: Write All Files

/**
 * Safe file operation wrapper with error handling
 * @param {Function} operation - File operation to execute
 * @param {string} context - Context description for error logging
 * @returns {*} Result of the operation
 * @throws {Error} Re-throws the error after logging
 */
function safeFileOperation(operation, context) {
  try {
    return operation();
  } catch (error) {
    logger.error(`Failed to ${context}: ${error.message}`);
    throw error;
  }
}

/** Write all output files */
function writeAllFiles(originalSpec, outputData) {
  const { categories, indexes, specs, metadata } = outputData;

  safeFileOperation(() => prepareDirectories(categories), 'prepare directories');

  safeFileOperation(
    () => writeJsonFile(path.join(CONFIG.outputDir, 'oas.json'), originalSpec),
    'write oas.json'
  );

  safeFileOperation(
    () => writeJsonFile(path.join(CONFIG.outputDir, 'metadata.json'), metadata),
    'write metadata.json'
  );

  Object.entries(indexes).forEach(([category, index]) =>
    safeFileOperation(
      () => writeIndexFile(category, index),
      `write index for category: ${category}`
    )
  );

  specs.forEach((spec) =>
    safeFileOperation(
      () => writeSpecFile(spec),
      `write spec for operation: ${spec.operationId}`
    )
  );

  specs.forEach((spec) =>
    safeFileOperation(
      () => writeExampleFile(spec),
      `write example for operation: ${spec.operationId}`
    )
  );
}

function writeIndexFile(category, index) {
  const filePath = path.join(CONFIG.apiIndexDir, `${category}-api-index.json`);
  writeJsonFile(filePath, index);
}

function writeSpecFile(spec) {
  const { _responseExamples, listDescription, ...specWithoutExamples } = spec;
  const filePath = path.join(CONFIG.apiInfoDir, spec.category, `${spec.operationId}.json`);
  writeJsonFile(filePath, removeCircularRefs(specWithoutExamples));
}

function writeExampleFile(spec) {
  if (!spec._responseExamples) return;

  const filePath = path.join(
    CONFIG.apiExampleDir,
    spec.category,
    `${spec.operationId}-response-example.json`
  );
  writeJsonFile(filePath, removeCircularRefs(spec._responseExamples));
}

function prepareDirectories(categories) {
  [CONFIG.apiIndexDir, CONFIG.apiInfoDir, CONFIG.apiExampleDir].forEach((dir) => {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  });

  [CONFIG.outputDir, CONFIG.apiIndexDir, CONFIG.apiInfoDir, CONFIG.apiExampleDir].forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
  categories.forEach(createCategoryDirectory);
}

function createCategoryDirectory(category) {
  fs.mkdirSync(path.join(CONFIG.apiInfoDir, category), { recursive: true });
  fs.mkdirSync(path.join(CONFIG.apiExampleDir, category), { recursive: true });
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function removeCircularRefs(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return '[Circular Reference]';
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => removeCircularRefs(item, seen));
  }

  return Object.entries(obj).reduce((result, [key, value]) => {
    result[key] = removeCircularRefs(value, seen);
    return result;
  }, {});
}

// Step 6: Generate Schema File

/** Check if an operationId is a reference-only API (error codes, category codes) */
function isReferenceApi(operationId) {
  return operationId === 'CategoryCodes' || operationId.endsWith('ErrorCodes');
}

/** Build describe string fragment for a single category */
function buildCategoryDescription(category, apis) {
  const meta = CONFIG.categoryMeta[category] || { label: category };
  const summaries = apis
    .filter((api) => !isReferenceApi(api.operationId))
    .map((api) => api.summary);

  let desc = `${category} (${meta.label}: `;
  if (meta.guidance) {
    desc += `${meta.guidance}. `;
  }
  desc += `API 목록: ${summaries.join(', ')})`;
  return desc;
}

/** Generate the list-api-specs input schema TypeScript file */
function generateSchemaFile(indexes) {
  const categories = Object.keys(indexes);
  const enumValues = categories.map((c) => `      '${c}',`).join('\n');

  const descriptions = categories.map((category) => {
    const index = indexes[category];
    return buildCategoryDescription(category, index.apis);
  });

  const describeLines = descriptions.map((desc, i, arr) => {
    const isLast = i === arr.length - 1;
    const trailing = isLast ? '.' : ', ';
    const continuation = isLast ? ',' : ' +';
    return "        '" + desc + trailing + "'" + continuation;
  });

  const lines = [
    '/**',
    ' * @generated by scripts/update-api-docs.js — DO NOT EDIT',
    ' */',
    "import { z } from 'zod';",
    '',
    'export const listApiSpecsInputSchema = {',
    '  category: z',
    '    .enum([',
    enumValues,
    '    ])',
    '    .optional()',
    '    .describe(',
    "      'Optional category filter. Omit this parameter to search across ALL categories — this is the safest option when unsure. ' +",
    "        'Available categories: ' +",
    ...describeLines,
    '    ),',
    '};',
    '',
  ];

  const content = lines.join('\n');

  fs.writeFileSync(CONFIG.schemaOutputPath, content, 'utf-8');

  fs.writeFileSync(CONFIG.schemaOutputPath, content, 'utf-8');
}

// Main Pipeline

async function main() {
  try {
    const spec = await fetchOpenApiSpec();
    const originalSpec = structuredClone(spec);
    const dereferenced = await dereferenceSpec(spec);
    const operations = extractOperations(dereferenced);
    transformReferenceApis(operations);
    const outputData = buildOutputData(operations, dereferenced);
    writeAllFiles(originalSpec, outputData);
    generateSchemaFile(outputData.indexes);

    logger.info(`Generated ${outputData.metadata.totalApis} APIs in ${outputData.categories.length} categories`);
    process.exit(0);
  } catch (error) {
    logger.error(`Pipeline failed: ${error.message}`);
    process.exit(1);
  }
}

main();
