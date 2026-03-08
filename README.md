# Team9 프로젝트

## 🚀 기술 스택 (Tech Stack)

### 핵심 기술 (Core)

- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4, @base-ui/react

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

## 📏 코드 컨벤션 (Conventions)

### 네이밍 컨벤션

| 대상            | 규칙       | 예시                                    |
| --------------- | ---------- | --------------------------------------- |
| 폴더명          | kebab-case | `button/`, `date-picker/`, `user-auth/` |
| 파일명          | kebab-case | `button.tsx`, `use-auth.ts`             |
| 컴포넌트        | PascalCase | `Button`, `DatePicker`                  |
| 훅              | camelCase  | `useAuth`, `useToggle`                  |
| 타입/인터페이스 | PascalCase | `ButtonProps`, `UserData`               |

### 2. Import 순서 정렬 (자동화)

```typescript
// 1. React 관련 패키지
import React, { useState } from 'react';

// 2. Next.js 관련 패키지
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 3. 외부 라이브러리 (Third-party)
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

// 4. 프로젝트 내부 경로 별칭 (@/*)
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import '../styles/globals.css';
// 5. 상대 경로 및 스타일 파일
import { LocalUtils } from './utils';
```

### 3. 커밋 메시지 규칙 (Commitlint)

`type: description` 형식을 엄격히 준수해야 커밋이 가능합니다.

- `feat`: 새로운 기능 추가 (예: `feat: 카카오 로그인 기능 추가`)
- `fix`: 버그 수정 (예: `fix: 모바일에서 버튼 클릭 안되는 현상 수정`)
- `docs`: 문서 수정 (예: `docs: README 구조 업데이트`)
- `style`: 코드 포맷팅, 세미콜론 누락 등 (로직 변경 없음)
- `refactor`: 코드 리팩토링 (기능 변경 없이 가독성/구조 개선)
- `test`: 테스트 코드 추가 및 수정
- `chore`: 빌드 업무, 패키지 설정 변경 (예: `chore: lodash 패키지 추가`)
- `design`: UI 디자인 스타일만 수정 (CSS 등)
- `perf`: 성능 개선 작업

---

## 🛠️ 개발 및 실행 방법 (Available Commands)

### 🚀 개발 및 실행 (Development)

- `npm run dev`: **로컬 개발 서버**를 실행합니다. (`http://localhost:3000`)
- `npm run build`: 프로덕션 배포를 위한 **최적화 빌드**를 수행합니다.
- `npm run start`: 빌드된 결과물로 **프로덕션 서버**를 실행합니다.

### 🧹 코드 품질 및 포맷팅 (Quality & Style)

- `npm run lint`: **ESLint 9**를 통해 코드의 문법 오류 및 컨벤션 위반을 검사합니다.
- `npm run format`: **Prettier**를 통해 전체 파일의 **코드 포맷팅 및 임포트 순서**를 자동 정렬합니다.

### 🧪 테스트 (Testing)

- `npm run test`: **Jest**를 사용하여 단위 테스트(Unit Test)를 실행합니다.
- `npx vitest`: **Vitest**를 사용하여 빠른 유닛 테스트를 실행합니다.
- `npx playwright test`: **Playwright**를 사용하여 브라우저 기반 E2E 테스트를 실행합니다.

### 🎨 컴포넌트 개발 (UI Development)

- `npm run storybook`: **Storybook** 개발 서버를 실행하여 컴포넌트를 독립적으로 확인하고 개발합니다.
- `npm run build-storybook`: Storybook을 정적 파일로 빌드하여 배포 준비를 합니다.

### 🛠 기타 (Infrastructure)

- `npm run prepare`: **Husky** 설정을 초기화합니다. (Git Hooks 자동 설정)

---

### 💡 용도별 요약 가이드

| 상황                        | 추천 명령어                        |
| :-------------------------- | :--------------------------------- |
| **코딩 시작 전**            | `npm run dev`                      |
| **코딩 완료 후 / 커밋 전**  | `npm run format` && `npm run lint` |
| **컴포넌트만 따로 만들 때** | `npm run storybook`                |
| **배포하기 전 최종 점검**   | `npm run build` && `npm run test`  |

---

## 🧪 CI/CD 프로세스

GitHub에 코드를 Push하거나 PR(Pull Request)을 생성하면 GitHub Actions가 자동으로 다음 과정을 검사합니다:

1. **Lint**: 코드 컨벤션 준수 여부
2. **Type Check**: TypeScript 타입 오류 검사
3. **Unit Test**: 작성된 Jest 테스트 통과 여부
4. **E2E Test**: Playwright 시나리오 통과 여부

모든 단계가 통과되어야 `main` 또는 `develop` 브랜치로 병합할 수 있습니다.
