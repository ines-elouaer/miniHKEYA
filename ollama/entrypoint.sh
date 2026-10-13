#!/usr/bin/env sh
set -e

# 1) démarre le serveur ollama
ollama serve &
sleep 2

# 2) télécharge le modèle si pas présent
# (choisis le modèle déployable en 1 jour)
MODEL="${OLLAMA_MODEL:-qwen2.5:1.5b-instruct}"
echo "Pulling model: $MODEL"
ollama pull "$MODEL" || true

# 3) reste en foreground
wait
