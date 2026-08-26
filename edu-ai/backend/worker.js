export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || 'https://kwonoyoung.github.io').split(',').map(v => v.trim());
    const corsOrigin = allowed.includes(origin) ? origin : allowed[0];
    const headers = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, headers);
    if (!env.OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY is not configured' }, 500, headers);

    try {
      const body = await request.json();
      const question = String(body.question || '').trim().slice(0, 4000);
      const context = Array.isArray(body.context) ? body.context.slice(0, 6) : [];
      if (!question) return json({ error: 'question is required' }, 400, headers);

      const sources = context.map((d, i) =>
        `[${i + 1}] ${String(d.title || '').slice(0, 180)}\n분류: ${String(d.category || '').slice(0, 100)}\n요약: ${String(d.summary || '').slice(0, 1200)}\n출처: ${String(d.url || '').slice(0, 600)}`
      ).join('\n\n');

      const instructions = `당신은 전북특별자치도교육청 교육행정 업무지원 AI다.\n` +
        `제공된 근거자료 범위 안에서만 답하고, 자료로 확정할 수 없는 내용은 추정하지 말고 확인이 필요하다고 명시한다.\n` +
        `답변은 한국어로 간결하고 실무적으로 작성한다. 근거가 있으면 문장 끝에 [1], [2]처럼 자료 번호를 표시한다.\n` +
        `법률·급여·인사 관련 답변에는 최신 규정과 소관 부서의 공식 해석을 최종 확인하라는 주의를 덧붙인다.\n` +
        `사용자가 제공하지 않은 개인정보를 만들거나 추정하지 않는다.`;

      const input = `질문:\n${question}\n\n검색된 근거자료:\n${sources || '(관련 자료 없음)'}\n\n위 자료만을 근거로 답변하라.`;

      const apiResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-5.6-luna',
          instructions,
          input,
          max_output_tokens: 1200
        })
      });

      const data = await apiResponse.json();
      if (!apiResponse.ok) {
        console.error('OpenAI error', data);
        return json({ error: 'AI provider request failed' }, 502, headers);
      }

      const answer = extractText(data) || 'AI 응답에서 텍스트를 찾지 못했습니다.';
      return json({ answer }, 200, headers);
    } catch (error) {
      console.error(error);
      return json({ error: 'Unexpected server error' }, 500, headers);
    }
  }
};

function extractText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of (data.output || [])) {
    for (const content of (item.content || [])) {
      if (typeof content.text === 'string') parts.push(content.text);
      if (typeof content.output_text === 'string') parts.push(content.output_text);
    }
  }
  return parts.join('\n').trim();
}

function json(value, status, headers) {
  return new Response(JSON.stringify(value), { status, headers });
}
