# 픽셀 아트 에디터 Review

## 검증 결과 요약

전체적으로 구현 품질이 높고 명세를 충실히 따르고 있다.
BFS flood fill에서 동일 셀이 큐에 중복 추가될 수 있는 성능 버그 1건을 발견하여 수정했다.
나머지 기능·구조·반응형 항목은 모두 정상이다.

---

## 기능 체크리스트

### 기능 정확성

| 항목 | 결과 | 비고 |
|------|------|------|
| 16×16 그리드 생성 (256개 셀, data-row/col) | PASS | `initGrid()` 이중 루프, `cell.dataset.row/col` 올바르게 설정 |
| 펜 도구: 클릭 + 드래그 연속 그리기 | PASS | 각 셀 `mousemove` + `isDrawing` 플래그로 구현 |
| 지우개 도구: 셀을 null로 초기화 | PASS | `pixels[row][col] = null` 후 `renderCell` 호출 |
| 채우기 도구: BFS flood fill | PASS (수정 후) | 중복 큐 버그 수정 완료 (아래 참조) |
| 스포이트: 색상 획득 후 펜 자동 전환 | PASS | `setActiveTool('pen')` 호출 확인 |
| 팔레트 32색 스와치 초기화 및 activeColor 변경 | PASS | `PALETTE` 배열 32개 정확, 클릭 핸들러 정상 |
| 커스텀 color input 연동 | PASS | `input` 이벤트로 `activeColor` 즉시 반영 |
| Clear 버튼: 전체 픽셀 null 초기화 | PASS | `pixels` 배열 재생성 후 `renderAll()` 호출 |
| 그리드 토글: 클래스 토글 + 버튼 텍스트 변경 | PASS | `classList.toggle('grid-visible')` 후 텍스트 조건 분기 |
| PNG 저장: canvas → toDataURL → a.download | PASS | 흰 배경 fill 후 픽셀 순회, `a.click()` 트리거 |

### 버그 및 엣지 케이스

| 항목 | 결과 | 비고 |
|------|------|------|
| flood fill 큐 중복 추가 방지 | PASS (수정 후) | 수정 전: 셀을 dequeue 시점에 채워 동일 셀이 여러 번 push 가능 → 수정 후: enqueue 시점에 즉시 채워 중복 진입 차단 |
| 마우스가 그리드 밖으로 나갈 때 isDrawing 해제 | PASS | `gridEl.mouseleave` + `document.mouseup` 두 곳에서 모두 처리 |
| 터치 이벤트 `{ passive: false }` | PASS | `touchstart`, `touchmove`, `touchend` 세 핸들러 모두 적용 |
| 스포이트로 빈 셀(null) 클릭 | PASS | null이면 `'#ffffff'`로 대체 후 펜 전환 (동작은 정상, 의도된 처리) |

### HTML/CSS 구조

| 항목 | 결과 | 비고 |
|------|------|------|
| meta viewport 설정 | PASS | `width=device-width, initial-scale=1.0` |
| 모바일 `@media max-width: 640px` — 팔레트 아래 이동 | PASS | `flex-direction: column` 적용, `palette-panel` 너비 100% |
| 캔버스 컨테이너 `overflow: auto` | PASS | `.canvas-container { overflow: auto }` |

---

## 발견된 문제 및 수정 내역

### 문제 1: BFS flood fill 큐 중복 추가 (성능 버그)

**위치**: `editor.js` `floodFill()` 함수

**원인**: 셀의 색상을 `queue.shift()`로 꺼낸 뒤에 fill로 바꾸는 방식이었기 때문에,
같은 셀이 dequeue되기 전에 여러 이웃 셀에서 동시에 push될 수 있었다.
예를 들어 4방향 이웃 셀이 모두 같은 target 색상이면, 그 셀이 큐에 최대 4번 들어갈 수 있다.
결과적으로 큐 크기가 O(n²)까지 커질 수 있어 대면적 fill 시 성능이 저하된다.
(무한루프는 발생하지 않음 — dequeue 시 `pixels[r][c] !== target` 조건이 두 번째 처리를 차단함)

**수정 내용**: 셀을 큐에 넣기 **전에** 즉시 `pixels[nr][nc] = fill`과 `renderCell` 호출.
이후 같은 셀이 다시 조건을 만족하지 못하므로 중복 push가 발생하지 않는다.

```js
// 수정 전
const queue = [[startRow, startCol]];
while (queue.length) {
  const [r, c] = queue.shift();
  if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
  if (pixels[r][c] !== target) continue;
  pixels[r][c] = fill;
  renderCell(r, c);
  queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
}

// 수정 후
pixels[startRow][startCol] = fill;
renderCell(startRow, startCol);
const queue = [[startRow, startCol]];
while (queue.length) {
  const [r, c] = queue.shift();
  for (const [nr, nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]) {
    if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
    if (pixels[nr][nc] !== target) continue;
    pixels[nr][nc] = fill;
    renderCell(nr, nc);
    queue.push([nr, nc]);
  }
}
```

---

## 최종 판정

**PASS**

버그 1건(flood fill 큐 중복 추가)을 수정했으며, 수정 후 모든 기능·엣지케이스·구조 항목이 명세를 충족한다.
