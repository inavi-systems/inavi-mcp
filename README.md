# iNavi Maps MCP Server

[![npm version](https://img.shields.io/npm/v/@inavi-maps/mcp-server)](https://www.npmjs.com/package/@inavi-maps/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI 어시스턴트에 지도 인텔리전스를 부여하는 MCP (Model Context Protocol) 서버입니다.

iNavi Maps MCP Server를 연결하면, AI가 iNavi Maps의 다양한 위치 기반 API를 이해하고 인터랙티브 지도를 직접 생성할 수 있게 됩니다. 별도의 API 문서를 읽거나 코드를 직접 작성할 필요 없이, 자연어로 대화하며 지도 기반 기능을 구현할 수 있습니다.

- **API 스펙 조회** - 지오코딩, POI 검색, 경로 탐색, 맵 매칭 등 30개 이상의 iNavi Maps API 사양을 AI에게 제공
- **지도 시각화** - 마커, 클러스터, 폴리곤, 폴리라인 등 18개의 HTML 템플릿으로 인터랙티브 지도 생성

**이런 분들에게 적합합니다:**
- **빠른 프로토타이핑** - API 문서를 읽지 않고 AI 대화만으로 지도 기반 기능 구현
- **위치 기반 서비스 개발** - 지오코딩, 경로 탐색, POI 검색 등을 활용한 서비스 구축
- **데이터 시각화** - 위치 데이터를 인터랙티브 지도 위에 시각화

---

## 빠른 시작

### 방법 1: .mcpb Bundle (Claude Desktop 전용 - 추천)

가장 쉬운 설치 방법입니다. 별도 환경 구성 없이 바로 사용할 수 있습니다.

1. [GitHub Releases](https://github.com/inavi-systems/inavi-mcp/releases)에서 최신 `.mcpb` 파일 다운로드
2. 다운로드한 `.mcpb` 파일을 Claude Desktop에 **드래그 앤 드롭** (또는 더블클릭)
3. Claude Desktop 재시작

완료! 이제 Claude에게 지도 관련 질문을 할 수 있습니다.

### 방법 2: npx (모든 MCP 호스트)

Cursor, Windsurf, Claude Code 등 다양한 MCP 호스트에서 사용할 수 있습니다.

> **사전 요구사항:** Node.js 22 이상이 설치되어 있어야 합니다.

<details>
<summary><b>Claude Desktop</b></summary>

설정 파일 위치:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "inavi-maps-mcp": {
      "command": "npx",
      "args": ["-y", "@inavi-maps/mcp-server"]
    }
  }
}
```

설정 파일 저장 후 Claude Desktop을 재시작하세요.
</details>

<details>
<summary><b>Cursor</b></summary>

Cursor > Settings > Cursor Settings > Tools & MCP에서 다음을 추가:

```json
{
  "mcpServers": {
    "inavi-maps-mcp": {
      "command": "npx",
      "args": ["-y", "@inavi-maps/mcp-server"]
    }
  }
}
```
</details>

<details>
<summary><b>Claude Code</b></summary>

터미널에서 다음 명령어를 실행:

```bash
claude mcp add inavi-maps-mcp npx -y @inavi-maps/mcp-server
```
</details>

<details>
<summary><b>기타 MCP 호스트 (Windsurf, Continue, Cline 등)</b></summary>

각 에디터의 MCP 설정 파일에 다음을 추가:

```json
{
  "mcpServers": {
    "inavi-maps-mcp": {
      "command": "npx",
      "args": ["-y", "@inavi-maps/mcp-server"]
    }
  }
}
```
</details>

---

## 사용 예시

MCP 서버를 설치한 후, AI에게 자연어로 요청하세요.

### API 탐색 & 코드 생성

이 MCP 서버는 iNavi Maps API 사양을 AI에게 제공합니다. AI가 직접 API를 호출하는 것이 아니라, API 스펙을 참조하여 올바른 호출 코드를 작성해 줍니다.

```
iNavi Maps에서 사용할 수 있는 지오코딩 관련 API를 알려줘
```

```
리버스 지오코딩 API의 요청/응답 스펙을 보여줘
```

```
주소를 좌표로 변환하는 API 호출 코드를 TypeScript로 작성해줘
```

```
출발지-도착지 경로 탐색 API를 사용하는 예제 코드를 만들어줘
```

```
N:1 거리 매트릭스 API로 가장 가까운 매장을 찾는 로직을 구현해줘
```

### 지도 시각화

AI가 HTML 템플릿을 기반으로 인터랙티브 지도 페이지를 생성합니다.

```
iNavi 지도에 마커를 표시하는 HTML 페이지를 만들어줘
```

```
여러 지점을 클러스터로 묶어서 지도에 표시하는 페이지를 만들어줘
```

```
경로를 교통 상황 색상으로 지도에 시각화하는 페이지를 만들어줘
```

```
서울 주요 관광지를 폴리곤 영역과 마커로 표시하는 지도를 만들어줘
```

### 조합 활용

API 스펙 조회와 지도 시각화를 함께 사용하면 더 복잡한 기능을 구현할 수 있습니다.

```
지오코딩 API로 주소를 좌표로 변환하고, 그 결과를 지도에 마커로 표시하는 페이지를 만들어줘
```

```
경로 탐색 API 호출 결과를 지도 위에 폴리라인으로 시각화하는 코드를 작성해줘
```

---

## 사용 가능한 도구

이 MCP 서버는 두 종류, 총 **4개의 도구**를 제공합니다. 각 도구 쌍은 **탐색 → 상세 조회**의 2단계 워크플로우로 설계되어 있습니다.

### API 스펙 도구

iNavi Maps API 사양을 AI에게 제공하여, API 문서를 직접 읽지 않고도 AI가 올바른 API 호출 코드를 작성할 수 있도록 합니다.

| 도구 | 설명 | 주요 입력 |
|------|------|-----------|
| `list_api_specs` | API 스펙 목록 조회 | `category` (선택) |
| `get_api_spec` | 특정 API 상세 사양 조회 | `operationId` (필수) |

**워크플로우:** `list_api_specs`로 사용 가능한 API를 탐색한 후, `get_api_spec`에 `operationId`를 전달하여 파라미터, 요청/응답 스키마 등 상세 사양을 조회합니다.

<details>
<summary><b>API 스펙 카테고리 (8개)</b></summary>

| 카테고리 | 설명 | 포함 API |
|---------|------|---------|
| `search-place` | 장소/주소 검색 | 통합 검색, 다국어 통합 검색, 장소 상세 조회, 시설물 정보 조회, 검색어 추천, 주변 카테고리 검색, 최적 지점 검색 |
| `search-geocoding` | 지오코딩 | 지오코딩, 리버스 지오코딩, 다국어 리버스 지오코딩, 다중 리버스 지오코딩, 주소 정규화 지오코딩 |
| `search-spatial` | 공간 검색 | 공간 검색, 행정/법정동 영역 검색, 좌표(계) 변환 |
| `search-w3w` | what3words | W3W 검색어 추천, W3W 리버스 지오코딩, W3W 최적 지점 검색 |
| `route-directions` | 경로 탐색 | 경로 탐색, 경로 탐색 요약, 경로 예측 탐색, 다중 경유지 탐색 100, 도보/PM 경로 탐색 |
| `route-optimization` | 경유지 최적화 | TSP (다중 경유지 최적화) |
| `route-map-matching` | 맵 매칭 | Special Map Matching, MTR 100, MTR 1000 |
| `route-matrix` | 거리/시간 매트릭스 | N:1, 1:N, M:N 매트릭스 |

</details>

### HTML 예제 도구 (지도 시각화)

인터랙티브 지도를 생성하기 위한 HTML 템플릿을 제공합니다. AI가 템플릿의 데이터 값(좌표, 레이블 등)을 커스터마이징하여 맞춤형 지도 페이지를 생성합니다.

| 도구 | 설명 | 주요 입력 |
|------|------|-----------|
| `list_map_examples` | 지도 예제 목록 조회 | `category` (선택) |
| `get_map_example` | 특정 지도 예제 HTML 조회 | `id` (필수) |

**워크플로우:** `list_map_examples`로 사용 가능한 예제를 탐색한 후, `get_map_example`에 `id`를 전달하여 완전한 HTML 코드를 조회합니다.

<details>
<summary><b>지도 예제 카테고리 (4개, 총 18개 예제)</b></summary>

| 카테고리 | 예제 수 | 포함 예제 |
|---------|--------|----------|
| `dynamic-maps` | 5 | 기본 지도, 지도 정보 표시, 거리 계산, 지도 타입 전환, FlyTo 애니메이션 |
| `marker` | 6 | 기본 마커, 이동 가능 마커, 클러스터, 클러스터 격자 크기, 넘버링, 컬러 마커 |
| `infowindow` | 2 | 기본 InfoWindow, 클러스터 마커 InfoWindow |
| `shapes` | 5 | 원, 폴리곤, 멀티 폴리곤, 스타일 변경, 폴리라인 (교통 색상) |

</details>

---

## Tools

This server exposes **4 tools**, arranged as two discovery → detail pairs.

- `list_api_specs` — Browse available iNavi Maps API specifications by category.
- `get_api_spec` — Get the detailed specification of a specific API by `operationId`.
- `list_map_examples` — Browse available map visualization HTML examples.
- `get_map_example` — Get a specific map example's HTML template by `id`.

---

## 문제 해결

### MCP 서버가 연결되지 않을 때

1. **Node.js 버전 확인**: Node.js 22 이상이 필요합니다 (`node -v`로 확인)
2. **MCP Host 재시작**: 설정 변경 후 반드시 재시작
3. **설정 파일 확인**: JSON 문법 오류가 없는지 확인

### JSON 파싱 에러

```
Unexpected token...is not valid JSON
```

**해결 방법:**
- 최신 버전으로 업데이트 (이미 수정된 이슈)
- 로컬 개발 시 `console.log` 대신 MCP Logging 사용 (stdout 오염 방지)

더 자세한 문제 해결 방법은 [Troubleshooting Guide](./docs/troubleshooting.md)를 참고하세요.

---

## 문서

| 문서 | 설명 |
|-----|------|
| [API 레퍼런스](./docs/guides/api-reference.md) | 모든 도구의 상세 입출력 문서 |
| [Claude Desktop 설정](./docs/setup/claude-desktop-setup.md) | Claude Desktop 설치 및 설정 가이드 |
| [Cursor 설정](./docs/setup/cursor-setup.md) | Cursor IDE 설정 가이드 |
| [로컬 개발](./docs/setup/local-development.md) | 소스 코드에서 직접 빌드 및 실행 |
| [Troubleshooting](./docs/troubleshooting.md) | 상세 문제 해결 가이드 |

---

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포할 수 있습니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

---

## 참고 자료

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 공식 문서
- [Claude Desktop](https://claude.ai/download) - Claude Desktop 다운로드
- [iNavi Maps API](https://mapsapi.inavisys.com/) - iNavi Maps API 공식 문서
