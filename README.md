 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/README.md
index 0000000000000000000000000000000000000000..e61a7327971cf2a06c80f45c22296d863f00f55e 100644
--- a//dev/null
+++ b/README.md
@@ -0,0 +1,37 @@
+# Alpha Launchpad
+
+Ce projet permet de créer rapidement des pages pour lancer des memecoins sur Solana.
+
+## Prérequis
+
+- **Node.js** (version 18 recommandée) pour exécuter le serveur.
+- **Phantom** (extension de portefeuille Solana) pour pouvoir réclamer votre projet.
+
+## Configuration `.env`
+
+Créez un fichier `.env` à la racine avec les variables suivantes :
+
+```
+OPENAI_API_KEY=...
+TELEGRAM_BOT_TOKEN=...
+SERVER_PRIVATE_KEY=...
+SOLANA_CLUSTER=...
+```
+
+## Installation et lancement
+
+Installez les dépendances puis démarrez le serveur :
+
+```bash
+npm install
+npm start
+```
+
+Le serveur tourne alors sur `http://localhost:3001`.
+
+## Créer et réclamer un projet
+
+1. Ouvrez `form.html` ou `launcher.html` dans votre navigateur (directement en ouvrant le fichier ou via un petit serveur HTTP local).
+2. Remplissez le formulaire (nom, ticker, prompt d'image, description) puis validez.
+3. Une URL vers votre page projet apparaîtra. Ouvrez-la pour voir le site généré.
+4. Sur cette page, cliquez sur **Claim This Project** puis signez la demande dans Phantom afin de prouver que vous êtes le créateur.
 
EOF
)