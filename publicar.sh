#!/bin/bash
# Publica os 12 adapters do pago.sh no npm, em ordem de dependência.
# Rode você mesmo: o npm vai pedir a chave de segurança no navegador quando precisar.

set -u
export PATH="/opt/homebrew/bin:$PATH"
cd "$(dirname "$0")/packages" || exit 1

PACOTES=(
  adapter-utils          # precisa vir primeiro: os demais dependem dele
  pago-nextjs
  pago-astro
  pago-hono
  pago-express
  pago-fastify
  pago-elysia
  pago-nuxt
  pago-remix
  pago-sveltekit
  pago-supabase
  pago-tanstack-start
)

ok=0
falhou=()

for dir in "${PACOTES[@]}"; do
  [ -d "$dir" ] || { echo "  ignorando $dir (não existe)"; continue; }

  nome=$(node -p "require('./$dir/package.json').name" 2>/dev/null || echo "$dir")
  versao=$(node -p "require('./$dir/package.json').version" 2>/dev/null || echo "?")

  # já publicado nessa versão? então pula
  if npm view "$nome@$versao" version >/dev/null 2>&1; then
    echo "  = $nome@$versao já está no registro"
    ok=$((ok + 1))
    continue
  fi

  echo ""
  echo "publicando $nome@$versao ..."
  if (cd "$dir" && npm publish --access public); then
    ok=$((ok + 1))
  else
    falhou+=("$nome")
  fi
done

echo ""
echo "─────────────────────────────────────────"
echo "  publicados: $ok de ${#PACOTES[@]}"
if [ ${#falhou[@]} -gt 0 ]; then
  echo "  falharam:   ${falhou[*]}"
  echo ""
  echo "  rode o script de novo — ele pula o que já subiu"
  exit 1
fi
echo "  tudo publicado"
