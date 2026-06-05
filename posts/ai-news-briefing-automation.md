# AI 뉴스 브리핑 자동화 — Claude Cowork로 카카오톡까지 한 번에

매일 아침 AI 관련 뉴스를 직접 찾아보고 정리하는 일이 번거로웠다. 그래서 Claude Cowork를 활용해 뉴스 수집부터 문서 생성, Google Drive 업로드, 카카오톡 발송까지 전 과정을 자동화해봤다. 구현 과정에서 예상치 못한 문제들이 꽤 많았는데, 그 해결 과정도 함께 기록한다.

## 최종 완성된 파이프라인

```
뉴스 수집 (웹 검색)
  ↓
docx 브리핑 문서 생성 (navy 헤더 + 컬러 테이블 포맷)
  ↓
Google Drive 업로드 → Claude in Chrome으로 Google Docs 변환
  ↓
카카오톡 나와의 채팅 자동 발송 (제목 + 하이라이트 + 문서 링크)
```

명령 한 마디면 이 흐름이 전부 자동으로 돌아간다.

---

## 1단계: 브리핑 문서 디자인

처음엔 Google Drive에 텍스트를 plain text로 업로드해서 Google Docs로 변환하는 방식을 썼다. 내용은 들어가지만 포맷이 단조로웠다.

원하는 건 이런 구조였다.

- **Navy 배경 제목 헤더** (날짜·카테고리 정보 포함)
- **컬러 하이라이트 테이블** (★★★ = 골드, ★★ = 파랑, ★ = 초록)
- 섹션별 언더라인 헤딩과 출처·요약·시사점 구조

이를 구현하기 위해 Node.js의 `docx` 라이브러리를 사용했다.

```javascript
const { Document, Packer, Table, TableRow, TableCell,
        ShadingType, WidthType, BorderStyle } = require('docx');

// 하이라이트 행 생성 함수
function hlRow(stars, text, bgColor) {
  return new TableRow({ children: [
    new TableCell({
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun(stars)] })]
    }),
    new TableCell({
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [new TextRun(text)] })]
    }),
  ]});
}

// 색상 정의
const GOLD  = "FFF2CC";  // ★★★
const BLUE  = "DAE8FC";  // ★★★ (파랑)
const GREEN = "D5E8D4";  // ★★★ (초록)
```

생성된 docx를 Word에서 열면 완벽하게 렌더링된다.

---

## 2단계: Google Docs 변환 문제

docx를 Google Drive에 업로드하면 파일은 저장되지만 `docs.google.com` URL이 생기지 않아 카카오톡 링크로 사용하기 어려웠다.

Drive API의 `disableConversionToGoogleType` 옵션을 이리저리 시도해봤지만, docx → Google Docs 자동 변환은 Drive MCP에서 지원하지 않았다.

**해결책: Claude in Chrome 활용**

Drive에 docx를 업로드한 뒤, Claude in Chrome MCP로 브라우저를 직접 제어해 "Google 문서로 열기" 버튼을 클릭했다.

```python
# Claude가 Chrome을 제어해서
# drive.google.com/file/d/{ID}/view 에 접속
# → "Google 문서(으)로 열기" 버튼 클릭
# → 새 탭에서 docs.google.com/document/d/{ID}/edit URL 획득
```

이렇게 하면 Navy 헤더와 컬러 테이블 포맷이 Google Docs에서도 완벽하게 렌더링된다.

---

## 3단계: 카카오톡 자동 발송

카카오톡 "나와의 채팅"으로 보내는 기능은 카카오 Developers에서 앱을 만들고 OAuth 토큰을 발급받아 구현했다. 처음에 몇 가지 시행착오가 있었다.

### 함정 1: Python 경로 문제

Desktop Commander에서 `python` 명령이 인식되지 않았다. Windows에서 Python 실행 경로를 직접 지정해야 했다.

```python
# ❌ 작동 안 함
python send_kakao_me.py

# ✅ 작동함
C:\Python313\python.exe send_kakao_me.py
```

### 함정 2: feed 템플릿 이미지 깨짐

처음에 feed 템플릿에 이미지 URL을 넣었는데, 플레이스홀더 URL이 존재하지 않아 카카오톡에서 깨진 이미지로 표시됐다.

```json
// ❌ 이렇게 하면 이미지 깨짐
{
  "object_type": "feed",
  "content": {
    "image_url": "https://i.imgur.com/removed.png"  // 존재하지 않는 URL
  }
}
```

이미지 없이 text 템플릿을 쓰는 게 더 깔끔했다.

### 함정 3: 텍스트 잘림으로 링크 누락

text 템플릿의 본문에 요약을 넣고 링크를 맨 뒤에 붙였더니, 200자 제한에 걸려 링크가 잘렸다. 링크를 텍스트 본문에 명시적으로 포함시키고 `button_title`도 함께 넣어야 했다.

```python
body = (
    title + "\n\n"
    + description + "\n\n"
    + "📄 전체 문서 보기\n"
    + link  # 링크가 텍스트에 직접 표시됨
)

tmpl = json.dumps({
    "object_type": "text",
    "text": body,
    "link": {
        "web_url": link,
        "mobile_web_url": link
    },
    "button_title": "전체 문서 확인"
}, ensure_ascii=False)
```

### 최종 발송 결과

카카오톡 나와의 채팅에 이런 형식으로 도착한다.

```
🤖 AI 뉴스 브리핑 | 2026-06-05

★★★ Microsoft, Build 2026서 자체 AI 모델 7종 공개
★★★ Anthropic, Claude Opus 4.8 출시
★★★ EU AI Act 8월 전면 시행 임박

📄 전체 문서 보기
https://docs.google.com/document/d/...

[전체 문서 확인]
```

링크를 탭하면 포맷된 Google Docs 문서가 바로 열린다.

---

## 4단계: Claude Cowork 스킬로 통합

이 전체 흐름을 Claude Cowork 스킬로 패키징했다. Cowork에서 "오늘 AI 뉴스 브리핑해줘"라고 입력하면 다음이 자동으로 실행된다.

1. 웹 검색으로 최신 AI 뉴스 수집 (모델·연구·기업·규제·국내 5개 카테고리)
2. Node.js로 포맷된 docx 생성
3. Google Drive "AI 뉴스 브리핑" 폴더에 업로드
4. Claude in Chrome으로 Google Docs 변환
5. `C:\Python313\python.exe send_kakao_me.py` 실행으로 카카오톡 발송

---

## 핵심 교훈

**Desktop Commander가 핵심이다.** Claude Cowork에는 `mcp__Desktop_Commander__start_process` 도구가 있어서 로컬 Python 스크립트를 직접 실행할 수 있다. Claude.ai 웹 채팅에서는 불가능한 기능이다.

**Claude in Chrome으로 브라우저 자동화.** API만으로 해결 안 되는 UI 작업(Google Docs 변환 버튼 클릭)을 브라우저 제어로 우회할 수 있었다. DOM 조작이 필요한 작업에 매우 유용하다.

**포맷 있는 문서는 docx로.** Google Docs API 없이 복잡한 포맷(컬러 테이블, 배경색 헤더)을 만들려면 docx 생성 후 Docs로 변환하는 게 현실적이다.

---

## 사용 스택

- **Claude Cowork** — 전체 오케스트레이션
- **Desktop Commander MCP** — Python 스크립트 자동 실행
- **Claude in Chrome MCP** — 브라우저 자동화 (Google Docs 변환)
- **Google Drive MCP** — 파일 업로드
- **Node.js `docx`** — 포맷 있는 Word 문서 생성
- **Kakao REST API + 솔라피** — 카카오톡 나와의 채팅 발송
- **Python `requests`** — API 호출

자동화 구축에 반나절 걸렸지만, 매일 아침 5분씩 절약된다. 내년이면 손익분기점을 넘는다.
