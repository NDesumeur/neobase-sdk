// Plugin d'exemple : un compteur dont la valeur est gardée (et synchronisée) par NeoBase.
export default function (ctx) {
  const box = ctx.el('div', 'hello'), count = ctx.el('b'), btn = ctx.el('button', 'btn main px', '+1');
  box.append(ctx.el('p', '', 'Bonjour depuis ' + ctx.id + ' v' + ctx.version), count, btn);
  ctx.view.append(box);

  let n = 0;
  const show = () => { count.textContent = ' ' + n + ' '; };
  btn.onclick = async () => { n++; show(); await ctx.storage.set({ n }); };

  ctx.onOpen(async () => { n = (await ctx.storage.get())?.n || 0; show(); });
}
