/*
| The rows of a post's "Content IDs" section: one per file CID, and one more
| for a video's poster frame.
|
| `media` is what GET /api/v2/media-proof answers for the post. `urls` are the
| file addresses the page already knows, used only to link a row to its file.
| `shown` are CIDs the page prints elsewhere (a Forever post's own `s5` ids),
| so the same ID is never listed twice.
*/
export function cidRows(media, { urls = [], shown = [] } = {}) {
  const skip = new Set(shown.filter(Boolean))
  const isUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u)
  const urlFor = (file) => urls.find((u) => isUrl(u) && u.split('?')[0].endsWith(`/${file}`)) || null

  const rows = []
  for (const m of Array.isArray(media) ? media : []) {
    if (!m || typeof m.file !== 'string') continue
    if (typeof m.s5_cid === 'string' && m.s5_cid && !skip.has(m.s5_cid)) {
      rows.push({ key: `${m.file}:file`, kind: m.kind, role: 'file', file: m.file, url: urlFor(m.file), cid: m.s5_cid })
    }
    if (typeof m.s5_thumb_cid === 'string' && m.s5_thumb_cid && !skip.has(m.s5_thumb_cid)) {
      rows.push({ key: `${m.file}:poster`, kind: m.kind, role: 'poster', file: m.file, url: null, cid: m.s5_thumb_cid })
    }
  }
  return rows
}
