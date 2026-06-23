# 로컬 개발 가이드

프로젝트에 기여하거나 로컬에서 개발하려는 개발자를 위한 가이드입니다.

## 목차
- [필수 요구사항](#필수-요구사항)
- [프로젝트 설정](#프로젝트-설정)
- [환경 변수 설정](#환경-변수-설정)
- [빌드](#빌드)
- [MCP 서버 등록](#mcp-서버-등록)
- [개발 명령어](#개발-명령어)
- [테스트](#테스트)
- [코드 품질](#코드-품질)

---

## 필수 요구사항

로컬 개발을 시작하기 전에 다음 도구들이 설치되어 있어야 합니다:

- **Node.js 18 이상**
  - [Node.js 다운로드](https://nodejs.org/)
  - 버전 확인: `node --version`

- **npm** (Node.js와 함께 설치됨)
  - 버전 확인: `npm --version`

- **Git**
  - [Git 다운로드](https://git-scm.com/)
  - 버전 확인: `git --version`

---

## 프로젝트 설정

### 1. 저장소 클론

```bash
git clone https://github.com/inavi-systems/inavi-mcp.git
cd inavi-maps-mcp-server
```

### 2. 의존성 설치

```bash
npm install
```

이 명령어는 `package.json`에 정의된 모든 의존성을 설치합니다.

---

## 환경 변수 설정

### 1. 환경 변수 파일 생성

`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다:

```bash
# Linux/macOS
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env

# Windows (CMD)
copy .env.example .env
```

### 2. 환경 변수 설정 (선택 사항)

`.env` 파일을 열어 필요한 경우 기본값을 변경합니다:

```env
# Optional (uncomment to override defaults)
# NODE_ENV=development
# INAVI_BASE_URL=https://dev-imaps.inavi.com/maps/v3.0
```

### 환경 변수 설명

| 변수명 | 설명 | 기본값 | 필수 |
|--------|------|--------|------|
| `NODE_ENV` | 실행 환경 (`development` \| `production` \| `test`) | `development` | ❌ |
| `INAVI_BASE_URL` | iNavi Maps API 베이스 URL | `https://dev-imaps.inavi.com/maps/v3.0` | ❌ |

---

## 빌드

TypeScript 소스 코드를 JavaScript로 컴파일합니다:

```bash
npm run build
```

컴파일된 파일은 `dist/` 디렉터리에 생성됩니다.

### 빌드 확인

```bash
ls dist/
# 또는
dir dist\
```

`server.js` 파일이 생성되었는지 확인합니다.

---

## MCP 서버 등록

로컬 빌드 후 MCP Host에 서버를 등록해야 합니다.

### Claude Desktop 설정

설정 파일 위치:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

설정 파일에 다음 내용을 추가:

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
- **절대 경로**를 사용하세요 (상대 경로 불가)
- Windows에서는 슬래시(`/`) 또는 이스케이프된 백슬래시(`\\`) 사용

### Cursor / Windsurf / Continue / Cline

각 에디터의 MCP 설정 파일에 위와 동일한 형식으로 추가합니다.

### 재시작 및 확인

1. MCP Host(Claude Desktop 등)를 완전히 종료
2. MCP Host 재시작
3. Claude에게 다음과 같이 요청하여 확인:

```
"서울시청"의 좌표를 알려줘
```

또는

```
강남역에서 잠실역까지의 경로를 계산해줘
```

---

## 개발 명령어

### 개발 모드 (Hot Reload)

파일 변경 시 자동으로 재시작되는 개발 모드:

```bash
npm run dev
```

**참고:** 개발 모드는 디버깅용이며, 실제 MCP 서버는 빌드 후 MCP Host에 등록해야 합니다.

### TypeScript 타입 체크

타입 에러만 확인 (컴파일하지 않음):

```bash
npm run type-check
```

### 서버 실행 (테스트용)

빌드된 서버를 직접 실행:

```bash
npm start
```

**참고:** 이 방식은 MCP 통신이 아닌 테스트용입니다.

---

## 테스트

### 모든 테스트 실행

```bash
npm test
```

### Vitest UI로 테스트 실행

시각적 인터페이스로 테스트 확인:

```bash
npm run test:ui
```

브라우저가 자동으로 열리며 테스트 결과를 확인할 수 있습니다.

### 테스트 커버리지

```bash
npm run test:coverage
```

커버리지 리포트는 `coverage/` 디렉터리에 생성됩니다.

### Watch 모드

파일 변경 시 자동으로 테스트 재실행:

```bash
npm run test:watch
```

### 특정 테스트 파일 실행

```bash
npm test -- searches.tool.integration.test.ts
```

---

## 코드 품질

### Linting

코드 스타일 검사:

```bash
npm run lint
```

### Linting 자동 수정

```bash
npm run lint:fix
```

### 코드 포맷팅

Prettier로 코드 포맷팅:

```bash
npm run format
```

### 포맷 검사

```bash
npm run format:check
```

포맷팅이 올바른지 확인만 하고 파일을 수정하지 않습니다.

---

## 개발 워크플로우

일반적인 개발 워크플로우는 다음과 같습니다:

### 1. 기능 개발

```bash
# 새 브랜치 생성
git checkout -b feature/my-new-feature

# 코드 작성
# ...

# 타입 체크
npm run type-check

# Lint 자동 수정
npm run lint:fix

# 테스트 실행
npm test
```

### 2. 빌드 및 테스트

```bash
# 빌드
npm run build

# MCP Host 재시작하여 테스트
# Claude Desktop 등에서 직접 테스트
```

### 3. 커밋 전 체크리스트

- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] `npm test` 통과
- [ ] `npm run format:check` 통과
- [ ] 실제 MCP Host에서 동작 확인

### 4. 커밋 및 푸시

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/my-new-feature
```

---

## 프로젝트 구조

간략한 프로젝트 구조:

```
inavi-maps-mcp-server/
├── src/
│   ├── config/           # 환경 변수 설정
│   ├── tools/            # MCP 도구 정의
│   ├── services/         # 비즈니스 로직
│   ├── utils/            # 유틸리티
│   └── server.ts         # 진입점
├── test/                 # 테스트 코드
├── public/               # HTML 예제 파일
├── dist/                 # 빌드 출력 (gitignore)
├── .env                  # 환경 변수 (gitignore)
└── package.json          # 의존성 및 스크립트
```

상세한 아키텍처는 [CLAUDE.md](../../CLAUDE.md)를 참고하세요.

---

## 다음 단계

- **기여하기**: Pull Request를 생성하여 기능 개선이나 버그 수정에 기여하세요
- **문서 확인**: [CLAUDE.md](../../CLAUDE.md)에서 상세한 개발 가이드 확인
- **API 레퍼런스**: [API Reference](../guides/api-reference.md)에서 모든 도구 확인
- **문제 해결**: [Troubleshooting Guide](../troubleshooting.md) 참고

---

## 추가 지원

- **GitHub Issues**: [문제 보고](https://github.com/inavi-systems/inavi-mcp/issues)
- **GitHub Discussions**: [질문하기](https://github.com/inavi-systems/inavi-mcp/discussions)
