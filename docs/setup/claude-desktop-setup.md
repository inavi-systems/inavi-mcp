# Claude Desktop 설정 가이드

Claude Desktop에서 iNavi Maps MCP Server를 사용하기 위한 설정 가이드입니다.

## 목차
- [설치 방법](#설치-방법)
  - [방법 1: .mcpb Bundle (추천)](#방법-1-mcpb-bundle-추천)
  - [방법 2: npx](#방법-2-npx)
  - [방법 3: 로컬 빌드](#방법-3-로컬-빌드)
- [설정 확인](#설정-확인)
- [문제 해결](#문제-해결)

---

## 설치 방법

### 방법 1: .mcpb Bundle (추천)

가장 쉬운 설치 방법입니다. 클릭 몇 번으로 설치 완료!

#### 단계

1. **[GitHub Releases](https://github.com/inavi-systems/inavi-mcp/releases)에서 최신 `.mcpb` 파일 다운로드**

   최신 릴리스 페이지에서 `inavi-maps-mcp-server.mcpb` 파일을 다운로드합니다.

2. **다운로드한 `.mcpb` 파일을 Claude Desktop에 드래그 앤 드롭** (또는 더블클릭)

   Claude Desktop이 자동으로 파일을 인식하고 설치를 시작합니다.

3. **Claude Desktop 재시작**

   설정 적용을 위해 Claude Desktop을 완전히 종료하고 재시작합니다.

#### 완료!

이제 Claude에게 지도 관련 질문을 할 수 있습니다:

```
"서울시청"의 좌표를 알려줘
```

---

### 방법 2: npx

npx를 사용하면 별도의 다운로드 없이 최신 버전을 자동으로 실행할 수 있습니다.

#### 필수 요구사항

- Node.js 18 이상 설치

#### 설정 파일 위치

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### 설정 파일 수정

설정 파일을 열고 다음 내용을 추가합니다:

```json
{
  "mcpServers": {
    "inavi-maps-mcp": {
      "command": "npx",
      "args": ["-y", "inavi-maps-mcp"]
    }
  }
}
```

#### Claude Desktop 재시작

설정을 저장한 후 Claude Desktop을 완전히 종료하고 재시작합니다.

---

### 방법 3: 로컬 빌드

개발자이거나 프로젝트에 기여하려는 경우 로컬에서 빌드하여 사용할 수 있습니다.

#### 단계

1. **프로젝트 클론 및 빌드**

   ```bash
   git clone https://github.com/inavi-systems/inavi-mcp.git
   cd inavi-maps-mcp-server
   npm install
   npm run build
   ```

2. **설정 파일 수정**

   Claude Desktop 설정 파일을 열고 다음 내용을 추가:

   ```json
   {
     "mcpServers": {
       "inavi-maps-mcp": {
         "command": "node",
         "args": ["C:/absolute/path/to/inavi-maps-mcp-server/dist/server.js"]
       }
     }
   }
   ```

   **중요:**
   - `C:/absolute/path/to/`를 실제 프로젝트 경로로 교체
   - **절대 경로**를 사용해야 합니다 (상대 경로 불가)
   - Windows에서는 슬래시(`/`) 또는 이스케이프된 백슬래시(`\\`) 사용

3. **Claude Desktop 재시작**

상세한 로컬 개발 가이드는 [Local Development Guide](./local-development.md)를 참고하세요.

---

## 설정 확인

설정이 올바르게 적용되었는지 확인하는 방법:

### 1. Claude Desktop 재시작

설정을 변경한 후에는 반드시 Claude Desktop을 완전히 종료하고 재시작합니다.

### 2. 테스트 질문

Claude에게 다음과 같이 요청하여 MCP 도구가 정상적으로 등록되었는지 확인:

```
"서울시청"의 좌표를 알려줘
```

또는

```
강남역에서 잠실역까지의 경로를 계산해줘
```

### 3. MCP 도구 확인

Claude Desktop의 설정 메뉴에서 MCP 서버가 올바르게 등록되었는지 확인할 수 있습니다.

---

## 문제 해결

### MCP 서버가 연결되지 않을 때

1. **설정 파일 경로 확인**

   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. **JSON 형식 확인**

   설정 파일이 올바른 JSON 형식인지 확인합니다. [JSONLint](https://jsonlint.com/)에서 검증할 수 있습니다.

3. **절대 경로 사용 (방법 3 사용 시)**

   ```json
   // ❌ 잘못된 예 (상대 경로)
   "args": ["./dist/server.js"]

   // ✅ 올바른 예 (절대 경로)
   "args": ["C:/Users/username/projects/inavi-maps-mcp-server/dist/server.js"]
   ```

4. **로그 확인**

   Claude Desktop 개발자 도구를 열어 로그 확인:
   - Windows/macOS: `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (macOS)
   - Console 탭에서 에러 메시지 확인

### Node.js 관련 문제 (npx 방법 사용 시)

npx 방법을 사용할 때 Node.js가 설치되어 있지 않으면:

1. [Node.js 공식 사이트](https://nodejs.org/)에서 Node.js 18 이상 다운로드 및 설치
2. 터미널에서 `node --version` 명령어로 설치 확인
3. Claude Desktop 재시작

### 추가 문제 해결

더 자세한 문제 해결 방법은 [Troubleshooting Guide](../troubleshooting.md)를 참고하세요.

---

## 다음 단계

- **사용 방법**: [API Reference](../guides/api-reference.md)에서 사용 가능한 모든 도구 확인
- **예제**: README의 "사용 예시" 섹션 참고
- **기여하기**: [Local Development Guide](./local-development.md) 참고

---

## 추가 지원

- **GitHub Issues**: [문제 보고](https://github.com/inavi-systems/inavi-mcp/issues)
- **GitHub Discussions**: [질문하기](https://github.com/inavi-systems/inavi-mcp/discussions)
