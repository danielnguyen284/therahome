const https = require('https');
const webpush = require('web-push');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BGMqDN9r279uLSeCmQ2jqvnJ9jkx6w7OgtstN-jPAILIe1zQVdO8DCMAvjim6UKSoqAcw57wUOsLoAW1LvPcNqM';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'rktqpyxJeN4WjN1DWzj3LIcYsEQsVzaYk80z0-7bxpo';

webpush.setVapidDetails(
  'mailto:support@therahome.vn',
  vapidPublicKey,
  vapidPrivateKey
);

function isExpoPushToken(token) {
  return (
    typeof token === 'string'
    && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }, (response) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            statusCode: response.statusCode || 0,
            body: parsed,
          });
        } catch (error) {
          reject(new Error(`Invalid push response: ${error.message}`));
        }
      });
    });

    request.on('error', reject);
    request.write(JSON.stringify(payload));
    request.end();
  });
}

async function sendExpoPushNotification({ token, title, body, data = {} }) {
  if (!isExpoPushToken(token)) {
    throw new Error('Expo push token không hợp lệ');
  }

  const response = await postJson('https://exp.host/--/api/v2/push/send', {
    to: token,
    title,
    body,
    sound: 'default',
    data,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Expo push HTTP ${response.statusCode}`);
  }

  const ticket = Array.isArray(response.body?.data)
    ? response.body.data[0]
    : response.body?.data;

  if (!ticket || ticket.status !== 'ok') {
    const message = ticket?.message
      || response.body?.errors?.[0]?.message
      || 'Gửi push thất bại';
    throw new Error(message);
  }

  return {
    ticketId: ticket.id || '',
    raw: response.body,
  };
}

async function sendWebPushNotification({ subscription, title, body, data = {} }) {
  const payload = JSON.stringify({
    title,
    body,
    data,
  });

  const parsedSubscription = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
  const result = await webpush.sendNotification(parsedSubscription, payload);
  return {
    ticketId: result.headers?.['location'] || String(Date.now()),
    raw: result,
  };
}

module.exports = {
  isExpoPushToken,
  sendExpoPushNotification,
  sendWebPushNotification,
};
