# Cursor 설정 가이드

Cursor 에디터에서 iNavi MCP Server를 사용하기 위한 설정 가이드입니다.

> **참고**: 이 가이드는 Windsurf, Continue, Cline 등 다른 MCP 호스트에서도 유사하게 적용됩니다.

## 목차
- [필수 요구사항](#필수-요구사항)
- [설치 방법](#설치-방법)
  - [방법 1: npx (추천)](#방법-1-npx-추천)
  - [방법 2: 로컬 빌드](#방법-2-로컬-빌드)
- [설정 확인](#설정-확인)
- [문제 해결](#문제-해결)

---

## 필수 요구사항

- **Node.js 22 이상**
  - [Node.js 다운로드](https://nodejs.org/)
  - 버전 확인: `node --version`

---

## 설치 방법

### 방법 1: npx (추천)

npx를 사용하면 별도의 다운로드 없이 최신 버전을 자동으로 실행할 수 있습니다.

#### MCP 설정 파일 수정

Cursor의 MCP 설정 파일을 열고 다음 내용을 추가합니다:

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

**중요:**
- `-y` 플래그는 설치 확인을 자동으로 진행합니다

#### Cursor 재시작

설정을 저장한 후 Cursor를 완전히 종료하고 재시작합니다.

---

### 방법 2: 로컬 빌드

소스에서 직접 빌드하려는 개발자는 로컬에서 빌드하여 사용할 수 있습니다.

#### 단계

1. **프로젝트 클론 및 빌드**

   ```bash
   git clone https://github.com/inavi-systems/inavi-mcp.git
   cd inavi-maps-mcp-server
   npm install
   npm run build
   ```

2. **MCP 설정 파일 수정**

   Cursor의 MCP 설정 파일을 열고 다음 내용을 추가:

   ```json
   {
     "mcpServers": {
       "inavi-maps-mcp": {
         "command": "node",
         "args": ["/absolute/path/to/inavi-maps-mcp-server/dist/server.js"]
       }
     }
   }
   ```

   **중요:**
   - `/absolute/path/to/`를 실제 프로젝트 경로로 교체
   - **절대 경로**를 사용해야 합니다 (상대 경로 불가)
   - Windows: `C:/Users/username/projects/inavi-maps-mcp-server/dist/server.js`
   - macOS/Linux: `/home/username/projects/inavi-maps-mcp-server/dist/server.js`

3. **Cursor 재시작**

상세한 로컬 개발 가이드는 [Local Development Guide](./local-development.md)를 참고하세요.

---

## 설정 확인

설정이 올바르게 적용되었는지 확인하는 방법:

### 1. Cursor 재시작

설정을 변경한 후에는 반드시 Cursor를 완전히 종료하고 재시작합니다.

### 2. 테스트 질문

Cursor의 AI 채팅에서 다음과 같이 요청하여 MCP 도구가 정상적으로 등록되었는지 확인:

```
"서울시청"의 좌표를 알려줘
```

또는

```
강남역에서 잠실역까지의 경로를 계산해줘
```

### 3. MCP 도구 확인

Cursor의 설정 메뉴 또는 출력 패널에서 MCP 서버가 올바르게 등록되었는지 확인할 수 있습니다.

---

## 문제 해결

### MCP 서버가 연결되지 않을 때

1. **Node.js 설치 확인**

   터미널에서 다음 명령어로 Node.js가 설치되어 있는지 확인:

   ```bash
   node --version
   ```

   Node.js 22 이상이어야 합니다. 설치되어 있지 않다면 [Node.js 공식 사이트](https://nodejs.org/)에서 다운로드하세요.

2. **MCP 설정 파일 경로 확인**

   Cursor의 MCP 설정 파일 위치를 확인하고 올바른 파일을 수정했는지 확인합니다.

3. **JSON 형식 확인**

   설정 파일이 올바른 JSON 형식인지 확인합니다. [JSONLint](https://jsonlint.com/)에서 검증할 수 있습니다.

4. **절대 경로 사용 (방법 2 사용 시)**

   ```json
   // ❌ 잘못된 예 (상대 경로)
   "args": ["./dist/server.js"]

   // ✅ 올바른 예 (절대 경로)
   "args": ["C:/Users/username/projects/inavi-maps-mcp-server/dist/server.js"]
   ```

5. **로그 확인**

   Cursor의 출력 패널 또는 개발자 로그에서 에러 메시지를 확인합니다.

### npx 관련 문제

npx 실행 시 문제가 발생하면:

1. npm 캐시 정리:
   ```bash
   npm cache clean --force
   ```

2. npx를 직접 실행하여 오류 확인:
   ```bash
   npx -y @inavi-maps/mcp-server
   ```

3. 에러 메시지를 확인하여 문제 해결

### 추가 문제 해결

더 자세한 문제 해결 방법은 [Troubleshooting Guide](../troubleshooting.md)를 참고하세요.

---

## Windsurf, Continue, Cline 등 다른 MCP 호스트

이 가이드는 다른 MCP 호스트에서도 유사하게 적용됩니다:

### Windsurf

Windsurf의 MCP 설정 파일에 위와 동일한 형식으로 설정을 추가합니다.

### Continue

Continue의 MCP 설정 파일(일반적으로 `.continue/config.json`)에 위와 동일한 형식으로 설정을 추가합니다.

### Cline

Cline의 MCP 설정에 위와 동일한 형식으로 설정을 추가합니다.

각 도구의 공식 문서를 참고하여 MCP 설정 파일의 정확한 위치를 확인하세요.

---

## 다음 단계

- **사용 방법**: [API Reference](../guides/api-reference.md)에서 사용 가능한 모든 도구 확인
- **예제**: README의 "사용 예시" 섹션 참고
- **로컬 빌드**: [Local Development Guide](./local-development.md) 참고

---

## 추가 지원

- **개발자 문의**: [devbaek@inavi.kr](mailto:devbaek@inavi.kr)로 이메일 문의
- **공식 문의 채널**: [iNavi Maps API 커뮤니티](https://mapsapi.inavisys.com/community/)로 문의 전달
