# API 레퍼런스

iNavi Maps MCP Server가 제공하는 모든 MCP 도구의 상세 문서입니다.

## 목차
- [API 스펙 도구](#api-스펙-도구)
  - [list_api_specs - API 스펙 목록 조회](#list_api_specs)
  - [get_api_spec - API 스펙 상세 조회](#get_api_spec)
- [HTML 예제 도구](#html-예제-도구)
  - [list_map_examples - 지도 예제 목록 조회](#list_map_examples)
  - [get_map_example - 지도 예제 HTML 조회](#get_map_example)

---

## API 스펙 도구

iNavi Maps API 사양을 조회하여 AI가 참조할 수 있도록 합니다. 두 단계 워크플로우로 사용합니다:

1. `list_api_specs`로 사용 가능한 API 목록 탐색
2. `get_api_spec`으로 특정 API의 상세 사양 조회

### list_api_specs

사용 가능한 iNavi Maps API 목록을 조회합니다. 카테고리별 필터링이 가능합니다.

#### 입력 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `category` | enum | ❌ | 카테고리 필터 (생략 시 전체 조회) |

#### 사용 가능한 카테고리

| 카테고리 | 설명 | 포함 API |
|---------|------|---------|
| `search-place` | 장소/주소 검색 | 통합 검색, 다국어 통합 검색, 장소 상세 조회, 시설물 정보 조회, 검색어 추천, 주변 카테고리 검색, 최적 지점 검색 |
| `search-geocoding` | 지오코딩 | 지오코딩, 리버스 지오코딩, 다국어 리버스 지오코딩, 다중 리버스 지오코딩, 주소 정규화 지오코딩 |
| `search-spatial` | 공간 검색 | 공간 검색, 행정/법정동 영역 검색, 좌표(계) 변환 |
| `search-w3w` | what3words | W3W 검색어 추천, W3W 리버스 지오코딩, W3W 최적 지점 검색 |
| `route-directions` | 경로 탐색 | 경로 탐색, 경로 탐색 요약, 경로 예측 탐색, 다중 경유지 탐색 100, 도보/PM 경로 탐색 |
| `route-optimization` | 경유지 최적화 | TSP (다중 경유지 최적화) |
| `route-map-matching` | 맵 매칭 | Special Map Matching, MTR 100, MTR 1000 |
| `route-matrix` | 거리/시간 매트릭스 | 다중 출발지-단일 목적지(N:1), 단일 출발지-다중 목적지(1:N), RDM(M:N) |

#### 출력

```json
{
  "apis": [
    {
      "operationId": "getCoordinateResult",
      "summary": "지오코딩",
      "description": "..."
    }
  ],
  "totalCount": 5,
  "filters": { "category": "search-geocoding" }
}
```

#### 사용 예시

**Claude에게:**
```
iNavi Maps에서 사용할 수 있는 검색 관련 API 목록을 알려줘
```

---

### get_api_spec

특정 API의 상세 사양(파라미터, 요청/응답 스키마 포함)을 조회합니다.

#### 입력 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `operationId` | string | ✅ | API 고유 식별자 (예: `getRouteTimeResult`) |

#### 출력

API의 상세 사양을 반환합니다:
- HTTP 메서드 및 경로
- 요청 파라미터 (query, path, header)
- 요청 바디 스키마
- 응답 스키마
- 예제 요청/응답 데이터

#### 사용 예시

**Claude에게:**
```
지오코딩 API의 상세 스펙을 알려줘
```

#### 참고사항

- 반드시 `list_api_specs`로 먼저 `operationId`를 확인한 후 사용
- 모든 `$ref` 참조는 실제 스키마 내용으로 이미 역참조(dereference)되어 있음

---

## HTML 예제 도구

인터랙티브 지도 시각화를 위한 HTML 템플릿을 제공합니다. 두 단계 워크플로우로 사용합니다:

1. `list_map_examples`로 사용 가능한 예제 탐색
2. `get_map_example`으로 특정 예제의 HTML 코드 조회

### list_map_examples

사용 가능한 지도 예제 목록을 조회합니다. 카테고리별 필터링이 가능합니다.

#### 입력 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `category` | enum | ❌ | 카테고리 필터 (dynamic-maps, marker, infowindow, shapes) |

#### 사용 가능한 카테고리 및 예제

| 카테고리 | 예제 수 | 포함 예제 |
|---------|--------|----------|
| `dynamic-maps` | 5 | 기본 지도, 지도 정보 표시, 거리 계산, 지도 타입 전환, FlyTo 애니메이션 |
| `marker` | 6 | 기본 마커, 이동 가능 마커, 클러스터, 클러스터 격자 크기, 넘버링, 컬러 마커 |
| `infowindow` | 2 | 기본 InfoWindow, 클러스터 마커 InfoWindow |
| `shapes` | 5 | 원, 폴리곤, 멀티 폴리곤, 스타일 변경, 폴리라인 (교통 색상) |

#### 출력

```json
{
  "examples": [
    {
      "id": "dynamic-basic",
      "title": "기본 인터랙티브 지도",
      "description": "...",
      "tags": ["map", "basic"]
    }
  ],
  "totalCount": 18,
  "category": null
}
```

#### 사용 예시

**Claude에게:**
```
사용 가능한 마커 관련 지도 예제를 보여줘
```

---

### get_map_example

특정 지도 예제의 전체 메타데이터와 HTML 코드를 반환합니다.

#### 입력 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | string | ✅ | 예제 ID (예: `marker-basic`) |

#### 출력

- `metadata`: 전체 메타데이터 (설명, 사용 사례, 기능, 키워드)
- `htmlContent`: 완전한 HTML 코드 (플레이스홀더가 실제 값으로 치환됨)

#### 사용 예시

**Claude에게:**
```
마커 클러스터 예제 HTML을 가져와서 검색 결과를 표시하는 페이지를 만들어줘
```

#### 참고사항

- 반드시 `list_map_examples`로 먼저 `id`를 확인한 후 사용
- AI는 템플릿의 데이터 값(좌표, 레이블 등)만 커스터마이징 가능
- iNavi Maps API 생성자/메서드의 옵션을 임의로 변경하거나 추가하면 안 됨

---

## 일반 참고사항

### 좌표 형식

- **좌표계**: WGS84 (표준 GPS 좌표)
- **순서**: (경도, 위도) = (X, Y)
- **경도(X)**: -180 ~ 180
- **위도(Y)**: -90 ~ 90
