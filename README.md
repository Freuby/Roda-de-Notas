# Roda de Notas 🪘

Cahier de cours collaboratif pour profs de capoeira, connecté à Supabase.

## Structure

- `index.html` – page d'entrée
- `styles.css` – tous les styles
- `app.js` – toute la logique (auth, espaces, pages, blocs, chants, commentaires)
- `vercel.json` – config de déploiement statique

## Déployer sur Vercel (sans GitHub)

1. Allez sur https://vercel.com/new
2. Choisissez "Deploy" puis glissez-déposez ce dossier (ou un zip dézippé) dans la zone d'upload
3. Vercel détecte un site statique automatiquement (aucune commande de build nécessaire)
4. Cliquez "Deploy" → vous obtenez une URL `https://....vercel.app`

## Déployer via GitHub (recommandé pour les mises à jour)

```bash
cd roda-de-notas
git init
git add .
git commit -m "Roda de Notas"
git branch -M main
git remote add origin https://github.com/VOTRE-USER/roda-de-notas.git
git push -u origin main
```

Puis sur https://vercel.com/new, importez ce dépôt GitHub. Chaque futur `git push` redéploiera automatiquement.

## Configuration Supabase

Les identifiants (URL + clé publique "anon") sont déjà présents en haut de `app.js`. Ce sont des clés publiques protégées par les règles RLS de Supabase — rien de secret à cacher côté serveur.

## Notes

- Les sessions restent mémorisées (persistSession activé) — pas de reconnexion à chaque visite.
- La recherche de chants utilise la table `songs` du même projet Supabase.
