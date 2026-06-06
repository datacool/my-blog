# 픽셀 아트 에디터 구현 명세서

## 1. 앱 개요

16×16 격자 위에 도트(픽셀)를 찍어 픽셀 아트를 그리는 웹 기반 에디터다.
펜·지우개·채우기 도구와 32색 기본 팔레트를 제공하며, 완성된 그림을
HTML5 Canvas API를 통해 PNG 파일로 저장할 수 있다.
마크다운 블로그 포트폴리오의 미니 웹앱으로, `apps/pixel-art/` 폴더 안에서
완전히 자체완결되며 블로그 공통 파일에 일절 영향을 주지 않는다.

---

## 2. 파일 구조

```
apps/pixel-art/
├── index.html   # 에디터 마크업 (헤더, 툴바, 팔레트 패널, 캔버스 영역)
├── style.css    # 레이아웃, 그리드, 팔레트, 버튼 스타일, 반응형
└── editor.js    # 상태 관리, 도구 로직, flood fill, 이벤트 처리, PNG 저장
```

외부 라이브러리·CDN 의존성 없음. 세 파일만으로 동작한다.

---

## 3. 기능 명세

### 3-1. 캔버스 (16×16 그리드)

- 논리 해상도: 16열 × 16행 = 256개 셀.
- 각 셀의 렌더 크기: 기본 32px × 32px (CSS로 지정).
- 전체 그리드 표시 크기: 512px × 512px (데스크톱 기준).
- 내부 상태: `pixels[16][16]` — 각 원소는 hex 색상 문자열(`#rrggbb`) 또는
  `null` (투명/배경색).
- 그리드 라인: 1px 실선, 색상 `#cccccc` (토글 가능).
- DOM 구현: CSS Grid(`grid-template-columns: repeat(16, 32px)`)로 256개
  `<div class="cell" data-row="r" data-col="c">` 생성. 각 셀의 배경색을 직접 설정한다.

### 3-2. 도구

| 도구 | ID | 동작 설명 |
|------|----|-----------|
| 펜 (Pen) | `tool-pen` | 셀 클릭·드래그 시 현재 활성 색상으로 칠함 |
| 지우개 (Eraser) | `tool-eraser` | 셀 클릭·드래그 시 해당 셀을 `null`(흰색 배경)으로 초기화 |
| 채우기 (Fill) | `tool-fill` | 클릭한 셀과 동일한 색상으로 연결된 영역을 flood fill |
| 스포이트 (Eyedropper) | `tool-eyedropper` | 클릭한 셀의 색상을 활성 색상으로 가져옴 |

- 활성 도구는 버튼에 `.active` 클래스를 부여해 시각적으로 구분한다.
- 기본 활성 도구: 펜.

#### Flood Fill 알고리즘 (3-2-a)

- 입력: 시작 셀 `(row, col)`, 대상 색상(시작 셀의 현재 색), 채울 색상.
- 대상 색상 = 채울 색상이면 즉시 반환 (무한루프 방지).
- BFS/큐 방식으로 4방향(상·하·좌·우) 인접 셀을 탐색한다.
- 동일한 대상 색상인 셀만 채운다.
- 그리드 경계(0~15)를 초과하는 좌표는 무시한다.

### 3-3. 팔레트

#### 기본 32색 (3-3-a)

행 4 × 열 8 배열. hex 값:

```
Row 0: #000000, #ffffff, #ff0000, #00ff00, #0000ff, #ffff00, #ff00ff, #00ffff
Row 1: #ff8800, #8800ff, #00ff88, #ff0088, #0088ff, #88ff00, #ff8888, #88ff88
Row 2: #8888ff, #ffcc00, #cc00ff, #00ffcc, #ff4444, #44ff44, #4444ff, #ffaa44
Row 3: #aa44ff, #44ffaa, #ff44aa, #333333, #666666, #999999, #cccccc, #eeeeee
```

- 각 색상은 클릭 가능한 `<div class="swatch">` 로 렌더링한다.
- 활성 색상 스와치에는 두꺼운 흰색 테두리 + 외곽 어두운 테두리로 표시한다.
- 기본 활성 색상: `#000000`.

#### 커스텀 색상 입력 (3-3-b)

- `<input type="color">` 요소를 팔레트 하단에 배치한다.
- 값이 변경될 때마다 활성 색상을 즉시 업데이트한다.

### 3-4. PNG 저장

1. `<canvas>` 요소(512×512px)를 생성한다.
2. 흰색(`#ffffff`)으로 배경을 채운다.
3. `pixels[row][col]` 배열을 순회하며 `ctx.fillRect(col*32, row*32, 32, 32)`
   로 각 셀을 그린다. 값이 `null`인 셀은 흰 배경 그대로 유지한다.
4. `canvas.toDataURL('image/png')`로 data URL을 얻는다.
5. `<a download="pixel-art.png" href="...">` 를 생성·클릭해 다운로드한다.
6. PNG 저장 버튼 ID: `btn-save`.

### 3-5. 추가 컨트롤

| 컨트롤 | ID | 동작 |
|--------|----|------|
| Clear 버튼 | `btn-clear` | 모든 셀을 `null`로 초기화 (즉시 실행) |
| 그리드 토글 버튼 | `btn-grid-toggle` | `.grid-visible` 클래스를 토글해 그리드 라인 표시/숨김 |

- 기본 상태: 그리드 표시.

### 3-6. 마우스 드래그로 연속 그리기

- `mousedown` → `mousemove` → `mouseup` 이벤트 조합으로 구현한다.
- `mousedown` 시 `isDrawing = true` 플래그를 설정한다.
- `mousemove` 중 `isDrawing`이 `true`면 현재 도구 동작을 실행한다
  (펜·지우개에만 적용; 채우기·스포이트는 클릭 시에만 실행).
- `mouseup` 및 `mouseleave`(그리드 영역 벗어남) 시 `isDrawing = false`.

### 3-7. 모바일 터치 드래그 지원

- `touchstart`, `touchmove`, `touchend` 이벤트를 `{ passive: false }` 옵션으로 등록한다.
- `touchmove` 이벤트에서 `preventDefault()`를 호출해 페이지 스크롤을 방지한다.
- `event.touches[0].clientX / clientY`로 좌표를 구한 뒤
  `document.elementFromPoint(x, y)`로 대상 셀을 탐지한다.
- 터치 동작은 마우스 드래그와 동일한 코드 경로로 처리한다.

---

## 4. UI 레이아웃 명세

### 4-1. 전체 구조

```
┌─────────────────────────────────────────────────┐
│                    HEADER                       │
│  [ Pixel Art Editor ]              [ ← Blog ]   │
├─────────────────────────────────────────────────┤
│  TOOLBAR                                        │
│  [ 펜 ] [ 지우개 ] [ 채우기 ] [ 스포이트 ]        │
│  [ Clear ] [ 그리드 숨기기 ] [ PNG 저장 ]         │
├──────────────────────┬──────────────────────────┤
│                      │  PALETTE PANEL           │
│   CANVAS AREA        │  ■■■■■■■■ (색상 스와치)   │
│   (16×16 grid)       │  ■■■■■■■■                │
│   512×512px          │  ■■■■■■■■                │
│                      │  ■■■■■■■■                │
│                      │  [커스텀 색상 input]       │
│                      │  현재 색상: ██            │
└──────────────────────┴──────────────────────────┘
```

### 4-2. 헤더

- 좌측: 앱 이름 `Pixel Art Editor` (h1).
- 우측: 블로그 메인으로 돌아가는 링크 `← Blog` (`href="../../index.html"`).

### 4-3. 툴바

- 단일 수평 flex 행. 모바일에서는 두 줄로 줄 바꿈 허용 (`flex-wrap: wrap`).
- 도구 버튼(펜·지우개·채우기·스포이트)과 액션 버튼(Clear·그리드·저장)을
  시각적으로 구분한다.
- 활성 도구 버튼: 배경색 강조 + 테두리 강조.

### 4-4. 메인 영역

- CSS Flexbox: 좌측 캔버스 + 우측 팔레트 패널을 나란히 배치.
- 모바일(최대 너비 640px): 세로 스택(`flex-direction: column`),
  캔버스가 위, 팔레트가 아래.
- 캔버스 컨테이너에 `overflow: auto`를 적용해 내부 스크롤로 처리한다
  (셀 크기를 모바일에서 줄이지 않음 — 손가락 터치 정확도 유지).

### 4-5. 팔레트 패널

- 스와치 그리드: `display: grid; grid-template-columns: repeat(8, 28px)`.
- 각 스와치: 28px × 28px, `border-radius: 4px`.
- 활성 스와치: `outline: 3px solid #fff; box-shadow: 0 0 0 4px #333`.
- 패널 하단: "커스텀 색상" 레이블 + `<input type="color">`.
- 현재 활성 색상을 40px × 40px 색상 미리보기 박스로 표시.

---

## 5. 기술 스택

| 항목 | 내용 |
|------|------|
| 마크업 | 순수 HTML5 |
| 스타일 | 순수 CSS3 (CSS Custom Properties, CSS Grid, Flexbox) |
| 로직 | 순수 Vanilla JavaScript (ES6+) |
| 외부 의존성 | 없음 (CDN 미사용) |
| 이미지 저장 | HTML5 Canvas API + `toDataURL('image/png')` |
| 데이터 저장 | 없음 (픽셀 상태는 메모리에만 유지) |
| 빌드 도구 | 없음 |

---

## 6. 제약 사항

- `apps/pixel-art/` 폴더 **외부** 파일은 일절 수정하지 않는다.
  - 루트의 `index.html`, `style.css`, `app.js`, `post.js`, `posts/` 등
    블로그 공통 파일 수정 금지.
- CDN 또는 외부 URL에서 스크립트·스타일을 불러오지 않는다.
- React, Vue, Angular 등 프레임워크 및 npm 패키지 사용 금지.
- `apps/pixel-art/index.html`은 `file://` 프로토콜로 직접 열어도 동작해야 한다.
- 터치 이벤트 등록 시 `{ passive: false }` 옵션을 명시한다.
