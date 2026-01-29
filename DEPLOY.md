# GitHub Pages 배포 가이드

## 방법 1: GitHub Actions를 사용한 자동 배포 (권장)

이 방법은 코드를 푸시할 때마다 자동으로 빌드하고 배포합니다.

### 1단계: GitHub 저장소 생성

1. GitHub에서 새 저장소를 생성합니다 (예: `my-blog`)
2. 저장소 이름을 기억해두세요

### 2단계: 로컬에서 Git 초기화 및 푸시

```bash
# Git 초기화
git init

# 모든 파일 추가 (node_modules와 dist는 .gitignore에 의해 제외됨)
git add .

# 첫 커밋
git commit -m "Initial commit: 블로그 프로젝트"

# GitHub 저장소 연결 (YOUR_USERNAME과 YOUR_REPO_NAME을 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# main 브랜치로 푸시
git branch -M main
git push -u origin main
```

### 3단계: GitHub Pages 설정

1. GitHub 저장소 페이지로 이동
2. **Settings** → **Pages** 메뉴 클릭
3. **Source** 섹션에서:
   - **Deploy from a branch** 선택
   - **Branch**: `gh-pages` → **Save** (또는 GitHub Actions 사용 시 자동 설정됨)
4. 또는 **Source**에서 **GitHub Actions** 선택

### 4단계: 배포 확인

- GitHub Actions 탭에서 배포 진행 상황 확인
- 배포 완료 후 `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/` 에서 블로그 확인

---

## 방법 2: 수동 배포 (gh-pages 브랜치 사용)

### 1단계: gh-pages 패키지 설치

```bash
npm install --save-dev gh-pages
```

### 2단계: package.json에 배포 스크립트 추가

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### 3단계: 배포 실행

```bash
npm run deploy
```

이 명령은 `dist` 폴더의 내용을 `gh-pages` 브랜치로 푸시합니다.

---

## 배포 후 확인사항

- [ ] GitHub Pages 설정에서 올바른 브랜치/폴더 선택 확인
- [ ] 블로그가 정상적으로 로드되는지 확인
- [ ] 이미지와 CSS가 정상적으로 표시되는지 확인
- [ ] 모든 링크가 올바르게 작동하는지 확인

---

## 문제 해결

### 404 에러가 발생하는 경우
- GitHub Pages 설정에서 올바른 브랜치/폴더를 선택했는지 확인
- 빌드가 성공적으로 완료되었는지 확인

### 이미지가 표시되지 않는 경우
- 이미지 경로가 상대 경로(`/logo.jpg`)로 시작하는지 확인
- `public` 폴더의 파일이 `dist` 폴더로 복사되었는지 확인
