// Copies each workspace package.json version into its portable and Claude
// manifests. Only the `version` field of those two files is ever rewritten.
import fs from 'node:fs';
import {
  NPM_SCOPE,
  fail,
  listPluginNames,
  pluginPath,
  readJson,
  relativeToRepo,
} from './lib/repo.mjs';

for (const name of listPluginNames()) {
  const packageFile = pluginPath(name, 'package.json');
  const pkg = readJson(packageFile);
  if (pkg.name !== `${NPM_SCOPE}/${name}`) {
    fail(`${relativeToRepo(packageFile)}: name "${pkg.name}" must be "${NPM_SCOPE}/${name}"`);
  }

  // Read and check both manifests before writing either one.
  const manifests = [pluginPath(name, 'plugin.json'), pluginPath(name, '.claude-plugin', 'plugin.json')]
    .map((file) => ({ file, data: readJson(file) }));
  for (const { file, data } of manifests) {
    if (data.name !== name) {
      fail(`${relativeToRepo(file)}: name "${data.name}" must be "${name}"`);
    }
  }

  for (const { file, data } of manifests) {
    if (data.version === pkg.version) {
      console.log(`✔ ${relativeToRepo(file)} already at ${pkg.version}`);
      continue;
    }
    data.version = pkg.version;
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`✔ ${relativeToRepo(file)} set to ${pkg.version}`);
  }
}
