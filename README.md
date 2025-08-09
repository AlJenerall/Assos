# Application de gestion d'association (clé-en-main)

Conforme au document **PDF** fourni (espaces admin & membre, projets, cotisations, antennes, événements, documents, votes — MVP). Backend **Node/Express + Prisma (SQLite)**, frontend **Vue 3 (Vite)**. Auth v1 via `ADMIN_TOKEN` (à remplacer ensuite par vraie auth/JWT).

## Lancer en local (sans Docker)

### 1) API
```bash
cd backend
cp .env.example .env
npm i
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
# API: http://localhost:4000
```

### 2) Front
```bash
cd ../frontend
cp .env.example .env
npm i
npm run dev
# Front: http://localhost:5173
```
Dans le front, mets ton `ADMIN_TOKEN` (depuis le `.env` backend) en haut de l'interface.

## Lancer avec Docker (recommandé pour démo rapide)
```bash
docker compose up --build
# Front: http://localhost:5173  /  API: http://localhost:4000
```
> Variable d'env côté Docker: `ADMIN_TOKEN` (défaut: `change-me-super-secret`).

## Déploiement (Render ou Railway)
- Crée deux services (web pour le front, web pour l’API) ou un monorepo avec docker-compose (Railway).
- API: Node 20, commande de démarrage: `npx prisma generate && npx prisma migrate deploy && node src/server.js`
- FRONT: Node 20, build `npm run build`, start `npm run preview -- --host` (ou déploie statique sur Netlify/Vercel et pointe `VITE_API_URL` vers l’API).
- Ajoute `ADMIN_TOKEN` côté API.

## Ce qui est inclus (MVP)
- **Membres**: CRUD + affectation d’antenne, historique d’activités
- **Antennes**: création/liste
- **Caisse**: paiements cash/automatique (placeholder)
- **Quotas**: table `QuotaSetting` (weekly/monthly/yearly)
- **Cotisations (Contributions)**: création + paiements liés
- **Projets**: CRUD + statuts (en cours/terminé/archivé/annulé)
- **Propositions de projet**: soumission publique + revue admin
- **Événements**: création (membre) + approbation (admin)
- **Documents**: ajout + archivage
- **Votes**: squelette (création/liste)
- **Dashboard** (membre): 8 derniers projets/cotisations/événements approuvés

## À venir (faciles à ajouter)
- Auth réelle (JWT + rôles du PDF)
- Workflow d’affectation avec dettes bloquantes
- Agrégateurs de paiement (Orange, etc.)
- Upload de documents (stockage S3)
- Page membre: quotas détaillés, réunions & vidéos

Bon dev !