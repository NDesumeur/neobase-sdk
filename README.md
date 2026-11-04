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
  "neobase": ">=4.1.0",
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
| `system` | réservé : un plugin système ne peut pas être désinstallé et se range dans la catégorie « Système » (fixé par NeoBase, pas par l'auteur). Réservé aux applis qui dépendent du cœur de NeoBase |
| `main` | le **volet système** du plugin : un fichier Node (`main.js`) chargé par NeoBase seulement si le plugin est signé, activé et que l'accès complet est accordé (voir plus bas) |
| `sync` | les règles de fusion de la synchro pour les documents du plugin (voir « Le dossier de données ») |
| `dependencies` | autres plugins requis : `{ "neobase.autreplugin": ">=1.2.0" }` (installés automatiquement depuis le catalogue) |
| `uses` | plugins dont celui-ci lit les données : `["neobase.peche"]` (demande la permission `data:<id>:read`) |
| `exposes` | ce que ce plugin partage : `{ "storage": "read" }` ou `{ "storage": "write" }` |
| `sdk` | version du SDK et du registre des autorisations visée : `"2.0.0"` |
| `permissions` | liste des autorisations demandées (voir plus bas) |

Le schéma de validation est dans [`plugin.schema.json`](plugin.schema.json).

## Le code du plugin

`entry` exporte une fonction par défaut. NeoBase l'appelle avec un contexte `ctx` : le plugin
n'a accès qu'à ce contexte, jamais au reste de NeoBase ni aux autres plugins.

```js
export default async function (ctx) {
  const box = ctx.el('div', 'hello');
  box.textContent = 'Bonjour ' + ctx.id;
  ctx.view.append(box);

  const saved = await ctx.folder.read('notes');      // un document de TON dossier de données : sauvegardé par NeoBase
  box.textContent = saved?.note || 'Bonjour';
  ctx.onOpen(() => box.focus?.());
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
| `ctx.folder.read(nom)` / `.write(nom, json)` / `.remove(nom)` / `.list()` | `storage` | les **documents JSON** de ton dossier de données |
| `ctx.folder.readFile(nom)` / `.writeFile(nom, base64)` / `.removeFile(nom)` / `.listFiles()` | `storage` | les **fichiers** (images, sons…) de ton dossier de données, en base64 |
| `ctx.storage.get()` / `.set(data)` | `storage` | raccourci : le document `storage` de ton dossier |
| `ctx.data.get(idAutrePlugin)` / `.set(idAutrePlugin, données)` | `data:<id>:read` / `:write` | lire ou modifier le document `storage` d'un autre plugin qui le partage (`exposes`) |
| `ctx.host` | `full` | les outils d'interface de NeoBase : `el`, `toast`, `sfx`, `ask`, `newTab`, `pixIcon`, `PIX`, `WX`, `win(action)`, **`confirm(message)`** (boîte de confirmation de NeoBase, renvoie une promesse `true`/`false`, jamais la fenêtre de Windows), `box({title, text, buttons, danger})`, `settings()` (réglages de NeoBase en lecture seule), `tabLabel(texte, titre)` (le texte de ton onglet : messages non lus…), `pref(nom)` (un réglage de NeoBase, lecture seule), **`hooks({audio, mute, onClose, onTabChange, playing})`** : dis à NeoBase si ton plugin joue du son (haut-parleur sur l'onglet, NeoMe qui danse), ce qu'il doit faire quand ton onglet se ferme ou que l'utilisateur change d'onglet (mini-lecteur…) |
| `ctx.legacy` | `full` | lecture seule des données d'**avant les plugins** (`settings()`, `api(nom)`, `local(clé)`), pour reprendre ce que l'utilisateur avait à la première ouverture |
| `ctx.files.add/read/remove` | `files` | fichiers (images, exports…) du plugin |
| `ctx.net(url, opts)` | `network` ou `network:<domaine>` | requêtes réseau sortantes |
| `ctx.permission(nom, raison)` | toujours | demander une autorisation au moment de l'utiliser, en disant pourquoi ; l'utilisateur choisit « cette fois », « toujours » ou « refuser » ; renvoie un booléen |

### Les autorisations

Toutes les autorisations viennent d'un seul registre, [`permissions.json`](permissions.json) (registre 2, SDK 2.0.0).
Pour chacune, il donne son identifiant, son libellé, la phrase montrée à l'utilisateur et son niveau de risque.
Une autorisation absente du registre fait échouer la validation du plugin.

Un plugin ne reçoit que les autorisations qu'il déclare **et** que l'utilisateur accorde.
L'utilisateur les voit dans l'appli **Autorisations**, par plugin ou par autorisation, et peut les retirer quand il veut.
Le plugin redemande une autorisation au moment où il en a besoin, avec `ctx.permission(nom, raison)`.

NeoBase contrôle chaque appel lui-même. Un appel sans l'autorisation échoue avec une erreur dont le message commence par `PERMISSION_DENIED`.

| Autorisation | Risque | Donne accès à |
|--------------|--------|---------------|
| `storage` | faible | ses propres données, 50 Mo au plus pour tout son dossier |
| `files` | faible | les fichiers livrés avec le plugin, rien d'autre sur le PC |
| `notifications` | faible | le centre de notifications de NeoBase |
| `network:exemple.org` | faible | ce domaine seulement ; `network:*.exemple.org` couvre aussi ses sous-domaines |
| `network` | moyen | tous les sites Internet (préfère les domaines) |
| `clipboard` | moyen | lire et écrire le presse-papiers |
| `data:<id>:read` | moyen | lire les données qu'un autre plugin partage |
| `data:<id>:write` | élevé | modifier les données qu'un autre plugin partage |
| `system:exec:<programme>` | élevé | lancer un programme de la liste blanche du registre (`explorer`, `notepad`, `winget`…). Plugins **signés** seulement, toujours demandé à l'utilisateur |
| `full` | élevé | **accès complet** : le plugin tourne dans la page de NeoBase, avec ses outils d'interface (`ctx.host`). Réservé aux plugins **signés** par NeoBase. Jamais accordé d'office : NeoBase le demande à la première ouverture, avec un avertissement |

**Partager ses données.** Un plugin ne lit les données d'un autre que si ce dernier les partage dans son manifeste.
- `"exposes": { "storage": "read" }` : les autres peuvent les lire.
- `"exposes": { "storage": "write" }` : les autres peuvent les lire et les modifier.

L'accord de l'utilisateur ne suffit pas. `ctx.data.get(id)` lit les données, `ctx.data.set(id, données)` les modifie.

**Mises à jour.** Une nouvelle version qui demande plus d'autorisations ne s'installe pas d'office.
NeoBase montre ce qui s'ajoute et attend l'accord de l'utilisateur. D'ici là, l'ancienne version reste en place.

**Migration.** Déclare `"sdk": "2.0.0"` dans ton manifeste.
- Les anciens noms sont convertis tout seuls, d'après la table `legacy` du registre : `data:<id>` devient `data:<id>:read`.
- Un plugin sans `sdk` dont les données sont lues sans `exposes` reste lisible pour l'instant, avec un message de dépréciation dans le journal.
- Ce cas sera refusé dans une prochaine version du registre.

Demande le minimum : un plugin qui réclame trop d'autorisations est refusé à l'examen.

## Le dossier de données du plugin

Chaque plugin a son **dossier de données**, `plugindata/<id>/` dans les données de NeoBase. Il contient :

- des **documents JSON** (`ctx.folder.read/write`) ;
- des **fichiers** (`ctx.folder.readFile/writeFile`), rangés dans `files/`.

NeoBase s'en sert pour la **sauvegarde cloud** : chaque document devient une section de la synchro
entre appareils (fusionnée champ par champ, avec gestion des conflits dans fgestion), chaque fichier est
copié dans le fichier de synchro, et le tout est dans les sauvegardes automatiques. Tu n'as rien à faire :
écris tes données dans ton dossier et elles suivent l'utilisateur d'un appareil à l'autre.

Règles :

- noms de documents et de fichiers : lettres, chiffres, `.`, `_`, `-` (80 caractères au plus, jamais `..`) ;
- 8 Mo au plus par document, 15 Mo au plus par fichier ;
- une structure **avec des listes d'objets portant un `id`** se fusionne finement entre appareils
  (deux appareils qui ajoutent chacun une ligne gardent les deux) ;
- un plugin **ne lit jamais** le dossier d'un autre, sauf via `ctx.data.get` après autorisation.

### Reprendre les données d'avant

Un plugin qui remplace une ancienne appli de NeoBase (`full` uniquement) peut lire **une fois**, à la
première ouverture, ce que l'utilisateur avait (`ctx.legacy`), le copier dans son dossier, puis ne plus
jamais y toucher. Exemple : si `ctx.folder.read('budget')` renvoie `null`, lire `await ctx.legacy.api('budget')`
et l'écrire dans le dossier.

### Les règles de fusion de la synchro

Chaque document du dossier part dans le fichier de synchro (une section `pd/<id>/<nom>`), sur tous tes PC et, plus tard, tes téléphones. Quand deux appareils ont changé le même morceau, NeoBase garde les deux versions et te demande de choisir. Pour un document fait de compteurs, de caches ou d'une liste qui ne fait que grandir, déclare comment fusionner dans `plugin.json` :

```json
"sync": { "library": { "auto": ["session", "stats.*"], "union": ["stats.history"] } }
```

- `auto` : des chemins dans le document, où le plus récent gagne sans rien demander (`*` = un niveau).
- `union` : des listes sans identifiant qui ne font que grandir : on garde l'union des deux.

## Le volet système d'un plugin (`main`)

Un plugin qui a besoin de Node ou d'Electron (lancer un programme, lire des fichiers du PC, des raccourcis globaux, servir des fichiers) met ce code dans un fichier `main.js`, nommé par le champ `main`. NeoBase le charge **seulement** si le plugin est signé, activé et a reçu l'accès complet : aucun code de ce genre ne vit dans le cœur.

```js
module.exports = api => {
  api.ipcMain.handle('mon:salut', async (_, nom) => 'Salut ' + nom);   // appelé par la page du plugin
  api.protocol(async (req, url) => api.serveFile(monFichier, req));    // sert neoplugin://<id>/…
  api.emit('mon:evenement', { x: 1 });                                  // prévient la page
  return () => { /* nettoyage quand le plugin est désactivé ou mis à jour */ };
};
```

`api` contient : `id`, `electron`, `getWin`, `dataDir`, `ipcMain.handle`, `emit`, `protocol`, `serveFile`, `onShortcutReset`, `readDoc` et `writeDoc` (les documents du dossier du plugin).

Dans la page du plugin : `await ctx.neo.pluginMain('<id>', 'mon:salut', 'toi')` appelle ce code, et `ctx.neo.onPluginMain(e => …)` reçoit ses événements (`e.id`, `e.name`, `e.data`). Les fichiers servis sont à l'adresse `neoplugin://<id>/…`. Mets `main.js` (et les fichiers qu'il utilise) dans l'archive, à côté de `plugin.json` et `index.js`. Un plugin peut appeler le volet système d'un autre en le déclarant dans `dependencies`.

## Isolation, désinstallation

- Un plugin ne peut pas lire ni modifier les fichiers d'un autre plugin ni le cœur de NeoBase.
- Son **code** est retéléchargé sur chaque appareil depuis sa Release (signature revérifiée) : un plugin
  installé sur un appareil apparaît installé sur les autres.
- À la désinstallation, NeoBase propose de **garder** les données (elles restent dans la synchro et
  reviennent à la réinstallation) ou de les **effacer** (l'effacement est envoyé aux autres appareils).

### Fichiers livrés, plugin toujours actif, menu

- Tout fichier ajouté à l'archive (images, bibliothèques) est posé dans le dossier du plugin ; un plugin d'accès complet le lit avec `neo.pluginFileRead(ctx.id, 'chemin')` (base64).
- `"autoload": true` dans `plugin.json` : le plugin se charge au démarrage, sans attendre son ouverture (accès complet et signature exigés).
- `ctx.host.menuItem(nom, infobulle, fn)` ajoute une entrée au menu de NeoBase ; `ctx.host.closeTab(onglet)` ferme un onglet ; `ctx.host.statCount(clé)` compte un usage pour Stats ; `ctx.icon` est l'adresse de l'icône du plugin.

### L'emploi du temps de NeoBase

Un plugin d'accès complet peut y mettre ses événements : `ctx.host.agenda.sync('mon-plugin', [événements])` **remplace** à chaque
appel tous les événements de ce plugin (ils portent son nom dans `src`). Un événement :
`{ id, kind: 'event', title, date: 'AAAA-MM-JJ', start: 'HH:MM', end: 'HH:MM', allDay: false, color, place }`. Les identifiants doivent être
stables (`monplugin:<identifiant du match>`) : deux PC synchronisés obtiennent les mêmes événements. Appelle `sync(nom, [])` pour les
retirer quand l'utilisateur décoche le réglage. Les plugins « Sorties anime » et « NBA » s'en servent.

### Les captures d'un plugin

Mets une ou plusieurs captures dans le dépôt, dans `screenshots/1.jpg` (le thème Néon de NeoBase, 1280 × 800) : NeoStore les montre sur la
fiche du plugin quand le catalogue les référence. Elles ne font pas partie de l'archive.

### Le style d'un plugin

Un plugin apporte **son propre style** : `ctx.host.addStyle(css)` (accès complet) l'ajoute à la page et le retire quand le plugin
est déchargé. Pour rester dans l'esprit de NeoBase, sers-toi des variables du thème, qui suivent les couleurs choisies par
l'utilisateur : `--magenta`, `--win`, `--line`, `--line2`, `--lilac`, `--shell`, `--muted`, `--bg0`, `--text` (police), `--title`
(police des titres), `--pkr` (couleur d'accent en R, G, B, pour `rgba(var(--pkr), .3)`). Les classes communes du système
(`btn`, `px`, `tab`, `label`, `hint`, `appWrap`, `agHead`, `f` pour un champ…) restent disponibles sans rien écrire.
Le sélecteur de ta vue est `#plug_<id avec des _ au lieu des points>`.

Le guide complet, de zéro à la Release : [`docs/PUBLIER.md`](docs/PUBLIER.md).

## Publier une version

1. Monte `version` dans `plugin.json`.
2. Crée une archive `.zip` contenant `plugin.json`, `index.js` à la racine et les dossiers de fichiers livrés (voir le guide).
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
