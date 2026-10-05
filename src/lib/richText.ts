const ALLOWED_TAGS = new Set(['B', 'STRONG', 'U', 'S', 'STRIKE', 'DEL', 'I', 'EM', 'BR', 'DIV', 'P', 'SPAN']);
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i;

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

const cleanStyle = (el: HTMLElement) => {
  const out: string[] = [];
  const color = el.style.color;
  if (color && COLOR_RE.test(color.trim())) out.push(`color: ${color.trim()}`);
  const deco = el.style.textDecorationLine || el.style.textDecoration;
  if (deco) {
    const parts = ['underline', 'line-through'].filter((d) => deco.includes(d));
    if (parts.length) out.push(`text-decoration: ${parts.join(' ')}`);
  }
  const fw = el.style.fontWeight;
  if (fw === 'bold' || fw === '700' || fw === '600') out.push('font-weight: bold');
  return out.join('; ');
};

const cleanNode = (node: Node, doc: Document): Node[] => {
  if (node.nodeType === Node.TEXT_NODE) return [doc.createTextNode(node.textContent || '')];
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as HTMLElement;
  const children = Array.from(el.childNodes).flatMap((c) => cleanNode(c, doc));
  if (!ALLOWED_TAGS.has(el.tagName)) return children;
  const clean = doc.createElement(el.tagName.toLowerCase());
  if (el.tagName === 'SPAN') {
    const style = cleanStyle(el);
    if (style) clean.setAttribute('style', style);
  }
  children.forEach((c) => clean.appendChild(c));
  return [clean];
};

export const sanitizeHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const wrapper = document.createElement('div');
  Array.from(doc.body.childNodes)
    .flatMap((n) => cleanNode(n, document))
    .forEach((n) => wrapper.appendChild(n));
  return wrapper.innerHTML;
};
