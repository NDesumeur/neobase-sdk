// Plugin d'exemple : un compteur dont la valeur est gardée dans le dossier de données du plugin (sauvegardé par NeoDex).
export default async function (ctx) {
  const box = ctx.el('div', 'hello'), count = ctx.el('b'), btn = ctx.el('button', 'btn main px', '+1');
  box.append(ctx.el('p', '', 'Bonjour depuis ' + ctx.id + ' v' + ctx.version), count, btn);
  ctx.view.append(box);

  let n = (await ctx.folder.read('compteur'))?.n || 0;
  const show = () => { count.textContent = ' ' + n + ' '; };
  btn.onclick = async () => { n++; show(); await ctx.folder.write('compteur', { n }); };
  show();
}
