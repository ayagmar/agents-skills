// Enforces one synchronized SemVer per plugin across package.json, plugin.json,
// and .claude-plugin/plugin.json, and keeps versions out of SKILL.md.
import {
  listPluginNames,
  pluginPath,
  readJson,
  readSkillFrontmatter,
  relativeToRepo,
  skillFilePath,
} from './lib/repo.mjs';

// Official SemVer 2.0.0 regular expression from https://semver.org.
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const errors = [];
const summaries = [];

for (const name of listPluginNames()) {
  const packageFile = pluginPath(name, 'package.json');
  const version = readJson(packageFile).version;
  if (typeof version !== 'string' || !SEMVER_PATTERN.test(version)) {
    errors.push(`${relativeToRepo(packageFile)}: version "${version}" is not valid SemVer 2.0.0`);
  }

  for (const manifestFile of [pluginPath(name, 'plugin.json'), pluginPath(name, '.claude-plugin', 'plugin.json')]) {
    const manifestVersion = readJson(manifestFile).version;
    if (manifestVersion !== version) {
      errors.push(`${relativeToRepo(manifestFile)}: version "${manifestVersion}" must equal package.json version "${version}" (run node scripts/sync-versions.mjs)`);
    }
  }

  const skillFile = skillFilePath(name);
  const frontmatter = readSkillFrontmatter(skillFile);
  if ('version' in frontmatter) {
    errors.push(`${relativeToRepo(skillFile)}: frontmatter must not declare version (repo policy: package.json is the only version source)`);
  }
  if (Object.hasOwn(frontmatter.metadata ?? {}, 'version')) {
    errors.push(`${relativeToRepo(skillFile)}: frontmatter must not declare metadata.version (repo policy: package.json is the only version source)`);
  }

  summaries.push(`${name}@${version}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`✘ ${error}`);
  }
  console.error(`✘ version check failed with ${errors.length} error(s)`);
  process.exit(1);
}

for (const summary of summaries) {
  console.log(`✔ ${summary} (package.json, plugin.json, .claude-plugin/plugin.json agree)`);
}
