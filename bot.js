Set up GitHub require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

if (!token) {
  console.log("يرجى إضافة توكن البوت");
  process.exit(1);
}

const bot = new TelegramBot(token, {
  polling: true
});

const adminId = process.env.ADMIN_CHAT_ID;

const menu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🎮 شحن PUBG Mobile", callback_data: "pubg" }],
      [{ text: "🔥 شحن Free Fire", callback_data: "freefire" }],
      [{ text: "🛍️ حسابات ألعاب", callback_data: "accounts" }],
      [{ text: "📦 طلباتي", callback_data: "orders" }],
      [{ text: "☎️ الدعم الفني", callback_data: "support" }]
    ]
  }
};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🌟 أهلاً بك في متجر الألعاب 🌟\n\nاختار القسم الذي تريده:",
    menu
  );
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  await bot.answerCallbackQuery(query.id);

  switch (query.data) {

    case "pubg":
      bot.sendMessage(chatId,
        "🎮 متجر PUBG Mobile\n\nاختر الشحن:\n\n60 UC\n325 UC\n660 UC\n1800 UC\n\nأرسل الكمية المطلوبة ومعرّف اللاعب للإدارة."
      );
      break;

    case "freefire":
      bot.sendMessage(chatId,
        "🔥 متجر Free Fire\n\nاختر الشحن:\n\n100 جوهرة\n310 جوهرة\n520 جوهرة\n\nأرسل طلبك للإدارة."
      );
      break;

    case "accounts":
      bot.sendMessage(chatId,
        "🛍️ قسم حسابات الألعاب\n\nللاستفسار عن الحسابات المتوفرة تواصل مع الإدارة."
      );
      break;

    case "orders":
      bot.sendMessage(chatId,
        "📦 لمتابعة طلبك تواصل مع إدارة المتجر."
      );
      break;

    case "support":
      bot.sendMessage(chatId,
        "☎️ أهلاً بك في الدعم الفني.\nأرسل تفاصيل مشكلتك."
      );
      break;
  }
});

bot.on("polling_error", (error) => {
  console.log(error.message);
});

console.log("متجر الألعاب يعمل بنجاح 🚀");Copilot
