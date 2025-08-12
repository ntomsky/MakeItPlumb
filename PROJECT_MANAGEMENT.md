# MakeItPlumb Project Management Guide

## 📋 **ALWAYS Use Yarn (Not NPM)**

### ✅ **Correct Commands**
```bash
yarn install              # Install dependencies
yarn add package-name     # Add new package  
yarn remove package-name  # Remove package
yarn ios                  # Run iOS app
yarn android              # Run Android app
yarn start                # Start Metro bundler
```

### ❌ **Never Use These**
```bash
npm install               # WRONG - Creates conflicts
npm install package-name  # WRONG - Use yarn add instead
npx react-native run-ios  # WRONG - Use yarn ios instead
```

## 🗂️ **Current Project Structure**
```
✅ package.json          # Main configuration
✅ yarn.lock             # Yarn dependency lockfile
✅ node_modules/         # JavaScript dependencies  
✅ ios/Pods/            # iOS dependencies
✅ ios/Podfile.lock     # iOS dependency lockfile
❌ NO package-lock.json  # This would conflict with yarn.lock
```

## 🧹 **Cleanup When Build Issues Occur**

### Quick Cleanup Script
```bash
./scripts/clean-project.sh
```

### Manual Cleanup Steps
1. **Clean RN Caches**: `npx react-native clean --include metro,watchman`
2. **Remove Artifacts**: `rm -rf node_modules ios/build ios/Pods ios/Podfile.lock`
3. **Clean Xcode**: `rm -rf ~/Library/Developer/Xcode/DerivedData/MakeItPlumb-*`
4. **Clean Yarn**: `yarn cache clean`
5. **Reinstall**: `yarn install`
6. **iOS Deps**: `cd ios && pod install --clean-install`
7. **Test Build**: `yarn ios`

## 🔄 **Branch Switching Protocol**
1. Switch branch: `git checkout branch-name`
2. Update dependencies: `yarn install`
3. Update iOS deps: `cd ios && pod install` 
4. If issues occur: Run cleanup script

## 📦 **Adding New Packages**

### JavaScript-only packages
```bash
yarn add lodash
```

### React Native packages (need iOS setup)
```bash
yarn add react-native-new-package
cd ios && pod install  # Always run this!
```

## 🚨 **Common Issues & Solutions**

### "Sandbox not in sync with Podfile.lock"
- **Solution**: `cd ios && pod install`

### "Command not found: react-native"
- **Solution**: Use `yarn ios` instead of `npx react-native run-ios`

### Build errors after branch switch
- **Solution**: Run `./scripts/clean-project.sh`

### Package conflicts
- **Solution**: Never mix npm and yarn commands

## 🎯 **Best Practices**
- ✅ Always use yarn commands
- ✅ Run `pod install` after adding RN packages
- ✅ Use cleanup script when switching between New/Old Architecture branches  
- ✅ Commit `yarn.lock` and `ios/Podfile.lock`
- ❌ Never commit `node_modules/` or `ios/Pods/`
- ❌ Never use npm commands in this project
