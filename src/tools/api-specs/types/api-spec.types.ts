/**
 * API Spec 타입 정의
 * OpenAPI Specification 기반 API 문서 도구용 타입
 */

/**
 * API 요약 (list_api_specs용)
 * 목록 조회 시 반환되는 경량 메타데이터
 */
export interface ApiSpecSummary extends Record<string, unknown> {
  operationId: string;
  method: string;
  path: string;
  category: string;
  tags: string[];
  summary: string;
  description: string;
  deprecated?: boolean;
}

/**
 * API 상세 (get_api_spec용)
 * 특정 API의 완전한 스펙 정보
 */
export interface ApiSpecDetail extends Record<string, unknown> {
  operationId: string;
  method: string;
  path: string;
  category: string;
  baseUrl: string;
  tags: string[];
  summary: string;
  description: string;
  deprecated?: boolean;
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: Record<string, ApiResponse>;
}

/**
 * API 파라미터
 */
export interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema: Record<string, unknown>;
  description?: string;
}

/**
 * API 요청 본문
 */
export interface ApiRequestBody {
  required?: boolean;
  content: Record<string, unknown>;
}

/**
 * API 응답
 */
export interface ApiResponse {
  description?: string;
  content?: Record<string, unknown>;
}

/**
 * API 인덱스 (route-api-index.json, search-api-index.json)
 */
export interface ApiIndex {
  category?: string;
  apis: ApiSpecSummary[];
  totalCount: number;
  categories?: string[];
}

/**
 * API 문서 메타데이터 (metadata.json)
 */
export interface Metadata {
  generatedAt: string;
  sourceUrl: string;
  openapiVersion: string;
  apiVersion?: string;
  totalApis: number;
  categories: string[];
  tagMapping: Record<string, string>;
  ignoredTags: string[];
}

/**
 * @deprecated Use Metadata instead
 */
export type ApiDocsMetadata = Metadata;
