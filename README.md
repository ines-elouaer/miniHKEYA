# 🧠 miniHKEYA – Plateforme éducative intelligente pour enfants

mini HKEYA est une application éducative interactive destinée aux enfants, combinant
des **jeux pédagogiques**, des **histoires générées par IA**, et une **interface ludique**
en arabe (classique + tunisien).

Le projet est conçu avec une **architecture moderne frontend / backend**, entièrement
**containerisée avec Docker** et **déployée sur Microsoft Azure**.

---

## 🎯 Objectifs du projet

- Rendre l’apprentissage plus **amusant** et **interactif**
- Proposer du contenu éducatif en **arabe simple**
- Utiliser l’IA pour générer :
  - des histoires éducatives
  - des jeux (quiz, missions, labyrinthe)
- Mettre en place un **déploiement cloud réel** (production-ready)

---

### Séparation des responsabilités
- **Frontend** : interface utilisateur (UX, navigation, jeux)
- **Backend** : logique métier, IA, authentification, base de données
- **DB** : stockage utilisateurs, scores, histoires
- **IA (local)** : Ollama + Qwen (en développement)

---

## 🧰 Technologies utilisées

### Frontend
- React
- Vite
- JavaScript
- CSS moderne
- Docker + Nginx

### Backend
- Python 3.11
- FastAPI
- SQLAlchemy
- Pydantic
- JWT Authentication
- Uvicorn

### Base de données
- PostgreSQL 16

### IA / LLM (local)
- Ollama
- Qwen 2.5 (1.5B instruct)

### DevOps / Déploiement
- Docker & Docker Compose
- Azure Container Registry (ACR)
- Azure Container Apps
- HTTPS Ingress (Azure)

---


### ☁️ Déploiement Cloud (Azure)
Services Azure utilisés

Azure Container Registry (ACR)

Azure Container Apps

HTTPS Ingress automatique

### Frontend (déployé)

🔗 URL Frontend
👉 https://ca-minihkeya-frontend.jollyground-f04d0bd3.francecentral.azurecontainerapps.io

### Backend (déployé)

🔗 API Backend
👉 https://ca-minihkeya-backend.jollyground-f04d0bd3.francecentral.azurecontainerapps.io

### Documentation API (Swagger)

👉 https://ca-minihkeya-backend.jollyground-f04d0bd3.francecentral.azurecontainerapps.io/docs

### Health Check

👉 /health → { "status": "ok" }

---

### 🔐 Authentification

Système d’inscription et de connexion

JWT Token (Bearer)

Endpoints :

POST /api/auth/register

POST /api/auth/login
---

### 🤖 IA & Génération de contenu

Génération d’histoires éducatives

Jeux interactifs (quiz, missions)

IA locale via Ollama 

