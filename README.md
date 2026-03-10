# Team9 프로젝트

## 🚀 기술 스택 (Tech Stack)

### 핵심 기술 (Core)

- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4

### 상태 및 데이터 관리 (State & Data)

- **상태 관리**: Zustand (전역 상태 관리)
- **서버 상태 관리**: TanStack Query v5 (데이터 페칭 및 캐싱)

### 테스트 및 개발 도구 (Testing & Tooling)

- **단위 테스트**: Jest, Vitest, React Testing Library
- **E2E 테스트**: Playwright
- **컴포넌트 문서화**: Storybook
- **코드 품질 관리**: ESLint 9 (Flat Config), Prettier
- **Git 작업 자동화**: Husky, Commitlint, lint-staged

---

## 🏁 시작하기 (Getting Started)

프로젝트를 로컬 환경에서 시작하는 방법입니다.

1. **저장소 클론**

   ```bash
   git clone https://github.com/your-repo/team9.git
   cd team9
   ```

2. **의존성 설치**

   ```bash
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

---

## 🛠️ 개발 및 실행 방법 (Available Commands)

### 📌 핵심 명령어 요약 (Quick Start)

| 명령어               | 용도                       |
| :------------------- | :------------------------- |
| `npm run dev`        | 로컬 개발 서버 실행        |
| `npm run build`      | 프로덕션 빌드 및 최종 점검 |
| `npm run format`     | 코드 스타일 자동 정렬      |
| `npm run type-check` | TypeScript 타입 체크       |
| `npm run test`       | 단위 테스트 실행           |
| `npm run storybook`  | UI 컴포넌트 개별 개발      |

### 🚀 상세 명령어 목록

#### 개발 및 실행 (Development)

| 명령어          | 설명                                                   |
| :-------------- | :----------------------------------------------------- |
| `npm run dev`   | 로컬 개발 서버를 실행합니다. (`http://localhost:3000`) |
| `npm run build` | 프로덕션 배포를 위한 최적화 빌드를 수행합니다.         |
| `npm run start` | 빌드된 결과물로 프로덕션 서버를 실행합니다.            |

#### 코드 품질 및 포맷팅 (Quality & Style)

| 명령어               | 설명                                                 |
| :------------------- | :--------------------------------------------------- |
| `npm run lint`       | ESLint를 통해 코드 컨벤션 및 문법 오류를 검사합니다. |
| `npm run type-check` | TypeScript 타입 체크를 수행합니다. (`tsc --noEmit`)  |
| `npm run format`     | Prettier를 통해 전체 코드 포맷팅을 자동 수정합니다.  |

#### 테스트 (Testing)

| 명령어                  | 설명                                                         |
| :---------------------- | :----------------------------------------------------------- |
| `npm run test`          | Jest를 사용하여 모든 단위 테스트를 실행합니다.               |
| `npm run test:watch`    | 변경된 파일 위주로 테스트를 감시 모드로 실행합니다.          |
| `npm run test:watchAll` | 전체 파일을 테스트 감시 모드로 실행합니다.                   |
| `npm run test:changed`  | 마지막 커밋 이후 변경된 파일에 대해서만 테스트를 실행합니다. |
| `npm run test:coverage` | 테스트 커버리지 리포트를 생성합니다.                         |

#### 컴포넌트 개발 (UI Development)

| 명령어                    | 설명                                                        |
| :------------------------ | :---------------------------------------------------------- |
| `npm run storybook`       | Storybook 개발 서버를 실행합니다. (`http://localhost:6006`) |
| `npm run build-storybook` | Storybook을 정적 파일로 빌드합니다.                         |

#### 기타 (Infrastructure)

| 명령어            | 설명                                    |
| :---------------- | :-------------------------------------- |
| `npm run prepare` | Husky 및 Git Hooks 설정을 초기화합니다. |

---

## 💻 개발 환경 설정 (Setup)

### VS Code 추천 확장 (Recommended Extensions)

원활한 개발을 위해 다음 VS Code 확장 도구 설치를 권장합니다. (`.vscode/extensions.json`)

- **ESLint**: `dbaeumer.vscode-eslint` (코드 정적 분석 및 린트)
- **Prettier**: `esbenp.prettier-vscode` (코드 포맷팅)
- **Tailwind CSS IntelliSense**: `bradlc.vscode-tailwindcss` (Tailwind CSS 자동 완성 및 미리보기)

### VS Code 설정

프로젝트에 포함된 `.vscode/settings.json`을 통해 저장 시 자동으로 다음 작업이 수행됩니다:

- Prettier 포맷팅
- ESLint 자동 수정 (Import 순서 정렬 포함)

---

## 📂 폴더 구조 (Folder Structure)

본 프로젝트는 **도메인(Feature) 기반 구조**를 채택하여 관련 로직을 한데 모으고 유지보수성을 극대화했습니다.

```text
src/
├── app/                # Next.js App Router (라우팅 및 페이지 레이아웃 전용)
├── features/           # 핵심 비즈니스 로직 (도메인 단위 모듈)
│   └── [domain-name]/  # 예: auth, user, order 등
│       ├── components/ # 해당 도메인에서만 사용되는 컴포넌트
│       ├── hooks/      # 해당 도메인 전용 커스텀 훅
│       ├── store/      # 해당 도메인의 Zustand 스토어
│       ├── queries/    # 해당 도메인의 TanStack Query (api 호출 포함)
│       ├── types/      # 해당 도메인 전용 타입 정의
│       └── index.ts    # 외부 노출 엔트리포인트
├── components/         # 여러 도메인에서 공용으로 사용하는 컴포넌트
│   ├── ui/             # 원자(Atomic) 컴포넌트 (Base UI 기반)
│   └── common/         # Layout, Header, Footer 등 공용 컴포넌트
├── hooks/              # 전역 공통 커스텀 훅
├── lib/                # 외부 라이브러리 초기 설정 (예: utils, query-client)
└── types/              # 프로젝트 전역 공통 타입 정의

tests/e2e               # Playwright E2E 테스트 시나리오
.github/workflows/      # CI/CD (GitHub Actions)
```

---

## 📏 개발 규칙 및 컨벤션 (Conventions)

### 1. 브랜치 전략 (Branch Strategy)

본 프로젝트는 **Git Flow** 전략을 기반으로 협업합니다.

- **main**: 프로덕션 환경에 배포되는 최상위 브랜치입니다.
- **develop**: 다음 출시 버전을 개발하는 통합 브랜치입니다.
- **feature**: 새로운 기능을 개발하는 브랜치입니다. `develop`에서 생성하며, 완료 후 `develop`으로 PR을 보냅니다.

**브랜치 네이밍 규칙**: `type/#issuenumber-description` (예: `feat/#12-login-page`)

### 2. 네이밍 컨벤션

| 대상            | 규칙       | 예시                        |
| :-------------- | :--------- | :-------------------------- |
| 폴더명          | kebab-case | `button/`, `user-auth/`     |
| 파일명          | kebab-case | `button.tsx`, `use-auth.ts` |
| 컴포넌트        | PascalCase | `Button`, `DatePicker`      |
| 훅              | camelCase  | `useAuth`, `useToggle`      |
| 타입/인터페이스 | PascalCase | `ButtonProps`, `UserData`   |

### 3. Import 순서 정렬 (자동화)

```typescript
// 1. React 관련 -> 2. Next.js 관련 -> 3. 외부 라이브러리 -> 4. 프로젝트 내부 (@/*) -> 5. 상대 경로
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LocalUtils } from './utils';
```

### 4. 커밋 메시지 규칙 (Commitlint)

`type: description` 형식을 엄격히 준수해야 커밋이 가능합니다.

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅 (로직 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가 및 수정
- `chore`: 빌드 업무, 패키지 설정 변경
- `design`: UI 디자인 스타일만 수정 (CSS 등)
- `perf`: 성능 개선 작업

---

## ⚓ Git Hooks & 자동화 (Automation)

본 프로젝트는 **Husky**와 **lint-staged**를 사용하여 코드 품질을 자동으로 검증합니다.

### Pre-commit 실행 순서

1. **Type Check**: `tsc --noEmit` 전체 타입 검사
2. **Lint-staged**: 스테이징된 파일에 대해 Prettier(포맷팅), ESLint(컨벤션), Jest(연관 테스트) 실행

### Commit-msg 실행

- **Commitlint**: 커밋 메시지 규칙 준수 여부 검사

---

## 🧪 CI/CD 파이프라인 (CI/CD Pipeline)

GitHub Actions를 사용하여 자동화된 검증 및 배포 프로세스를 운영합니다.

### 1. CI (Continuous Integration): 코드 검증

모든 PR에 대해 다음 작업이 **병렬(Parallel)**로 실행됩니다:

- **Lint & Type Check**: 코드 컨벤션 및 타입 안정성 검사
- **Unit Tests**: `jest` 단위 테스트 실행
- **Build & E2E Tests**: 빌드 성공 여부 및 `playwright` 시나리오 테스트

### 2. CD (Continuous Deployment): 자동 배포

- **트리거**: `main` 브랜치로 병합 시 발생
- **절차**: 모든 CI 작업 성공 후 Vercel을 통해 자동 배포됩니다.
