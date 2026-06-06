/* ===== 상수 ===== */
const GRID_SIZE = 16;
const CELL_PX = 32;

const PALETTE = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff8800', '#8800ff', '#00ff88', '#ff0088', '#0088ff', '#88ff00', '#ff8888', '#88ff88',
  '#8888ff', '#ffcc00', '#cc00ff', '#00ffcc', '#ff4444', '#44ff44', '#4444ff', '#ffaa44',
  '#aa44ff', '#44ffaa', '#ff44aa', '#333333', '#666666', '#999999', '#cccccc', '#eeeeee',
];

/* ===== 상태 변수 ===== */
let pixels = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
let activeTool = 'pen';
let activeColor = '#000000';
let isDrawing = false;
let winShown = false; // 구조 통일을 위해 유지

/* ===== DOM 참조 ===== */
const gridEl = document.getElementById('grid');
const swatchesEl = document.getElementById('swatches');
const colorInput = document.getElementById('color-input');
const colorPreview = document.getElementById('current-color-preview');
const btnClear = document.getElementById('btn-clear');
const btnGridToggle = document.getElementById('btn-grid-toggle');
const btnSave = document.getElementById('btn-save');
const toolButtons = document.querySelectorAll('.tool-btn');

/* ===== 셀 DOM 캐시 ===== */
const cellEls = [];

/* ===== 그리드 초기화 ===== */
function initGrid() {
  gridEl.innerHTML = '';
  cellEls.length = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    cellEls[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDrawing = true;
        applyTool(r, c);
      });

      cell.addEventListener('mousemove', () => {
        if (!isDrawing) return;
        if (activeTool === 'pen' || activeTool === 'eraser') {
          applyTool(r, c);
        }
      });

      gridEl.appendChild(cell);
      cellEls[r][c] = cell;
    }
  }
}

/* ===== 셀 렌더링 ===== */
function renderCell(row, col) {
  const cell = cellEls[row][col];
  const color = pixels[row][col];
  cell.style.backgroundColor = color !== null ? color : '';
}

function renderAll() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      renderCell(r, c);
    }
  }
}

/* ===== 도구 적용 ===== */
function applyTool(row, col) {
  switch (activeTool) {
    case 'pen':
      pixels[row][col] = activeColor;
      renderCell(row, col);
      break;
    case 'eraser':
      pixels[row][col] = null;
      renderCell(row, col);
      break;
    case 'fill':
      floodFill(row, col);
      break;
    case 'eyedropper':
      activeColor = pixels[row][col] !== null ? pixels[row][col] : '#ffffff';
      updateColorUI();
      // 스포이트 사용 후 펜 도구로 자동 전환
      setActiveTool('pen');
      break;
  }
}

/* ===== Flood Fill (BFS) ===== */
function floodFill(startRow, startCol) {
  const target = pixels[startRow][startCol];
  const fill = activeColor;
  if (target === fill) return;

  // 시작 셀을 즉시 채워 중복 큐 진입 방지
  pixels[startRow][startCol] = fill;
  renderCell(startRow, startCol);

  const queue = [[startRow, startCol]];
  while (queue.length) {
    const [r, c] = queue.shift();
    const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
    for (const [nr, nc] of neighbors) {
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
      if (pixels[nr][nc] !== target) continue;
      // 큐에 넣기 전 즉시 채워 중복 추가 방지
      pixels[nr][nc] = fill;
      renderCell(nr, nc);
      queue.push([nr, nc]);
    }
  }
}

/* ===== 색상 UI 업데이트 ===== */
function updateColorUI() {
  colorPreview.style.backgroundColor = activeColor;
  colorInput.value = activeColor;

  // 팔레트 스와치 활성 상태 업데이트
  const swatches = swatchesEl.querySelectorAll('.swatch');
  swatches.forEach((swatch) => {
    if (swatch.dataset.color.toLowerCase() === activeColor.toLowerCase()) {
      swatch.classList.add('active');
    } else {
      swatch.classList.remove('active');
    }
  });
}

/* ===== 활성 도구 설정 ===== */
function setActiveTool(toolName) {
  activeTool = toolName;
  toolButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.id === `tool-${toolName}`);
  });
}

/* ===== 팔레트 초기화 ===== */
function initPalette() {
  swatchesEl.innerHTML = '';
  PALETTE.forEach((color) => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.dataset.color = color;
    swatch.style.backgroundColor = color;
    swatch.title = color;

    if (color.toLowerCase() === activeColor.toLowerCase()) {
      swatch.classList.add('active');
    }

    swatch.addEventListener('click', () => {
      activeColor = color;
      colorInput.value = color;
      updateColorUI();
    });

    swatchesEl.appendChild(swatch);
  });
}

/* ===== PNG 저장 ===== */
function savePNG() {
  const canvas = document.createElement('canvas');
  canvas.width = GRID_SIZE * CELL_PX;
  canvas.height = GRID_SIZE * CELL_PX;
  const ctx = canvas.getContext('2d');

  // 흰색 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 픽셀 그리기
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (pixels[r][c] !== null) {
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

/* ===== 마우스 전역 이벤트 ===== */
document.addEventListener('mouseup', () => {
  isDrawing = false;
});

// 그리드 영역 벗어날 때도 드래그 중지
gridEl.addEventListener('mouseleave', () => {
  isDrawing = false;
});

/* ===== 터치 이벤트 ===== */
function getTouchCell(touch) {
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!el || !el.classList.contains('cell')) return null;
  return {
    row: parseInt(el.dataset.row, 10),
    col: parseInt(el.dataset.col, 10),
  };
}

gridEl.addEventListener('touchstart', (e) => {
  e.preventDefault();
  isDrawing = true;
  const pos = getTouchCell(e.touches[0]);
  if (pos) applyTool(pos.row, pos.col);
}, { passive: false });

gridEl.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!isDrawing) return;
  if (activeTool !== 'pen' && activeTool !== 'eraser') return;
  const pos = getTouchCell(e.touches[0]);
  if (pos) applyTool(pos.row, pos.col);
}, { passive: false });

gridEl.addEventListener('touchend', (e) => {
  e.preventDefault();
  isDrawing = false;
}, { passive: false });

/* ===== 버튼 이벤트 ===== */
// 도구 버튼
document.getElementById('tool-pen').addEventListener('click', () => setActiveTool('pen'));
document.getElementById('tool-eraser').addEventListener('click', () => setActiveTool('eraser'));
document.getElementById('tool-fill').addEventListener('click', () => setActiveTool('fill'));
document.getElementById('tool-eyedropper').addEventListener('click', () => setActiveTool('eyedropper'));

// Clear
btnClear.addEventListener('click', () => {
  pixels = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  renderAll();
});

// 그리드 토글
btnGridToggle.addEventListener('click', () => {
  const isVisible = gridEl.classList.toggle('grid-visible');
  btnGridToggle.textContent = isVisible ? '그리드 숨기기' : '그리드 표시';
});

// PNG 저장
btnSave.addEventListener('click', savePNG);

// 커스텀 색상 input
colorInput.addEventListener('input', () => {
  activeColor = colorInput.value;
  // 팔레트 스와치의 active 클래스를 전부 제거 (커스텀 색상이므로 팔레트와 무관)
  swatchesEl.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
  colorPreview.style.backgroundColor = activeColor;
});

/* ===== 초기 실행 ===== */
initGrid();
initPalette();
updateColorUI();
