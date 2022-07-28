import { Octokit } from "octokit";
import yargs from "yargs";
import { getCommitAndLabels } from "./github-utils";

export async function printInfo(octokit: Octokit, previousVersion: string, nextVersion: string) {

  let lines = "";
  const addInfoLine = (line: string) => {
    lines += line + '\n';
  }

  const owners = {
    polkadot: "paritytech",
    // moonbeam: "OAK-Foundation",
    // "open-runtime-module-library": "open-web3-stack"
  };
  const prefixes = {
    polkadot: "release-",
    // moonbeam: "oak-polkadot-",
    // "open-runtime-module-library": "polkadot-"
  };
  addInfoLine(`# Description\n`);
  addInfoLine(`This ticket is automatically generated using\n`);
  addInfoLine("```");
  addInfoLine(`$ npm run print-version-bump-info -- --from ${previousVersion} --to ${nextVersion}`);
  addInfoLine("```");

  const prInfoByLabels = {};
  for (const repo of Object.keys(prefixes)) {
    const previousTag = `${prefixes[repo]}${previousVersion}`;
    const nextTag = `${prefixes[repo]}${nextVersion}`;
    try {
      const previousCommit = await octokit.rest.git.getCommit({
        owner: owners[repo],
        repo,
        commit_sha: (
          await octokit.rest.git.getTree({
            owner: owners[repo],
            repo,
            tree_sha: previousTag,
          })
        ).data.sha,
      });
      const nextCommit = await octokit.rest.git.getCommit({
        owner: owners[repo],
        repo,
        commit_sha: (
          await octokit.rest.git.getTree({
            owner: owners[repo],
            repo,
            tree_sha: nextTag,
          })
        ).data.sha,
      });
      addInfoLine(
        `\n## ${repo} (${previousCommit.data.author.date.slice(
          0,
          10
        )} -> ${nextCommit.data.author.date.slice(0, 10)})\n`
      );
      const { commits, prByLabels } = await getCommitAndLabels(
        octokit,
        owners[repo],
        repo,
        previousTag,
        nextTag
      );
      addInfoLine(`https://github.com/${owners[repo]}/${repo}/compare/${previousTag}...${nextTag}`);
      addInfoLine("```");
      addInfoLine(`    from: ${previousCommit.data.sha}`);
      addInfoLine(`      to: ${nextCommit.data.sha}`);
      addInfoLine(` commits: ${commits.length}`);
      addInfoLine("```");

      for (const label of Object.keys(prByLabels)) {
        prInfoByLabels[label] = (prInfoByLabels[label] || []).concat(
          prByLabels[label].map((pr) => {
            return `  ${`(${owners[repo]}/${repo}#${pr.number}) ${pr.title}`}`;
          })
        );
      }
    } catch (e) {
      console.log('error: ', e);
      console.trace(`Failing to query ${repo} [${previousTag}..${nextTag}]: ${e.toString()}`);
      process.exit(1);
    }
  }

  addInfoLine(`\n# Important commits by label\n`);
  const excludeRegs = [
    /D5-nicetohaveaudit/,
    /D3-trivia/,
    /D2-notlive/,
    /D1-audited/,
    /C[01234]-/,
    /B0-silent/,
    /A[0-9]-/,
  ];
  for (const labelName of Object.keys(prInfoByLabels).sort().reverse()) {
    if (excludeRegs.some((f) => f.test(labelName))) {
      continue;
    }
    console.log(`\n### ${labelName || "N/A"}\n`);
    // Deduplicate PRs on same label
    const deduplicatePrsOfLabel = prInfoByLabels[labelName].filter(function (elem, index, self) {
      return index === self.indexOf(elem);
    });
    for (const prInfo of deduplicatePrsOfLabel) {
      addInfoLine(prInfo);
    }
  }

  addInfoLine(`\n## Review 'substrate-migrations' repo\n`);
  addInfoLine(`https://github.com/apopiak/substrate-migrations#frame-migrations`);
  addInfoLine(`\nThis repository contains a list of FRAME-related migrations which might be`);
  addInfoLine(`relevant to OAK.`);

  return lines;
}

// const createIssue = async (octokit: Octokit) => {
//   const {data: issue} = await octokit.rest.issues.create({
//     owner: 'imstar15',
//     repo: 'OAK-blockchain',
//     title: 'test',
//     body: 'abc'
//   })
//   console.log(`Created issue #${issue.number}`)
//   return issue.number;
// }

// async function main() {
//   // const argv = yargs(process.argv.slice(2))
//   //   .usage("Usage: npm run print-version-deps [args]")
//   //   .version("1.0.0")
//   //   .options({
//   //     from: {
//   //       type: "string",
//   //       describe: "commit-sha/tag of range start",
//   //     },
//   //     to: {
//   //       type: "string",
//   //       describe: "commit-sha/tag of range end",
//   //     },
//   //   })
//   //   .demandOption(["from", "to"])
//   //   .help().argv;

//   const octokit = new Octokit({
//     auth: process.env.GITHUB_TOKEN || undefined,
//   });

//   // printInfo(octokit, argv.from, argv.to);
//   await createIssue(octokit);
// }

// main();
