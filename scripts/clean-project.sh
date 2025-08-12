#!/bin/bash

# MakeItPlumb Project Cleanup Script
# Use this when encountering build issues or switching branches

set -e

echo "🧹 MakeItPlumb Project Cleanup"
echo "=============================="

# Step 1: Clean React Native caches
echo "1️⃣ Cleaning React Native and Metro caches..."
npx react-native clean --include metro,watchman || true

# Step 2: Remove build artifacts
echo "2️⃣ Removing build artifacts..."
rm -rf node_modules
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
echo "   ✅ Local artifacts cleared"

# Step 3: Clean Xcode DerivedData (with permission handling)
echo "3️⃣ Cleaning Xcode DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/MakeItPlumb-* 2>/dev/null || {
    echo "   ⚠️  Xcode data requires sudo permissions"
    sudo rm -rf ~/Library/Developer/Xcode/DerivedData/MakeItPlumb-*
}
echo "   ✅ Xcode cache cleared"

# Step 4: Clean Yarn cache
echo "4️⃣ Cleaning Yarn cache..."
yarn cache clean
echo "   ✅ Yarn cache cleared"

# Step 5: Reinstall dependencies
echo "5️⃣ Reinstalling dependencies..."
yarn install
echo "   ✅ Node dependencies installed"

# Step 6: Install iOS dependencies
echo "6️⃣ Installing iOS dependencies..."
cd ios
pod install --clean-install
cd ..
echo "   ✅ iOS dependencies installed"

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "Next steps:"
echo "  • Run: yarn ios          (to test iOS build)"
echo "  • Run: yarn android      (to test Android build)"
echo "  • Run: yarn start        (to start Metro bundler)"
echo ""
