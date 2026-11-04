/** Parse a model response without inventing or completing missing JSON values. */
export function parseModelJson(text: string): unknown {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(clean); } catch { /* Try narrowly defined formatting fixes. */ }

  // Extract one complete top-level object, ignoring braces inside JSON strings.
  const start = clean.indexOf('{');
  if (start < 0) throw new Error('invalid JSON');
  let depth = 0, quoted = false, escaped = false, end = -1;
  for (let i = start; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
      if (depth < 0) break;
    }
  }
  if (end < 0 || /[{}\[\]]/.test(clean.slice(end))) throw new Error('invalid JSON');
  const object = clean.slice(start, end);
  let fixed = '', inString = false, escape = false;
  for (let i = 0; i < object.length; i++) {
    const c = object[i];
    if (inString) {
      if (escape) { fixed += c; escape = false; }
      else if (c === '\\') { fixed += c; escape = true; }
      else if (c === '"') { fixed += c; inString = false; }
      else if (c.charCodeAt(0) < 0x20) fixed += `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`;
      else fixed += c;
    } else if (c === '"') { fixed += c; inString = true; }
    else if (c === ',' && /^\s*[}\]]/.test(object.slice(i + 1))) { /* trailing comma */ }
    else fixed += c;
  }
  return JSON.parse(fixed);
}
