const form = document.querySelector('#request-form');
const dateInput = form.elements.date;
dateInput.min = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date());
document.querySelector('#year').textContent = new Date().getFullYear();
form.addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.querySelector('#form-status');
  const button = form.querySelector('button');
  if(!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  data.consent = form.elements.consent.checked;
  button.disabled = true;
  form.setAttribute('aria-busy','true');
  status.className = '';
  status.textContent = 'Отправляем заявку…';
  try {
    const response = await fetch('/api/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    let result;
    try { result = await response.json(); } catch { throw new Error('Сервис временно недоступен. Данные формы сохранены — попробуйте позже.'); }
    if(!response.ok || !result.ok) throw new Error(result.error || 'Не удалось отправить заявку.');
    status.className = 'success';
    status.textContent = `Заявка №${result.id} доставлена. Свяжемся с вами по указанному телефону.`;
    form.reset();
  } catch(error) { status.className = 'error'; status.textContent = error instanceof TypeError ? 'Связь прервалась. Возможно, заявка уже отправлена; повторная отправка может создать дубль.' : error.message; }
  finally { button.disabled = false; form.removeAttribute('aria-busy'); }
});
