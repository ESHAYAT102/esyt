#!/usr/bin/env node
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function printTitle() {
  console.log(`ESYT CLI`);
}

async function run() {
  try {
    printTitle();

    const projectInfo = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What will your project be called?",
        default: "esyt-app",
      },
      {
        type: "list",
        name: "language",
        message: "Will you be using JavaScript or TypeScript?",
        choices: ["JavaScript", "TypeScript"],
      },
      {
        type: "checkbox",
        name: "packages",
        message: "Which packages would you like to enable?",
        choices: [
          "TailwindCSS",
          "React Router",
          "Framer Motion",
          "OGL",
          "MongoDB",
          "Firebase",
          "Clerk",
          "Appwrite",
          "Prisma",
        ],
        default: [],
      },
      {
        type: "confirm",
        name: "gitInit",
        message: "Initialize a new git repository?",
        default: true,
      },
      {
        type: "confirm",
        name: "installDeps",
        message: "Would you like us to run 'npm i'?",
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

    if (projectInfo.installDeps) {
      const devServerPrompt = await inquirer.prompt([
        {
          type: "confirm",
          name: "runDevServer",
          message:
            "Would you like to run the development server automatically after setup?",
          default: true,
        },
      ]);
      projectInfo.runDevServer = devServerPrompt.runDevServer;
    } else {
      projectInfo.runDevServer = false;
    }

    console.log(`Good choice! Using ${projectInfo.language}!`);

    const projectName = projectInfo.projectName;
    const projectPath = path.join(process.cwd(), projectName);

    console.log("Running: npm create vite@latest");
    let viteCommand = `npm create vite@latest ${projectName} -- --template `;
    viteCommand += projectInfo.language === "JavaScript" ? "react" : "react-ts";

    execSync(viteCommand, { stdio: "inherit" });

    console.log("Vite project created with the specified template.");

    process.chdir(projectPath);
    console.log(`Changed directory to: ${projectName}`);

    try {
      if (projectInfo.installDeps) {
        console.log("Installing initial dependencies...");
        execSync("npm i", { stdio: "inherit" });
      } else {
        console.log("Skipping initial dependencies installation as requested.");
      }
    } catch (error) {
      console.error("Error during initial setup:", error.message);
    }

    console.log("\nCleaning up unnecessary files...");
    try {
      const filesToRemove = [
        {
          path: path.join(projectPath, "src", "assets"),
          isDir: true,
          name: "assets folder",
        },
        {
          path: path.join(projectPath, "README.md"),
          isDir: false,
          name: "README.md file",
        },
        {
          path: path.join(projectPath, "public", "vite.svg"),
          isDir: false,
          name: "vite.svg from public folder",
        },
        {
          path: path.join(projectPath, "src", "App.css"),
          isDir: false,
          name: "App.css file",
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
            console.log(`Removed ${file.name}.`);
          } catch (error) {
            console.warn(`Failed to remove ${file.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error.message);
    }

    console.log("\nUpdating template files...");
    try {
      const appJsxPath = path.join(
        projectPath,
        "src",
        `App.${projectInfo.language === "JavaScript" ? "jsx" : "tsx"}`
      );
      if (fs.existsSync(appJsxPath)) {
        try {
          fs.writeFileSync(
            appJsxPath,
            `export default function App() {
  return (
    <>
      <h1>ESYT</h1>
    </>
  );
}
`
          );
          console.log("Updated App component with clean template.");
        } catch (error) {
          console.error(`Failed to update App component: ${error.message}`);
        }
      } else {
        console.warn(`App component file not found at ${appJsxPath}`);
      }

      const indexHtmlPath = path.join(projectPath, "index.html");
      if (fs.existsSync(indexHtmlPath)) {
        try {
          fs.writeFileSync(
            indexHtmlPath,
            `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="./src/index.css" />
    <title>ESYT App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${
      projectInfo.language === "JavaScript" ? "jsx" : "tsx"
    }"></script>
  </body>
</html>
`
          );
          console.log("Updated index.html with clean template.");
        } catch (error) {
          console.error(`Failed to update index.html: ${error.message}`);
        }
      } else {
        console.warn(`index.html not found at ${indexHtmlPath}`);
      }
    } catch (error) {
      console.error("Error updating template files:", error.message);
    }

    if (projectInfo.installDeps) {
      console.log("\nInstalling selected packages...");
      try {
        if (projectInfo.packages.includes("Clerk")) {
          console.log("\nAdding Clerk...");
          try {
            execSync("npm i @clerk/clerk-react --save", { stdio: "inherit" });
            console.log("✅ Clerk installed.");
          } catch (error) {
            console.error(`❌ Failed to install Clerk: ${error.message}`);
          }
        }

        if (projectInfo.packages.includes("Appwrite")) {
          console.log("\nAdding Appwrite...");
          try {
            execSync("npm i appwrite", { stdio: "inherit" });
            console.log("✅ Appwrite installed.");
          } catch (error) {
            console.error(`❌ Failed to install Appwrite: ${error.message}`);
          }
        }

        if (projectInfo.packages.includes("Prisma")) {
          console.log("\nAdding Prisma...");
          try {
            execSync("npm i prisma --save-dev", { stdio: "inherit" });
            execSync("npm i @prisma/client", { stdio: "inherit" });
            execSync(
              "npx prisma@latest init --datasource-provider postgresql",
              {
                stdio: "inherit",
              }
            );
            console.log("✅ Prisma initialized.");
          } catch (error) {
            console.error(`❌ Failed to install Prisma: ${error.message}`);
          }
        }

        if (projectInfo.packages.includes("Framer Motion")) {
          console.log("\nAdding Framer Motion...");
          try {
            execSync("npm i framer-motion", { stdio: "inherit" });
            console.log("✅ Framer Motion installed.");
          } catch (error) {
            console.error(
              `❌ Failed to install Framer Motion: ${error.message}`
            );
          }
        }

        if (projectInfo.packages.includes("React Router")) {
          console.log("\nAdding React Router...");
          try {
            execSync("npm i react-router-dom", { stdio: "inherit" });
            console.log("✅ React Router installed.");

            // Update main entry file with React Router configuration
            const mainFilePath = path.join(
              projectPath,
              "src",
              `main.${projectInfo.language === "JavaScript" ? "jsx" : "tsx"}`
            );
            if (fs.existsSync(mainFilePath)) {
              fs.writeFileSync(
                mainFilePath,
                `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App${
                  projectInfo.language === "JavaScript" ? ".jsx" : ".tsx"
                }";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </StrictMode>
);
`
              );
              console.log(
                "✅ Updated main entry file with React Router configuration."
              );
            } else {
              console.warn(`Main entry file not found at ${mainFilePath}`);
            }
          } catch (error) {
            console.error(
              `❌ Failed to install React Router: ${error.message}`
            );
          }
        }

        if (projectInfo.packages.includes("OGL")) {
          console.log("\nAdding OGL (WebGL Framework)...");
          try {
            execSync("npm i ogl", { stdio: "inherit" });
            console.log("✅ OGL installed.");
          } catch (error) {
            console.error(`❌ Failed to install OGL: ${error.message}`);
          }
        }

        if (projectInfo.packages.includes("Firebase")) {
          console.log("\nAdding Firebase...");
          try {
            execSync("npm i firebase", { stdio: "inherit" });
            console.log("✅ Firebase installed.");
          } catch (error) {
            console.error(`❌ Failed to install Firebase: ${error.message}`);
          }
        }

        if (projectInfo.packages.includes("MongoDB")) {
          console.log("\nAdding MongoDB...");
          try {
            execSync("npm i mongodb", { stdio: "inherit" });
            console.log("✅ MongoDB installed.");
          } catch (error) {
            console.error(`❌ Failed to install MongoDB: ${error.message}`);
          }
        }

        if (projectInfo.packages.includes("TailwindCSS")) {
          console.log("\nAdding Tailwind CSS...");
          try {
            execSync("npm install tailwindcss @tailwindcss/vite", {
              stdio: "inherit",
            });

            const indexCssPath = path.join(projectPath, "src", "index.css");
            if (fs.existsSync(indexCssPath)) {
              fs.writeFileSync(indexCssPath, `@import "tailwindcss";\n`);
              console.log("✅ Updated index.css with Tailwind directives.");
            } else {
              console.warn(`index.css not found at ${indexCssPath}`);
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
                console.log(
                  "✅ Created tailwind.config.js with proper configuration."
                );
              } else {
                console.log(
                  "✅ tailwind.config.js already exists, skipping creation."
                );
              }
            } catch (error) {
              console.error(
                `❌ Failed to create tailwind.config.js: ${error.message}`
              );
            }

            const viteConfigPath = path.join(projectPath, "vite.config.js");
            if (fs.existsSync(viteConfigPath)) {
              fs.writeFileSync(
                viteConfigPath,
                `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n});\n`
              );
              console.log(
                "✅ Updated vite.config.js with TailwindCSS configuration."
              );
            } else {
              console.warn(`vite.config.js not found at ${viteConfigPath}`);
            }

            console.log("✅ Tailwind CSS installed and configured.");
          } catch (error) {
            console.error(
              `❌ Failed to install Tailwind CSS: ${error.message}`
            );
          }
        }
      } catch (error) {
        console.error("Error installing packages:", error.message);
      }
    } else {
      console.log(
        "\nSkipping package installations as npm install was not selected."
      );
      console.log(
        "You will need to run 'npm install' manually before installing any packages."
      );
    }

    if (projectInfo.gitInit) {
      console.log("\nInitializing Git repository...");
      try {
        execSync("git init", { stdio: "inherit" });

        const gitignorePath = path.join(projectPath, ".gitignore");
        if (!fs.existsSync(gitignorePath)) {
          fs.writeFileSync(
            gitignorePath,
            `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencies
node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
`
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
      console.log("\nSkipping Git repository initialization as requested.");
    }

    // Open the project with the selected IDE
    try {
      if (projectInfo.selectedIDE !== "None") {
        console.log(`\nOpening project with ${projectInfo.selectedIDE}...`);
        try {
          let ideCommand = "";
          switch (projectInfo.selectedIDE) {
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
            console.log(`✅ Project opened with ${projectInfo.selectedIDE}.`);
          }
        } catch (error) {
          console.error(
            `❌ Failed to open project with ${projectInfo.selectedIDE}: ${error.message}`
          );
          console.log(
            `To open manually, run: 'cd ${projectName}' and then the appropriate IDE command.`
          );
        }
      } else {
        console.log("Skipping IDE launch as requested.");
      }
    } catch (error) {
      console.error("Error during IDE launch:", error.message);
    }

    console.log("\n✨ Project setup complete! ✨");

    if (projectInfo.runDevServer) {
      console.log("\nStarting development server...");
      try {
        execSync("npm run dev", { stdio: "inherit" });
      } catch (error) {
        console.error(
          `❌ Failed to start development server: ${error.message}`
        );
        console.log(
          `To start manually, run: 'cd ${projectName}' and 'npm run dev'`
        );
      }
    } else {
      console.log(
        `\nTo start your project, run: 'cd ${projectName}' and 'npm run dev'`
      );
    }
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
