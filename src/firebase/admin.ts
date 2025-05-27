import admin from "firebase-admin";


let tokens: string[] = [];




export const saveToken = (token: string): void => {
  if (token && !tokens.includes(token)) {
    tokens.push(token);
    console.log('Saved token:', token);
  }
};

export const sendNotification = async (payload: {
  title: string;
  body: string;
  imageUrl?: string;
  url?: string;
}) => {
  if (!tokens.length) {
    throw new Error('No FCM tokens available');
  }

  const messages = tokens.map(token => ({
    token,
    data: {
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl || '',
      url: payload.url || '',
    },
  }));

  const results = await Promise.allSettled(
    messages.map(msg => admin.messaging().send(msg))
  );

  const successes = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<string>).value);

  const failures = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason);

  return { successes, failures };
};
