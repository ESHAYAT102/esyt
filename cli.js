#!/usr/bin/env node
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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

async function run() {
  try {
    printTitle();
    const pm = detectPackageManager();

    // 1. Framework selection prompt
    const { framework } = await inquirer.prompt([
      {
        type: "list",
        name: "framework",
        message: "Which framework would you like to use?",
        choices: ["Vite", "Next.js"],
      },
    ]);

    // 2. Language selection prompt
    const { language } = await inquirer.prompt([
      {
        type: "list",
        name: "language",
        message: "Will you be using JavaScript or TypeScript?",
        choices: ["JavaScript", "TypeScript"],
      },
    ]);

    // 3. Project name prompt
    const { projectName } = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What will your project be called?",
        default: "esyt-app",
        validate: (input) => {
          if (/\s/.test(input)) {
            return "Project name cannot contain spaces. Please use dashes or underscores.";
          }
          return true;
        },
      },
    ]);

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
    const { packages } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "packages",
        message: "Which packages would you like to enable?",
        choices: packageChoices,
        default: [],
      },
    ]);

    // 5. Git init, npm i, dev server, IDE selection prompts
    const { gitInit, installDeps, selectedIDE } = await inquirer.prompt([
      {
        type: "confirm",
        name: "gitInit",
        message: "Initialize a new git repository?",
        default: true,
      },
      {
        type: "confirm",
        name: "installDeps",
        message: `Would you like us to run '${pm.installCmd}'?`,
        default: true,
      },
      {
        type: "list",
        name: "selectedIDE",
        message: "Which IDE would you like to open your project with?",
        choices: ["VSCode", "Cursor", "Trae", "None"],
        default: "None",
      },
    ]);

    let runDevServer = false;
    if (installDeps) {
      const devServerPrompt = await inquirer.prompt([
        {
          type: "confirm",
          name: "runDevServer",
          message:
            "Would you like to run the development server automatically after setup?",
          default: true,
        },
      ]);
      runDevServer = devServerPrompt.runDevServer;
    }

    const projectPath = path.join(process.cwd(), projectName);

    // --- Framework-specific project creation ---
    if (framework === "Vite") {
      const template = language === "JavaScript" ? "react" : "react-ts";
      const viteCommand = pm.createViteCmd(projectName, template);
      console.log(`Running: ${viteCommand}`);
      execSync(viteCommand, { stdio: "inherit" });

      process.chdir(projectPath);

      try {
        if (installDeps) {
          execSync(pm.installCmd, { stdio: "inherit" });
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
            } catch (error) {}
          }
        }
      } catch (error) {}

      try {
        const componentsDir = path.join(projectPath, "src", "components");
        if (!fs.existsSync(componentsDir)) {
          fs.mkdirSync(componentsDir);
        }
        const navbarPath = path.join(
          componentsDir,
          `Navbar.${language === "JavaScript" ? "jsx" : "tsx"}`
        );
        fs.writeFileSync(
          navbarPath,
          `export default function Navbar() {\n  return (\n    <>\n      <h1>Navbar</h1>\n    </>\n  )\n}`
        );
        const footerPath = path.join(
          componentsDir,
          `Footer.${language === "JavaScript" ? "jsx" : "tsx"}`
        );
        fs.writeFileSync(
          footerPath,
          `export default function Footer() {\n  return (\n    <>\n      <h1>Footer</h1>\n    </>\n  )\n}`
        );
      } catch (error) {}

      // Create routes directory and Routes file if React Router is selected
      if (packages.includes("React Router")) {
        try {
          const routesDir = path.join(projectPath, "src", "routes");
          if (!fs.existsSync(routesDir)) {
            fs.mkdirSync(routesDir);
          }
          const routesPath = path.join(
            routesDir,
            `Routes.${language === "JavaScript" ? "jsx" : "tsx"}`
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
]);`
          );
        } catch (error) {}
      }

      try {
        const appJsxPath = path.join(
          projectPath,
          "src",
          `App.${language === "JavaScript" ? "jsx" : "tsx"}`
        );
        if (fs.existsSync(appJsxPath)) {
          try {
            const appContent = packages.includes("React Router")
              ? `import { RouterProvider } from "react-router-dom";\nimport { router } from "./routes/Routes${
                  language === "JavaScript" ? ".jsx" : ".tsx"
                }";\n\nfunction App() {\n  return (\n    <>\n      <RouterProvider router={router} />\n    </>\n  );\n}\n\nexport default App;`
              : `import Navbar from "./components/Navbar";\nimport Home from "./pages/Home";\nimport Footer from "./components/Footer";\n\nexport default function App() {\n  return (\n    <>\n      <Navbar/>\n      <Footer/>\n    </>\n  );\n}`;
            fs.writeFileSync(appJsxPath, appContent);
          } catch (error) {}
        }
        const indexHtmlPath = path.join(projectPath, "index.html");
        if (fs.existsSync(indexHtmlPath)) {
          try {
            fs.writeFileSync(
              indexHtmlPath,
              `<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <link rel=\"stylesheet\" href=\"./src/index.css\" />\n    <title>ESYT App</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.${
                language === "JavaScript" ? "jsx" : "tsx"
              }\"></script>\n  </body>\n</html>\n`
            );
          } catch (error) {}
        }
      } catch (error) {}

      if (installDeps) {
        try {
          if (packages.includes("Clerk")) {
            try {
              execSync(`${pm.addCmd} @clerk/clerk-react`, { stdio: "inherit" });
            } catch (error) {}
          }
          if (packages.includes("Appwrite")) {
            try {
              execSync(`${pm.addCmd} appwrite`, { stdio: "inherit" });
            } catch (error) {}
          }
          if (packages.includes("Prisma")) {
            try {
              execSync(`${pm.addDevCmd} prisma`, { stdio: "inherit" });
              execSync(`${pm.addCmd} @prisma/client`, { stdio: "inherit" });
              execSync(
                `${pm.dlxCmd} prisma@latest init --datasource-provider postgresql`,
                { stdio: "inherit" }
              );
            } catch (error) {}
          }
          if (packages.includes("React Icons")) {
            try {
              execSync(`${pm.addCmd} react-icons`, { stdio: "inherit" });
            } catch (error) {}
          }
          if (packages.includes("Framer Motion")) {
            try {
              execSync(`${pm.addCmd} framer-motion motion`, {
                stdio: "inherit",
              });
            } catch (error) {}
          }
          if (packages.includes("React Router")) {
            try {
              execSync(`${pm.addCmd} react-router-dom`, { stdio: "inherit" });
            } catch (error) {}
          }
          if (packages.includes("OGL")) {
            try {
              execSync(`${pm.addCmd} ogl`, { stdio: "inherit" });
            } catch (error) {}
          }
          if (packages.includes("Firebase")) {
            try {
              execSync(`${pm.addCmd} firebase`, { stdio: "inherit" });
              const firebaseDir = path.join(projectPath, "src", "firebase");
              if (!fs.existsSync(firebaseDir)) {
                fs.mkdirSync(firebaseDir, { recursive: true });
              }
              const firebaseConfigPath = path.join(
                firebaseDir,
                "firebase.config.js"
              );
              fs.writeFileSync(
                firebaseConfigPath,
                `import { initializeApp } from "firebase/app";\nimport { getAuth } from "firebase/auth";\n\nconst firebaseConfig = {\n  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,\n  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,\n  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,\n  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,\n  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,\n  appId: import.meta.env.VITE_FIREBASE_APP_ID,\n};\n\nconst app = initializeApp(firebaseConfig);\nexport const auth = getAuth(app);`
              );
              const envPath = path.join(projectPath, ".env");
              fs.writeFileSync(
                envPath,
                `VITE_FIREBASE_API_KEY=\nVITE_FIREBASE_AUTH_DOMAIN=\nVITE_FIREBASE_PROJECT_ID=\nVITE_FIREBASE_STORAGE_BUCKET=\nVITE_FIREBASE_APP_ID=\nVITE_SERVER_URL=`
              );
            } catch (error) {}
          }
          if (packages.includes("DotENV")) {
            try {
              execSync(`${pm.addCmd} dotenv`, { stdio: "inherit" });
            } catch (error) {}
          }
          if (packages.includes("Axios")) {
            try {
              execSync(`${pm.addCmd} axios`, { stdio: "inherit" });
            } catch (error) {}
          }
          if (packages.includes("TailwindCSS")) {
            try {
              execSync(`${pm.addCmd} tailwindcss @tailwindcss/vite`, {
                stdio: "inherit",
              });
              const indexCssPath = path.join(projectPath, "src", "index.css");
              if (fs.existsSync(indexCssPath)) {
                fs.writeFileSync(indexCssPath, `@import "tailwindcss";\n`);
              }
              const tailwindConfigPath = path.join(
                projectPath,
                "tailwind.config.js"
              );
              try {
                if (!fs.existsSync(tailwindConfigPath)) {
                  fs.writeFileSync(
                    tailwindConfigPath,
                    `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n};\n`
                  );
                }
              } catch (error) {}
              const viteConfigPath = path.join(projectPath, "vite.config.js");
              if (fs.existsSync(viteConfigPath)) {
                fs.writeFileSync(
                  viteConfigPath,
                  `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n});\n`
                );
              }
            } catch (error) {}
          }
        } catch (error) {}
      }
      try {
        const pagesDir = path.join(projectPath, "src", "pages");
        if (!fs.existsSync(pagesDir)) {
          fs.mkdirSync(pagesDir);
        }
        const homePath = path.join(
          pagesDir,
          `Home.${language === "JavaScript" ? "jsx" : "tsx"}`
        );
        fs.writeFileSync(
          homePath,
          `export default function Home() {\n  return (\n    <>\n      <h1>Home</h1>\n    </>\n  )\n}`
        );
      } catch (error) {}
    } else if (framework === "Next.js") {
      // --- Next.js extra options prompt ---
      const nextOptions = await inquirer.prompt([
        {
          type: "confirm",
          name: "eslint",
          message: "Would you like to use ESLint?",
          default: true,
        },
        {
          type: "confirm",
          name: "srcDir",
          message: "Would you like your code inside a 'src/' directory?",
          default: false,
        },
        {
          type: "confirm",
          name: "appRouter",
          message: "Would you like to use App Router? (recommended)",
          default: true,
        },
        {
          type: "confirm",
          name: "turbo",
          message: "Would you like to use Turbopack for 'next dev'?",
          default: true,
        },
      ]);
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
        nextFlagsParts.join(" ")
      );
      console.log(`Running: ${nextCommand}`);
      execSync(nextCommand, { stdio: "inherit" });
      console.log("Next.js project created.");
      process.chdir(projectPath);
      // Cleanup: Remove README.md for Next.js projects (to match Vite cleanup)
      try {
        const readmePath = path.join(projectPath, "README.md");
        if (fs.existsSync(readmePath)) {
          fs.unlinkSync(readmePath);
        }
      } catch (error) {}
      console.log(`Changed directory to: ${projectName}`);
      try {
        if (installDeps) {
          console.log("Installing initial dependencies...");
          execSync(pm.installCmd, { stdio: "inherit" });
        } else {
          console.log(
            "Skipping initial dependencies installation as requested."
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
          `export default function Navbar() {\n  return (\n    <nav className="p-16 border-b border-slate-200">\n      <h1>Navbar</h1>\n    </nav>\n  )\n}`
        );
        const footerPath = path.join(componentsDir, `Footer.${ext}`);
        fs.writeFileSync(
          footerPath,
          `export default function Footer() {\n  return (\n    <footer className="p-16 border-t border-slate-200">\n      <h1>Footer</h1>\n    </footer>\n  )\n}`
        );
        console.log(
          "Created Navbar and Footer components inside app/components."
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
          `hello.${language === "JavaScript" ? "js" : "ts"}`
        );
        fs.writeFileSync(
          apiFile,
          language === "JavaScript"
            ? `export default function handler(req, res) {\n  res.status(200).json({ message: 'Hello from Next.js API!' });\n}`
            : `import { NextApiRequest, NextApiResponse } from 'next';\nexport default function handler(req: NextApiRequest, res: NextApiResponse) {\n  res.status(200).json({ message: 'Hello from Next.js API!' });\n}`
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
          `export default function Home() {\n  return (\n    <div>\n      <h1>ESYT</h1>\n    </div>\n  );\n}`
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
                  { stdio: "inherit" }
                );
                // Write postcss.config.mjs
                const postcssConfigPath = path.join(
                  projectPath,
                  "postcss.config.mjs"
                );
                fs.writeFileSync(
                  postcssConfigPath,
                  'const config = {  plugins: {    "@tailwindcss/postcss": {},  },};\nexport default config;'
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
                execSync(`${pm.addCmd} react-icons`, { stdio: "inherit" });
                break;
              case "Framer Motion":
                execSync(`${pm.addCmd} framer-motion`, { stdio: "inherit" });
                break;
              case "DotENV":
                execSync(`${pm.addCmd} dotenv`, { stdio: "inherit" });
                break;
              case "Axios":
                execSync(`${pm.addCmd} axios`, { stdio: "inherit" });
                break;
              case "Firebase":
                execSync(`${pm.addCmd} firebase`, { stdio: "inherit" });
                break;
              case "Clerk":
                execSync(`${pm.addCmd} @clerk/nextjs`, { stdio: "inherit" });
                break;
              case "Appwrite":
                execSync(`${pm.addCmd} appwrite`, { stdio: "inherit" });
                break;
              case "Prisma":
                execSync(`${pm.addDevCmd} prisma`, { stdio: "inherit" });
                execSync(`${pm.addCmd} @prisma/client`, { stdio: "inherit" });
                execSync(
                  `${pm.dlxCmd} prisma@latest init --datasource-provider postgresql`,
                  { stdio: "inherit" }
                );
                break;
              case "next-auth":
                execSync(`${pm.addCmd} next-auth`, { stdio: "inherit" });
                break;
              case "@next/font":
                execSync(`${pm.addCmd} @next/font`, { stdio: "inherit" });
                break;
              case "next-seo":
                execSync(`${pm.addCmd} next-seo`, { stdio: "inherit" });
                break;
              case "next-sitemap":
                execSync(`${pm.addCmd} next-sitemap`, { stdio: "inherit" });
                break;
              case "next-pwa":
                execSync(`${pm.addCmd} next-pwa`, { stdio: "inherit" });
                break;
            }
            console.log(`✅ ${pkg} installed.`);
          } catch (error) {
            console.error(`❌ Failed to install ${pkg}: ${error.message}`);
          }
        }
      }
    }
    // --- End framework-specific logic ---

    // --- Git init, IDE, dev server, etc. (shared) ---
    if (gitInit) {
      try {
        console.log("\nInitializing Git repository...");
        execSync("git init", { stdio: "inherit" });
        const gitignorePath = path.join(projectPath, ".gitignore");
        if (!fs.existsSync(gitignorePath)) {
          fs.writeFileSync(
            gitignorePath,
            `# Logs\nlogs\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\npnpm-debug.log*\nlerna-debug.log*\n\n# Dependencies\nnode_modules\n*.local\n\n# Editor directories and files\n.vscode/*\n!.vscode/extensions.json\n.idea\n.DS_Store\n*.suo\n*.ntvs*\n*.njsproj\n*.sln\n*.sw?\n\n# Environment variables\n.env\n.env.local\n.env.development.local\n.env.test.local\n.env.production.local\n`
          );
          console.log("Created .gitignore file.");
        }
        console.log("✅ Git repository initialized.");
      } catch (error) {
        console.error(
          `❌ Failed to initialize Git repository: ${error.message}`
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
            execSync(ideCommand, { stdio: "inherit" });
            console.log(`✅ Project opened with ${selectedIDE}.`);
          }
        } catch (error) {
          console.error(
            `❌ Failed to open project with ${selectedIDE}: ${error.message}`
          );
          console.log(
            `To open manually, run: 'cd ${projectName}' and then the appropriate IDE command.`
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
        execSync(`${pm.name} run dev`, { stdio: "inherit" });
      } catch (error) {
        console.error(
          `❌ Failed to start development server: ${error.message}`
        );
        console.log(
          `You can manually start it by running '${pm.name} run dev' in your project directory.`
        );
      }
    }

    console.log("\n✨ Project setup complete! ✨");
  } catch (error) {
    console.error(
      "\n❌ An error occurred during project setup:",
      error.message
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
