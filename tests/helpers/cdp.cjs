const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function until(check, description) {
  for (let i = 0; i < 160; i++) {
    const result = await check();
    if (result) return result;
    await delay(25);
  }
  throw new Error(`Timed out: ${description}`);
}

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  const pending = new Map();
  const listeners = new Map();
  let id = 0;
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      clearTimeout(waiter.timeout);
      message.error ? waiter.reject(new Error(JSON.stringify(message.error))) : waiter.resolve(message.result);
    } else {
      for (const fn of listeners.get(message.method) || []) fn(message.params);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timed out: ${method}`)); }, 5000);
    pending.set(requestId, { resolve, reject, timeout }); ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  return {
    send,
    on(method, fn) { listeners.set(method, [...(listeners.get(method) || []), fn]); },
    close() { ws.close(); },
    async evaluate(expression, contextId) {
      const result = await send('Runtime.evaluate', { expression, contextId, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    },
  };
}

module.exports = { delay, until, connect };
