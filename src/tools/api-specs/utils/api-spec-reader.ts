/**
 * API Spec 파일 읽기 유틸리티
 * public/api-docs/ 디렉토리의 JSON 파일들을 읽어오는 함수들
 */

import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { ApiIndex, ApiSpecDetail, ApiSpecSummary, Metadata } from '../types/api-spec.types';

// 프로젝트 루트 경로 (dist/tools/api-specs/utils -> 프로젝트 루트)
const projectRoot = resolve(__dirname, '../../../..');
const apiDocsDir = join(projectRoot, 'public/api-docs');
const apiIndexDir = join(apiDocsDir, 'index');
const apiInfoDir = join(apiDocsDir, 'information');

/**
 * 메타데이터 파일 읽기
 */
export async function readMetadata(): Promise<Metadata> {
  const metadataPath = join(apiDocsDir, 'metadata.json');
  const content = await readFile(metadataPath, 'utf-8');
  return JSON.parse(content) as Metadata;
}

/**
 * 사용 가능한 카테고리 목록 가져오기
 */
export async function getAvailableCategories(): Promise<string[]> {
  const metadata = await readMetadata();
  return metadata.categories;
}

/**
 * API 인덱스 파일 읽기
 * @param category - 카테고리 (예: 'search-place', 'route-directions'). undefined면 전체 조회
 */
export async function readApiIndex(category?: string): Promise<ApiIndex> {
  // category가 지정된 경우 해당 인덱스 파일만 읽기
  if (category) {
    const indexPath = join(apiIndexDir, `${category}-api-index.json`);
    const content = await readFile(indexPath, 'utf-8');
    return JSON.parse(content) as ApiIndex;
  }

  // category가 없으면 메타데이터에서 모든 카테고리 목록 가져와서 병합
  const metadata = await readMetadata();
  const categories = metadata.categories;

  const indexPromises = categories.map(async (cat) => {
    const indexPath = join(apiIndexDir, `${cat}-api-index.json`);
    const content = await readFile(indexPath, 'utf-8');
    return JSON.parse(content) as ApiIndex;
  });

  const indexes = await Promise.all(indexPromises);

  // 모든 인덱스 병합
  const allApis: ApiSpecSummary[] = [];
  let totalCount = 0;

  for (const index of indexes) {
    allApis.push(...index.apis);
    totalCount += index.totalCount;
  }

  return {
    apis: allApis,
    totalCount,
    categories,
  };
}

/**
 * 특정 API 스펙 파일 읽기
 * @param operationId - API의 operationId
 * @param category - 카테고리 (예: 'search-place'). 지정하지 않으면 모든 카테고리에서 검색
 */
export async function readApiSpec(operationId: string, category?: string): Promise<ApiSpecDetail> {
  // category가 지정된 경우 해당 디렉토리에서만 찾기
  if (category) {
    const specPath = join(apiInfoDir, category, `${operationId}.json`);
    const content = await readFile(specPath, 'utf-8');
    return JSON.parse(content) as ApiSpecDetail;
  }

  // category가 없으면 모든 카테고리 디렉토리에서 순차적으로 찾기
  const metadata = await readMetadata();
  const categories = metadata.categories;

  for (const cat of categories) {
    try {
      const specPath = join(apiInfoDir, cat, `${operationId}.json`);
      const content = await readFile(specPath, 'utf-8');
      return JSON.parse(content) as ApiSpecDetail;
    } catch {
      // 이 카테고리에 없으면 다음 카테고리 시도
      continue;
    }
  }

  // 어느 카테고리에서도 찾지 못한 경우
  throw new Error(`API spec not found: ${operationId}`);
}
