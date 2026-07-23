import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { ApiSpecSummary, ApiIndex, Metadata } from '@/tools/api-specs/types/api-spec.types';

const OUTPUT_DIR = path.resolve(__dirname, '../../public/api-docs');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');
const API_INDEX_DIR = path.join(OUTPUT_DIR, 'index');
const API_INFO_DIR = path.join(OUTPUT_DIR, 'information');
const API_EXAMPLE_DIR = path.join(OUTPUT_DIR, 'example');
const SCHEMA_FILE = path.resolve(
  __dirname,
  '../../src/tools/api-specs/schema/list-api-specs.input.schema.ts',
);

/** Category index with required category field (individual index files always have it) */
interface CategoryIndex extends Omit<ApiIndex, 'category'> {
  category: string;
  apis: ApiSpecSummary[];
}

let metadata: Metadata;
let categories: string[];
const indexes: Record<string, CategoryIndex> = {};

function readJson<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/** Reference documents (error codes, category codes) are not callable endpoints */
function isReferenceApi(operationId: string): boolean {
  return operationId.endsWith('ErrorCodes') || operationId === 'CategoryCodes';
}

describe('validate-api-docs', () => {
  beforeAll(() => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      throw new Error(
        `Output directory not found: ${OUTPUT_DIR}\nRun "npm run update-api-docs" first to generate API docs.`,
      );
    }

    metadata = readJson<Metadata>(METADATA_FILE);
    categories = metadata.categories;

    for (const category of categories) {
      const indexFile = path.join(API_INDEX_DIR, `${category}-api-index.json`);
      if (fs.existsSync(indexFile)) {
        indexes[category] = readJson<CategoryIndex>(indexFile);
      }
    }
  });

  describe('Step 0: oas.json', () => {
    it('should exist and be valid JSON', () => {
      const oasFile = path.join(OUTPUT_DIR, 'oas.json');
      expect(fs.existsSync(oasFile), 'oas.json not found').toBe(true);

      const oas = readJson<Record<string, unknown>>(oasFile);
      expect(typeof oas, 'oas.json should be an object').toBe('object');
      expect(Array.isArray(oas), 'oas.json should not be an array').toBe(false);
    });

    it('should have required OpenAPI fields', () => {
      const oas = readJson<Record<string, unknown>>(path.join(OUTPUT_DIR, 'oas.json'));

      expect(oas.openapi, '"openapi" field is missing').toBeTruthy();
      expect(oas.info, '"info" field is missing').toBeDefined();
      expect(oas.paths, '"paths" field is missing').toBeDefined();
    });
  });

  describe('Step 1: metadata.json', () => {
    it('should have all required fields', () => {
      const requiredFields: (keyof Metadata)[] = [
        'generatedAt',
        'sourceUrl',
        'openapiVersion',
        'totalApis',
        'categories',
        'tagMapping',
        'ignoredTags',
      ];

      for (const field of requiredFields) {
        expect(metadata[field], `"${field}" field is missing`).toBeDefined();
      }
    });

    it('should have categories as an array', () => {
      expect(Array.isArray(metadata.categories)).toBe(true);
    });

    it('should have tagMapping as an object', () => {
      expect(typeof metadata.tagMapping, '"tagMapping" should be an object').toBe('object');
      expect(Array.isArray(metadata.tagMapping), '"tagMapping" should not be an array').toBe(false);
    });

    it('should have ignoredTags as an array', () => {
      expect(Array.isArray(metadata.ignoredTags), '"ignoredTags" should be an array').toBe(true);
    });
  });

  describe('Step 2: category indexes', () => {
    it('should have parseable index files for every category', () => {
      for (const category of categories) {
        const indexFile = path.join(API_INDEX_DIR, `${category}-api-index.json`);
        expect(fs.existsSync(indexFile), `${category}-api-index.json not found`).toBe(true);
        expect(indexes[category], `${category}-api-index.json failed to parse`).toBeDefined();
      }
    });

    it('should have valid structure (apis array, totalCount, matching category)', () => {
      for (const category of categories) {
        const index = indexes[category];
        if (!index) continue;

        const name = `${category}-api-index.json`;

        expect(Array.isArray(index.apis), `${name}: "apis" should be an array`).toBe(true);
        expect(typeof index.totalCount, `${name}: "totalCount" should be a number`).toBe('number');
        expect(index.category, `${name}: "category" should be "${category}"`).toBe(category);
        expect(
          index.apis.length,
          `${name}: totalCount (${index.totalCount}) does not match apis length (${index.apis.length})`,
        ).toBe(index.totalCount);
      }
    });

    it('should have valid API entries with no duplicate operationIds', () => {
      for (const category of categories) {
        const index = indexes[category];
        if (!index?.apis) continue;

        const name = `${category}-api-index.json`;
        const operationIds = new Set<string>();

        index.apis.forEach((api, i) => {
          expect(api.operationId, `${name}: apis[${i}] is missing operationId`).toBeTruthy();
          expect(api.method, `${name}: apis[${i}] (${api.operationId}) is missing method`).toBeTruthy();
          // Reference docs carry an empty path (not callable); regular APIs must have one.
          expect(
            typeof api.path === 'string',
            `${name}: apis[${i}] (${api.operationId}) path should be a string`,
          ).toBe(true);
          if (!isReferenceApi(api.operationId)) {
            expect(api.path, `${name}: apis[${i}] (${api.operationId}) is missing path`).toBeTruthy();
          }
          expect(
            api.category,
            `${name}: apis[${i}] (${api.operationId}) has incorrect category "${api.category}"`,
          ).toBe(category);

          expect(
            Array.isArray(api.tags),
            `${name}: apis[${i}] (${api.operationId}) "tags" should be an array`,
          ).toBe(true);
          expect(api.summary, `${name}: apis[${i}] (${api.operationId}) is missing summary`).toBeTruthy();
          expect(
            api.description,
            `${name}: apis[${i}] (${api.operationId}) is missing description`,
          ).toBeTruthy();

          expect(
            operationIds.has(api.operationId),
            `${name}: Duplicate operationId "${api.operationId}"`,
          ).toBe(false);
          operationIds.add(api.operationId);
        });
      }
    });
  });

  describe('Step 3: API specs', () => {
    it('should have a spec file for every API in each index', () => {
      for (const category of categories) {
        const index = indexes[category];
        if (!index?.apis) continue;

        const categoryDir = path.join(API_INFO_DIR, category);

        for (const api of index.apis) {
          const specPath = path.join(categoryDir, `${api.operationId}.json`);
          expect(
            fs.existsSync(specPath),
            `Missing ${category} API spec file: ${api.operationId}.json`,
          ).toBe(true);
        }
      }
    });

    it('should have valid required fields in each spec', () => {
      for (const category of categories) {
        const index = indexes[category];
        if (!index?.apis) continue;

        const categoryDir = path.join(API_INFO_DIR, category);

        for (const api of index.apis) {
          const specPath = path.join(categoryDir, `${api.operationId}.json`);
          if (!fs.existsSync(specPath)) continue;

          const spec = readJson<Record<string, unknown>>(specPath);
          const fileName = `${api.operationId}.json`;

          expect(spec.operationId, `${fileName}: operationId mismatch`).toBe(api.operationId);
          expect(spec.method, `${fileName}: "method" field is missing`).toBeTruthy();
          // Reference docs carry an empty path (not callable); regular APIs must have one.
          expect(typeof spec.path === 'string', `${fileName}: "path" should be a string`).toBe(true);
          if (!isReferenceApi(api.operationId)) {
            expect(spec.path, `${fileName}: "path" field is missing`).toBeTruthy();
          }
          expect(spec.category, `${fileName}: category should be "${category}"`).toBe(category);
          expect(spec.responses, `${fileName}: "responses" field is missing`).toBeDefined();

          if (!spec.baseUrl) {
            console.warn(`${fileName}: "baseUrl" field is missing`);
          }

          // Check for residual examples that should have been extracted
          if (spec.responses && typeof spec.responses === 'object') {
            for (const [statusCode, response] of Object.entries(
              spec.responses as Record<string, Record<string, unknown>>,
            )) {
              const appJson = (response?.content as Record<string, Record<string, unknown>>)?.[
                'application/json'
              ];
              if (!appJson) continue;

              if ((appJson.schema as Record<string, unknown>)?.example !== undefined) {
                console.warn(
                  `${fileName}: responses.${statusCode} still contains schema.example (should be extracted)`,
                );
              }
              if (appJson.examples) {
                console.warn(
                  `${fileName}: responses.${statusCode} still contains examples (should be extracted)`,
                );
              }
            }
          }
        }
      }
    });

    it('should have no orphaned spec files', () => {
      for (const category of categories) {
        const index = indexes[category];
        if (!index?.apis) continue;

        const categoryDir = path.join(API_INFO_DIR, category);
        if (!fs.existsSync(categoryDir)) continue;

        const expectedFiles = new Set(index.apis.map((api) => `${api.operationId}.json`));
        const actualFiles = fs.readdirSync(categoryDir).filter((f) => f.endsWith('.json'));

        for (const file of actualFiles) {
          if (!expectedFiles.has(file)) {
            console.warn(`Orphaned file in ${category}/: ${file} (not in index)`);
          }
        }
      }
    });
  });

  describe('Step 4: API examples', () => {
    it('should have valid object format if example file exists', () => {
      for (const category of categories) {
        const index = indexes[category];
        if (!index?.apis) continue;

        const categoryDir = path.join(API_EXAMPLE_DIR, category);

        for (const api of index.apis) {
          const examplePath = path.join(categoryDir, `${api.operationId}-response-example.json`);
          if (!fs.existsSync(examplePath)) continue;

          const example = readJson<unknown>(examplePath);

          if (typeof example !== 'object' || Array.isArray(example)) {
            console.warn(
              `${api.operationId}-response-example.json: expected object with status code keys`,
            );
          }
        }
      }
    });
  });

  describe('Step 5: orphaned directories', () => {
    it('should have no directories outside metadata categories', () => {
      const categorySet = new Set(categories);

      if (fs.existsSync(API_INFO_DIR)) {
        const infoDirs = fs
          .readdirSync(API_INFO_DIR, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);

        for (const dir of infoDirs) {
          if (!categorySet.has(dir)) {
            console.warn(`Orphaned directory in information/: ${dir} (not in metadata categories)`);
          }
        }
      }

      if (fs.existsSync(API_EXAMPLE_DIR)) {
        const exampleDirs = fs
          .readdirSync(API_EXAMPLE_DIR, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);

        for (const dir of exampleDirs) {
          if (!categorySet.has(dir)) {
            console.warn(`Orphaned directory in example/: ${dir} (not in metadata categories)`);
          }
        }
      }
    });
  });

  describe('Step 6: schema file sync', () => {
    let schemaContent: string;

    beforeAll(() => {
      schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');
    });

    it('should have enum values matching metadata categories', () => {
      for (const category of categories) {
        expect(
          schemaContent.includes(`'${category}'`),
          `Schema file is missing enum value: '${category}'`,
        ).toBe(true);
      }
    });

    it('should have no extra enum values beyond metadata categories', () => {
      const enumMatch = schemaContent.match(/\.enum\(\[([\s\S]*?)\]\)/);
      expect(enumMatch, 'Could not find .enum([...]) in schema file').toBeTruthy();

      const enumBlock = enumMatch![1];
      const enumValues = [...enumBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]);
      const categorySet = new Set(categories);

      for (const value of enumValues) {
        expect(categorySet.has(value), `Schema file has extra enum value: '${value}'`).toBe(true);
      }
    });

    it('should include API summaries in describe string (excluding reference APIs)', () => {
      for (const category of categories) {
        const index = indexes[category];
        if (!index?.apis) continue;

        const nonRefApis = index.apis.filter(
          (api) => api.operationId !== 'CategoryCodes' && !api.operationId.endsWith('ErrorCodes'),
        );

        for (const api of nonRefApis) {
          expect(
            schemaContent.includes(api.summary),
            `Schema describe is missing summary "${api.summary}" from ${category}/${api.operationId}`,
          ).toBe(true);
        }
      }
    });

    it('should not include reference API summaries in describe string', () => {
      for (const category of categories) {
        const index = indexes[category];
        if (!index?.apis) continue;

        const refApis = index.apis.filter(
          (api) => api.operationId === 'CategoryCodes' || api.operationId.endsWith('ErrorCodes'),
        );

        for (const api of refApis) {
          // "에러 코드" and "카테고리 코드" should not appear as standalone API summaries
          // But they could appear as substring in other summaries, so check the category block
          const categoryBlock = schemaContent.match(
            new RegExp(`${category} \\([^)]+\\)`),
          );
          if (!categoryBlock) continue;

          const summariesInBlock = categoryBlock[0];
          // The reference API summary should not be listed in this category's block
          expect(
            summariesInBlock.includes(api.summary),
            `Schema describe should not include reference API summary "${api.summary}" from ${category}/${api.operationId}`,
          ).toBe(false);
        }
      }
    });
  });

  describe('Step 7: total count', () => {
    it('should match metadata.totalApis with sum of all category totalCounts', () => {
      const totalApiCount = Object.values(indexes)
        .filter((index) => index !== null && index !== undefined)
        .reduce((sum, index) => sum + index.totalCount, 0);

      expect(
        metadata.totalApis,
        `metadata.totalApis (${metadata.totalApis}) does not match sum of all categories (${totalApiCount})`,
      ).toBe(totalApiCount);
    });
  });

  describe('Step 8: reference API list/detail pattern', () => {
    /** All reference-API index entries with their owning category */
    function referenceEntries(): { category: string; api: ApiSpecSummary }[] {
      return Object.entries(indexes).flatMap(([category, index]) =>
        (index?.apis ?? [])
          .filter((api) => isReferenceApi(api.operationId))
          .map((api) => ({ category, api })),
      );
    }

    it('should list reference APIs with a brief (non-table) description', () => {
      for (const { category, api } of referenceEntries()) {
        expect(
          api.description.includes('|'),
          `${category}/${api.operationId}: list description should be brief, not a full table`,
        ).toBe(false);
      }
    });

    it('should label error-code APIs as "{tag} 에러 코드" with matching list description', () => {
      for (const { category, api } of referenceEntries()) {
        if (!api.operationId.endsWith('ErrorCodes')) continue;
        expect(
          api.summary.endsWith('에러 코드'),
          `${category}/${api.operationId}: summary "${api.summary}" should end with "에러 코드"`,
        ).toBe(true);
        expect(
          api.description,
          `${category}/${api.operationId}: list description should equal summary`,
        ).toBe(api.summary);
      }
    });

    it('should describe CategoryCodes in list as "...에서 사용되는..."', () => {
      for (const { category, api } of referenceEntries()) {
        if (api.operationId !== 'CategoryCodes') continue;
        expect(
          api.description.includes('에서 사용되는'),
          `${category}/CategoryCodes: unexpected list description "${api.description}"`,
        ).toBe(true);
      }
    });

    it('should serve full, Unknown-Error-free tables via get_api_spec detail files', () => {
      for (const { category, api } of referenceEntries()) {
        const specPath = path.join(API_INFO_DIR, category, `${api.operationId}.json`);
        expect(
          fs.existsSync(specPath),
          `Missing detail file: ${category}/${api.operationId}.json`,
        ).toBe(true);

        const spec = readJson<{ description?: string }>(specPath);
        const detail = spec.description ?? '';

        expect(
          detail.includes('|'),
          `${category}/${api.operationId}: detail should contain the full table`,
        ).toBe(true);

        if (api.operationId.endsWith('ErrorCodes')) {
          expect(
            detail.includes('Unknown Error'),
            `${category}/${api.operationId}: detail still contains Unknown Error rows`,
          ).toBe(false);
        }
      }
    });
  });
});
