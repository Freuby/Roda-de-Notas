import { Space, Page, Block } from '../types';
import { SONG_CATEGORIES } from './utils';

export function downloadSpaceArchive(space: Space, pages: Page[], blocks: Block[]) {
  const blocksByPage: Record<string, Block[]> = {};
  blocks.forEach((b) => {
    if (!blocksByPage[b.page_id]) blocksByPage[b.page_id] = [];
    blocksByPage[b.page_id].push(b);
  });

  function renderArchiveBlock(b: Block, allBlocks: Block[], depth: number): string {
    const c = b.content || {};
    const indent = depth * 20;
    let inner = '';
    const esc = (s: string) =>
      (s || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '&quot;');

    switch (b.type) {
      case 'heading':
        inner = `<h2 style="margin:18px 0 6px;font-size:22px;color:#7C3AED;border-left:4px solid #7C3AED;padding-left:10px;">${esc(
          c.text || ''
        )}</h2>`;
        break;
      case 'subheading':
        inner = `<h3 style="margin:14px 0 4px;font-size:17px;color:#5a4a2c;border-left:4px solid #FFB300;padding-left:8px;">${esc(
          c.text || ''
        )}</h3>`;
        break;
      case 'paragraph':
        inner = `<p style="margin:4px 0;line-height:1.6;white-space:pre-wrap;">${esc(c.text || '')}</p>`;
        break;
      case 'bullet':
        inner = `<div style="margin:2px 0;padding-left:${indent}px;">• ${esc(c.text || '')}</div>`;
        break;
      case 'numbered':
        inner = `<div style="margin:2px 0;padding-left:${indent}px;">${b.order_index + 1}. ${esc(
          c.text || ''
        )}</div>`;
        break;
      case 'callout':
        inner = `<div style="background:#FFF3D6;border:1px solid #FFB300;border-radius:8px;padding:10px 14px;margin:8px 0;white-space:pre-wrap;">${esc(
          c.emoji || '💡'
        )} ${esc(c.text || '')}</div>`;
        break;
      case 'divider':
        inner = `<hr style="border:none;border-top:1px dashed #E3DCC9;margin:14px 0;">`;
        break;
      case 'video':
        inner = c.url
          ? `<p style="margin:6px 0;">🎬 <a href="${esc(c.url)}" target="_blank">${esc(c.url)}</a>${
              c.caption ? ` — <em>${esc(c.caption)}</em>` : ''
            }</p>`
          : '';
        break;
      case 'song':
        inner = `<div style="border:1px solid #7C3AED;border-radius:10px;padding:12px 16px;margin:10px 0;background:#fff;">
          <strong style="color:#7C3AED;font-size:15px;">♪ ${esc(c.title || 'Sans titre')}</strong>${
          c.category ? ` <span style="font-size:11px;color:#7A7A7A;">(${esc(SONG_CATEGORIES[c.category] || c.category)})</span>` : ''
        }
          ${c.lyrics ? `<div style="white-space:pre-wrap;margin-top:8px;font-size:13.5px;line-height:1.6;background:#F5F0E6;padding:10px;border-radius:6px;">${esc(c.lyrics)}</div>` : ''}
          ${c.mnemonic ? `<div style="margin-top:6px;font-style:italic;color:#1A3C2F;font-size:12.5px;">💭 ${esc(c.mnemonic)}</div>` : ''}
          ${c.mediaLink ? `<p style="margin-top:6px;"><a href="${esc(c.mediaLink)}" target="_blank" style="color:#7C3AED;font-size:12px;">🔗 Écouter / regarder</a></p>` : ''}
        </div>`;
        break;
      case 'toggle':
        const children = allBlocks
          .filter((x) => x.parent_block_id === b.id)
          .sort((a, b2) => a.order_index - b2.order_index);
        inner = `<details style="margin:8px 0;" open>
          <summary style="cursor:pointer;font-weight:600;color:#1A3C2F;font-size:16px;">${esc(
            c.text || 'Titre dépliant'
          )}</summary>
          <div style="margin-left:18px;border-left:2px solid #DCEFE6;padding-left:14px;margin-top:6px;">
            ${children.map((ch) => renderArchiveBlock(ch, allBlocks, depth + 1)).join('')}
          </div>
        </details>`;
        break;
    }
    return inner;
  }

  const pagesHtml = pages
    .map((p) => {
      const pageBlocks = (blocksByPage[p.id] || [])
        .filter((b) => !b.parent_block_id)
        .sort((a, b) => a.order_index - b.order_index);
      const allPageBlocks = blocksByPage[p.id] || [];
      return `<section style="margin-bottom:48px;padding-bottom:24px;border-bottom:2px solid #E3DCC9;">
      <h1 style="font-size:26px;margin-bottom:4px;color:#1A3C2F;">${p.title || 'Sans titre'}</h1>
      <div>${pageBlocks.map((b) => renderArchiveBlock(b, allPageBlocks, 0)).join('')}</div>
    </section>`;
    })
    .join('\n');

  const payload = JSON.stringify({ space: { name: space.name }, pages, blocks });
  const payloadEscaped = payload.replace(/<\/script>/g, '<\\/script>');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Archive — ${space.name}</title>
<style>
  body { 
    font-family:'Segoe UI', system-ui, -apple-system, sans-serif; 
    max-width:760px; 
    margin:40px auto; 
    padding:0 24px; 
    color:#1A3C2F; 
    background:#F5F0E6; 
    line-height: 1.5; 
  }
  a { 
    color:#FF6B00; 
    text-decoration: none; 
  }
  a:hover { 
    text-decoration: underline; 
  }
  .archive-header { 
    text-align:center; 
    margin-bottom:40px; 
    padding-bottom:20px; 
    border-bottom:3px double #FF6B00; 
  }
  .archive-header p { 
    color:#7A7A7A; 
    font-size:13px; 
    margin-top: 4px; 
  }
  .archive-metadata {
    background:#F8F5EE;
    border-left:4px solid #FF6B00;
    padding:12px 16px;
    margin-bottom:24px;
    font-size:12px;
    color:#5a4a2c;
  }
  .archive-metadata strong {
    color:#FF6B00;
  }
</style>
</head>
<body>
  <div class="archive-header">
    <h1 style="margin: 0; font-size: 28px;">🪘 ${space.name}</h1>
    <p>Archive Roda de Notas — générée le ${new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} — ${pages.length} cours</p>
  </div>
  
  <div class="archive-metadata">
    <strong>Créé par:</strong> ${space.created_by}<br>
    <strong>Date de création:</strong> ${new Date(space.created_at || '').toLocaleDateString('fr-FR')}<br>
    <strong>Total des blocs:</strong> ${blocks.length}<br>
    <strong>Type de contenu:</strong> ${pages.reduce((sum, p) => sum + (blocksByPage[p.id]?.length || 0), 0)} éléments
  </div>
  
  ${pagesHtml}
  <script type="application/json" id="roda-archive-data">${payloadEscaped}</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = space.name.replace(/[^a-z0-9_\-]+/gi, '_');
  a.href = url;
  a.download = `archive_${safeName}_${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}