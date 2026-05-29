/** GSW 포털 main.js getIpAddress 와 동일한 폴백 체인 */

let cachedIp: string | null = null

export async function getClientIpAddress(): Promise<string> {
  if (cachedIp) return cachedIp

  const apis = [
    { url: 'https://api.ipify.org?format=json', extract: (d: { ip?: string }) => d.ip },
    { url: 'https://api64.ipify.org?format=json', extract: (d: { ip?: string }) => d.ip },
    {
      url: 'https://ipapi.co/json/',
      extract: (d: { ip?: string; query?: string }) => d.ip || d.query,
    },
  ]

  for (const api of apis) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(api.url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) continue
      const data = await res.json()
      const ip = api.extract(data)
      if (ip && typeof ip === 'string') {
        cachedIp = ip
        return ip
      }
    } catch {
      /* try next */
    }
  }

  cachedIp = 'IP 미확인'
  return cachedIp
}
