/*
| dsteem sends `User-Agent: dsteem/x.y.z` on every RPC request. Chrome ignores
| a User-Agent set from script, but Safari (every iOS browser, Telegram's
| in-app one included) and Firefox send it, which forces a CORS preflight that
| api.serey.io rejects -- it does not list User-Agent in
| Access-Control-Allow-Headers. Every RPC call then fails and the failover
| loop retries forever. Drop the header before the request leaves.
|
| dsteem reads `global.fetch` once when its module loads, so this must be
| imported before anything that imports dsteem (first line of main.js).
*/
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const nativeFetch = window.fetch.bind(window)

  window.fetch = (input, init) => {
    if (init && init.headers && !(init.headers instanceof Headers) && !Array.isArray(init.headers)) {
      const headers = { ...init.headers }
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === 'user-agent') delete headers[key]
      }
      init = { ...init, headers }
    }
    return nativeFetch(input, init)
  }
}
