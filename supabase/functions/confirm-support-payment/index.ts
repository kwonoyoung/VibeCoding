import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://kwonoyoung.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ message: 'POST 요청만 허용됩니다.' }), { status: 405, headers: corsHeaders });

  try {
    const secretKey = Deno.env.get('TOSS_SECRET_KEY');
    if (!secretKey) return new Response(JSON.stringify({ message: '결제 승인 서버에 TOSS_SECRET_KEY가 설정되지 않았습니다.' }), { status: 500, headers: corsHeaders });

    const { paymentKey, orderId, amount } = await req.json();
    const value = Number(amount);
    if (typeof paymentKey !== 'string' || paymentKey.length < 1) throw new Error('paymentKey가 올바르지 않습니다.');
    if (typeof orderId !== 'string' || !/^SUPPORT_[A-Za-z0-9_-]{6,56}$/.test(orderId)) throw new Error('orderId가 올바르지 않습니다.');
    if (!Number.isInteger(value) || value < 1000 || value > 1000000) throw new Error('후원 금액이 허용 범위를 벗어났습니다.');

    const authorization = 'Basic ' + btoa(`${secretKey}:`);
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentKey, orderId, amount: value })
    });

    const result = await tossRes.json();
    if (!tossRes.ok) {
      return new Response(JSON.stringify({ message: result?.message || '토스페이먼츠 결제 승인에 실패했습니다.', code: result?.code || 'TOSS_CONFIRM_FAILED' }), { status: tossRes.status, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true, paymentKey: result.paymentKey, orderId: result.orderId, status: result.status, method: result.method, easyPay: result.easyPay || null, totalAmount: result.totalAmount, approvedAt: result.approvedAt }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ message: error instanceof Error ? error.message : '결제 승인 처리 중 오류가 발생했습니다.' }), { status: 400, headers: corsHeaders });
  }
});
