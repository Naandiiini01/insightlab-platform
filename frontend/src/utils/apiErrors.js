/**
 * Django REST Framework errors: { field: ["msg"] } or { detail: "..." }.
 */
export function formatApiError(err) {
  const data = err?.response?.data
  if (!data) {
    return err?.message || 'Something went wrong. Please try again.'
  }
  if (typeof data === 'string') return data
  if (data.detail != null) {
    const d = data.detail
    return typeof d === 'string' ? d : Array.isArray(d) ? d.join(' ') : String(d)
  }
  if (typeof data.message === 'string') return data.message

  const lines = []
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      value.forEach((msg) => {
        if (typeof msg === 'string') {
          lines.push(key === 'non_field_errors' ? msg : `${labelField(key)}${msg}`)
        }
      })
    } else if (typeof value === 'string') {
      lines.push(`${labelField(key)}${value}`)
    }
  }
  return lines.length ? lines.join(' ') : 'Request failed'
}

function labelField(key) {
  if (key === 'non_field_errors') return ''
  const map = { email: 'Email: ', password: 'Password: ', name: 'Name: ' }
  return map[key] || `${key}: `
}

/** First message per field for inline hints (email, password, name, …). */
export function extractFieldErrors(data) {
  if (!data || typeof data !== 'object') return {}
  const out = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'detail') continue
    if (Array.isArray(value) && value[0]) out[key] = value[0]
    else if (typeof value === 'string') out[key] = value
  }
  return out
}
