#!/bin/bash
# Corrige os 11 adapters publicados com o protocolo "workspace:*" nas dependências.
#
# O que aconteceu: publiquei com `npm publish` dentro de um workspace pnpm. O pnpm
# substitui "workspace:*" pela versão real ao empacotar; o npm não. Os pacotes
# 1.0.0 saíram pedindo `"@pago-sh/adapter-utils": "workspace:*"`, que npm e yarn
# não sabem resolver — quem instalasse recebia EUNSUPPORTEDPROTOCOL.
#
# Por que 1.0.1 e não republicar 1.0.0: o npm nunca permite reusar um par
# nome+versão, mesmo após despublicar, e despublicar o pacote inteiro bloqueia
# novas versões por 24 horas. Corrigir para frente é mais barato que apagar.
#
# Rode você mesmo: o npm vai pedir a chave de segurança no navegador.

set -u
export PATH="/opt/homebrew/bin:$PATH"
cd "$(dirname "$0")/packages" || exit 1

PACOTES=(
  pago-nextjs pago-astro pago-hono pago-express pago-fastify pago-elysia
  pago-nuxt pago-remix pago-sveltekit pago-supabase pago-tanstack-start
)

echo "=== publicando 1.0.1 com as dependências resolvidas ==="
ok=0
falhou=()
for dir in "${PACOTES[@]}"; do
  nome=$(node -p "require('./$dir/package.json').name")
  echo ""
  echo "publicando $nome@1.0.1 ..."
  # pnpm publish substitui workspace:* pela versão real; npm publish não.
  if (cd "$dir" && pnpm publish --access public --no-git-checks); then
    ok=$((ok + 1))
  else
    falhou+=("$nome")
  fi
done

echo ""
echo "=== marcando 1.0.0 como obsoleto ==="
for dir in "${PACOTES[@]}"; do
  nome=$(node -p "require('./$dir/package.json').name")
  npm deprecate "$nome@1.0.0" \
    "1.0.0 shipped an unresolvable workspace: dependency and cannot be installed. Use 1.0.1." \
    2>/dev/null && echo "  marcado: $nome@1.0.0"
done

echo ""
echo "─────────────────────────────────────────"
echo "  publicados: $ok de ${#PACOTES[@]}"
if [ ${#falhou[@]} -gt 0 ]; then
  echo "  falharam:   ${falhou[*]}"
  echo "  rode de novo — o npm recusa versão já publicada, então o que subiu é pulado"
  exit 1
fi
echo "  tudo corrigido"
