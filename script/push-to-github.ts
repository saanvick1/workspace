import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.local',
  '.config',
  '.upm',
  'dist',
  '.replit',
  'replit.nix',
  '.breakpoints',
  'script/push-to-github.ts',
  'snippets',
  'references',
  'generated',
  'tmp',
  '.npm',
];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  return IGNORE_PATTERNS.some(pattern => parts.some(part => part === pattern));
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push(relativePath);
    }
  }
  
  return results;
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });

  const { data: user } = await octokit.users.getAuthenticated();
  console.log('Authenticated as:', user.login);

  const repoName = path.basename(process.cwd());
  console.log('Repository name:', repoName);

  let repo;
  let needsInit = false;
  try {
    const { data: existingRepo } = await octokit.repos.get({
      owner: user.login,
      repo: repoName,
    });
    repo = existingRepo;
    console.log('Repository already exists, will push to it.');
    try {
      await octokit.git.getRef({ owner: user.login, repo: repoName, ref: 'heads/main' });
    } catch {
      needsInit = true;
    }
  } catch {
    const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: false,
      auto_init: false,
    });
    repo = newRepo;
    needsInit = true;
    console.log('Created new repository:', repo.html_url);
  }

  if (needsInit) {
    console.log('Initializing repository with README...');
    await octokit.repos.createOrUpdateFileContents({
      owner: user.login,
      repo: repoName,
      path: 'README.md',
      message: 'Initial commit',
      content: Buffer.from('# ' + repoName + '\n').toString('base64'),
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to push.`);

  const tree = [];
  for (const file of files) {
    const filePath = path.join(projectDir, file);
    const contentBuffer = fs.readFileSync(filePath);
    
    let isBinary = false;
    for (let i = 0; i < Math.min(contentBuffer.length, 8000); i++) {
      if (contentBuffer[i] === 0) {
        isBinary = true;
        break;
      }
    }

    if (isBinary) {
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: repoName,
        content: contentBuffer.toString('base64'),
        encoding: 'base64',
      });
      tree.push({
        path: file,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      });
    } else {
      const content = contentBuffer.toString('utf-8');
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: repoName,
        content: content,
        encoding: 'utf-8',
      });
      tree.push({
        path: file,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      });
    }
  }

  console.log('Creating tree...');
  const { data: gitTree } = await octokit.git.createTree({
    owner: user.login,
    repo: repoName,
    tree: tree,
  });

  let parentSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
    });
    parentSha = ref.object.sha;
  } catch {
    // No existing commits
  }

  console.log('Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner: user.login,
    repo: repoName,
    message: 'Initial commit from Replit',
    tree: gitTree.sha,
    parents: parentSha ? [parentSha] : [],
  });

  try {
    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
      force: true,
    });
  } catch {
    await octokit.git.createRef({
      owner: user.login,
      repo: repoName,
      ref: 'refs/heads/main',
      sha: commit.sha,
    });
  }

  console.log('Successfully pushed to:', repo.html_url);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
