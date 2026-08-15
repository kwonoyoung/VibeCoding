window.SUPPORT_CONFIG = {
  // 토스페이먼츠 결제위젯 연동 키의 "클라이언트 키"를 입력하세요.
  // 시크릿 키는 절대 이 파일이나 GitHub에 넣지 마세요.
  tossClientKey: '',

  // Supabase Edge Function 주소입니다. 함수 배포 후 그대로 사용할 수 있습니다.
  confirmEndpoint: 'https://eqpiuszmgrwituwprgdc.supabase.co/functions/v1/confirm-support-payment',

  // 직접 계좌이체를 받을 계좌 정보입니다. 실제 정보로 바꿔주세요.
  bankName: '',
  bankAccount: '',
  accountHolder: '',

  minAmount: 1000,
  maxAmount: 1000000,
  presets: [1000, 3000, 5000, 10000]
};
