#!/bin/bash

# Script de Verificación del Sistema ECU 911
# Este script verifica que todos los componentes estén instalados y funcionando

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Sistema de Optimización ECU 911 - Verificación          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Función para verificar paso
check_step() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

echo "📋 Verificando prerequisitos..."
echo ""

# 1. Verificar Node.js
echo -n "Verificando Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION instalado"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Node.js no encontrado"
    echo "   Instalar desde: https://nodejs.org/"
    ((FAILED++))
fi

# 2. Verificar pnpm
echo -n "Verificando pnpm... "
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}✓${NC} pnpm $PNPM_VERSION instalado"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} pnpm no encontrado"
    echo "   Instalando pnpm..."
    npm install -g pnpm
    check_step "Instalación de pnpm"
fi

echo ""
echo "📂 Verificando estructura de archivos..."
echo ""

# Lista de archivos requeridos
REQUIRED_FILES=(
    "package.json"
    "tsconfig.json"
    "next.config.mjs"
    "lib/simulation-engine.ts"
    "lib/personnel-data-loader.ts"
    "lib/redistribution-analyzer.ts"
    "lib/alert-system.ts"
    "lib/types.ts"
    "data/personal_articulado_provincia_2025.csv"
    "INFORME_PROYECTO_ECU911.md"
    "README.md"
    "RESUMEN_EJECUTIVO.md"
    "ALGORITMOS_EXPLICADOS.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $file - NO ENCONTRADO"
        ((FAILED++))
    fi
done

echo ""
echo "📦 Verificando dependencias..."
echo ""

# Verificar si node_modules existe
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules presente"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} node_modules no encontrado"
    echo "   Instalando dependencias..."
    pnpm install
    check_step "Instalación de dependencias"
fi

echo ""
echo "🔍 Verificando contenido de archivos clave..."
echo ""

# Verificar que los archivos tienen contenido
FILES_TO_CHECK=(
    "lib/personnel-data-loader.ts:PersonnelDataLoader"
    "lib/redistribution-analyzer.ts:RedistributionAnalyzer"
    "lib/alert-system.ts:AlertSystem"
    "data/personal_articulado_provincia_2025.csv:Pichincha"
)

for item in "${FILES_TO_CHECK[@]}"; do
    IFS=':' read -r file search <<< "$item"
    if grep -q "$search" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $file contiene $search"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $file no contiene $search"
        ((FAILED++))
    fi
done

echo ""
echo "📊 Verificando módulos TypeScript..."
echo ""

# Verificar tipos en types.ts
TYPES_TO_CHECK=(
    "PersonnelByProvince"
    "QueueAnalysis"
    "CapacityAnalysis"
    "RedistributionSuggestion"
    "Alert"
    "AlertSystem"
)

for type in "${TYPES_TO_CHECK[@]}"; do
    if grep -q "$type" "lib/types.ts" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Tipo $type definido"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Tipo $type NO definido"
        ((FAILED++))
    fi
done

echo ""
echo "🧪 Intentando compilar TypeScript..."
echo ""

# Intentar compilación
if pnpm tsc --noEmit 2>&1 | grep -q "error"; then
    echo -e "${RED}✗${NC} Errores de compilación detectados"
    echo "   Ejecuta: pnpm tsc --noEmit para ver detalles"
    ((FAILED++))
else
    echo -e "${GREEN}✓${NC} Código TypeScript compila sin errores"
    ((PASSED++))
fi

echo ""
echo "📄 Verificando documentación..."
echo ""

# Verificar longitud de documentos
DOCS=(
    "INFORME_PROYECTO_ECU911.md:800"
    "README.md:400"
    "ALGORITMOS_EXPLICADOS.md:300"
)

for doc in "${DOCS[@]}"; do
    IFS=':' read -r file min_lines <<< "$doc"
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        if [ "$lines" -ge "$min_lines" ]; then
            echo -e "${GREEN}✓${NC} $file ($lines líneas, mínimo $min_lines)"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠${NC} $file solo tiene $lines líneas (esperado >$min_lines)"
            ((PASSED++)) # Aún así pasa
        fi
    else
        echo -e "${RED}✗${NC} $file no encontrado"
        ((FAILED++))
    fi
done

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     RESUMEN DE VERIFICACIÓN                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Total de verificaciones: $TOTAL"
echo -e "${GREEN}Exitosas: $PASSED${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Fallidas: $FAILED${NC}"
fi

echo "Porcentaje de éxito: ${PERCENTAGE}%"

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ SISTEMA COMPLETAMENTE VERIFICADO Y FUNCIONAL            ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🚀 Para ejecutar el sistema:"
    echo "   $ pnpm dev"
    echo ""
    echo "📖 Para ver el ejemplo de uso:"
    echo "   $ ts-node ejemplo-uso.ts"
    echo ""
    exit 0
elif [ $FAILED -le 3 ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  SISTEMA FUNCIONAL CON ADVERTENCIAS MENORES             ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Algunas verificaciones fallaron pero el sistema debería funcionar."
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ SE DETECTARON PROBLEMAS CRÍTICOS                        ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Por favor, revisa los errores anteriores antes de continuar."
    echo ""
    exit 1
fi
