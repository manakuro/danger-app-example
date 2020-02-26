import { warn, danger } from "danger"
import * as fs from 'fs';
import * as path from 'path';

const prThreshold = 300;
if (danger.github.pr.additions + danger.github.pr.deletions > prThreshold) {
  warn(':exclamation: Big PR');
}

const createLink = (href: string, text: string): string =>
  `<a href='${href}'>${text}</a>`;
const toLinkList = (files: string[]): string => {
  const repoURL = danger.github.pr.head.repo.html_url;
  const ref = danger.github.pr.head.ref;
  return files
    .map(f => createLink(`${repoURL}/blob/${ref}/${f}`, f))
    .map(a => `- ${a}`)
    .join('\n');
};

const isAppFile = (file: string) => /^(?!.*\.d\.ts).*?\.(ts|js|tsx|jsx)$/.test(file);
const isOnlyFiles = (file: string) => fs.existsSync(file) && fs.lstatSync(file).isFile()
const modifiedOrCreatedFiles = [
  ...danger.git.modified_files,
  ...danger.git.created_files,
]
  .filter((p: string) => p.includes('src/'))
  .filter((p: string) => isOnlyFiles(p) && isAppFile(p));

const untestedFiles = modifiedOrCreatedFiles
  .filter(m => !/(test|spec|snap)/.test(m))
  .map(file => ({
    file,
    testFile: `${path.basename(file, path.extname(file))}.test${path.extname(file)}`,
  }))
  .filter(m => !modifiedOrCreatedFiles.includes(m.testFile));

const hasAppChanges = modifiedOrCreatedFiles.length;
const hasUntestedFiles = untestedFiles.length;

if (hasAppChanges && hasUntestedFiles) {
  const list = toLinkList(untestedFiles.map(u => u.file));
  warn(
    'App files should get test files' +
    `\n\n${list}`
  );
}
