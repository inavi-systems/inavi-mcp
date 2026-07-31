/**
 * SDK Doc 타입 정의
 * Maps SDK 문서 도구용 타입 (scripts/update-sdk-docs.js 산출물 구조와 일치)
 */

/** 파라미터 / 속성 */
export interface SdkParam {
  name: string;
  type?: string[];
  description: string;
  optional?: boolean;
  default?: string;
}

/** 메서드 스펙 */
export interface SdkMethod {
  name: string;
  signature: string;
  description: string;
  params: SdkParam[];
  returns: { type?: string[]; description: string }[];
}

/** 클래스 인스턴스 멤버 */
export interface SdkMember {
  name: string;
  type?: string[];
  description: string;
}

/**
 * 심볼별 구조화 문서 ({category}/{id}.json)
 */
export interface SdkDoc extends Record<string, unknown> {
  id: string;
  category: string;
  kind: 'class' | 'type';
  name: string;
  description: string;
  // class
  /** 상속한 부모 클래스 이름들 (`@extends`), 렌더 시 relatedTypes로 링크 */
  augments?: string[];
  ctor?: { signature: string; params: SdkParam[] };
  methods?: SdkMethod[];
  members?: SdkMember[];
  events?: string[];
  // typedef
  type?: string[];
  properties?: SdkParam[];
  examples?: string[];
  /** 참조하는 문서화 타입 name → docId (렌더 시 docId 링크로 표기) */
  relatedTypes?: Record<string, string>;
}

/**
 * SDK 문서 요약 (list_sdk_docs용, index/{category}-sdk-index.json)
 */
export interface SdkDocSummary extends Record<string, unknown> {
  id: string;
  category: string;
  kind: string;
  name: string;
  summary: string;
  methods: string[];
}

/**
 * SDK 문서 인덱스
 */
export interface SdkDocIndex {
  category?: string;
  docs: SdkDocSummary[];
  totalCount: number;
  categories?: string[];
}

/**
 * SDK 문서 메타데이터 (metadata.json)
 */
export interface SdkDocMetadata {
  generatedAt: string;
  sourceUrl: string;
  version?: string;
  totalDocs: number;
  categories: string[];
  categoryMeta: Record<string, { label: string; guidance: string }>;
}
