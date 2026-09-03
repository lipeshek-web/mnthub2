#!/bin/bash

# 将 stderr 重定向到 stdout，避免 execute_command 因为 stderr 输出而报错
exec 2>&1

set -e

# 获取脚本所在目录（.zscripts 目录，即 workspace-agent/.zscripts）
# 使用 $0 获取脚本路径（兼容 sh 和 bash）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Next.js 项目路径
NEXTJS_PROJECT_DIR="/home/z/my-project"

# 检查 Next.js 项目目录是否存在
if [ ! -d "$NEXTJS_PROJECT_DIR" ]; then
    echo "❌ 错误: Next.js 项目目录不存在: $NEXTJS_PROJECT_DIR"
    exit 1
fi

echo "🚀 开始构建 Next.js 应用和 mini-services..."
echo "📁 Next.js 项目路径: $NEXTJS_PROJECT_DIR"

# 切换到 Next.js 项目目录
cd "$NEXTJS_PROJECT_DIR" || exit 1

# 设置环境变量
export NEXT_TELEMETRY_DISABLED=1

BUILD_DIR="/tmp/build_fullstack_$BUILD_ID"
echo "📁 清理并创建构建目录: $BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 安装依赖
echo "📦 安装依赖..."
bun install

# 构建 Next.js 应用
echo "🔨 构建 Next.js 应用..."
bun run build

# 校验 standalone 服务端入口是否生成（部署成功率守卫）。
# Next 仅在 next.config 含 output:"standalone" 时产出 .next/standalone/server.js。
# 若用户/AI 编辑项目时改写或删除了该配置，bun run build 仍会成功（static 照常
# 产出、退出码 0），但 standalone 缺失——打出的包里没有 server.js，部署到 FC 后
# start.sh 找不到 next-service-dist/server.js → 不启动 Next → Caddy:81 反代空的
# 3000 → FC 健康检查 120s 超时失败（线上 warmup_412 / FunctionNotStarted 的主因）。
# 这里做一次自愈：仅在确实缺失时，给 next.config 补回 output:"standalone" 并重建。
# 正常项目（已生成 server.js）整段跳过，不读写任何用户文件。
if [ ! -f ".next/standalone/server.js" ]; then
    echo "⚠️  构建未产出 .next/standalone/server.js，开始自愈 next.config 的 output 配置..."
    NEXT_CONFIG_FILE="$(ls next.config.ts next.config.js next.config.mjs next.config.cjs 2>/dev/null | head -1)"

    if [ -z "$NEXT_CONFIG_FILE" ]; then
        echo "❌ 构建失败：未找到 next.config.*，无法生成 standalone 部署产物。"
        exit 1
    fi

    if grep -Eq "output\s*:\s*['\"]standalone['\"]" "$NEXT_CONFIG_FILE"; then
        # 已声明 standalone 却仍没产出 server.js，说明不是配置缺失（可能 build 真
        # 出错、自定义 distDir 等）。不臆改用户配置，直接失败并暴露原因。
        echo "❌ 构建失败：$NEXT_CONFIG_FILE 已含 output:\"standalone\"，但仍未生成 .next/standalone/server.js。"
        echo "   请检查上方构建日志中的报错或项目自定义的构建配置。"
        exit 1
    fi

    if grep -Eq "output\s*:\s*['\"]" "$NEXT_CONFIG_FILE"; then
        # 已显式声明了其它 output（如 "export" 静态导出 / "standalone" 之外的值）。
        # "export" 与本部署模型（standalone + 自定义 server）互斥——不能注入第二个
        # output 覆盖用户意图（JS 对象重复 key 后者生效，注入也无效）。明确失败。
        echo "❌ 构建失败：$NEXT_CONFIG_FILE 已声明非 standalone 的 output（如 \"export\" 静态导出），与当前部署模型不兼容。"
        echo "   当前部署需要 output:\"standalone\"。请改为 standalone，或确认该项目是否应走静态托管而非部署沙箱。"
        exit 1
    fi

    echo "🔧 检测到 $NEXT_CONFIG_FILE 缺少 output:\"standalone\"，自动注入后重新构建..."
    cp "$NEXT_CONFIG_FILE" "${NEXT_CONFIG_FILE}.zbak"
    # 在第一个配置对象字面量起始的 { 之后插入 output:"standalone"，
    # 覆盖脚手架常见写法：const nextConfig...= {  /  export default {  /  module.exports = {
    perl -0pi -e 's/((?:const\s+\w+[^=]*=|export\s+default|module\.exports\s*=)\s*\{)/$1\n  output: "standalone",/' "$NEXT_CONFIG_FILE"

    if ! grep -Eq "output\s*:\s*['\"]standalone['\"]" "$NEXT_CONFIG_FILE"; then
        echo "❌ 未能匹配到可注入的配置对象，next.config 写法非常规，需人工添加 output:\"standalone\"。"
        echo "   当前 $NEXT_CONFIG_FILE 内容："
        cat "$NEXT_CONFIG_FILE"
        mv "${NEXT_CONFIG_FILE}.zbak" "$NEXT_CONFIG_FILE"
        exit 1
    fi

    echo "🔨 已注入 output:\"standalone\"，重新构建..."
    bun run build

    if [ ! -f ".next/standalone/server.js" ]; then
        echo "❌ 注入 output:\"standalone\" 并重建后，仍未生成 .next/standalone/server.js。"
        exit 1
    fi
    echo "✅ 自愈成功：standalone 服务端入口已生成。"
fi

# 构建 mini-services
# 检查 Next.js 项目目录下是否有 mini-services 目录
if [ -d "$NEXTJS_PROJECT_DIR/mini-services" ]; then
    echo "🔨 构建 mini-services..."
    # 使用 workspace-agent 目录下的 mini-services 脚本
    sh "$SCRIPT_DIR/mini-services-install.sh"
    sh "$SCRIPT_DIR/mini-services-build.sh"

    # 复制 mini-services-start.sh 到 mini-services-dist 目录
    echo "  - 复制 mini-services-start.sh 到 $BUILD_DIR"
    cp "$SCRIPT_DIR/mini-services-start.sh" "$BUILD_DIR/mini-services-start.sh"
    chmod +x "$BUILD_DIR/mini-services-start.sh"
else
    echo "ℹ️  mini-services 目录不存在，跳过"
fi

# 将所有构建产物复制到临时构建目录
echo "📦 收集构建产物到 $BUILD_DIR..."

# 复制 Next.js standalone 构建输出
if [ -d ".next/standalone" ]; then
    echo "  - 复制 .next/standalone"
    cp -r .next/standalone "$BUILD_DIR/next-service-dist/"
fi

# 复制 Next.js 静态文件
if [ -d ".next/static" ]; then
    echo "  - 复制 .next/static"
    mkdir -p "$BUILD_DIR/next-service-dist/.next"
    cp -r .next/static "$BUILD_DIR/next-service-dist/.next/"
fi

# 复制 public 目录
if [ -d "public" ]; then
    echo "  - 复制 public"
    cp -r public "$BUILD_DIR/next-service-dist/"
fi

# Copia as variáveis de RUNTIME para dentro do standalone — .env NÃO é embutido
# pelo Next no standalone; sem isso a produção sobe sem config e cai no SQLite
# empacotado (dados congelados no publish). Mantém também a cópia do banco
# empacotado como fallback (start.sh decide em runtime).
#
# Ordem de resolução (persistência à prova de downgrade):
#   1. .env do workspace (fonte primária, gitignored)
#   2. .zscripts/cloud.env (fallback VERSIONADO no git — se o workspace sofrer
#      downgrade e perder o .env, o publish ainda sai em modo nuvem e os dados
#      do Turso permanecem visíveis; sem isso o usuário veria "tudo zerado")
# FALHA REAL W-47: um snapshot restaurado pode trazer um .env ANTIGO/incompleto
# (ex.: só DATABASE_URL local, sem TURSO_*). Como o teste original era apenas de
# existência, esse .env incompleto Vencia o fallback versionado e o publish saía
# sem modo nuvem → APIs 500 / dados "sumidos". Agora: .env é sempre a base, mas
# qualquer variável de nuvem ausente é completada a partir do cloud.env versionado.
CLOUD_ENV_VARS="TURSO_DATABASE_URL TURSO_AUTH_TOKEN LIBSQL_URL LIBSQL_AUTH_TOKEN"

if [ -f ".env" ]; then
    cp .env "$BUILD_DIR/next-service-dist/.env"
    echo "  - Copiado .env para next-service-dist (base de config de runtime)"
    if [ -f "$SCRIPT_DIR/cloud.env" ]; then
        MERGED=0
        for __v in $CLOUD_ENV_VARS; do
            if ! grep -qE "^${__v}=" "$BUILD_DIR/next-service-dist/.env" && grep -qE "^${__v}=" "$SCRIPT_DIR/cloud.env"; then
                grep -E "^${__v}=" "$SCRIPT_DIR/cloud.env" >> "$BUILD_DIR/next-service-dist/.env"
                MERGED=1
            fi
        done
        if [ "$MERGED" = "1" ]; then
            echo "  - 🔧 .env incompleto detectado (rollback de snapshot?) — variáveis de nuvem ausentes foram completadas a partir de .zscripts/cloud.env (modo nuvem preservado)"
        fi
        if grep -qE "^TURSO_DATABASE_URL=" "$BUILD_DIR/next-service-dist/.env"; then
            echo "  - ✅ Modo nuvem garantido no artefato (TURSO_DATABASE_URL presente)"
        else
            echo "  - ❌ Nem .env nem cloud.env trouxeram TURSO_DATABASE_URL — produção subirá no SQLite empacotado (dados congelados)!"
        fi
    fi
elif [ -f "$SCRIPT_DIR/cloud.env" ]; then
    cp "$SCRIPT_DIR/cloud.env" "$BUILD_DIR/next-service-dist/.env"
    echo "  - ⚠️  .env ausente no workspace — usando fallback .zscripts/cloud.env (modo nuvem preservado)"
else
    echo "  - ❌ NEM .env NEM .zscripts/cloud.env encontrados — produção subirá no SQLite empacotado (dados congelados)!"
fi

# ─── FIX Bun ESM: shim para "@libsql/isomorphic-fetch" (v2, à prova de subdirs) ───
# O @prisma/adapter-libsql aninha @libsql/client → hrana-client, que faz
# `export { fetch, Request, Headers } from "@libsql/isomorphic-fetch"`. Dentro
# do standalone, o Bun FALHA a resolução desse pacote. O pacote é apenas um
# shim de globalThis — substituímos por um shim local, zero resolução.
#
# BUG CORRIGIDO (causou APIs 500 em produção): a v1 tratava "lib-esm" e
# "lib-esm/http" numa mesma passada RECURSIVA — a 1ª iteração reescrevia os
# .js dos SUBDIRETÓRIOS com "./fetch-shim.mjs", e a 2ª iteração (que criaria
# o shim dentro do subdir) não achava mais nada a reescrever e pulava. Tempos
# depois, o hrana-client ganhou a estrutura lib-esm/http/ e o import relativo
# de http/stream.js passou a apontar para um shim inexistente → o carregamento
# do Prisma morria → TODAS as rotas de API retornavam 500 (páginas estáticas
# continuavam 200 — o sintoma visto em produção).
#
# v2: cada diretório (lib-esm, lib-esm/http, lib-cjs, lib-cjs/http) é processado
# isoladamente com find -maxdepth 1: cria o shim lá e reescreve apenas os .js
# DAQUELE diretório. Sem efeito colateral entre diretórios, idempotente.
find "$BUILD_DIR/next-service-dist/node_modules" -type d -name hrana-client -path "*@libsql*" 2>/dev/null | while read -r HC; do
    for sub in "lib-esm" "lib-esm/http" "lib-cjs" "lib-cjs/http"; do
        d="$HC/$sub"
        [ -d "$d" ] || continue
        # Só arquivos .js DIRETAMENTE em $d que ainda importam o pacote.
        files="$(find "$d" -maxdepth 1 -type f -name '*.js' -exec grep -l '"@libsql/isomorphic-fetch"' {} + 2>/dev/null || true)"
        [ -n "$files" ] || continue
        case "$sub" in
            lib-esm*)
                printf 'const _fetch = globalThis.fetch;\nconst _Request = globalThis.Request;\nconst _Headers = globalThis.Headers;\nexport { _fetch as fetch, _Request as Request, _Headers as Headers };\n' > "$d/fetch-shim.mjs"
                echo "$files" | xargs sed -i 's|"@libsql/isomorphic-fetch"|"./fetch-shim.mjs"|g'
                ;;
            lib-cjs*)
                printf 'module.exports = { fetch: globalThis.fetch, Request: globalThis.Request, Headers: globalThis.Headers };\n' > "$d/fetch-shim.cjs"
                echo "$files" | xargs sed -i 's|"@libsql/isomorphic-fetch"|"./fetch-shim.cjs"|g'
                ;;
        esac
        echo "  - shim isomorphic-fetch aplicado: $d ($(echo "$files" | wc -l) arquivos)"
    done
done

# Guarda de sanidade: nenhum .js pode ter ficado apontando para o pacote
# original (se ficou, o Prisma não carrega em runtime). Falha o build aqui —
# melhor que publicar um artefato quebrado.
LEFTOVER="$(grep -rl '"@libsql/isomorphic-fetch"' "$BUILD_DIR/next-service-dist/node_modules" --include='*.js' 2>/dev/null | head -3 || true)"
if [ -n "$LEFTOVER" ]; then
    echo "❌ Ainda existem imports de @libsql/isomorphic-fetch após o shim:"
    echo "$LEFTOVER"
    exit 1
fi
# Todo './fetch-shim.*' precisa existir ao lado do arquivo que o importa.
BROKEN="$(grep -rl '"\./fetch-shim' "$BUILD_DIR/next-service-dist/node_modules" --include='*.js' 2>/dev/null | while read -r f; do d="$(dirname "$f")"; [ -f "$d/fetch-shim.mjs" ] || [ -f "$d/fetch-shim.cjs" ] || echo "$f"; done | head -3 || true)"
if [ -n "$BROKEN" ]; then
    echo "❌ Arquivos importam ./fetch-shim sem o shim presente:"
    echo "$BROKEN"
    exit 1
fi
echo "  - ✅ shim isomorphic-fetch verificado (sem imports órfãos)"

# ─── FIX deploy: derreferencia TODOS os symlinks do artefato ───
# O Next 16 (Turbopack) cria SYMLINKS em .next/standalone/.next/node_modules
# (stubs de módulos externalizados, ex.: @prisma/adapter-libsql-<hash> →
# ../../../node_modules/@prisma/adapter-libsql). Empacotados como symlink
# entries no tar, eles colidem com o conteúdo já existente no destino durante
# a extração da plataforma → "tar: ... Directory renamed before its status
# could be extracted" → extração aborta ANTES de extrair docker-entrypoint.sh
# → container morre com CAExited "no such file or directory".
#
# Os stubs são LOAD-BEARING em runtime (o chunk externo do Prisma é importado
# pelo nome com hash), então NÃO podemos removê-los — convertemos cada symlink
# em conteúdo REAL (cópia). Extração de dirs/files sobre dirs/files é
# idempotente: nunca mais colisão, em extração limpa OU sobre deploy anterior.
find "$BUILD_DIR" -type l | while read -r L; do
    T="$(readlink "$L")"
    case "$T" in
        /*) TARGET="$T" ;;
        *) TARGET="$(cd "$(dirname "$L")" && cd "$(dirname "$T")" 2>/dev/null && pwd)/$(basename "$T")" ;;
    esac
    IN_BUILD=false
    case "$TARGET" in "$BUILD_DIR"/*) IN_BUILD=true ;; esac
    rm -f "$L"
    if [ "$IN_BUILD" = true ] && [ -n "$TARGET" ] && [ -e "$TARGET" ]; then
        if [ -d "$TARGET" ]; then
            cp -rL "$TARGET" "$L"
        else
            cp -L "$TARGET" "$L"
        fi
        echo "  - 🔗 symlink derreferenciado (conteúdo real): ${L#"$BUILD_DIR"/} → $T"
    else
        echo "  - ⚠️  symlink removido (quebrado ou aponta para fora do artefato): ${L#"$BUILD_DIR"/} → $T"
    fi
done

# Guarda final: o artefato NÃO PODE conter nenhum symlink (o tar precisaria de
# entradas symlink, que são a causa da falha de extração em produção).
REMAINING_LINKS="$(find "$BUILD_DIR" -type l 2>/dev/null | head -5)"
if [ -n "$REMAINING_LINKS" ]; then
    echo "❌ Ainda existem symlinks no artefato após a derreferenciação:"
    echo "$REMAINING_LINKS"
    exit 1
fi
echo "  - ✅ artefato sem symlinks (extração do tar à prova de colisão)"

# Python 不继承 workspace-agent 的 /home/z/.venv。若项目包含 Python 源码或
# 依赖清单，在构建期将生产依赖固化到产物，并保持 Python 源码的项目相对路径。
PROJECT_DIR="$NEXTJS_PROJECT_DIR" BUILD_DIR="$BUILD_DIR" \
    bash "$SCRIPT_DIR/python-runtime-build.sh"

# 有 Preview 数据库时复制现有数据；没有时直接在部署产物中初始化空库。
# 模板源码不携带 db/custom.db，不能依赖 dev.sh 必须在 Deploy 前成功运行过。
PROJECT_DIR="$NEXTJS_PROJECT_DIR" BUILD_DIR="$BUILD_DIR" \
    bash "$SCRIPT_DIR/database-runtime-build.sh"

# 复制 Caddyfile（如果存在）
if [ -f "Caddyfile" ]; then
    echo "  - 复制 Caddyfile"
    cp Caddyfile "$BUILD_DIR/"
else
    echo "ℹ️  Caddyfile 不存在，跳过"
fi

# 复制 start.sh 脚本
echo "  - 复制 start.sh 到 $BUILD_DIR"
cp "$SCRIPT_DIR/start.sh" "$BUILD_DIR/start.sh"
chmod +x "$BUILD_DIR/start.sh"

# 打包到 $BUILD_DIR.tar.gz
PACKAGE_FILE="${BUILD_DIR}.tar.gz"
echo ""
echo "📦 打包构建产物到 $PACKAGE_FILE..."
cd "$BUILD_DIR" || exit 1
tar -czf "$PACKAGE_FILE" .
cd - > /dev/null || exit 1

# Guarda FINAL do tarball: nenhuma entrada pode aparecer duplicada no arquivo.
# Entradas duplicadas (ou symlink + dir para o mesmo caminho) são exatamente o
# que derrubou a extração em produção ("Directory renamed before its status
# could be extracted"). Se aparecer qualquer duplicata, falha o build aqui.
echo "🔎 Verificando entradas duplicadas no tarball (guarda anti-CAExited)..."
DUPES="$(tar -tzf "$PACKAGE_FILE" | sort | uniq -d | head -3 || true)"
if [ -n "$DUPES" ]; then
    echo "❌ Tarball contém entradas duplicadas (quebraria a extração na plataforma):"
    echo "$DUPES"
    exit 1
fi
echo "  - ✅ tarball sem entradas duplicadas"

# # 清理临时目录
# rm -rf "$BUILD_DIR"

echo ""
echo "✅ 构建完成！所有产物已打包到 $PACKAGE_FILE"
echo "📊 打包文件大小:"
ls -lh "$PACKAGE_FILE"
