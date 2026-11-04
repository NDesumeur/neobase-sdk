# Politique de sécurité de NeoDex

## Signaler une faille

Ne publie pas la faille dans une issue publique. Utilise le signalement privé de GitHub :
onglet **Security** du dépôt concerné, puis **Report a vulnerability**.

- NeoDex lui-même : `NDesumeur/neodex-releases`
- un plugin : le dépôt du plugin (`NDesumeur/neodex-plugin-…`), ou `NDesumeur/neodex-store-catalog` s'il est dangereux
- le SDK ou le registre des autorisations : `NDesumeur/neodex-sdk`

Décris ce qui se passe, la version de NeoDex, et comment le reproduire. Tu reçois une réponse dès que possible.
Une faille confirmée est corrigée dans la version suivante. Si elle touche un plugin, le plugin est révoqué tout de suite.

## Versions suivies

Seule la dernière version de NeoDex reçoit des correctifs. NeoDex se met à jour tout seul.

## Comment NeoDex se protège

**Plugins**

- **Le catalogue officiel** (`neodex-store-catalog`) n'accepte que des plugins examinés.
  - Chaque version approuvée reçoit une attestation signée (ed25519).
  - NeoDex vérifie cette signature et l'empreinte SHA-256 de l'archive avant d'installer.
- **La clé privée de signature** n'est dans aucun dépôt : elle reste chiffrée sur la machine de l'auteur.
- **Les autorisations** viennent d'un seul registre, `permissions.json`, versionné avec le SDK.
  - Une autorisation inconnue fait échouer l'installation.
  - NeoDex contrôle chaque appel ; un appel non autorisé échoue avec `PERMISSION_DENIED`.
  - Internet peut être limité à des domaines.
  - Les données d'un autre plugin ne sont lisibles que si ce plugin les partage (`exposes`). L'écriture est une autorisation à part.
  - Le stockage d'un plugin non vérifié est plafonné à 1 Go.
  - Les programmes lancés doivent figurer dans une liste blanche.
- **Une mise à jour qui demande plus d'autorisations** ne s'installe pas sans ton accord. L'ancienne version reste en place en attendant.
- **Les plugins non signés** tournent dans une `<iframe sandbox>`, dans un processus à part. Ils n'ont pas accès à `window.neo` et ne parlent à NeoDex que par messages contrôlés.

**Révocation**

- Un plugin retiré (liste `revoked` du catalogue) est désinstallé de tous les PC en 15 minutes environ.
- Il ne peut plus être réinstallé, même avec une signature valide.

**Electron**

- `contextIsolation` est activé, `nodeIntegration` désactivé, `sandbox` activé sur toutes les fenêtres.
- Les pages de NeoDex ont une CSP qui interdit tout script venu d'Internet.
- Les sites web s'ouvrent dans des `<webview>` sans preload privilégié ni Node.
- Les fenêtres surgissantes sont refusées et rouvertes en onglet.

**Dépendances**

- Les versions sont verrouillées (`package.json` sans `^`, `package-lock.json` versionné).
- Dependabot propose les mises à jour de sécurité, et `npm audit` est lancé avant chaque version.
