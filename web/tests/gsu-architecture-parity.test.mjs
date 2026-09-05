import assert from 'node:assert/strict';
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`;
    const stats = lstatSync(path);
    if (stats.isSymbolicLink()) return [];
    if (stats.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js|jsx|mjs)$/.test(name) ? [path] : [];
  });
}

test('GSU architecture roots are the canonical frontend structure', () => {
  for (const path of [
    'src/App.tsx',
    'src/core/app/nav.ts',
    'src/core/app/navigation.tsx',
    'src/core/app/ManagementShell.tsx',
    'src/core/firebase',
    'src/modules',
    'src/shared/ui',
    'src/styles/index.css',
  ]) {
    assert.ok(existsSync(path), `Canonical GSU-style source path is missing: ${path}`);
  }

  for (const path of ['src/features', 'src/firebase', 'src/app/gsu-ui']) {
    assert.ok(lstatSync(path).isSymbolicLink(), `${path} must remain a migration-only symlink, never a second implementation.`);
  }
});

test('legacy app entry points are symlink-only compatibility paths', () => {
  for (const path of [
    'src/app/App.tsx',
    'src/app/ManagementShell.tsx',
    'src/app/navigation.tsx',
    'src/app/AppErrorBoundary.tsx',
    'src/app/ToastProvider.tsx',
    'src/app/ManagementControls.tsx',
    'src/app/ManagementSelect.tsx',
    'src/app/ResponsiveButtonContent.tsx',
    'src/app/TwoLineMenuIcon.tsx',
  ]) {
    assert.ok(lstatSync(path).isSymbolicLink(), `${path} must not contain a duplicate active implementation.`);
  }
});

test('architectural imports communicate ownership through GSU aliases', () => {
  const viteConfig = read('vite.config.ts');
  const tsconfig = read('tsconfig.json');
  const appSource = read('src/App.tsx');
  const shellSource = read('src/core/app/ManagementShell.tsx');

  for (const alias of ['@core', '@modules', '@shared', '@styles']) {
    assert.match(viteConfig, new RegExp(alias));
    assert.match(tsconfig, new RegExp(alias));
  }

  assert.match(appSource, /from '@core\/app\/nav'/);
  assert.match(appSource, /from '@modules\/dashboard\/DashboardPanel'/);
  assert.match(shellSource, /from '@shared\/ui\/Header'/);
  assert.match(shellSource, /from '@core\/firebase\/firebase'/);
  assert.doesNotMatch(appSource, /\.\.\/features|\.\/app\//);
});

test('shared UI has one canonical implementation tree', () => {
  for (const name of [
    'Header.tsx',
    'NavigationOverlay.tsx',
    'AppBrand.tsx',
    'PrimaryNavigation.tsx',
    'AccountMenu.tsx',
    'ManagementControls.tsx',
    'ManagementSelect.tsx',
    'ResponsiveButtonContent.tsx',
    'TwoLineMenuIcon.tsx',
  ]) {
    assert.ok(existsSync(`src/shared/ui/${name}`), `Shared UI primitive missing: ${name}`);
  }
});

test('styles keep one imports-only ownership entrypoint with responsive rules last', () => {
  const styleIndex = read('src/styles/index.css');
  assert.doesNotMatch(styleIndex, /\{/);
  assert.match(styleIndex, /@import '\.\/responsive-contract\.css';\s*$/);

  for (const name of readdirSync('src/styles')) {
    const path = `src/styles/${name}`;
    if (!name.endsWith('.css')) continue;
    assert.ok(statSync(path).size < 36_000, `Style ownership file must stay below 36 KB: ${path}`);
  }
});

test('human-readable module files remain bounded and avoid deep cross-layer imports', () => {
  for (const path of sourceFiles('src/modules').filter((path) => path.endsWith('.tsx'))) {
    assert.ok(statSync(path).size < 36_000, `Module TSX file must stay below 36 KB: ${path}`);

    const source = read(path);
    assert.doesNotMatch(
      source,
      /from ['"]\.\.\/\.\.\/\.\.\//,
      `Module code must use architectural aliases instead of deep three-level imports: ${path}`,
    );
  }
});
