require('dotenv').config();

async function getPRDiff(owner, repo, prNumber) {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3.diff"
            }
        }
    );

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
}

async function main() {
    // A small, real, closed PR to test with
    const diff = await getPRDiff("octocat", "Hello-World", 1);
    console.log(diff.slice(0, 500)); // just show first 500 chars for now
}

main();