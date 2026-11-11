// بوت تمويل القنوات وتجميع النقاط - نسخة أولية قابلة للتشغيل
// المتطلبات: Node.js 18+ و npm install
// متغيرات البيئة المطلوبة: BOT_TOKEN و ADMIN_ID
// أضف البوت مشرفاً في كل قناة تريد التحقق من الاشتراك بها.

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
if (!TOKEN) throw new Error('يرجى ضبط BOT_TOKEN في متغيرات البيئة');
if (!ADMIN_ID) console.warn('تنبيه: لم يتم ضبط ADMIN_ID؛ لوحة الإدارة لن تعمل.');

const bot = new TelegramBot(TOKEN, { polling: true });
const DB_FILE = path.join(__dirname, 'data.json');

function loadDB(8738123859) {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: {}, tasks: [], campaigns: [], requests: [] }; }
}
let db = loadDB();
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}
function user(id) {
  const key = String(id);
  if (!db.users[key]) db.users[key] = { points: 0, done: [], username: '' };
  return db.users[key];
}
function isAdmin(id) { return Number(id) === ADMIN_ID; }
function mainKeyboard(id) {
  const rows = [
    [{ text: '💰 جمع نقاط' }, { text: '⚡ التجميع التلقائي' }],
    [{ text: '👤 تمويل قنوات' }, { text: '⚡ تعزيز قنوات' }],
    [{ text: '🔔 طلبات التمويل' }, { text: '🔔 طلبات التعزيز' }],
    [{ text: '🔄 تحويل النقاط' }, { text: '📖 شرح البوت' }]
  ];
  if (isAdmin(id)) rows.push([{ text: '🛠 لوحة الإدارة' }]);
  return { keyboard: rows, resize_keyboard: true };
}
function sendHome(chatId, from) {
  const u = user(from.id);
  u.username = from.username || '';
  saveDB();
  bot.sendMessage(chatId,
    `أهلاً بك في بوت تمويل القنوات 🌟\n\n💰 رصيدك: ${u.points} نقطة\n🆔 رقمك: ${from.id}\n\nاختر الخدمة من الأزرار بالأسفل:`,
    { reply_markup: mainKeyboard(from.id) });
}
function inline(rows) { return { reply_markup: { inline_keyboard: rows } }; }

bot.onText(/\/start/, (msg) => sendHome(msg.chat.id, msg.from));
bot.onText(/\/id/, (msg) => bot.sendMessage(msg.chat.id, `رقم حسابك: ${msg.from.id}`));

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  const chatId = msg.chat.id, id = msg.from.id, text = msg.text.trim();
  const u = user(id);
  u.username = msg.from.username || '';
  saveDB();

  if (text === '💰 جمع نقاط' || text === '⚡ التجميع التلقائي') {
    const available = db.tasks.filter(t => !u.done.includes(t.id));
    if (!available.length) return bot.sendMessage(chatId, 'ماكو مهام متاحة حالياً. جرّب مرة ثانية لاحقاً.');
    const rows = available.slice(0, 20).flatMap(t => [[{ text: `📢 ${t.title} — ${t.reward} نقطة`, url: t.url }], [{ text: '✅ تحقّق واحصل على النقاط', callback_data: `verify:${t.id}` }]]);
    return bot.sendMessage(chatId, 'اشترك بالقناة المطلوبة، وبعدها اضغط زر التحقق. الاشتراك اختياري وتقدر تلغي الاشتراك لاحقاً.', inline(rows));
  }

  if (text === '👤 تمويل قنوات' || text === '⚡ تعزيز قنوات') {
    return bot.sendMessage(chatId,
      'لإرسال طلب تمويل، أرسل رابط قناتك العام بهذا الشكل:\nhttps://t.me/YourChannel\n\nبعدها يراجعه المشرف ويحدد عدد المهام والنقاط. لا ترسل روابط قنوات لا تملكها أو لا تديرها.');
  }

  if (text === '🔔 طلبات التمويل' || text === '🔔 طلبات التعزيز') {
    const mine = db.requests.filter(r => r.userId === id);
    return bot.sendMessage(chatId, mine.length
      ? mine.map((r, i) => `${i+1}. ${r.url} — ${r.status}`).join('\n')
      : 'ما عندك طلبات حالياً.');
  }

  if (text === '🔄 تحويل النقاط') {
    return bot.sendMessage(chatId, 'للتحويل أرسل الأمر بهذا الشكل:\n/transfer رقم_المستخدم عدد_النقاط');
  }
  if (text === '📖 شرح البوت') {
    return bot.sendMessage(chatId,
      'طريقة الاستخدام:\n1) اجمع النقاط من الاشتراك الاختياري بالقنوات.\n2) أرسل رابط قناتك لطلب التمويل.\n3) بعد موافقة المشرف تظهر قناتك كواحدة من المهام.\n4) تحصل على نقاط عند التحقق من الاشتراك.\n\nالبوت لا يضيف أعضاء وهميين ولا يشترك نيابةً عن المستخدمين.');
  }
  if (text === '🛠 لوحة الإدارة' && isAdmin(id)) {
    return bot.sendMessage(chatId,
      'أوامر الإدارة:\n/addtask رابط_القناة عدد_النقاط عنوان_بدون_مسافات\n/removetask رقم_المهمة\n/requests\n/approve رقم_الطلب\n\nأضف البوت مشرفاً بالقناة حتى يستطيع التحقق من الاشتراك.');
  }

  // رابط قناة = طلب تمويل جديد
  if (/^https:\/\/t\.me\/[A-Za-z0-9_]{5,}$/.test(text)) {
    const request = { id: Date.now(), userId: id, url: text, status: 'قيد المراجعة' };
    db.requests.push(request); saveDB();
    bot.sendMessage(chatId, `تم استلام طلبك رقم ${request.id} وهو قيد المراجعة ✅`);
    if (ADMIN_ID) bot.sendMessage(ADMIN_ID,
      `طلب تمويل جديد #${request.id}\nمن المستخدم: ${id}\nالقناة: ${text}\nللموافقة: /approve ${request.id}`);
    return;
  }
  bot.sendMessage(chatId, 'اختر خدمة من القائمة، أو أرسل /start لعرض القائمة.');
});

bot.onText(/\/addtask (https:\/\/t\.me\/[A-Za-z0-9_]{5,}) (\d+) ([^\s]+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return;
  const url = match[1], reward = Number(match[2]), title = match[3];
  if (reward < 1 || reward > 100000) return bot.sendMessage(msg.chat.id, 'عدد النقاط غير صحيح.');
  const username = url.split('/').pop();
  const task = { id: Date.now(), url, username, reward, title };
  db.tasks.push(task); saveDB();
  bot.sendMessage(msg.chat.id, `تمت إضافة المهمة #${task.id} ✅`);
});
bot.onText(/\/removetask (\d+)/, (msg, match) => {
  if (!isAdmin(msg.from.id)) return;
  db.tasks = db.tasks.filter(t => t.id !== Number(match[1])); saveDB();
  bot.sendMessage(msg.chat.id, 'تم حذف المهمة إذا كانت موجودة.');
});
bot.onText(/\/requests/, (msg) => {
  if (!isAdmin(msg.from.id)) return;
  const pending = db.requests.filter(r => r.status === 'قيد المراجعة');
  bot.sendMessage(msg.chat.id, pending.length
    ? pending.map(r => `#${r.id} | ${r.userId} | ${r.url}`).join('\n')
    : 'لا توجد طلبات معلّقة.');
});
bot.onText(/\/approve (\d+)/, (msg, match) => {
  if (!isAdmin(msg.from.id)) return;
  const r = db.requests.find(x => x.id === Number(match[1]));
  if (!r) return bot.sendMessage(msg.chat.id, 'الطلب غير موجود.');
  r.status = 'مقبول — أضف المهمة يدوياً عبر /addtask';
  saveDB();
  bot.sendMessage(msg.chat.id, `تم قبول الطلب #${r.id}. أضف القناة كمهمة باستخدام /addtask.`);
  bot.sendMessage(r.userId, 'تمت الموافقة على طلب قناتك مبدئياً ✅');
});

bot.onText(/\/transfer (\d+) (\d+)/, (msg, match) => {
  const sender = user(msg.from.id), targetId = Number(match[1]), amount = Number(match[2]);
  if (targetId === msg.from.id || !Number.isInteger(amount) || amount < 1)
    return bot.sendMessage(msg.chat.id, 'بيانات التحويل غير صحيحة.');
  if (sender.points < amount) return bot.sendMessage(msg.chat.id, 'رصيدك لا يكفي.');
  sender.points -= amount; user(targetId).points += amount; saveDB();
  bot.sendMessage(msg.chat.id, `تم تحويل ${amount} نقطة بنجاح.`);
  bot.sendMessage(targetId, `وصلتك ${amount} نقطة من المستخدم ${msg.from.id}.`);
});

bot.on('callback_query', async (q) => {
  const [action, rawId] = (q.data || '').split(':');
  if (action !== 'verify') return;
  const task = db.tasks.find(t => t.id === Number(rawId));
  if (!task) return bot.answerCallbackQuery(q.id, { text: 'المهمة غير موجودة.' });
  const u = user(q.from.id);
  if (u.done.includes(task.id)) return bot.answerCallbackQuery(q.id, { text: 'حصلت على نقاط هذه المهمة سابقاً.' });
  try {
    const member = await bot.getChatMember(`@${task.username}`, q.from.id);
    if (!['member', 'administrator', 'creator'].includes(member.status))
      return bot.answerCallbackQuery(q.id, { text: 'اشترك بالقناة أولاً ثم أعد التحقق.', show_alert: true });
    u.points += task.reward; u.done.push(task.id); saveDB();
    await bot.answerCallbackQuery(q.id, { text: `تمت إضافة ${task.reward} نقطة!` });
    bot.sendMessage(q.message.chat.id, `أحسنت! حصلت على ${task.reward} نقطة.\nرصيدك الآن: ${u.points}`);
  } catch (e) {
    bot.answerCallbackQuery(q.id, { text: 'تعذر التحقق. تأكد أن البوت مشرف بالقناة وأن الرابط عام.', show_alert: true });
  }
});

bot.on('polling_error', (err) => console.error('Polling error:', err.message));
console.log('Bot is running...');
