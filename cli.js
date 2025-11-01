#!/usr/bin/env node
import * as p from "@clack/prompts";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
// Import helper functions from lib/flags.js
const flagsModule = await import("./lib/flags.js");
const { parseFlags, mapNpmToLabel, printHelp, validateFlags } = flagsModule;

function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";

  const isBun =
    /bun/i.test(userAgent) ||
    process.env.BUN ||
    (process.versions && process.versions.bun);
  const isPnpm =
    /pnpm\//i.test(userAgent) ||
    (process.env.npm_execpath || "").includes("pnpm");

  if (isBun) {
    return {
      name: "bun",
      installCmd: "bun install",
      addCmd: "bun add",
      addDevCmd: "bun add -d",
      dlxCmd: "bunx",
      createViteCmd(projectName, template) {
        return `bun create vite@latest ${projectName} --template ${template}`;
      },
      createNextCmd(projectName, flags) {
        return `bunx create-next-app@latest ${projectName} ${flags}`;
      },
    };
  }

  if (isPnpm) {
    return {
      name: "pnpm",
      installCmd: "pnpm i",
      addCmd: "pnpm add",
      addDevCmd: "pnpm add -D",
      dlxCmd: "pnpm dlx",
      createViteCmd(projectName, template) {
        return `pnpm create vite@latest ${projectName} --template ${template}`;
      },
      createNextCmd(projectName, flags) {
        return `pnpm create next-app@latest ${projectName} ${flags}`;
      },
    };
  }

  return {
    name: "npm",
    installCmd: "npm i",
    addCmd: "npm i",
    addDevCmd: "npm i -D",
    dlxCmd: "npx",
    createViteCmd(projectName, template) {
      return `npm create vite@latest ${projectName} -- --template ${template}`;
    },
    createNextCmd(projectName, flags) {
      return `npx create-next-app@latest ${projectName} ${flags}`;
    },
  };
}

function printTitle() {
  console.log(`
 ______     ______     __  __     ______
/\\  ___\\   /\\  ___\\   /\\ \\_\\ \\   /\\__  _\\
\\ \\  __\\   \\ \\___  \\  \\ \\____ \\  \\/_/\\ \\/
 \\ \\_____\\  \\/\\_____\\  \\/\\_____\\    \\ \\_\\
  \\/_____/   \\/_____/   \\/_____/     \\/_/
`);
}

// flag parsing helpers are provided by ./lib/flags.js

async function run() {
  try {
    printTitle();
    const pm = detectPackageManager();
    // Parse CLI flags and use them to skip prompts when valid. We still validate
    // flags and fall back to interactive prompts for anything missing or wrong.
    const flags = parseFlags(process.argv.slice(2));
    // Validate flags and clear any invalid values so we prompt only for those
    const invalid = validateFlags(flags);
    for (const k of Object.keys(invalid)) {
      // clear invalid keys so interactive prompts run for them
      flags[k] = undefined;
    }
    // Helper to run or print commands depending on dryRun/yes flags
    const runCommand = (cmd, options = {}) => {
      if (flags.dryRun) {
        console.log(`[dry-run] ${cmd}`);
        return;
      }
      return execSync(cmd, options);
    };

    // If user provided --yes, fill sensible defaults for any missing values so
    // the CLI runs non-interactively.
    if (flags.yes) {
      flags.framework = flags.framework || "Vite";
      flags.language = flags.language || "JavaScript";
      flags.projectName = flags.projectName || "esyt-app";
      flags.npmPackages = flags.npmPackages || [];
      flags.gitInit = typeof flags.gitInit === "boolean" ? flags.gitInit : true;
      flags.installDeps = typeof flags.installDeps === "boolean" ? flags.installDeps : true;
      flags.selectedIDE = flags.selectedIDE || "None";
      // runDevServer default only makes sense if installDeps is true
      flags.runDevServer = typeof flags.runDevServer === "boolean" ? flags.runDevServer : true;
    }
    if (flags.help) {
      printHelp();
      process.exit(0);
    }
    if (flags.version) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
        console.log(pkg.version || "");
      } catch (e) {
        console.log("");
      }
      process.exit(0);
    }

    // 1. Framework selection
    let framework = flags.framework;
    if (!framework) {
      framework = await p.select({
        message: "Which framework would you like to use?",
        options: [
          { value: "Vite", label: "Vite" },
          { value: "Next.js", label: "Next.js" },
        ],
      });
      if (p.isCancel(framework)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
    }

    // 2. Language selection
    let language = flags.language;
    if (!language) {
      language = await p.select({
        message: "Will you be using JavaScript or TypeScript?",
        options: [
          { value: "JavaScript", label: "JavaScript" },
          { value: "TypeScript", label: "TypeScript" },
        ],
      });
      if (p.isCancel(language)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
    }

    // 3. Project name
    let projectName = flags.projectName;
    // Validate flag-provided project name: reject if contains spaces
    if (projectName && /\s/.test(projectName)) {
      console.log("Provided project name contains spaces and will be ignored. Please enter a valid name.");
      projectName = undefined;
    }
    if (!projectName) {
      projectName = await p.text({
        message: "What will your project be called?",
        placeholder: "esyt-app",
        validate: (value) => {
          if (!value || value.trim() === "") {
            return "Project name is required.";
          }
          if (/\s/.test(value)) {
            return "Project name cannot contain spaces. Please use dashes or underscores.";
          }
        },
      });
      if (p.isCancel(projectName)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
    }

    // 4. Package selection prompt (contextual)
    let packageChoices = [];
    if (framework === "Vite") {
      packageChoices = [
        "TailwindCSS",
        "React Router",
        "React Icons",
        "Framer Motion",
        "OGL",
        "DotENV",
        "Axios",
        "Firebase",
        "Clerk",
        "Appwrite",
        "Prisma",
      ];
    } else if (framework === "Next.js") {
      packageChoices = [
        "TailwindCSS",
        "React Icons",
        "Framer Motion",
        "DotENV",
        "Axios",
        "Firebase",
        "Clerk",
        "Appwrite",
        "Prisma",
        "next-auth",
        "@next/font",
        "next-seo",
        "next-sitemap",
        "next-pwa",
      ];
    }
    // 4. Package selection. Merge interactive labels with flags.npmPackages.
    let packages = [];
    // Map flag-provided npm packages to the interactive labels when possible.
    if (flags.npmPackages && flags.npmPackages.length > 0) {
      for (const np of flags.npmPackages) {
        const mapped = mapNpmToLabel(np);
        if (mapped) packages.push(mapped);
        else {
          // keep the raw npm package name to install later
          packages.push(np);
        }
      }
    }

    // If no packages were provided via flags, prompt interactively (unless --yes)
    if (packages.length === 0) {
      if (flags.yes) {
        packages = [];
      } else {
        const selected = await p.multiselect({
          message: "Which packages would you like to enable?",
          options: packageChoices.map((choice) => ({
            value: choice,
            label: choice,
          })),
        });
        if (p.isCancel(selected)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        packages = selected;
      }
    }

    // 5. Git init, npm i, dev server, IDE selection prompts
    // 5. Git init, install, and IDE selection. Use flags when available.
    let gitInit = typeof flags.gitInit === "boolean" ? flags.gitInit : undefined;
    let installDeps = typeof flags.installDeps === "boolean" ? flags.installDeps : undefined;
    let selectedIDE = typeof flags.selectedIDE === "string" ? flags.selectedIDE : undefined;

    if (gitInit === undefined || installDeps === undefined || !selectedIDE) {
      if (gitInit === undefined) {
        const result = await p.confirm({
          message: "Initialize a new git repository?",
          initialValue: false,
        });
        if (p.isCancel(result)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        gitInit = result;
      }
      if (installDeps === undefined) {
        const result = await p.confirm({
          message: `Would you like us to run '${pm.installCmd}'?`,
          initialValue: true,
        });
        if (p.isCancel(result)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        installDeps = result;
      }
      if (!selectedIDE) {
        const result = await p.select({
          message: "Which IDE would you like to open your project with?",
          options: [
            { value: "Zed", label: "Zed" },
            { value: "VSCode", label: "VSCode" },
            { value: "Cursor", label: "Cursor" },
            { value: "Trae", label: "Trae" },
            { value: "None", label: "None" },
          ],
          initialValue: "None",
        });
        if (p.isCancel(result)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        selectedIDE = result;
      }
    }

    let runDevServer = typeof flags.runDevServer === "boolean" ? flags.runDevServer : undefined;
    if (runDevServer === undefined && installDeps) {
      const result = await p.confirm({
        message: "Would you like to run the development server automatically after setup?",
        initialValue: true,
      });
      if (p.isCancel(result)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
      runDevServer = result;
    }

    const projectPath = path.join(process.cwd(), projectName);

    // --- Framework-specific project creation ---
    if (framework === "Vite") {
      const template = language === "JavaScript" ? "react" : "react-ts";
      const viteCommand = pm.createViteCmd(projectName, template);
      console.log(`Running: ${viteCommand}`);
      // Newer versions of the Vite create flow ask interactive questions
      // (e.g. "Use rolldown-vite (Experimental)?" and "Install with bun and start now?").
      // Auto-answer these prompts with "no" by sending two "no\n" lines to stdin.
      // We keep stdout/stderr inherited so the user still sees the command output.
      try {
        runCommand(viteCommand, {
          stdio: ["pipe", "inherit", "inherit"],
          input: Buffer.from("no\nno\n"),
        });
      } catch (err) {
        throw err;
      }

      process.chdir(projectPath);

      try {
        if (installDeps) {
          runCommand(pm.installCmd, { stdio: "inherit" });
        }
      } catch (error) {
        console.error("Error during initial setup:", error.message);
      }

      try {
        const filesToRemove = [
          {
            path: path.join(projectPath, "src", "assets"),
            isDir: true,
          },
          {
            path: path.join(projectPath, "README.md"),
            isDir: false,
          },
          {
            path: path.join(projectPath, "public", "vite.svg"),
            isDir: false,
          },
          {
            path: path.join(projectPath, "src", "App.css"),
            isDir: false,
          },
        ];
        for (const file of filesToRemove) {
          if (fs.existsSync(file.path)) {
            try {
              if (file.isDir) {
                fs.rmSync(file.path, { recursive: true, force: true });
              } else {
                fs.unlinkSync(file.path);
              }
            } catch (error) { }
          }
        }
      } catch (error) { }

      try {
        const componentsDir = path.join(projectPath, "src", "components");
        if (!fs.existsSync(componentsDir)) {
          fs.mkdirSync(componentsDir);
        }
        const navbarPath = path.join(
          componentsDir,
          `Navbar.${language === "JavaScript" ? "jsx" : "tsx"}`,
        );
        fs.writeFileSync(
          navbarPath,
          `export default function Navbar() {\n  return (\n    <>\n      <h1>Navbar</h1>\n    </>\n  )\n}`,
        );
        const footerPath = path.join(
          componentsDir,
          `Footer.${language === "JavaScript" ? "jsx" : "tsx"}`,
        );
        fs.writeFileSync(
          footerPath,
          `export default function Footer() {\n  return (\n    <>\n      <h1>Footer</h1>\n    </>\n  )\n}`,
        );
      } catch (error) { }

      // Create routes directory and Routes file if React Router is selected
      if (packages.includes("React Router")) {
        try {
          const routesDir = path.join(projectPath, "src", "routes");
          if (!fs.existsSync(routesDir)) {
            fs.mkdirSync(routesDir);
          }
          const routesPath = path.join(
            routesDir,
            `Routes.${language === "JavaScript" ? "jsx" : "tsx"}`,
          );
          fs.writeFileSync(
            routesPath,
            `import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home${language === "JavaScript" ? ".jsx" : ".tsx"}";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
]);`,
          );
        } catch (error) { }
      }

      try {
        const appJsxPath = path.join(
          projectPath,
          "src",
          `App.${language === "JavaScript" ? "jsx" : "tsx"}`,
        );
        if (fs.existsSync(appJsxPath)) {
          try {
            const appContent = packages.includes("React Router")
              ? `import { RouterProvider } from "react-router-dom";\nimport { router } from "./routes/Routes${language === "JavaScript" ? ".jsx" : ".tsx"
              }";\n\nfunction App() {\n  return (\n    <>\n      <RouterProvider router={router} />\n    </>\n  );\n}\n\nexport default App;`
              : `import Navbar from "./components/Navbar";\nimport Home from "./pages/Home";\nimport Footer from "./components/Footer";\n\nexport default function App() {\n  return (\n    <>\n      <Navbar/>\n      <Footer/>\n    </>\n  );\n}`;
            fs.writeFileSync(appJsxPath, appContent);
          } catch (error) { }
        }
        const indexHtmlPath = path.join(projectPath, "index.html");
        if (fs.existsSync(indexHtmlPath)) {
          try {
            fs.writeFileSync(
              indexHtmlPath,
              `<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <link rel=\"stylesheet\" href=\"./src/index.css\" />\n    <title>ESYT App</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.${language === "JavaScript" ? "jsx" : "tsx"
              }\"></script>\n  </body>\n</html>\n`,
            );
          } catch (error) { }
        }
      } catch (error) { }

      if (installDeps) {
        try {
          if (packages.includes("Clerk")) {
            try {
              runCommand(`${pm.addCmd} @clerk/clerk-react`, { stdio: "inherit" });
            } catch (error) { }
          }
          if (packages.includes("Appwrite")) {
            try {
              runCommand(`${pm.addCmd} appwrite`, { stdio: "inherit" });
            } catch (error) { }
          }
          if (packages.includes("Prisma")) {
            try {
              runCommand(`${pm.addDevCmd} prisma`, { stdio: "inherit" });
              runCommand(`${pm.addCmd} @prisma/client`, { stdio: "inherit" });
              runCommand(`${pm.dlxCmd} prisma@latest init --datasource-provider postgresql`, { stdio: "inherit" });
            } catch (error) { }
          }
          if (packages.includes("React Icons")) {
            try {
              runCommand(`${pm.addCmd} react-icons`, { stdio: "inherit" });
            } catch (error) { }
          }
          if (packages.includes("Framer Motion")) {
            try {
              runCommand(`${pm.addCmd} framer-motion motion`, { stdio: "inherit" });
            } catch (error) { }
          }
          if (packages.includes("React Router")) {
            try {
              runCommand(`${pm.addCmd} react-router-dom`, { stdio: "inherit" });
            } catch (error) { }
          }
          if (packages.includes("OGL")) {
            try {
              runCommand(`${pm.addCmd} ogl`, { stdio: "inherit" });
            } catch (error) { }
          }
          if (packages.includes("Firebase")) {
            try {
              runCommand(`${pm.addCmd} firebase`, { stdio: "inherit" });
              const firebaseDir = path.join(projectPath, "src", "firebase");
              if (!fs.existsSync(firebaseDir)) {
                fs.mkdirSync(firebaseDir, { recursive: true });
              }
              const firebaseConfigPath = path.join(
                firebaseDir,
                "firebase.config.js",
              );
              fs.writeFileSync(
                firebaseConfigPath,
                `import { initializeApp } from "firebase/app";\nimport { getAuth } from "firebase/auth";\n\nconst firebaseConfig = {\n  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,\n  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,\n  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,\n  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,\n  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,\n  appId: import.meta.env.VITE_FIREBASE_APP_ID,\n};\n\nconst app = initializeApp(firebaseConfig);\nexport const auth = getAuth(app);`,
              );
              const envPath = path.join(projectPath, ".env");
              fs.writeFileSync(
                envPath,
                `VITE_FIREBASE_API_KEY=\nVITE_FIREBASE_AUTH_DOMAIN=\nVITE_FIREBASE_PROJECT_ID=\nVITE_FIREBASE_STORAGE_BUCKET=\nVITE_FIREBASE_APP_ID=\nVITE_SERVER_URL=`,
              );
            } catch (error) { }
          }
          if (packages.includes("DotENV")) {
            try {
              runCommand(`${pm.addCmd} dotenv`, { stdio: "inherit" });
            } catch (error) { }
          }
          if (packages.includes("Axios")) {
            try {
              runCommand(`${pm.addCmd} axios`, { stdio: "inherit" });
            } catch (error) { }
          }
          if (packages.includes("TailwindCSS")) {
            try {
              runCommand(`${pm.addCmd} tailwindcss @tailwindcss/vite`, { stdio: "inherit" });
              const indexCssPath = path.join(projectPath, "src", "index.css");
              if (fs.existsSync(indexCssPath)) {
                fs.writeFileSync(indexCssPath, `@import "tailwindcss";\n`);
              }
              const tailwindConfigPath = path.join(
                projectPath,
                "tailwind.config.js",
              );
              try {
                if (!fs.existsSync(tailwindConfigPath)) {
                  fs.writeFileSync(
                    tailwindConfigPath,
                    `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n};\n`,
                  );
                }
              } catch (error) { }
              const viteConfigPath = path.join(projectPath, "vite.config.js");
              if (fs.existsSync(viteConfigPath)) {
                fs.writeFileSync(
                  viteConfigPath,
                  `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n});\n`,
                );
              }
            } catch (error) { }
          }
        } catch (error) { }
      }
      // Install any arbitrary npm packages provided via flags
      if (flags.npmPackages && flags.npmPackages.length > 0 && installDeps) {
        for (const np of flags.npmPackages) {
          try {
            console.log(`Installing extra package: ${np}`);
            runCommand(`${pm.addCmd} ${np}`, { stdio: "inherit" });
          } catch (error) {
            console.error(`Failed to install ${np}: ${error.message}`);
          }
        }
      }
      try {
        const pagesDir = path.join(projectPath, "src", "pages");
        if (!fs.existsSync(pagesDir)) {
          fs.mkdirSync(pagesDir);
        }
        const homePath = path.join(
          pagesDir,
          `Home.${language === "JavaScript" ? "jsx" : "tsx"}`,
        );
        fs.writeFileSync(
          homePath,
          `export default function Home() {\n  return (\n    <>\n      <h1>Home</h1>\n    </>\n  )\n}`,
        );
      } catch (error) { }
    } else if (framework === "Next.js") {
      // --- Next.js extra options prompt ---
      let nextOptions;
      if (flags.yes) {
        // sensible defaults for non-interactive mode
        nextOptions = {
          eslint: true,
          srcDir: false,
          appRouter: true,
          turbo: true,
        };
      } else {
        const eslint = await p.confirm({
          message: "Would you like to use ESLint?",
          initialValue: true,
        });
        if (p.isCancel(eslint)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        const srcDir = await p.confirm({
          message: "Would you like your code inside a 'src/' directory?",
          initialValue: false,
        });
        if (p.isCancel(srcDir)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        const appRouter = await p.confirm({
          message: "Would you like to use App Router? (recommended)",
          initialValue: true,
        });
        if (p.isCancel(appRouter)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        const turbo = await p.confirm({
          message: "Would you like to use Turbopack for 'next dev'?",
          initialValue: true,
        });
        if (p.isCancel(turbo)) {
          p.cancel("Operation cancelled.");
          process.exit(0);
        }
        nextOptions = { eslint, srcDir, appRouter, turbo };
      }
      // Tailwind CSS autofill
      const useTailwind = packages.includes("TailwindCSS");
      // --- Next.js project creation ---
      const nextFlagsParts = [];
      // Set language flag for Next.js
      if (language === "TypeScript") {
        nextFlagsParts.push("--ts");
      } else {
        nextFlagsParts.push("--js");
      }
      nextFlagsParts.push(nextOptions.eslint ? "--eslint" : "--no-eslint");
      nextFlagsParts.push(useTailwind ? "--tailwind" : "--no-tailwind");
      nextFlagsParts.push(nextOptions.srcDir ? "--src-dir" : "--no-src-dir");
      nextFlagsParts.push(nextOptions.appRouter ? "--app" : "--no-app");
      // Add Turbopack flags only if selected, per official docs (Made the import alias static to yes as it was not possible to automate for no)
      if (nextOptions.turbo) {
        nextFlagsParts.push("--turbopack", '--import-alias "@/*"');
      }
      const nextCommand = pm.createNextCmd(
        projectName,
        nextFlagsParts.join(" "),
      );
      console.log(`Running: ${nextCommand}`);
      runCommand(nextCommand, { stdio: "inherit" });
      console.log("Next.js project created.");
      process.chdir(projectPath);
      // Cleanup: Remove README.md for Next.js projects (to match Vite cleanup)
      try {
        const readmePath = path.join(projectPath, "README.md");
        if (fs.existsSync(readmePath)) {
          fs.unlinkSync(readmePath);
        }
      } catch (error) { }
      console.log(`Changed directory to: ${projectName}`);
      try {
        if (installDeps) {
          console.log("Installing initial dependencies...");
          runCommand(pm.installCmd, { stdio: "inherit" });
        } else {
          console.log(
            "Skipping initial dependencies installation as requested.",
          );
        }
      } catch (error) {
        console.error("Error during initial setup:", error.message);
      }
      // Scaffold components directory and Navbar/Footer
      try {
        // Determine base app directory for components
        let baseAppDir = projectPath;
        if (nextOptions.srcDir) {
          baseAppDir = path.join(projectPath, "src", "app");
        } else {
          baseAppDir = path.join(projectPath, "app");
        }
        if (!fs.existsSync(baseAppDir)) {
          fs.mkdirSync(baseAppDir, { recursive: true });
        }
        const componentsDir = path.join(baseAppDir, "components");
        if (!fs.existsSync(componentsDir)) {
          fs.mkdirSync(componentsDir);
          console.log("Created components directory inside app.");
        }
        const ext = language === "JavaScript" ? "jsx" : "tsx";
        const navbarPath = path.join(componentsDir, `Navbar.${ext}`);
        fs.writeFileSync(
          navbarPath,
          `export default function Navbar() {\n  return (\n    <nav className="p-16 border-b border-slate-200">\n      <h1>Navbar</h1>\n    </nav>\n  )\n}`,
        );
        const footerPath = path.join(componentsDir, `Footer.${ext}`);
        fs.writeFileSync(
          footerPath,
          `export default function Footer() {\n  return (\n    <footer className="p-16 border-t border-slate-200">\n      <h1>Footer</h1>\n    </footer>\n  )\n}`,
        );
        console.log(
          "Created Navbar and Footer components inside app/components.",
        );
      } catch (error) {
        console.error("Error creating components:", error.message);
      }
      // Scaffold sample API route
      try {
        const apiDir = path.join(projectPath, "pages", "api");
        if (!fs.existsSync(apiDir)) {
          fs.mkdirSync(apiDir, { recursive: true });
        }
        const apiFile = path.join(
          apiDir,
          `hello.${language === "JavaScript" ? "js" : "ts"}`,
        );
        fs.writeFileSync(
          apiFile,
          language === "JavaScript"
            ? `export default function handler(req, res) {\n  res.status(200).json({ message: 'Hello from Next.js API!' });\n}`
            : `import { NextApiRequest, NextApiResponse } from 'next';\nexport default function handler(req: NextApiRequest, res: NextApiResponse) {\n  res.status(200).json({ message: 'Hello from Next.js API!' });\n}`,
        );
        console.log("Created sample API route.");
      } catch (error) {
        console.error("Error creating API route:", error.message);
      }
      // Scaffold layout file in app directory
      try {
        let baseAppDir = projectPath;
        if (nextOptions.srcDir) {
          baseAppDir = path.join(projectPath, "src", "app");
        } else {
          baseAppDir = path.join(projectPath, "app");
        }
        const ext =
          language === "TypeScript"
            ? "tsx"
            : language === "JavaScript"
              ? "jsx"
              : "js";
        const layoutFile = path.join(baseAppDir, `layout.${ext}`);
        const layoutCode = `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ESYT App",
  description: "Project created with ESYT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang=\"en\">
      <body
        className={\`${geistSans.variable} ${geistMono.variable} antialiased\`}
      >
        {children}
      </body>
    </html>
  );
}
`;
        fs.writeFileSync(layoutFile, layoutCode);
        console.log(`Created layout file as app/layout.${ext}`);
      } catch (error) {
        console.error("Error creating layout file:", error.message);
      }
      // Scaffold .env.local
      try {
        const envPath = path.join(projectPath, ".env.local");
        if (!fs.existsSync(envPath)) {
          fs.writeFileSync(envPath, `NEXT_PUBLIC_EXAMPLE=\n`);
          console.log("Created .env.local file.");
        }
      } catch (error) {
        console.error("Error creating .env.local:", error.message);
      }
      // Overwrite main page file in app directory for Next.js
      try {
        let baseAppDir = projectPath;
        if (nextOptions.srcDir) {
          baseAppDir = path.join(projectPath, "src", "app");
        } else {
          baseAppDir = path.join(projectPath, "app");
        }
        const ext = language === "TypeScript" ? "tsx" : "jsx";
        const mainPageFile = path.join(baseAppDir, `page.${ext}`);
        fs.writeFileSync(
          mainPageFile,
          `export default function Home() {\n  return (\n    <div>\n      <h1>ESYT</h1>\n    </div>\n  );\n}`,
        );
        console.log(`Overwritten main page as app/page.${ext}`);
      } catch (error) {
        console.error("Error writing main page:", error.message);
      }
      // Install selected packages (Next.js compatible)
      if (installDeps && packages.length > 0) {
        console.log("\nInstalling selected packages...");
        for (const pkg of packages) {
          try {
            switch (pkg) {
              case "TailwindCSS":
                // For Next.js, install tailwindcss, @tailwindcss/postcss, postcss
                execSync(
                  `${pm.addCmd} tailwindcss @tailwindcss/postcss postcss`,
                  { stdio: "inherit" },
                );
                // Write postcss.config.mjs
                const postcssConfigPath = path.join(
                  projectPath,
                  "postcss.config.mjs",
                );
                fs.writeFileSync(
                  postcssConfigPath,
                  'const config = {  plugins: {    "@tailwindcss/postcss": {},  },};\nexport default config;',
                );
                // Update globals.css in app or src/app
                let baseAppDir = projectPath;
                if (nextOptions.srcDir) {
                  baseAppDir = path.join(projectPath, "src", "app");
                } else {
                  baseAppDir = path.join(projectPath, "app");
                }
                const globalsCssPath = path.join(baseAppDir, "globals.css");
                fs.writeFileSync(globalsCssPath, '@import "tailwindcss";\n');
                break;
              case "React Icons":
                runCommand(`${pm.addCmd} react-icons`, { stdio: "inherit" });
                break;
              case "Framer Motion":
                runCommand(`${pm.addCmd} framer-motion`, { stdio: "inherit" });
                break;
              case "DotENV":
                runCommand(`${pm.addCmd} dotenv`, { stdio: "inherit" });
                break;
              case "Axios":
                runCommand(`${pm.addCmd} axios`, { stdio: "inherit" });
                break;
              case "Firebase":
                runCommand(`${pm.addCmd} firebase`, { stdio: "inherit" });
                break;
              case "Clerk":
                runCommand(`${pm.addCmd} @clerk/nextjs`, { stdio: "inherit" });
                break;
              case "Appwrite":
                runCommand(`${pm.addCmd} appwrite`, { stdio: "inherit" });
                break;
              case "Prisma":
                runCommand(`${pm.addDevCmd} prisma`, { stdio: "inherit" });
                runCommand(`${pm.addCmd} @prisma/client`, { stdio: "inherit" });
                runCommand(`${pm.dlxCmd} prisma@latest init --datasource-provider postgresql`, { stdio: "inherit" });
                break;
              case "next-auth":
                runCommand(`${pm.addCmd} next-auth`, { stdio: "inherit" });
                break;
              case "@next/font":
                runCommand(`${pm.addCmd} @next/font`, { stdio: "inherit" });
                break;
              case "next-seo":
                runCommand(`${pm.addCmd} next-seo`, { stdio: "inherit" });
                break;
              case "next-sitemap":
                runCommand(`${pm.addCmd} next-sitemap`, { stdio: "inherit" });
                break;
              case "next-pwa":
                runCommand(`${pm.addCmd} next-pwa`, { stdio: "inherit" });
                break;
            }
            console.log(`✅ ${pkg} installed.`);
          } catch (error) {
            console.error(`❌ Failed to install ${pkg}: ${error.message}`);
          }
        }
        // Install any arbitrary npm packages provided via flags
        if (flags.npmPackages && flags.npmPackages.length > 0) {
          for (const np of flags.npmPackages) {
            try {
              console.log(`Installing extra package: ${np}`);
              runCommand(`${pm.addCmd} ${np}`, { stdio: "inherit" });
            } catch (error) {
              console.error(`Failed to install ${np}: ${error.message}`);
            }
          }
        }
      }
    }
    // --- End framework-specific logic ---

    // --- Git init, IDE, dev server, etc. (shared) ---
    if (gitInit) {
      try {
        console.log("\nInitializing Git repository...");
        runCommand("git init", { stdio: "inherit" });
        const gitignorePath = path.join(projectPath, ".gitignore");
        if (!fs.existsSync(gitignorePath)) {
          fs.writeFileSync(
            gitignorePath,
            `# Logs\nlogs\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\npnpm-debug.log*\nlerna-debug.log*\n\n# Dependencies\nnode_modules\n*.local\n\n# Editor directories and files\n.vscode/*\n!.vscode/extensions.json\n.idea\n.DS_Store\n*.suo\n*.ntvs*\n*.njsproj\n*.sln\n*.sw?\n\n# Environment variables\n.env\n.env.local\n.env.development.local\n.env.test.local\n.env.production.local\n`,
          );
          console.log("Created .gitignore file.");
        }
        console.log("✅ Git repository initialized.");
      } catch (error) {
        console.error(
          `❌ Failed to initialize Git repository: ${error.message}`,
        );
      }
    } else {
      // Remove .git folder if it exists
      const gitFolder = path.join(projectPath, ".git");
      if (fs.existsSync(gitFolder)) {
        fs.rmSync(gitFolder, { recursive: true, force: true });
      }
    }
    // Open the project with the selected IDE
    try {
      if (selectedIDE !== "None") {
        console.log(`\nOpening project with ${selectedIDE}...`);
        try {
          let ideCommand = "";
          switch (selectedIDE) {
            case "Zed":
              ideCommand = "zed .";
              break;
            case "VSCode":
              ideCommand = "code .";
              break;
            case "Cursor":
              ideCommand = "cursor .";
              break;
            case "Trae":
              ideCommand = "trae .";
              break;
          }
          if (ideCommand) {
            runCommand(ideCommand, { stdio: "inherit" });
            console.log(`✅ Project opened with ${selectedIDE}.`);
          }
        } catch (error) {
          console.error(
            `❌ Failed to open project with ${selectedIDE}: ${error.message}`,
          );
          console.log(
            `To open manually, run: 'cd ${projectName}' and then the appropriate IDE command.`,
          );
        }
      }
    } catch (error) {
      console.error("Error during IDE launch:", error.message);
    }

    // Run dev server if selected
    if (runDevServer) {
      try {
        console.log(`\nStarting development server with ${pm.name}...`);
        // Change to project directory
        process.chdir(projectPath);
        // Run the dev server command
        runCommand(`${pm.name} run dev`, { stdio: "inherit" });
      } catch (error) {
        console.error(
          `❌ Failed to start development server: ${error.message}`,
        );
        console.log(
          `You can manually start it by running '${pm.name} run dev' in your project directory.`,
        );
      }
    }

    console.log("\n✨ Project setup complete! ✨");
  } catch (error) {
    console.error(
      "\n❌ An error occurred during project setup:",
      error.message,
    );
    console.error("Please try again or report this issue.");
    process.exit(1);
  }
}

run().catch((error) => {
  console.error("\n❌ An unexpected error occurred:", error.message);
  console.error("Please try again or report this issue.");
  process.exit(1);
});
