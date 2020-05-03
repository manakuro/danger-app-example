import { warn, danger, schedule, message } from "danger"
import { istanbulCoverage } from 'danger-plugin-istanbul-coverage';
import * as fs from 'fs';
import * as path from 'path';

console.log('danger.git.modified_files: ', danger.git.modified_files)
console.log('danger.git.created_files: ', danger.git.created_files)
console.log('danger.github: ', danger.github.pr)

const prThreshold = 300;
if (danger.github.pr.additions + danger.github.pr.deletions > prThreshold) {
  warn(':exclamation: Big PR');
}

message("test!")

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
  .filter(m => !modifiedOrCreatedFiles.find(f => f.includes(m.testFile)));

const hasAppChanges = modifiedOrCreatedFiles.length;
const hasUntestedFiles = untestedFiles.length;

if (hasAppChanges && hasUntestedFiles) {
  const list = toLinkList(untestedFiles.map(u => u.file));
  warn(
    'App files should get test files' +
    `\n\n${list}`
  );
}


schedule(
  istanbulCoverage({
    reportFileSet: 'createdOrModified',

    coveragePath: { path: './coverage/lcov.info', type: 'lcov' },

    reportMode: 'warn',

    threshold: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  })
);
