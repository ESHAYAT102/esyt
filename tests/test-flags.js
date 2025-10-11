import { parseFlags, validateFlags } from '../lib/flags.js';

function assertEqual(a, b, msg) {
    const ok = JSON.stringify(a) === JSON.stringify(b);
    if (!ok) {
        console.error('FAIL:', msg);
        console.error('  expected:', b);
        console.error('  got:     ', a);
        process.exit(1);
    }
}

// Test 1: simple vite flags
let r = parseFlags(['-vite', '-js', 'my-app', '--tailwindcss', '--dotenv', '-git', '-i', '-code', '-dev']);
assertEqual(r.framework, 'Vite', 'framework should be Vite');
assertEqual(r.language, 'JavaScript', 'language should be JS');
assertEqual(r.projectName, 'my-app', 'projectName');
assertEqual(r.npmPackages.includes('tailwindcss'), true, 'tailwindcss present');
assertEqual(r.npmPackages.includes('dotenv'), true, 'dotenv present');
assertEqual(r.gitInit, true, 'gitInit true');
assertEqual(r.installDeps, true, 'installDeps true');
assertEqual(r.selectedIDE, 'VSCode', 'selectedIDE code -> VSCode');
assertEqual(r.runDevServer, true, 'runDevServer true');

// Test 2: order independent and single-dash package
r = parseFlags(['my-other-app', '--dotenv', '--tailwindcss', '--next', '--ts', '-git']);
assertEqual(r.framework, 'Next.js', 'framework Next');
assertEqual(r.language, 'TypeScript', 'language TS');
assertEqual(r.projectName, 'my-other-app', 'project name');
assertEqual(r.npmPackages.includes('dotenv'), true, 'dotenv');
assertEqual(r.gitInit, true, 'git');

// Test 3: invalid project name should be detected by validateFlags (direct check)
let inv = validateFlags({ projectName: 'bad project name' });
assertEqual(typeof inv.projectName !== 'undefined', true, 'invalid project name detected');

console.log('All flag tests passed!');

// Test 4: --no-git explicitly disables git
r = parseFlags(['--no-git', '-vite']);
assertEqual(r.gitInit, false, '--no-git disables git');

// Test 5: --yes with --no-git should set gitInit false
r = parseFlags(['--yes', '--no-git']);
assertEqual(r.gitInit, false, '--yes + --no-git -> gitInit false');

console.log('All extended flag tests passed!');
