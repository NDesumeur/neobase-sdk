# SDK des plugins NeoBase

NeoBase est un cœur minimal (accueil, navigateur, NeoStore, autorisations). Tout le reste —
jeux, outils, bureautique, lecteurs — est un **plugin** : un dépôt GitHub que NeoStore trouve,
télécharge et installe, indépendamment de NeoBase.

Ce dépôt décrit le format d'un plugin, l'API mise à disposition et la façon d'en publier un.

## Créer un plugin en 4 étapes

1. Crée un dépôt GitHub et ajoute-lui le *topic* **`neobase-plugin`** (Settings → Topics).
   C'est ainsi que NeoStore trouve les plugins.
2. Mets à la racine un fichier **`plugin.json`** (voir le format plus bas) et le code du plugin.
3. Publie une **Release** GitHub. Joins-y l'archive du plugin (`<id>-<version>.zip`) : c'est le
   fichier que NeoStore télécharge.
4. (Officiel) Fais approuver ton plugin pour qu'il reçoive une attestation signée et entre au
   catalogue officiel. Voir « Approbation ».

L'exemple complet le plus simple est dans [`examples/hello`](examples/hello).

## Le fichier `plugin.json`

```json
{
  "id": "neobase.hello",
  "name": "Bonjour",
  "version": "1.0.0",
  "author": "TonPseudo",
  "description": "Un plugin d'exemple.",
  "icon": "icon.png",
  "entry": "index.js",
  "view": "hello",
  "neobase": ">=4.0.0",
  "type": "app",
  "category": "Outils",
  "mobile": true,
  "system": false,
  "dependencies": {},
  "permissions": ["storage"]
}
```

| Champ | Rôle |
|-------|------|
| `id` | identifiant unique, en minuscules, style `auteur.nom` (ne change jamais) |
| `name` | nom affiché |
| `version` | version **semver** (`MAJEUR.MINEUR.CORRECTIF`) ; remonte-la à chaque Release |
| `author` | ton nom ou pseudo |
| `description` | une phrase |
| `icon` | fichier image dans l'archive (PNG carré conseillé) |
| `entry` | le script chargé par NeoBase (défaut `index.js`) |
| `view` | identifiant de la vue que le plugin crée (unique) |
| `neobase` | plage de versions de NeoBase compatibles (semver range) |
| `type` | `app` (une application) ou `mod` (modifie NeoBase : sorties animes, calendrier…) |
| `category` | catégorie dans NeoStore (Jeux, Outils, Bureautique…) |
| `mobile` | `true` si compatible avec le téléphone |
| `system` | réservé : un plugin système ne peut pas être désinstallé (fixé par NeoBase, pas par l'auteur) |
| `dependencies` | autres plugins requis : `{ "neobase.autreplugin": ">=1.2.0" }` |
| `permissions` | liste des autorisations demandées (voir plus bas) |

Le schéma de validation est dans [`plugin.schema.json`](plugin.schema.json).

## Le code du plugin

`entry` exporte une fonction par défaut. NeoBase l'appelle avec un contexte `ctx` : le plugin
n'a accès qu'à ce contexte, jamais au reste de NeoBase ni aux autres plugins.

```js
export default function (ctx) {
  const box = ctx.el('div', 'hello');
  box.textContent = 'Bonjour ' + ctx.id;
  ctx.view.append(box);

  ctx.onOpen(async () => {
    const saved = await ctx.storage.get();          // données du plugin, isolées et synchronisées
    box.textContent = saved?.note || 'Bonjour';
  });
}
```

### Ce que contient `ctx`

| Membre | Disponible | Rôle |
|--------|-----------|------|
| `ctx.id`, `ctx.version` | toujours | identité du plugin |
| `ctx.view` | toujours | l'élément HTML à remplir (ta fenêtre) |
| `ctx.el(tag, class?, text?)` | toujours | créer un élément (aide) |
| `ctx.ui.toast(msg, err?)` | toujours | message éphémère |
| `ctx.ui.newTab(url)` | toujours | ouvrir un onglet |
| `ctx.ui.pixIcon(rows)` | toujours | icône pixel art |
| `ctx.onOpen(fn)`, `ctx.onClose(fn)` | toujours | à l'ouverture / fermeture de la vue |
| `ctx.storage.get()` / `.set(data)` | `storage` | JSON propre au plugin, isolé, sauvegardé dans le cloud |
| `ctx.files.add/read/remove` | `files` | fichiers (images, exports…) du plugin |
| `ctx.net(url, opts)` | `network` | requêtes réseau sortantes |
| `ctx.permission(nom)` | toujours | demander une autorisation à l'usage ; renvoie un booléen |

### Les autorisations

Un plugin ne reçoit que les autorisations qu'il déclare **et** que l'utilisateur accorde. Elles
sont visibles et révocables à tout moment dans l'appli **Autorisations** ; si le plugin en a
besoin plus tard, il la redemande.

| Autorisation | Donne accès à |
|--------------|---------------|
| `storage` | ses propres données (conseillé pour presque tous) |
| `files` | lire/écrire les fichiers du plugin |
| `network` | contacter Internet |
| `clipboard` | lire/écrire le presse-papiers |
| `notifications` | afficher des notifications |

Demande le minimum : un plugin qui réclame trop d'autorisations est refusé à l'examen.

## Isolation, données, désinstallation

- Un plugin ne peut pas lire ni modifier les fichiers d'un autre plugin ni le cœur de NeoBase.
- Ses données vivent dans un espace à son `id`, inclus dans la synchronisation et les sauvegardes.
- À la désinstallation, NeoBase propose de garder ou d'effacer ces données.

## Publier une version

1. Monte `version` dans `plugin.json`.
2. Crée une archive `.zip` contenant `plugin.json` et tout le code à la racine.
3. Publie une Release GitHub dont le tag est la version (`v1.0.0`) et joins-y le `.zip`.
4. Pour un plugin officiel, joins aussi l'`attestation.json` signée (voir « Approbation »).

## Approbation (plugins officiels)

Un plugin **approuvé** a été examiné par NeoBase et déclaré compatible avec une plage de versions.
L'approbation est une **attestation signée** jointe à la Release :

```json
{
  "pluginId": "neobase.hello",
  "repo": "TonPseudo/neobase-hello",
  "version": "1.0.0",
  "sha256": "<empreinte du .zip>",
  "approvedAt": "2026-10-31T00:00:00Z",
  "neobase": ">=4.0.0",
  "signature": "<signature ed25519, base64>"
}
```

NeoBase embarque la clé publique officielle et refuse un plugin dont la signature est invalide,
dont l'empreinte ne correspond pas au fichier téléchargé, ou dont l'approbation ne vise pas la
version publiée. Chaque nouvelle version demande une nouvelle approbation.

Un plugin **proposé** (topic `neobase-plugin` mais sans attestation) reste installable, mais
NeoStore le signale comme non vérifié.

Pour proposer un plugin à l'approbation officielle : voir le dépôt du catalogue NeoStore.
