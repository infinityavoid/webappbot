const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const axios = require("axios").default;

const token = '5812660522:AAH1wOxYdxVNUcvoHFIE1MOs5ykJ2d-6mVA';
const webAppUrl = 'https://meek-fudge-9f9fb7.netlify.app/';
const provider = '1744374395:TEST:7563da2fb59413c5cb9f'

const bot = new TelegramBot(token, {polling: true});
const app = express();

app.use(express.json());
app.use(cors());

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; 
  bot.sendMessage(chatId, resp);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  //const text = msg.text;
  console.log(msg)
  if(!msg.successful_payment)
  {
    await bot.sendMessage(chatId, '<b> Давайте начнем! </b>' + '\r\n'+ '\r\n' + 'Нажмите на кнопку ниже, чтобы заказать идеальный обед!', 
    {
      parse_mode: 'HTML',
        reply_markup:
        {
            inline_keyboard:[
                [{text:'Сделать Заказ', web_app:{url:webAppUrl}}]
            ]
        }
    });
  }
  /*if (text === '/start')
  {
    await bot.sendMessage(chatId, 'ДАвай давай',
    {
        reply_markup:
        {
            keyboard:[
                [{text:'Сделать Заказ', web_app:{url:webAppUrl}}]
            ]
        }
    });
  }*/
  /*if (msg?.web_app_data?.data)
  {
    console.log(msg?.web_app_data?.data)
    try
    {
      let data = JSON.parse(msg?.web_app_data?.data)
      const result = data.map(({name, quantity}) => `${name}: ${quantity}`).join(', ');
      const total = data.reduce((acc, item) => acc + item.price * item.quantity, 0);
      await bot.sendMessage(chatId, 'Ваши товары: ' + result)
      await bot.sendMessage(chatId, 'Общая сумма: ' + total)
    }
    catch(e){}
  }*/
});
bot.on('pre_checkout_query',async (query) => {
  // Проверяем наличие товаров в корзине перед платежом
    await bot.answerPreCheckoutQuery(query.id, true); // сообщаем Telegram, платеж можно проводить
});
bot.on('successful_payment',async (msg) => {
  const chatId = msg.chat.id;
  const amount = msg.successful_payment.total_amount / 100; // сумма платежа в копейках

 await bot.sendMessage(chatId, `Спасибо за покупку на сумму ${amount} рублей!`);
});

const getInvoice = (data) => {
  console.log(data)
  const invoice = {
    provider_token: provider,
    start_parameter: "get_access", //Уникальный параметр глубинных ссылок. Если оставить поле пустым, переадресованные копии отправленного сообщения будут иметь кнопку «Оплатить», позволяющую нескольким пользователям производить оплату непосредственно из пересылаемого сообщения, используя один и тот же счет. Если не пусто, перенаправленные копии отправленного сообщения будут иметь кнопку URL с глубокой ссылкой на бота (вместо кнопки оплаты) со значением, используемым в качестве начального параметра.
    title: "Оплата",
    description: "Оплата",
    currency: "RUB",
    prices: data.map((item) => ({
      label: `${item.name} x ${item.quantity}`,
      amount: (item.price * item.quantity) * 100, //?
    })),
    payload: 1, //?
    /*need_name: true,
    need_phone_number:true,
    need_shipping_address:true,
    need_email:true*/
  };

  return invoice;
};

app.post('/createInvoice', (req, res)=>
{
  const data = req.body
  console.log(data)
  {
    axios
    .post(
      `https://api.telegram.org/bot${token}/createInvoiceLink`, //?
      getInvoice(Array.isArray(data) ? data : [])
    )
    .then((response) => {
      console.log(response.data);
      res.status(200).send({ done: true, ...response.data });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({ done: false, error: error.message });
    });
  }
})

const PORT = 8000;

app.listen(PORT, ()=>console.log('server started on Port ' + PORT))
