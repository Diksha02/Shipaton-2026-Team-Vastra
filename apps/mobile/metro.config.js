const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Metro assumes a single app directory. In a monorepo it must additionally
// watch the workspace root, or edits to @wardrobe/design never trigger a reload.
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Without this, Metro walks up the tree and can resolve two copies of React —
// which surfaces as "Invalid hook call" rather than as a resolution error.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
