import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {rolldown} from 'rolldown';
import {fileURLToPath} from 'node:url';

const root = process.cwd();
const names = new Set();
async function inspect(file) {
  const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
  source.forEachChild(node => {
    if (!ts.isImportDeclaration(node) || node.moduleSpecifier.text !== 'lucide-react-native' || node.importClause?.isTypeOnly) return;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings) || node.importClause.name) throw new Error(`Use named icon imports in ${file}.`);
    for (const entry of bindings.elements) if (!entry.isTypeOnly) names.add((entry.propertyName ?? entry.name).text);
  });
}
async function walk(dir) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.tsx?$/.test(file)) await inspect(file);
  }
}
await inspect(path.join(root, 'App.tsx'));
await walk(path.join(root, 'src'));
if (!names.size) throw new Error('No named icons found; refusing to emit an empty icon module.');
const directory = path.join(root, '.generated');
await mkdir(directory, {recursive: true});
const input = path.join(directory, 'icon-entry.mjs');
// Resolve each used public export to its leaf module. This also avoids loading
// unused barrel exports that may be invalid in an upstream package release.
const barrelPath = fileURLToPath(import.meta.resolve('lucide-react-native'));
const barrel = ts.createSourceFile(barrelPath, await readFile(barrelPath, 'utf8'), ts.ScriptTarget.Latest, true);
const exports = new Map();
barrel.forEachChild(node => {
  if (!ts.isExportDeclaration(node) || !node.moduleSpecifier || !node.exportClause || !ts.isNamedExports(node.exportClause)) return;
  for (const entry of node.exportClause.elements) exports.set(entry.name.text, {
    imported: (entry.propertyName ?? entry.name).text,
    file: path.resolve(path.dirname(barrelPath), node.moduleSpecifier.text),
  });
});
const lines = [...names].sort().map(name => {
  const entry = exports.get(name);
  if (!entry) throw new Error(`Used icon ${name} has no explicit upstream export.`);
  return `export {${entry.imported} as ${name}} from ${JSON.stringify(entry.file)};`;
});
await writeFile(input, lines.join('\n') + '\n');
const bundle = await rolldown({input, platform: 'browser', external: ['react', 'react-native', 'react-native-svg']});
await bundle.write({file: path.join(directory, 'lucide-icons.cjs'), format: 'cjs', minify: true});
await bundle.close();
console.log(`Bundled ${names.size} explicitly used web icons; Expo runtime initialization is unchanged.`);
