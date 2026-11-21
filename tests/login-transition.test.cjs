// Regression check for login without a reload. The backend is mocked; live RLS
// and credentials must be tested separately against the selected Supabase project.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

test('supplier login loads records and renders the menu without restarting App', async () => {
  const states = [], effects = [], pending = [];
  let cursor = 0, authCallback, requests = 0;
  const user = { id: 'supplier-user', role: 'SUPPLIER', supplierId: 'application-id' };
  const application = { id: 'application-id', businessName: 'Supplier', documents: [] };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState(initial) {
      const i = cursor++;
      if (!(i in states)) states[i] = initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    },
    useEffect(fn, deps) {
      const i = cursor++;
      const prev = effects[i];
      if (!prev || deps.some((value, j) => value !== prev.deps[j])) {
        pending.push(() => { prev?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  const services = {
    getCurrentUserAccount: async () => null,
    signOut: async () => {},
    fetchSupplierApplicationForOwner: async id => { assert.equal(id, user.id); requests++; return application; },
    fetchAllSuppliers: async () => [],
  };
  const source = transformSync(fs.readFileSync('src/App.tsx', 'utf8'), {
    loader: 'tsx', format: 'cjs', jsx: 'transform', target: 'es2022',
  }).code;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    exports: module.exports, module, console, setTimeout, clearTimeout,
    require(name) {
      if (name === 'react') return react;
      if (name.includes('/services/')) return services;
      if (name === './lib/supabase') return {
        isSupabaseConfigured: () => true,
        supabase: { auth: { onAuthStateChange: cb => { authCallback = cb; return { data: { subscription: { unsubscribe() {} } } }; } } },
      };
      return new Proxy({}, { get: (_, key) => key });
    },
  });
  function render() {
    cursor = 0;
    const tree = module.exports.default();
    while (pending.length) pending.shift()();
    return tree;
  }
  function find(tree, type) {
    if (!tree || typeof tree !== 'object') return null;
    if (tree.type === type) return tree;
    for (const child of (tree.children || []).flat(Infinity)) {
      const match = find(child, type); if (match) return match;
    }
    return null;
  }
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const first = render();
  await flush();
  assert.equal(authCallback.constructor.name, 'Function', 'auth listener must remain synchronous');
  find(first, 'AuthView').props.onLogin(user);
  render();
  await flush();
  const dashboard = render();
  assert.equal(requests, 1, 'login triggers a supplier fetch without a reload');
  assert.ok(find(dashboard, 'Role1Sidebar'), 'supplier menu becomes available');
  authCallback('SIGNED_OUT', null);
  const signedOut = render();
  assert.ok(find(signedOut, 'AuthView'), 'logout returns to supplier login');
  assert.equal(find(signedOut, 'Role1Sidebar'), null, 'previous supplier menu is cleared');
});
