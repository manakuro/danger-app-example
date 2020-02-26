import { warn, danger } from "danger"

const prThreshold = 300;
if (danger.github.pr.additions + danger.github.pr.deletions > prThreshold) {
  warn(':exclamation: Big PR');
}
