# 전북교육행정 AI MVP

GitHub Pages 기반 교육행정 업무지원 포털의 1차 버전입니다.

## 현재 바로 작동하는 기능

- 교육행정 질문 입력 UI
- 등록된 근거자료 키워드 검색 및 출처 표시
- 기존 VibeCoding 업무 계산기 바로가기
- 관리자 화면에서 사용자 자료 추가/삭제
- JSON 자료 가져오기/내보내기
- Cloudflare Worker 주소 등록 시 AI 답변 모드 자동 전환

## 구조

```text
edu-ai/
├─ index.html                  # 사용자 AI/검색 포털
├─ admin.html                  # 브라우저 기반 자료/백엔드 설정
├─ data/
│  └─ documents.json           # 기본 근거자료 메타데이터
└─ backend/
   ├─ worker.js                # OpenAI API 중계용 Cloudflare Worker
   └─ wrangler.toml.example    # Worker 설정 예시
```

## 보안 원칙

OpenAI API 키를 `index.html`, JavaScript, GitHub 저장소에 넣지 않습니다. `OPENAI_API_KEY`는 Cloudflare Worker의 secret으로만 저장합니다.

## AI 활성화 순서

1. Cloudflare Workers 프로젝트를 생성합니다.
2. `backend/worker.js`를 배포합니다.
3. Worker 환경변수 `ALLOWED_ORIGIN=https://kwonoyoung.github.io`를 설정합니다.
4. `OPENAI_MODEL`을 사용할 모델로 설정합니다. 예시는 `gpt-5.6-luna`입니다.
5. `OPENAI_API_KEY`를 Worker secret으로 등록합니다.
6. 배포된 `https://...workers.dev` 주소를 `edu-ai/admin.html`의 AI 백엔드 주소에 저장합니다.
7. `edu-ai/index.html`로 돌아가 질문하면 AI 연결 모드가 작동합니다.

## 2차 개발 권장사항

현재 사용자 추가 자료는 브라우저 localStorage에 저장됩니다. 기관/팀 단위 운영에서는 다음 구조로 확장하는 것이 좋습니다.

- Supabase Auth: 사용자 로그인/권한
- Supabase Postgres: 문서 메타데이터, 질문 이력
- Supabase Storage: PDF/한글 변환본 등 원문 저장
- pgvector 또는 OpenAI File Search: 의미기반 RAG 검색
- 관리자 승인 기반 문서 발행
- 자료별 시행일/폐지일/버전 관리
- 답변별 출처 문서명·페이지 표시
- 감사사례/법령/교육청 지침 별도 컬렉션

## 주의

이 서비스는 업무 참고용입니다. 실제 행정처리는 최신 법령, 예규, 지침 및 소관 부서의 공식 해석을 최종 확인해야 합니다.
