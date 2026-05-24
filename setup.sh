#!/bin/bash
set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Seyamii Slate — Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌ Python 3 not found. Install from https://python.org"
  exit 1
fi

echo "✓ Node $(node -v)"
echo "✓ Python $(python3 --version)"
echo ""

# Install Whisper
echo "📦 Installing Whisper engine..."
pip3 install openai-whisper --quiet
echo "✓ Whisper ready"
echo ""

# Install Electron
echo "📦 Installing Electron..."
npm install --quiet
echo "✓ Electron ready"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Setup complete!"
echo ""
echo "  Run the app:"
echo "  npm start"
echo ""
echo "  Build .dmg to distribute:"
echo "  npm run build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
