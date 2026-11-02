/** Invokes a Vercel-style handler with a fake req/res and returns { status, body }. */
export async function call(handler, { method = 'GET', query = {}, body, token } = {}) {
  const req = {
    method,
    query,
    body,
    headers: token ? { authorization: `Bearer ${token}` } : {}
  };
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(name, value) {
        this.headers[name] = value;
      },
      json(payload) {
        resolve({ status: this.statusCode, body: payload });
      },
      send(payload) {
        resolve({ status: this.statusCode, body: payload, headers: this.headers });
      }
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}
