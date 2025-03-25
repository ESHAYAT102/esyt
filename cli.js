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
      choices: ["TailwindCSS", "Framer Motion", "Clerk", "Appwrite", "Prisma"],
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
  if (projectInfo.installDeps) {
    console.log("Installing initial dependencies...");
    execSync("npm i", { stdio: "inherit" });
  }

  // Step 6: Install and configure selected packages
  if (projectInfo.packages.includes("TailwindCSS")) {
    console.log("Adding TailwindCSS...");
    execSync("npm install tailwindcss @tailwindcss/vite", { stdio: "inherit" });

    // Basic Tailwind CSS configuration
    const tailwindConfigPath = path.join(projectPath, "tailwind.config.js");
    if (!fs.existsSync(tailwindConfigPath)) {
      fs.writeFileSync(
        tailwindConfigPath,
        `/** @type {import('tailwindcss').Config} */
module.exports = {
content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
theme: {
  extend: {},
},
plugins: [],
};
`
      );
      console.log("Created tailwind.config.js file.");
    } else {
      console.log("Using existing tailwind.config.js file.");
    }

    // Create vite.config.js file with TailwindCSS configuration
    const viteConfigPath = path.join(projectPath, "vite.config.js");
    if (!fs.existsSync(viteConfigPath)) {
      fs.writeFileSync(
        viteConfigPath,
        `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";    
    
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`
      );
      console.log("Created vite.config.js file.");
    } else {
      console.log("Using existing vite.config.js file.");
    }

    // Update src/index.css to include Tailwind directives
    const cssPath = path.join(projectPath, "src", "index.css");
    if (fs.existsSync(cssPath)) {
      fs.writeFileSync(cssPath, `@import "tailwindcss";\n`);
    } else {
      console.warn("Could not find src/index.css to add Tailwind directives.");
    }

    console.log("TailwindCSS setup complete with clean template.");
  }

  // Delete unnecessary files
  const assetsPath = path.join(projectPath, "src", "assets");
  if (fs.existsSync(assetsPath)) {
    fs.rmSync(assetsPath, { recursive: true, force: true });
    console.log("Removed assets folder.");
  }

  const readmePath = path.join(projectPath, "README.md");
  if (fs.existsSync(readmePath)) {
    fs.unlinkSync(readmePath);
    console.log("Removed README.md file.");
  }

  const publicSvgPath = path.join(projectPath, "public", "vite.svg");
  if (fs.existsSync(publicSvgPath)) {
    fs.unlinkSync(publicSvgPath);
    console.log("Removed vite.svg from public folder.");
  }

  const appCssPath = path.join(projectPath, "src", "App.css");
  if (fs.existsSync(appCssPath)) {
    fs.unlinkSync(appCssPath);
    console.log("Removed App.css file.");
  }

  // Update App.jsx/tsx with clean template
  const appJsxPath = path.join(
    projectPath,
    "src",
    `App.${projectInfo.language === "JavaScript" ? "jsx" : "tsx"}`
  );
  if (fs.existsSync(appJsxPath)) {
    fs.writeFileSync(
      appJsxPath,
      `export default function App() {
  return (
    <>
      <h1>Hello</h1>
    </>
  );
}
`
    );
    console.log("Updated App component with clean template.");
  }

  // Update index.html with clean template
  const indexHtmlPath = path.join(projectPath, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    fs.writeFileSync(
      indexHtmlPath,
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="./src/index.css" />
    <title>ESYT</title>
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
  }

  if (projectInfo.packages.includes("Clerk")) {
    console.log("Adding Clerk...");
    execSync("npm i @clerk/clerk-react --save", { stdio: "inherit" });
    // You'll likely need to provide instructions on setting up Clerk API keys, etc.
    console.log(
      "Clerk installed. Please refer to the Clerk documentation for web setup instructions."
    );
  }

  if (projectInfo.packages.includes("Appwrite")) {
    console.log("Adding Appwrite...");
    execSync("npm i appwrite", { stdio: "inherit" });
    console.log(
      "Appwrite installed. Please refer to the Appwrite documentation for setup instructions."
    );
  }

  if (projectInfo.packages.includes("Prisma")) {
    console.log("Adding Prisma...");
    execSync("npm i prisma --save-dev", { stdio: "inherit" });
    execSync("npm i @prisma/client", { stdio: "inherit" });
    execSync("npx prisma@latest init --datasource-provider postgresql", {
      stdio: "inherit",
    });
    // You might want to add more Prisma setup instructions here, like editing the schema.prisma
    console.log(
      "Prisma initialized. Remember to configure your database connection in .env and run migrations."
    );
  }

  if (projectInfo.packages.includes("Framer Motion")) {
    console.log("Adding Framer Motion...");
    execSync("npm i framer-motion", { stdio: "inherit" });
    console.log(
      "Framer Motion installed. Please refer to the Framer Motion documentation for usage instructions."
    );
  }

  // Step 7: Initialize Git repository
  if (projectInfo.gitInit) {
    console.log("Initializing Git repository...");
    execSync("git init", { stdio: "inherit" });
  } else {
    console.log("Skipping Git repository initialization.");
  }

  console.log("Project setup complete!");

  // Run development server if requested
  if (projectInfo.runDevServer) {
    console.log("Starting development server...");
    execSync("npm run dev", { stdio: "inherit" });
  } else {
    console.log(`Run: 'cd ${projectName}' and 'npm run dev'`);
  }
}

run().catch((error) => {
  console.error("An error occurred:", error);
});
