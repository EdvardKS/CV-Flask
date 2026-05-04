const KEY = 'quiz:clientId'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'cid-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function getOrCreateClientId(): string {
  if (typeof localStorage === 'undefined') return 'ssr'
  let id = localStorage.getItem(KEY)
  if (!id) { id = uuid(); localStorage.setItem(KEY, id) }
  return id
}
