// Utility: parse CLI flags in an order-independent way and provide helpers.
export function mapNpmToLabel(token) {
    const map = {
        tailwindcss: "TailwindCSS",
        dotenv: "DotENV",
        "react-icons": "React Icons",
        "framer-motion": "Framer Motion",
        ogl: "OGL",
        axios: "Axios",
        firebase: "Firebase",
        clerk: "Clerk",
        appwrite: "Appwrite",
        prisma: "Prisma",
        "react-router": "React Router",
        "react-router-dom": "React Router",
        "next-auth": "next-auth",
        "@next/font": "@next/font",
        "next-seo": "next-seo",
        "next-sitemap": "next-sitemap",
        "next-pwa": "next-pwa",
    };
    return map[token] || null;
}

export function printHelp() {
    console.log(`
Usage: bun create esyt@latest -- [framework] [language] [projectName] [packages...] [options]

Positional / brief
    projectName                First non-dash token is treated as the project name (no spaces).
                                                         Example: bun create esyt@latest -- my-app

Framework / language
    -vite, --vite, vite        Create a Vite project (default in interactive flow)
    -next, --next, next        Create a Next.js project
    -js, --js, js              Use JavaScript
    -ts, --ts, ts              Use TypeScript

Packages
    Any token starting with -- or a single - followed by >2 chars is treated as a package token.
    Examples: --tailwindcss  -tailwindcss  --dotenv  -dotenv
    Unknown tokens are installed as npm packages.

Install / Git / Editor / Dev
    -git                       Initialize a git repository (interactive default was changed to No)
    -i, -install, --install    Run the detected package manager's install command after creation
    -dev                       Run the development server after install
    -zed, -code, -cursor, -trae Select editor to open the project (Zed, VSCode, Cursor, Trae)

Negations (explicit overrides)
    --no-git, -no-git          Disable git init
    --no-install, -no-install, -no-i
                                                         Disable running the install step
    --no-dev, -no-dev          Disable running the dev server
    --no-editor, -no-ide       Disable opening an editor (sets editor to 'None')
    Note: only these specific --no-... names are handled. Unknown --no-... tokens are ignored.

Automation / testing
    --yes, -y, --no-interactive
                                                         Accept sensible defaults and skip prompts (non-interactive).
                                                         Defaults used by --yes can be overridden by explicit flags like --no-git.
    --dry-run, -d              Print the shell commands the CLI would run without executing them.

Help / version
    -h, --help, help           Print this help text and exit
    -v, --version, version     Print the package version and exit

Notes
    - When running via wrapper commands (bun/pnpm/npm create), use a double-dash (--) to forward
        flags and positional args to this CLI: bun create esyt@latest -- my-app --tailwindcss
    - The CLI accepts flexible token forms (single-dash long tokens like -tailwindcss are supported).

`);
}

export function parseFlags(argv) {
    const result = {
        framework: undefined, // 'Vite' | 'Next.js'
        language: undefined, // 'JavaScript' | 'TypeScript'
        projectName: undefined,
        packages: [], // raw tokens like '--dotenv' or '-dotenv'
        npmPackages: [], // raw npm package names
        gitInit: undefined,
        installDeps: undefined,
        selectedIDE: undefined,
        runDevServer: undefined,
        help: false,
        version: false,
    };

    if (!argv || argv.length === 0) return result;

    // Helper to normalize tokens (strip leading dashes)
    const strip = (t) => (t.startsWith("--") ? t.slice(2) : t.startsWith("-") ? t.slice(1) : t);

    for (let i = 0; i < argv.length; i++) {
        const t = argv[i];
        if (!t) continue;
        // Handle explicit `--no-` overrides (e.g. --no-git)
        if (t.startsWith('--no-') || t.startsWith('-no-')) {
            const key = t.replace(/^--?no-/, '');
            switch (key) {
                case 'git':
                    result.gitInit = false;
                    break;
                case 'install':
                case 'i':
                    result.installDeps = false;
                    break;
                case 'dev':
                    result.runDevServer = false;
                    break;
                case 'editor':
                case 'ide':
                    result.selectedIDE = 'None';
                    break;
                default:
                    // unknown --no- flag; ignore
                    break;
            }
            continue;
        }
        // Help / version
        if (t === "-h" || t === "--help" || t === "help") {
            result.help = true;
            continue;
        }
        if (t === "-v" || t === "--version" || t === "version") {
            result.version = true;
            continue;
        }

        // Non-interactive / yes
        if (t === "--yes" || t === "-y" || t === "--no-interactive") {
            result.yes = true;
            continue;
        }

        // Dry-run
        if (t === "--dry-run" || t === "-d") {
            result.dryRun = true;
            continue;
        }

        // Framework
        if (["-vite", "--vite", "vite"].includes(t) || t === "vite") {
            result.framework = "Vite";
            continue;
        }
        if (["-next", "--next", "next"].includes(t) || t === "next") {
            result.framework = "Next.js";
            continue;
        }

        // Language
        if (["-js", "--js", "js", "-javascript", "--javascript", "javascript"].includes(t)) {
            result.language = "JavaScript";
            continue;
        }
        if (["-ts", "--ts", "ts", "-typescript", "--typescript", "typescript"].includes(t)) {
            result.language = "TypeScript";
            continue;
        }

        // Git
        if (t === "-git") {
            result.gitInit = true;
            continue;
        }
        if (t === "-") {
            // explicit placeholder: treat as nothing/none for position-sensitive defaults
            continue;
        }

        // Install
        if (t === "-i" || t === "-install" || t === "--install") {
            result.installDeps = true;
            continue;
        }

        // Editor
        if (t === "-zed") {
            result.selectedIDE = "Zed";
            continue;
        }
        if (t === "-code") {
            result.selectedIDE = "VSCode";
            continue;
        }
        if (t === "-cursor") {
            result.selectedIDE = "Cursor";
            continue;
        }
        if (t === "-trae") {
            result.selectedIDE = "Trae";
            continue;
        }

        // Dev server
        if (t === "-dev") {
            result.runDevServer = true;
            continue;
        }

        // Packages: tokens starting with --pkg or -pkg (but not short flags like -v)
        if (t.startsWith("--") || (t.startsWith("-") && t.length > 2)) {
            const pkg = strip(t);
            result.packages.push(t);
            result.npmPackages.push(pkg);
            continue;
        }

        // If we reach here and token doesn't start with dash, it's likely the project name
        if (!result.projectName) {
            // validate no spaces
            if (/\s/.test(t)) {
                // ignore and let interactive flow ask for a valid name
                continue;
            }
            result.projectName = t;
            continue;
        }

        // Unknown token: if it's not a flag and we already have projectName, treat as package
        const fallbackPkg = strip(t);
        result.packages.push(t);
        result.npmPackages.push(fallbackPkg);
    }

    return result;
}

export function validateFlags(flags) {
    const invalid = {};
    // framework
    if (flags.framework !== undefined) {
        if (!(flags.framework === 'Vite' || flags.framework === 'Next.js')) {
            invalid.framework = 'unsupported';
        }
    }
    // language
    if (flags.language !== undefined) {
        if (!(flags.language === 'JavaScript' || flags.language === 'TypeScript')) {
            invalid.language = 'unsupported';
        }
    }
    // projectName
    if (flags.projectName !== undefined) {
        if (/\s/.test(flags.projectName) || flags.projectName.length === 0) {
            invalid.projectName = 'invalid';
        }
    }
    // selectedIDE
    if (flags.selectedIDE !== undefined) {
        const allowed = ['Zed', 'VSCode', 'Cursor', 'Trae', 'None'];
        if (!allowed.includes(flags.selectedIDE)) invalid.selectedIDE = 'invalid';
    }
    return invalid;
}
