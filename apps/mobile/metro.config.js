const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Find the project and workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Ensure consistent module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 5. Add resolver alias for better native module resolution
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// 6. Reset cache configuration to use defaults
config.resetCache = true;

module.exports = withNativeWind(config, { input: './global.css' });