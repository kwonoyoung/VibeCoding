# 🚀 VibeCoding parental2022 배포 가이드

## GitHub Pages 활성화 방법

### 1단계: GitHub Settings 접속
1. 브라우저에서 https://github.com/kwonoyoung/vibecoding/settings 접속
2. 왼쪽 사이드바에서 **"Pages"** 클릭

### 2단계: GitHub Pages 설정
1. **Source** 섹션에서 "Deploy from a branch" 선택
2. **Branch** 드롭다운에서 **`main`** 선택
3. 폴더는 **`/ (root)`** 선택
4. **Save** 버튼 클릭

### 3단계: 배포 확인
- 설정 후 약 1-2분 후 GitHub Pages가 활성화됩니다
- "Your site is published at" 아래 배포 URL이 표시됩니다

---

## 배포된 파일 접속 URL

GitHub Pages 활성화 후 다음 URL에서 접속 가능합니다:

| 파일 | 접속 URL |
|------|---------|
| **개선된 2022 계산기** | `https://kwonoyoung.github.io/vibecoding/parental2022-improved.html` |
| **설정 규칙** | `https://kwonoyoung.github.io/vibecoding/config-rules.json` |

---

## 🔐 인증 설정 필수

parental2022-improved.html은 Supabase 인증이 필요합니다.

### 환경 변수 설정 방법

**방법 1: 로컬 환경 변수 (개발)**
```bash
export VITE_SUPABASE_URL="https://xxxxx.supabase.co"
export VITE_SUPABASE_KEY="eyJhbGc..."
```

**방법 2: GitHub Secrets (프로덕션)**
1. https://github.com/kwonoyoung/vibecoding/settings/secrets/actions 접속
2. **"New repository secret"** 클릭
3. 다음 secrets 추가:
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_KEY`: Supabase 공개 API 키

**방법 3: 직접 주입 (임시)**
parental2022-improved.html 파일에서 다음 부분을 수정:
```javascript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xxxxx.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || 'eyJhbGc...';
```

---

## 📋 체크리스트

- [ ] GitHub Settings → Pages 접속
- [ ] Deploy from branch: **main** 선택
- [ ] Folder: **/ (root)** 선택
- [ ] Save 클릭
- [ ] 1-2분 대기
- [ ] 배포 URL에서 접속 확인
- [ ] Supabase 인증 설정 완료
- [ ] 로그인 테스트

---

## 🔍 배포 상태 확인

### GitHub에서 배포 상태 보기
1. Repository 메인 페이지에서 **"Deployments"** 클릭
2. 배포 이력 및 상태 확인 가능

### 배포 성공 확인
```bash
# 명령줄에서 확인
curl -I https://kwonoyoung.github.io/vibecoding/parental2022-improved.html
# HTTP/1.1 200 OK 응답이 나와야 함
```

---

## ⚠️ 주의사항

1. **민감한 정보 보안**
   - API 키는 절대 저장소에 커밋하지 마세요
   - 환경 변수로만 전달하세요

2. **CORS 문제**
   - Supabase의 CORS 설정 확인 필요
   - https://kwonoyoung.github.io 도메인 허용 필요

3. **캐싱**
   - GitHub Pages는 기본적으로 캐싱 미적용
   - 파일 업데이트 후 약 1분 내 반영됨

---

## 📞 문제 해결

### "404 Not Found" 에러
- GitHub Pages 활성화 확인
- 파일 경로 확인 (대소문자 구분)
- 저장소 공개 여부 확인

### "인증 실패" 에러
- Supabase URL 및 API 키 확인
- CORS 설정 확인
- 브라우저 개발자 도구 → Console에서 에러 메시지 확인

### "복직합산금 계산 오류"
- JavaScript console에서 에러 메시지 확인
- 입력 날짜 형식 확인 (YYYY-MM-DD)
- 월봉급액 숫자 입력 확인

---

## 🔄 업데이트 방법

### 파일 수정 후 배포
```bash
cd /home/claude/vibecoding
git add parental2022-improved.html config-rules.json
git commit -m "Update parental2022 calculator"
git push origin main
```

배포 후 1-2분 내 GitHub Pages에 반영됩니다.

---

**마지막 업데이트:** 2026-10-03  
**배포 버전:** parental2022-improved.html v1.0  
**설정 버전:** config-rules.json (2022, 2024)
