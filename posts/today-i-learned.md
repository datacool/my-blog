# 오늘 배운것

클로드 코드로 마크다운 블로그를 직접 만들어 보면서 HTML, CSS, JavaScript가 각각 어떤 역할을 하는지 몸으로 익혔다. 간단히 정리해 둔다.

## HTML — 페이지의 뼈대

HTML은 페이지에 **무엇이 있는지**를 정의한다. 제목, 단락, 버튼, 링크처럼 콘텐츠의 종류와 구조를 나타낸다.

```html
<header>
  <a href="index.html" class="site-title">My Blog</a>
  <button id="theme-toggle">🌙</button>
</header>
<main>
  <div id="post-list"></div>
</main>
```

이 블로그에서 HTML은 헤더·메인·푸터 같은 레이아웃 뼈대를 잡고, JavaScript가 채울 빈 `<div>`를 미리 배치하는 역할을 했다.

## CSS — 페이지의 옷

CSS는 페이지가 **어떻게 보이는지**를 결정한다. 색상, 폰트, 간격, 반응형 레이아웃이 모두 여기서 나온다.

이번에 특히 유용했던 것은 **CSS 커스텀 프로퍼티(변수)** 였다. 라이트/다크 모드 색상을 변수로 관리하니 테마 전환이 훨씬 간단해졌다.

```css
:root {
  --color-bg: #ffffff;
  --color-text: #1a1a2e;
}

[data-theme="dark"] {
  --color-bg: #0f1117;
  --color-text: #e2e8f0;
}
```

`html` 태그에 `data-theme="dark"` 속성 하나만 붙이면 모든 색상이 한 번에 바뀐다. 반응형은 `@media (max-width: 640px)` 안에서 모바일용 크기를 따로 지정하는 방식으로 처리했다.

## JavaScript — 페이지의 두뇌

JavaScript는 페이지가 **어떻게 동작하는지**를 담당한다. 사용자 인터랙션 처리, 데이터 불러오기, DOM 업데이트가 모두 여기서 이루어진다.

이 블로그에서 JavaScript가 한 일은 크게 세 가지였다.

1. **글 목록 로드** — `fetch('posts/index.json')`으로 메타데이터를 가져와 카드 목록을 그린다
2. **마크다운 렌더링** — `fetch('posts/slug.md')`로 파일을 읽고 `marked.parse()`로 HTML로 변환한다
3. **테마 토글** — 버튼 클릭 시 `data-theme` 속성을 바꾸고 `localStorage`에 저장해 새로고침 후에도 유지한다

```javascript
document.getElementById('theme-toggle').addEventListener('click', function () {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});
```

## 세 가지의 관계

| 역할 | 담당 | 비유 |
|------|------|------|
| 구조 | HTML | 건물의 골조 |
| 디자인 | CSS | 인테리어 |
| 동작 | JavaScript | 전기·배관 |

셋은 각자 독립적이지만 협력한다. HTML 없이는 CSS와 JS가 붙을 곳이 없고, CSS 없이는 보기 불편하고, JS 없이는 정적인 페이지에 머문다.

## VS Code에서 웹 페이지 미리보기

정적 HTML 파일은 `file://`로 직접 열면 `fetch()`가 보안 정책에 막혀 동작하지 않는다. 반드시 로컬 서버를 통해 `http://`로 접근해야 한다.

### 방법 1 — VS Code Simple Browser

1. 터미널에서 `python -m http.server 8080` 실행
2. `Ctrl+Shift+P` → `Simple Browser: Show` 입력
3. URL에 `http://localhost:8080` 입력

에디터 탭 안에 브라우저가 열린다. 별도 확장 설치 없이 바로 쓸 수 있다.

### 방법 2 — Live Preview 확장 (추천)

Microsoft의 **Live Preview** 확장을 설치하면 더 편하다.

- HTML 파일에서 우클릭 → **Show Preview** 선택
- 파일을 저장할 때마다 미리보기가 자동으로 새로고침된다
- 서버를 별도로 띄울 필요가 없다

---

직접 만들어 보니 세 언어의 경계가 훨씬 명확하게 느껴졌다. 다음엔 글 검색 기능이나 태그 필터를 추가해 볼 생각이다.
