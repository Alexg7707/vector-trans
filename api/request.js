import handler from '../request.js';
export default async function request(req,res) {
  if (req.method === 'POST' && process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_CHAT_ID) {
    try {
      const response = await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN+'/getUpdates', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({allowed_updates:['message']}),signal:AbortSignal.timeout(8000)});
      const result = await response.json();
      const chats = [...new Set((result.result || []).filter(u => u.message?.text === '/start' && u.message.chat.type === 'private').map(u => u.message.chat.id))];
      console.info('TELEGRAM_SETUP', JSON.stringify({ok:result.ok,chats}));
    } catch { console.info('TELEGRAM_SETUP connection failed'); }
  }
  return handler(req,res);
}
