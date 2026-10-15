const ID = '[0-9A-HJKMNP-TV-Z]{26}'
const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u)
const validCid = (c) => typeof c === 'string' && c !== ''

// A video's poster frame sits beside it as <id>.jpg under /thumbnails/.
export function posterOf(videoUrl) {
  if (!isHttp(videoUrl)) return null
  const clean = videoUrl.split(/[?#]/)[0]
  const swapped = clean.replace(new RegExp(`/videos/(${ID})\\.[A-Za-z0-9]{1,5}$`, 'i'), '/thumbnails/$1.jpg')
  return swapped === clean ? null : swapped
}

const kindOfUrl = (url) => {
  const path = String(url || '').split(/[?#]/)[0]
  const m = /\/(videos|audio|images)\/[^/]+$/.exec(path)
  if (m) return m[1]
  if (/\.(mp4|webm|mov|m4v)$/i.test(path)) return 'videos'
  if (/\.(m4a|mp3|ogg|wav)$/i.test(path)) return 'audio'
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(path)) return 'images'
  return null
}

const NAMES = { image: 'Image', video: 'Video', audio: 'Audio', file: 'File' }

// What to draw for a file: its own picture, a video's poster, or an icon.
export function describeMedia(url, kind) {
  const k = kind || kindOfUrl(url)
  let visual = 'file'
  let thumb = null
  if (k === 'videos') { visual = 'video'; thumb = posterOf(url) }
  else if (k === 'images') { visual = 'image'; thumb = isHttp(url) ? url : null }
  else if (k === 'audio') visual = 'audio'
  return { visual, thumb, name: NAMES[visual] }
}

// "Image 1", "Image 2" when a name repeats; plain "Image" when it does not.
export function numberLabels(items) {
  const total = {}
  items.forEach((i) => { total[i.name] = (total[i.name] || 0) + 1 })
  const seen = {}
  return items.map((i) => {
    seen[i.name] = (seen[i.name] || 0) + 1
    return { ...i, label: total[i.name] > 1 ? `${i.name} ${seen[i.name]}` : i.name }
  })
}

// Rows of the "Content IDs" section: one per file CID, plus a video's poster.
// `urls` only link a row to its file; `shown` are CIDs printed elsewhere, so
// none appears twice.
export function cidRows(media, { urls = [], shown = [] } = {}) {
  const skip = new Set(shown.filter(Boolean))
  const urlFor = (file) => urls.find((u) => isHttp(u) && u.split('?')[0].endsWith(`/${file}`)) || null

  const rows = []
  for (const m of Array.isArray(media) ? media : []) {
    if (!m || typeof m.file !== 'string') continue
    const url = urlFor(m.file)
    if (validCid(m.s5_cid) && !skip.has(m.s5_cid)) {
      const { visual, thumb, name } = describeMedia(url, m.kind)
      rows.push({ key: `${m.file}:file`, kind: m.kind, role: 'file', file: m.file, url, thumb, visual, name, cid: m.s5_cid })
    }
    if (validCid(m.s5_thumb_cid) && !skip.has(m.s5_thumb_cid)) {
      const poster = posterOf(url)
      rows.push({ key: `${m.file}:poster`, kind: m.kind, role: 'poster', file: m.file, url: poster, thumb: poster, visual: 'image', name: 'Video poster', cid: m.s5_thumb_cid })
    }
  }
  return numberLabels(rows)
}
