# 마크다운으로 글 쓰기

마크다운은 일반 텍스트로 서식 있는 문서를 작성할 수 있는 경량 마크업 언어입니다. 이 블로그가 지원하는 마크다운 요소들을 알아봅니다.

## 텍스트 서식

**굵게**, *기울임*, ~~취소선~~, `인라인 코드`를 사용할 수 있습니다.

## 제목

`#`의 개수로 제목 수준을 지정합니다.

```
# H1 — 글 제목 (페이지당 하나)
## H2 — 섹션
### H3 — 소섹션
```

## 목록

순서 없는 목록:

- 항목 하나
- 항목 둘
  - 중첩 항목
  - 중첩 항목 둘
- 항목 셋

순서 있는 목록:

1. 첫 번째
2. 두 번째
3. 세 번째

## 링크와 이미지

[링크 텍스트](https://example.com)

이미지는 `![대체 텍스트](이미지 경로)` 형식으로 삽입합니다.

## 인용구

> 좋은 코드는 그 자체로 설명이 된다.
>
> — 로버트 C. 마틴

## 표

| 언어 | 용도 | 하이라이팅 |
|------|------|:----------:|
| JavaScript | 프론트엔드 | ✓ |
| Python | 백엔드, 스크립트 | ✓ |
| Rust | 시스템 프로그래밍 | ✓ |
| Go | 서버, CLI | ✓ |

## 코드 블록

언어를 명시하면 문법 강조가 적용됩니다.

```typescript
interface Post {
  slug: string;
  title: string;
  date: string;
  summary?: string;
}

async function loadPosts(): Promise<Post[]> {
  const res = await fetch('posts/index.json');
  if (!res.ok) throw new Error('Failed to load posts');
  return res.json();
}
```

```css
/* 다크모드 CSS 커스텀 프로퍼티 예시 */
[data-theme="dark"] {
  --color-bg: #0f1117;
  --color-text: #e2e8f0;
  --color-accent: #60a5fa;
}
```

## 구분선

---

마크다운으로 글쓰기는 이게 전부입니다. 파일을 저장하면 바로 블로그에 반영됩니다.
