# UIA Annual Report 2026

UIA 2026 연간 보고서 책 화면. 쪽 이미지를 page-flip으로 넘겨 본다.

- `source/pages.html`: 쪽 20장(1200x1600)을 HTML로 구성한 원본. `?p=0`부터 `?p=19`까지 한 쪽씩 열린다.
- `public/pages/p-00.webp` 부터 `p-19.webp`: `source/pages.html`을 구워 만든 쪽 이미지(1800x2400).
- `src/`: 책 화면(React, Vite).

실행은 `dev.command`를 더블클릭하거나 `npm install` 뒤 `npm run dev`(포트 5192).
