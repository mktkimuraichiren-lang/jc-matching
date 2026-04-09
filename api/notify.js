// =====================================================
// LINE Notify 通知サーバーレス関数
// Supabase Edge Functions または Vercel Functions で使用
//
// デプロイ方法:
//   Vercel: /api/notify.js として配置
//   Supabase Edge: supabase functions deploy line-notify
// =====================================================

// Vercel / Next.js API Route 用
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to_participant_id, message } = req.body

  // Supabase から参加者のLINEユーザーIDを取得
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
  const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

  try {
    // 参加者情報を取得
    const participantRes = await fetch(
      `${SUPABASE_URL}/rest/v1/participants?id=eq.${to_participant_id}&select=line_user_id,name`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    )
    const participants = await participantRes.json()
    const participant = participants[0]

    if (!participant?.line_user_id) {
      // LINEユーザーIDがない場合はスキップ（メール通知に切り替えも可）
      return res.status(200).json({ skipped: true, reason: 'no_line_user_id' })
    }

    // LINE Messaging API でプッシュ通知
    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: participant.line_user_id,
        messages: [
          {
            type: 'flex',
            altText: message,
            contents: {
              type: 'bubble',
              hero: {
                type: 'box',
                layout: 'horizontal',
                backgroundColor: '#185FA5',
                paddingAll: '16px',
                contents: [
                  { type: 'text', text: '🤝 関東JC マッチング', color: '#ffffff', size: 'sm', weight: 'bold' }
                ]
              },
              body: {
                type: 'box',
                layout: 'vertical',
                spacing: 'md',
                contents: [
                  { type: 'text', text: message, wrap: true, size: 'md', color: '#1a1a18' },
                  {
                    type: 'button',
                    style: 'primary',
                    color: '#185FA5',
                    action: {
                      type: 'uri',
                      label: 'アプリで確認する',
                      uri: process.env.APP_URL || 'https://your-app.vercel.app'
                    }
                  }
                ]
              }
            }
          }
        ]
      })
    })

    if (!lineRes.ok) {
      const err = await lineRes.text()
      console.error('LINE API error:', err)
      return res.status(500).json({ error: 'LINE send failed', detail: err })
    }

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('Notify error:', err)
    return res.status(500).json({ error: err.message })
  }
}

// =====================================================
// Supabase Edge Function 版 (supabase/functions/line-notify/index.ts)
// =====================================================
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const { to_participant_id, message } = await req.json()

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: p } = await sb.from('participants').select('line_user_id').eq('id', to_participant_id).single()

  if (!p?.line_user_id) return new Response(JSON.stringify({ skipped: true }), { status: 200 })

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')}`
    },
    body: JSON.stringify({
      to: p.line_user_id,
      messages: [{ type: 'text', text: message }]
    })
  })

  return new Response(JSON.stringify({ ok: res.ok }), { status: 200 })
})
*/
