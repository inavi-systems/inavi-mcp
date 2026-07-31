/**
 * SDK Doc 파일 읽기 유틸리티
 * public/sdk-docs/ 의 구조화 JSON을 읽고, 마크다운으로 렌더한다.
 */

import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { SdkDoc, SdkDocIndex, SdkDocMetadata, SdkDocSummary } from '../types/sdk-doc.types';
import { renderDocMarkdown, renderMethodMarkdown } from './sdk-doc-renderer';

// 프로젝트 루트 경로 (dist/tools/sdk-docs/utils -> 프로젝트 루트)
const projectRoot = resolve(__dirname, '../../../..');
const sdkDocsDir = join(projectRoot, 'public/sdk-docs');
const sdkIndexDir = join(sdkDocsDir, 'index');

/** get_sdk_doc 반환 형태 (마크다운만) */
export interface SdkDocResult {
  id: string;
  content: string;
}

/**
 * 메타데이터 파일 읽기
 */
export async function readMetadata(): Promise<SdkDocMetadata> {
  const content = await readFile(join(sdkDocsDir, 'metadata.json'), 'utf-8');
  return JSON.parse(content) as SdkDocMetadata;
}

/**
 * SDK 문서 인덱스 읽기
 * @param category - 카테고리 (예: 'overlay'). undefined면 전체 병합
 */
export async function readSdkIndex(category?: string): Promise<SdkDocIndex> {
  if (category) {
    return readIndexFile(category);
  }

  const { categories } = await readMetadata();
  const indexes = await Promise.all(categories.map((cat) => readIndexFile(cat)));
  const docs: SdkDocSummary[] = indexes.flatMap((index) => index.docs);
  return { docs, totalCount: docs.length, categories };
}

/**
 * 특정 SDK 문서 조회 후 마크다운 + 구조화 데이터 반환
 * @param docId - 클래스/타입 id(예: "inavi.maps.Map", "MapOptions") 또는
 *                메서드 longname(예: "inavi.maps.Map#fitBounds")
 */
export async function readSdkDoc(docId: string): Promise<SdkDocResult> {
  const hashIndex = docId.indexOf('#');

  if (hashIndex !== -1) {
    const classId = docId.slice(0, hashIndex);
    const methodName = docId.slice(hashIndex + 1);
    const classDoc = await loadDocById(classId);
    const method = (classDoc.methods || []).find((m) => m.name === methodName);
    if (!method) {
      throw new Error(`SDK method not found: ${docId}`);
    }
    return { id: docId, content: renderMethodMarkdown(classDoc, method) };
  }

  const doc = await loadDocById(docId);
  return { id: docId, content: renderDocMarkdown(doc) };
}

/**
 * 카테고리 인덱스 파일 하나 읽기
 */
async function readIndexFile(category: string): Promise<SdkDocIndex> {
  const content = await readFile(join(sdkIndexDir, `${category}-sdk-index.json`), 'utf-8');
  return JSON.parse(content) as SdkDocIndex;
}

/**
 * id로 구조화 문서 JSON 로드. 카테고리를 모르므로 모든 카테고리 디렉토리에서 탐색.
 */
async function loadDocById(docId: string): Promise<SdkDoc> {
  const { categories } = await readMetadata();
  const filename = sanitizeFilename(docId) + '.json';

  for (const category of categories) {
    try {
      const content = await readFile(join(sdkDocsDir, category, filename), 'utf-8');
      return JSON.parse(content) as SdkDoc;
    } catch {
      // 이 카테고리에 없으면 다음 시도
    }
  }
  throw new Error(`SDK doc not found: ${docId}`);
}

/**
 * scripts/update-sdk-docs.js의 sanitizeFilename과 동일한 규칙
 */
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
