import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { SdkDoc, SdkDocIndex, SdkDocMetadata } from '@/tools/sdk-docs/types/sdk-doc.types';

const OUTPUT_DIR = path.resolve(__dirname, '../../public/sdk-docs');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');
const INDEX_DIR = path.join(OUTPUT_DIR, 'index');
const SCHEMA_FILE = path.resolve(
  __dirname,
  '../../src/tools/sdk-docs/schema/list-sdk-docs.input.schema.ts',
);

// 파이프라인이 유도하는 카테고리 집합(계약). 새 카테고리가 생기면 여기도 갱신되어야 한다.
const ALLOWED_CATEGORIES = ['map', 'overlay', 'control', 'coordinates', 'options', 'style'];

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

/** sanitizeFilename (scripts/update-sdk-docs.js와 동일 규칙) */
function sanitizeFilename(name: string): string {
  return (
    name
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1f#]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim()
      .substring(0, 120)
  );
}

let metadata: SdkDocMetadata;
let indexes: Record<string, SdkDocIndex>;
let allDocs: SdkDoc[];

describe('validate-sdk-docs', () => {
  beforeAll(() => {
    if (!fs.existsSync(METADATA_FILE)) {
      throw new Error(
        `metadata.json not found. Run "npm run update-sdk-docs" first to generate SDK docs.`,
      );
    }
    metadata = readJson<SdkDocMetadata>(METADATA_FILE);
    indexes = {};
    allDocs = [];
    metadata.categories.forEach((cat) => {
      const index = readJson<SdkDocIndex>(path.join(INDEX_DIR, `${cat}-sdk-index.json`));
      indexes[cat] = index;
      index.docs.forEach((summary) => {
        allDocs.push(readJson<SdkDoc>(path.join(OUTPUT_DIR, cat, sanitizeFilename(summary.id) + '.json')));
      });
    });
  });

  describe('metadata', () => {
    it('categories are all within the allowed set', () => {
      metadata.categories.forEach((cat) => expect(ALLOWED_CATEGORIES).toContain(cat));
    });

    it('totalDocs equals the sum of category index counts', () => {
      const sum = metadata.categories.reduce((n, cat) => n + indexes[cat].totalCount, 0);
      expect(metadata.totalDocs).toBe(sum);
    });

    it('every category has categoryMeta with label and guidance', () => {
      metadata.categories.forEach((cat) => {
        expect(metadata.categoryMeta[cat]).toBeDefined();
        expect(metadata.categoryMeta[cat].label).toBeTruthy();
        expect(metadata.categoryMeta[cat].guidance).toBeTruthy();
      });
    });
  });

  describe('index ↔ doc file integrity', () => {
    it('every index summary resolves to a doc file in the same category', () => {
      metadata.categories.forEach((cat) => {
        indexes[cat].docs.forEach((summary) => {
          const file = path.join(OUTPUT_DIR, cat, sanitizeFilename(summary.id) + '.json');
          expect(fs.existsSync(file), `${file} missing`).toBe(true);
          const doc = readJson<SdkDoc>(file);
          expect(doc.category).toBe(cat);
          expect(doc.id).toBe(summary.id);
        });
      });
    });

    it('index index.totalCount matches its docs length', () => {
      metadata.categories.forEach((cat) => {
        expect(indexes[cat].totalCount).toBe(indexes[cat].docs.length);
      });
    });
  });

  describe('doc structure', () => {
    it('every doc has required fields and a valid kind/category', () => {
      allDocs.forEach((doc) => {
        expect(doc.id).toBeTruthy();
        expect(doc.name).toBeTruthy();
        expect(['class', 'type']).toContain(doc.kind);
        expect(ALLOWED_CATEGORIES).toContain(doc.category);
      });
    });

    it('class docs have no duplicate method names (dedupe held)', () => {
      allDocs
        .filter((d) => d.kind === 'class')
        .forEach((doc) => {
          const names = (doc.methods || []).map((m) => m.name);
          expect(new Set(names).size, `${doc.id} has duplicate methods`).toBe(names.length);
        });
    });

    it('index method names match the doc method names for classes', () => {
      metadata.categories.forEach((cat) => {
        indexes[cat].docs
          .filter((s) => s.kind === 'class')
          .forEach((summary) => {
            const doc = readJson<SdkDoc>(
              path.join(OUTPUT_DIR, cat, sanitizeFilename(summary.id) + '.json'),
            );
            const docNames = (doc.methods || []).map((m) => m.name).sort();
            expect([...summary.methods].sort()).toEqual(docNames);
          });
      });
    });

    it('no leftover markdown or flat index.json artifacts remain', () => {
      const rootFiles = fs.readdirSync(OUTPUT_DIR);
      expect(rootFiles).not.toContain('index.json');
      expect(rootFiles.some((f) => f.endsWith('.md'))).toBe(false);
    });
  });

  describe('generated input schema', () => {
    it('enum values exactly match metadata.categories', () => {
      const src = fs.readFileSync(SCHEMA_FILE, 'utf-8');
      const enumBlock = src.slice(src.indexOf('.enum(['), src.indexOf('])'));
      const enumValues = [...enumBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]);
      expect(enumValues).toEqual(metadata.categories);
    });
  });
});
