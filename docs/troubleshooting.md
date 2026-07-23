# 문제 해결 가이드

iNavi MCP Server 사용 중 발생할 수 있는 문제들과 해결 방법을 정리했습니다.

## 목차
- [MCP 서버가 연결되지 않을 때](#mcp-서버가-연결되지-않을-때)
- [JSON 파싱 에러가 발생할 때](#json-파싱-에러가-발생할-때)
- [API 호출이 실패할 때](#api-호출이-실패할-때)
- [HTML 예제 코드가 작동하지 않을 때](#html-예제-코드가-작동하지-않을-때)
- [테스트 실행 시 문제가 발생할 때](#테스트-실행-시-문제가-발생할-때)

---

## MCP 서버가 연결되지 않을 때

### 증상
Claude Desktop이나 다른 MCP Host에서 iNavi MCP 서버를 인식하지 못합니다.

### 해결 방법

1. **빌드 확인**
   ```bash
   npm run build
   ```
   빌드가 성공적으로 완료되었는지 확인하고, `dist/` 디렉터리에 `server.js` 파일이 생성되었는지 확인합니다.

2. **경로 확인**

   MCP Host 설정 파일에서 **절대 경로**를 사용하고 있는지 확인합니다.

   **잘못된 예:**
   ```json
   {
     "command": "node",
     "args": ["./dist/server.js"]  // ❌ 상대 경로
   }
   ```

   **올바른 예:**
   ```json
   {
     "command": "node",
     "args": ["C:/Users/username/projects/inavi-maps-mcp-server/dist/server.js"]  // ✅ 절대 경로
   }
   ```

3. **로그 확인**

   **Claude Desktop:**
   - 개발자 도구 열기: `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (macOS)
   - Console 탭에서 MCP 서버 stderr 로그 확인
   - 또는 로그 디렉터리 확인:
     - Windows: `%APPDATA%\Claude\logs\`
     - macOS: `~/Library/Logs/Claude/`

   **Cursor:**
   - Output 패널 또는 개발자 로그 확인

4. **MCP Host 재시작**

   설정을 변경한 후에는 반드시 MCP Host를 완전히 종료하고 재시작합니다.

---

## JSON 파싱 에러가 발생할 때

### 증상
```
Unexpected token 'd', "[dotenv@17."... is not valid JSON
```

### 원인
stdout이 MCP JSON-RPC 프로토콜이 아닌 다른 내용(로그, console.log 등)으로 오염되었을 때 발생합니다.

### 해결 방법

1. **최신 버전 사용**

   이 문제는 이미 수정되었습니다. 최신 버전을 사용하고 있는지 확인하세요.

   ```bash
   # 최신 버전 확인
   git pull origin main
   npm install
   npm run build
   ```

2. **코드에서 console.log 제거**

   서버 코드에 `console.log`나 `console.error`를 추가했다면 제거하고, 대신 MCP Logging을 사용하세요:

   ```typescript
   // ❌ 잘못된 방법
   console.log('Debug message');

   // ✅ 올바른 방법
   logger.log('debug', 'Debug message');
   ```

3. **MCP Host 재시작**

   빌드 후 MCP Host를 재시작합니다.

---

## API 호출이 실패할 때

### 증상
API 호출 시 에러가 발생하거나 결과가 반환되지 않습니다.

### 해결 방법

1. **API 키 검증**

   iNavi Maps API 키가 유효한지 확인합니다:
   - [iNavi Maps API 대시보드](https://mapsapi.inavisys.com/) 방문
   - API 키 상태 확인

2. **네트워크 확인**

   iNavi API 엔드포인트에 접근 가능한지 확인합니다:
   ```bash
   curl https://imaps.inavi.com/maps/v3.0
   ```

3. **좌표 형식 확인**

   WGS84 좌표계를 사용하고 있는지 확인합니다:
   - 형식: (경도, 위도) 순서
   - 예: `startX="127.027926", startY="37.497942"`
   - 경도(X): -180 ~ 180
   - 위도(Y): -90 ~ 90

4. **로그 확인**

   MCP Host의 로그를 확인하여 자세한 에러 메시지를 확인합니다.

---

## HTML 예제 코드가 작동하지 않을 때

### 증상
MCP 도구에서 받은 HTML 예제 코드를 브라우저에서 열었을 때 지도가 표시되지 않습니다.

### 해결 방법

1. **API 키 확인**

   HTML의 `{appKey}` 플레이스홀더를 실제 iNavi API 키로 교체합니다:

   ```html
   <!-- 템플릿 (base_url은 자동 치환됨) -->
   <script src="https://imaps.inavi.com/maps/v3.0/appkeys/{appKey}/maps?callback=initMap"></script>

   <!-- {appKey}를 실제 API 키로 교체 -->
   <script src="https://imaps.inavi.com/maps/v3.0/appkeys/your_api_key_here/maps?callback=initMap"></script>
   ```

3. **브라우저 콘솔 확인**

   브라우저 개발자 도구(F12)를 열어 Console 탭에서 JavaScript 에러를 확인합니다.

4. **CORS 이슈**

   로컬 파일(file://)로 열 경우 CORS 문제가 발생할 수 있습니다. 간단한 HTTP 서버를 사용하세요:

   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js
   npx http-server
   ```

   그리고 `http://localhost:8000`에서 HTML 파일을 엽니다.

---

## 테스트 실행 시 문제가 발생할 때

### 증상
`npm test` 실행 시 에러가 발생합니다.

### 해결 방법

1. **타입 체크 먼저 실행**

   ```bash
   npm run type-check
   ```

   TypeScript 타입 에러가 있는지 확인합니다.

2. **개별 테스트 파일 실행**

   ```bash
   npm test -- metadata-transformer.test.ts
   ```

   특정 테스트 파일만 실행하여 문제를 격리합니다.

3. **UI 모드로 테스트 (디버깅 용이)**

   ```bash
   npm run test:ui
   ```

   Vitest UI를 사용하면 테스트를 시각적으로 확인하고 디버깅할 수 있습니다.

4. **의존성 재설치**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 추가 지원

위의 방법으로 문제가 해결되지 않으면 아래 채널로 문의해 주세요:

1. **개발자 문의**: [devbaek@inavi.kr](mailto:devbaek@inavi.kr)로 이메일 문의
2. **공식 문의 채널**: [iNavi Maps API 커뮤니티](https://mapsapi.inavisys.com/community/)로 문의 전달
3. **로그 첨부**: MCP Host의 로그 파일을 첨부해주시면 더 빠르게 도움을 드릴 수 있습니다
4. **환경 정보**: OS, Node.js 버전, MCP Host 종류 및 버전을 함께 알려주세요
