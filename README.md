## MyBlog 정적 블로그

이 프로젝트는 **마크다운 기반 커스텀 정적 사이트 생성기(SSG)** 로 구동되는 개인 블로그입니다.

### 주요 기능

- 마크다운(`.md`) 파일로 글 작성
- 연/월 디렉터리 구조로 포스트 관리 (예: `content/2025/01/hello-world.md`)
- 프론트매터(YAML) 기반 메타데이터
  - `title`, `date`, `category`, `tags`, `summary`
- 정적 HTML 빌드 후 `dist/` 폴더를 GitHub Pages로 배포
- Home / About / Blog 메뉴
- 카테고리, 태그, 월별 아카이브 페이지 자동 생성

### 설치 및 빌드

```bash
npm install
npm run build
```

빌드 후 `dist/` 폴더가 생성됩니다.

### 배포

GitHub Pages에 배포하는 방법은 `DEPLOY.md` 파일을 참고하세요.

**빠른 배포 (GitHub Actions 사용):**
1. GitHub 저장소 생성
2. 코드 푸시: `git init && git add . && git commit -m "Initial commit" && git remote add origin YOUR_REPO_URL && git push -u origin main`
3. GitHub 저장소 Settings → Pages → Source를 "GitHub Actions"로 설정
4. 자동으로 빌드 및 배포됩니다!

### 마크다운 작성 예시

```md
---
title: "첫 번째 글"
date: "2025-01-15"
category: "Flutter"
tags:
  - riverpod
  - supabase
summary: "Flutter와 Supabase로 만든 첫 번째 예제 글입니다."
---

여기에 본문 내용을 작성합니다.
```

