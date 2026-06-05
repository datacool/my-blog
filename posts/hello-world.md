# Hello World

안녕하세요! 첫 번째 블로그 글에 오신 것을 환영합니다.

## 이 블로그에 대해

이 블로그는 프레임워크 없이 순수한 **HTML, CSS, JavaScript**만으로 만든 정적 블로그입니다. 마크다운 파일을 읽어서 웹페이지로 바로 렌더링합니다.

### 주요 특징

- 다크모드 지원 — 시스템 설정을 따르거나 버튼으로 직접 전환
- 반응형 디자인 — 모바일, 태블릿, 데스크톱 모두 지원
- 코드 문법 강조 — highlight.js 기반
- 빌드 도구 없음 — 파일 저장 후 새로고침하면 바로 반영

## 예시 코드

```javascript
// 마크다운을 HTML로 변환하는 핵심 코드
fetch('posts/' + slug + '.md')
  .then(r => r.text())
  .then(md => {
    document.getElementById('post-content').innerHTML = marked.parse(md);
  });
```

```python
# Python으로 간단한 HTTP 서버 실행
import http.server
import socketserver

PORT = 8080
with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
    print(f"서버 실행 중: http://localhost:{PORT}")
    httpd.serve_forever()
```

## 블로그 시작하기

새 글을 작성하려면 두 가지만 하면 됩니다.

1. `posts/` 폴더에 `.md` 파일 추가
2. `posts/index.json`에 메타데이터 추가

```json
{
  "slug": "my-new-post",
  "title": "나의 새 글",
  "date": "2026-06-06",
  "summary": "글 요약입니다."
}
```

> 로컬에서 확인하려면 `python -m http.server 8080`을 실행하고 `http://localhost:8080`에 접속하세요. `file://`로 직접 열면 fetch 요청이 차단됩니다.

앞으로 다양한 글로 찾아올게요. 감사합니다!
