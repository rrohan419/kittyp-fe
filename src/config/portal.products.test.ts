import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it, before } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { PortalConfig, PortalRole } from './portal.ts';

const srcRoot = fileURLToPath(new URL('..', import.meta.url));

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const base = path.join(srcRoot, specifier.slice(2));
      const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')];
      const match = candidates.find((candidate) => existsSync(candidate));
      return nextResolve(pathToFileURL(match ?? base).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const NON_ADMIN_ROLES: PortalRole[] = ['ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_CLINIC_STAFF'];

function pathsOf(config: PortalConfig): string[] {
  return [...config.navItems, ...config.bottomTabs].map((item) => item.path);
}

let portalConfigs: Record<PortalRole, PortalConfig>;

before(async () => {
  ({ portalConfigs } = await import('./portal.ts'));
});

describe('product create CTA is admin-only', () => {
  it('does not expose product nav to doctor or clinic roles', () => {
    for (const role of NON_ADMIN_ROLES) {
      const productPaths = pathsOf(portalConfigs[role]).filter((navPath) =>
        navPath.toLowerCase().includes('product')
      );
      assert.deepEqual(productPaths, [], role);
    }
  });

  it('keeps the admin products page that hosts Add Product', () => {
    assert.equal(
      pathsOf(portalConfigs.ROLE_ADMIN).includes('/admin/products'),
      true
    );
  });

  it('exposes system health nav to admin and moderator only', () => {
    assert.equal(pathsOf(portalConfigs.ROLE_ADMIN).includes('/admin/health'), true);
    assert.equal(pathsOf(portalConfigs.ROLE_MODERATOR).includes('/admin/health'), true);
    for (const role of NON_ADMIN_ROLES) {
      assert.equal(pathsOf(portalConfigs[role]).includes('/admin/health'), false, role);
    }
  });
});
