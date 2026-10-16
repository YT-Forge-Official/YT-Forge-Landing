// What a release asset actually is. GitHub counts every GET of every file on a
// release, and an electron-builder release ships three very different kinds:
//
//   installer  .dmg .exe .AppImage .deb .rpm   a person downloading the app
//   update     -mac.zip  *.blockmap            electron-updater pulling a patch
//   check      latest*.yml                     electron-updater asking "anything new?"
//
// Only the first is a "download" in the sense the landing page means. The yml
// files alone had 160+ hits on v2.0.1, all from installed apps polling.
//
// Classified on read, from the file name, so a rule change here re-buckets the
// whole history instead of only rows written after it.

export const KINDS = {
  installer: 'Installers',
  update: 'Updates',
  check: 'Update checks',
};

export const PLATFORMS = {
  mac: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
  other: 'Other',
};

export function classifyAsset(name) {
  const n = name.toLowerCase();

  if (n.endsWith('.yml') || n.endsWith('.yaml')) {
    // latest.yml is the Windows feed; the others name their platform.
    const platform = n.includes('mac') ? 'mac' : n.includes('linux') ? 'linux' : 'windows';
    return { kind: 'check', platform, arch: n.includes('arm64') ? 'arm64' : null, format: '.yml' };
  }

  const blockmap = n.endsWith('.blockmap');
  const base = blockmap ? n.slice(0, -'.blockmap'.length) : n;

  let platform = 'other';
  let format = base.slice(base.lastIndexOf('.'));
  if (base.endsWith('.dmg') || base.endsWith('-mac.zip')) platform = 'mac';
  else if (base.endsWith('.exe') || base.endsWith('.msi')) platform = 'windows';
  else if (base.endsWith('.appimage') || base.endsWith('.deb') || base.endsWith('.rpm')) platform = 'linux';

  if (format === '.appimage') format = '.AppImage';

  const kind = blockmap || base.endsWith('-mac.zip') ? 'update' : platform === 'other' ? 'update' : 'installer';

  let arch = null;
  if (/arm64|aarch64/.test(base)) arch = 'arm64';
  else if (/x64|amd64|x86_64/.test(base)) arch = 'x64';
  else if (platform === 'windows') arch = 'universal'; // one installer, x64 + ARM
  else if (platform === 'linux') arch = 'x64'; // unsuffixed AppImage is the x64 build

  return { kind, platform, arch, format: blockmap ? '.blockmap' : format };
}

/** Sum of installer downloads only — what "downloads" means on the landing page. */
export function countInstallerDownloads(releases) {
  if (!Array.isArray(releases)) return null;
  let total = 0;
  for (const release of releases) {
    for (const asset of release.assets ?? []) {
      if (classifyAsset(asset.name).kind === 'installer') total += asset.download_count ?? 0;
    }
  }
  return total;
}
