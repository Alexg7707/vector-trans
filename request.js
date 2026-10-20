import { randomUUID } from 'node:crypto';
export function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Заполните форму заявки.');
  const limits = {name:80,phone:30,from:180,to:180,cargo:350,date:10,comment:700};
  const data = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = body[key] ?? '';
    if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b-\u001f]/.test(value)) throw new Error('Проверьте заполненные поля.');
    data[key] = value.trim();
  }
  if (Object.keys(data).some(k => k !== 'comment' && !data[k])) throw new Error('Заполните все обязательные поля.');
  if (!/^[+\d\s()\-]+$/.test(data.phone) || !/^\d{10,15}$/.test(data.phone.replace(/\D/g,''))) throw new Error('Укажите телефон: от 10 до 15 цифр.');
  const date = new Date(data.date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(+date) || date.toISOString().slice(0,10) !== data.date || data.date < new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date())) throw new Error('Укажите сегодняшнюю или будущую дату.');
  if (body.consent !== true) throw new Error('Подтвердите согласие на обработку заявки.');
  return data;
}
export function message(data,id) {
  return `Новая заявка «Вектор Транс»\nНомер: ${id}\nИмя: ${data.name}\nТелефон: ${data.phone}\nОткуда: ${data.from}\nКуда: ${data.to}\nЧто везём: ${data.cargo}\nДата: ${data.date}\nКомментарий: ${data.comment || 'Не указан'}\nИсточник: форма сайта`;
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Метод не поддерживается.'}); }
  if(!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({error:'Нужен JSON.'});
  if(req.headers.origin) {
    try { if(new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({error:'Недопустимый источник запроса.'}); }
    catch { return res.status(403).json({error:'Недопустимый источник запроса.'}); }
  }
  let body = req.body;
  try { if(typeof body === 'string') body = JSON.parse(body); if(Buffer.byteLength(JSON.stringify(body) || '') > 8000) return res.status(413).json({error:'Слишком большой запрос.'}); }
  catch { return res.status(400).json({error:'Некорректный запрос.'}); }
  if(body?.website) return res.status(400).json({error:'Не удалось отправить заявку.'});
  let data;
  try { data = validate(body); } catch(e) { return res.status(400).json({error:e.message}); }
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if(!token || !chat) return res.status(503).json({error:'Приём заявок временно недоступен. Попробуйте позже.'});
  const id = randomUUID().slice(0,8).toUpperCase();
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chat,text:message(data,id)}),signal:AbortSignal.timeout(12000)});
    const result = await response.json();
    if(!response.ok || !result.ok) return res.status(502).json({error:'Telegram не подтвердил доставку. Попробуйте позже.'});
    return res.status(200).json({ok:true,id});
  } catch { return res.status(502).json({error:'Не удалось подтвердить доставку. Возможно, заявка уже пришла; повторная отправка может создать дубль.'}); }
}
