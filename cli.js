#!/usr/bin/env node
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Function to print the title
function printTitle() {
  console.log(`
    ESYT CLI
`);
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
          "Framer Motion",
          "OGL",
          "Clerk",
          "Appwrite",
          "Prisma",
        ],
        default: ["TailwindCSS"],
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
        type: "confirm",
        name: "runDevServer",
        message:
          "Would you like to run the development server automatically after setup?",
        default: true,
      },
    ]);

    console.log(`Good choice! Using ${projectInfo.language}!`);

    const projectName = projectInfo.projectName;
    const projectPath = path.join(process.cwd(), projectName);

    // Step 1: Run npm create vite@latest with the correct template
    console.log("Running: npm create vite@latest");
    let viteCommand = `npm create vite@latest ${projectName} -- --template `;
    viteCommand += projectInfo.language === "JavaScript" ? "react" : "react-ts";

    execSync(viteCommand, { stdio: "inherit" });

    // Step 2 & 3: Vite project is created with the specified template
    console.log("Vite project created with the specified template.");

    // Step 4: Navigate to the directory
    process.chdir(projectPath);
    console.log(`Changed directory to: ${projectName}`);

    // Step 5: Install initial dependencies if requested
    try {
      if (projectInfo.installDeps) {
        console.log("Installing initial dependencies...");
        execSync("npm i", { stdio: "inherit" });
      } else {
        console.log("Skipping initial dependencies installation as requested.");
      }

      // Step 6: Install and configure selected packages
      // Only install additional packages if dependencies installation was requested
      if (
        projectInfo.installDeps &&
        projectInfo.packages.includes("TailwindCSS")
      ) {
        console.log("Adding TailwindCSS...");
        execSync("npm install tailwindcss @tailwindcss/vite", {
          stdio: "inherit",
        });
        execSync("npx tailwindcss init", { stdio: "inherit" });

        // Basic Tailwind CSS configuration
        try {
          // TailwindCSS init already created the config file, but we'll ensure it has the right content
          const tailwindConfigPath = path.join(
            projectPath,
            "tailwind.config.js"
          );
          if (fs.existsSync(tailwindConfigPath)) {
            console.log("Using existing tailwind.config.js file.");
          } else {
            console.warn("tailwind.config.js not found. Creating it manually.");
            fs.writeFileSync(
              tailwindConfigPath,
              `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
`
            );
            console.log("Created tailwind.config.js file.");
          }

          // Update vite.config.js file if needed
          const viteConfigPath = path.join(projectPath, "vite.config.js");
          if (fs.existsSync(viteConfigPath)) {
            console.log("Using existing vite.config.js file.");
          } else {
            fs.writeFileSync(
              viteConfigPath,
              `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`
            );
            console.log("Created vite.config.js file.");
          }

          // Update src/index.css to include Tailwind directives
          const cssPath = path.join(projectPath, "src", "index.css");
          if (fs.existsSync(cssPath)) {
            fs.writeFileSync(cssPath, `@import "tailwindcss";`);
            console.log("Updated index.css with Tailwind directives.");
          } else {
            console.warn(
              "Could not find src/index.css to add Tailwind directives."
            );
          }

          console.log("TailwindCSS setup complete with clean template.");
        } catch (error) {
          console.error("Error setting up TailwindCSS:", error.message);
        }
      }
    } catch (error) {
      console.error("Error during initial setup:", error.message);
    }

    // Delete unnecessary files
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

    // Update App.jsx/tsx with clean template
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Your ESYT App</h1>
        <p className="text-gray-600">Start building something amazing!</p>
      </div>
    </div>
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

      // Update index.html with clean template
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

    // Install additional packages if requested
    if (projectInfo.installDeps) {
      console.log("\nInstalling selected packages...");
      try {
        // Install Clerk if selected
        if (projectInfo.packages.includes("Clerk")) {
          console.log("\nAdding Clerk...");
          try {
            execSync("npm i @clerk/clerk-react --save", { stdio: "inherit" });
            console.log("✅ Clerk installed.");
          } catch (error) {
            console.error(`❌ Failed to install Clerk: ${error.message}`);
          }
        }

        // Install Appwrite if selected
        if (projectInfo.packages.includes("Appwrite")) {
          console.log("\nAdding Appwrite...");
          try {
            execSync("npm i appwrite", { stdio: "inherit" });
            console.log("✅ Appwrite installed.");
          } catch (error) {
            console.error(`❌ Failed to install Appwrite: ${error.message}`);
          }
        }

        // Install Prisma if selected
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

        // Install Framer Motion if selected
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

        // Install OGL if selected
        if (projectInfo.packages.includes("OGL")) {
          console.log("\nAdding OGL (WebGL Framework)...");
          try {
            execSync("npm i ogl", { stdio: "inherit" });
            console.log("✅ OGL installed.");
          } catch (error) {
            console.error(`❌ Failed to install OGL: ${error.message}`);
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

    // Step 7: Initialize Git repository (moved to the end before starting dev server)
    if (projectInfo.gitInit) {
      console.log("\nInitializing Git repository...");
      try {
        execSync("git init", { stdio: "inherit" });

        // Create a basic .gitignore file if it doesn't exist
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

    console.log("\n✨ Project setup complete! ✨");

    // Run development server if requested
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
