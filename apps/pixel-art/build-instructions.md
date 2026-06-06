# Build 지침 — 픽셀 아트 에디터

## 역할
이 지침에 따라 `apps/pixel-art/` 폴더 안에 픽셀 아트 에디터를 구현한다.
**이 폴더 외부의 파일은 절대 수정하지 않는다.**

## 참고 파일
- `apps/pixel-art/spec.md` — 전체 기능/UI 명세 (반드시 정독할 것)

## 생성할 파일

```
apps/pixel-art/
├── index.html
├── style.css
└── editor.js
```

---

## index.html 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pixel Art Editor</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>Pixel Art Editor</h1>
    <a href="../../index.html" class="back-link">← Blog</a>
  </header>

  <div class="toolbar">
    <!-- 도구 버튼 4개 -->
    <button id="tool-pen" class="tool-btn active" title="펜">✏️ 펜</button>
    <button id="tool-eraser" class="tool-btn" title="지우개">⬜ 지우개</button>
    <button id="tool-fill" class="tool-btn" title="채우기">🪣 채우기</button>
    <button id="tool-eyedropper" class="tool-btn" title="스포이트">💉 스포이트</button>
    <div class="toolbar-sep"></div>
    <!-- 액션 버튼 3개 -->
    <button id="btn-clear">Clear</button>
    <button id="btn-grid-toggle">그리드 숨기기</button>
    <button id="btn-save">PNG 저장</button>
  </div>

  <div class="main-area">
    <div class="canvas-container">
      <div id="grid" class="grid grid-visible"></div>
    </div>

    <div class="palette-panel">
      <div id="swatches" class="swatches"></div>
      <div class="custom-color">
        <label for="color-input">커스텀 색상</label>
        <input type="color" id="color-input" value="#000000">
      </div>
      <div class="current-color-label">현재 색상</div>
      <div id="current-color-preview" class="current-color-preview"></div>
    </div>
  </div>

  <script src="editor.js"></script>
</body>
</html>
```

---

## style.css 요구사항

### CSS 변수 (`:root`)
```css
--bg: #1a1a2e;
--surface: #16213e;
--surface2: #0f3460;
--text: #e0e0e0;
--text-muted: #888;
--accent: #e94560;
--border: #2a2a4a;
--btn-bg: #0f3460;
--btn-hover: #e94560;
--cell-empty: #2a2a4a;
--grid-line: rgba(255,255,255,0.08);
```

### 헤더
- `display: flex; justify-content: space-between; align-items: center`
- `position: sticky; top: 0; z-index: 10`
- h1은 크고 굵게

### 툴바
- `display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px`
- `.tool-btn.active`: accent 색상 배경 + 흰색 텍스트
- `.toolbar-sep`: `width: 1px; background: var(--border); margin: 0 4px`

### 그리드
- `display: grid; grid-template-columns: repeat(16, 32px); grid-template-rows: repeat(16, 32px)`
- `.cell`: `width: 32px; height: 32px; background: var(--cell-empty); box-sizing: border-box; cursor: crosshair`
- `.grid-visible .cell`: `border: 1px solid var(--grid-line)`
- `.grid:not(.grid-visible) .cell`: `border: none`

### 메인 영역
- `display: flex; gap: 24px; padding: 16px; align-items: flex-start`
- `.canvas-container`: `overflow: auto` (512px 초과 시 내부 스크롤)

### 팔레트 패널
- `min-width: 260px`
- `.swatches`: `display: grid; grid-template-columns: repeat(8, 28px); gap: 4px`
- `.swatch`: `width: 28px; height: 28px; border-radius: 4px; cursor: pointer; border: 1px solid rgba(255,255,255,0.2)`
- `.swatch.active`: `outline: 3px solid #fff; box-shadow: 0 0 0 4px #333`
- `.current-color-preview`: `width: 40px; height: 40px; border-radius: 6px; border: 2px solid var(--border)`

### 모바일 (`max-width: 640px`)
```css
.main-area { flex-direction: column; }
.palette-panel { min-width: unset; width: 100%; }
.swatches { grid-template-columns: repeat(8, 1fr); }
```

---

## editor.js 구현 상세

### 상태 변수
```js
const GRID_SIZE = 16;
const CELL_PX = 32;

let pixels = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
let activeTool = 'pen';
let activeColor = '#000000';
let isDrawing = false;
let winShown = false; // 미사용이지만 구조 통일을 위해 유지
```

### 기본 32색 팔레트
```js
const PALETTE = [
  '#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff',
  '#ff8800','#8800ff','#00ff88','#ff0088','#0088ff','#88ff00','#ff8888','#88ff88',
  '#8888ff','#ffcc00','#cc00ff','#00ffcc','#ff4444','#44ff44','#4444ff','#ffaa44',
  '#aa44ff','#44ffaa','#ff44aa','#333333','#666666','#999999','#cccccc','#eeeeee',
];
```

### 초기화 (`initGrid`)
- `#grid`를 비운 뒤 256개 `<div class="cell" data-row="r" data-col="c">` 생성
- 각 셀에 마우스 이벤트 리스너 등록

### 셀 렌더링 (`renderCell(row, col)`)
- `pixels[row][col]`이 null이면 `cell.style.backgroundColor = ''`
- 값이 있으면 `cell.style.backgroundColor = pixels[row][col]`

### 도구 적용 (`applyTool(row, col)`)
```
pen      → pixels[row][col] = activeColor; renderCell
eraser   → pixels[row][col] = null; renderCell
fill     → floodFill(row, col)
eyedrop  → activeColor = pixels[row][col] ?? '#ffffff'; updateColorUI
```

### Flood Fill (`floodFill(startRow, startCol)`)
```js
function floodFill(startRow, startCol) {
  const target = pixels[startRow][startCol];
  const fill = activeColor;
  if (target === fill) return;
  const queue = [[startRow, startCol]];
  while (queue.length) {
    const [r, c] = queue.shift();
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
    if (pixels[r][c] !== target) continue;
    pixels[r][c] = fill;
    renderCell(r, c);
    queue.push([r-1,c],[r+1,c],[r,c-1],[r,c+1]);
  }
}
```

### 마우스 이벤트 (셀별)
- `mousedown`: `isDrawing = true; applyTool(row, col)` (단, fill/eyedrop은 클릭만)
- `mousemove`: `if (isDrawing && (pen || eraser)) applyTool(row, col)`
- `document.addEventListener('mouseup', () => isDrawing = false)`

### 터치 이벤트 (그리드 컨테이너)
- `touchstart`, `touchmove`, `touchend` → `{ passive: false }`
- `touchmove` → `preventDefault()` 호출
- `touches[0].clientX/Y` → `document.elementFromPoint` → `.cell` 여부 확인 → `applyTool`

### PNG 저장 (`savePNG`)
```js
function savePNG() {
  const canvas = document.createElement('canvas');
  canvas.width = GRID_SIZE * CELL_PX;
  canvas.height = GRID_SIZE * CELL_PX;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (pixels[r][c]) {
        ctx.fillStyle = pixels[r][c];
        ctx.fillRect(c * CELL_PX, r * CELL_PX, CELL_PX, CELL_PX);
      }
    }
  }
  const a = document.createElement('a');
  a.download = 'pixel-art.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}
```

### 버튼 이벤트
- `#btn-clear`: `pixels` 전체 null 초기화 → 전체 셀 리렌더
- `#btn-grid-toggle`: `#grid.classList.toggle('grid-visible')` + 버튼 텍스트 변경
- `#btn-save`: `savePNG()` 호출

### 팔레트 초기화
- PALETTE 배열을 순회해 `.swatch` div 생성 후 `#swatches`에 append
- 클릭 시 `activeColor` 업데이트, `.active` 클래스 이동, `#color-input.value` 동기화
- `#color-input` change → `activeColor` 업데이트, 모든 스와치 `.active` 제거, 미리보기 업데이트

### 색상 UI 업데이트 (`updateColorUI`)
- `#current-color-preview` 배경색 = `activeColor`
- `#color-input.value` = `activeColor`
- 팔레트에서 해당 색상 스와치에 `.active` 적용 (없으면 모두 제거)

---

## 완료 기준

- [ ] 16×16 그리드가 화면에 렌더링된다
- [ ] 펜으로 클릭/드래그 시 셀에 색상이 칠해진다
- [ ] 지우개로 셀을 지울 수 있다
- [ ] 채우기 도구로 연결된 영역이 한 번에 채워진다
- [ ] 스포이트로 셀 색상을 가져올 수 있다
- [ ] 팔레트 32색 스와치가 표시된다
- [ ] 커스텀 색상 input이 활성 색상을 변경한다
- [ ] Clear 버튼이 전체 그리드를 초기화한다
- [ ] 그리드 토글 버튼이 격자선을 켜고 끈다
- [ ] PNG 저장 버튼이 파일을 다운로드한다
- [ ] 모바일에서 팔레트가 캔버스 아래로 배치된다
