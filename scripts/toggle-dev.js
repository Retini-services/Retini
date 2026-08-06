import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");

let envContent = "";
if (fs.existsSync(envPath)) {
	envContent = fs.readFileSync(envPath, "utf-8");
}

const isDev = envContent.includes("PUBLIC_DEV_MODE=true");

if (isDev) {
	envContent = envContent.replace("PUBLIC_DEV_MODE=true", "PUBLIC_DEV_MODE=false");
	console.log("\x1b[33m%s\x1b[0m", "⚡ Dev Mode toggled: OFF");
} else {
	if (envContent.includes("PUBLIC_DEV_MODE=")) {
		envContent = envContent.replace("PUBLIC_DEV_MODE=false", "PUBLIC_DEV_MODE=true");
	} else {
		envContent += "\nPUBLIC_DEV_MODE=true\n";
	}
	console.log("\x1b[32m%s\x1b[0m", "⚡ Dev Mode toggled: ON");
}

fs.writeFileSync(envPath, envContent.trim());