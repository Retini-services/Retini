import fs from "fs";
import path from "path";

const staticDir = path.resolve(process.cwd(), "static");
const outputFile = path.resolve(process.cwd(), "src/lib/state/static-files.json");

function scanDirectory(dirPath, relativePath = "") {
	const items = fs.readdirSync(dirPath, { withFileTypes: true });
	const children = [];

	for (const item of items) {
		const itemRelativePath = `${relativePath}/${item.name}`;
		const itemFullPath = path.join(dirPath, item.name);

		if (item.isDirectory()) {
			children.push({
				name: item.name,
				path: itemRelativePath,
				type: "folder",
				expanded: true,
				children: scanDirectory(itemFullPath, itemRelativePath)
			});
		} else {
			children.push({
				name: item.name,
				path: itemRelativePath,
				type: "file"
			});
		}
	}

	return children;
}

function generateStaticTree() {
	if (!fs.existsSync(staticDir)) {
		console.log("\x1b[31m%s\x1b[0m", "⚠️  /static directory not found!");
		return;
	}

	const tree = [
		{
			name: "root (/)",
			path: "/",
			type: "folder",
			expanded: true,
			children: [
				{ name: "Overview Page", path: "/", type: "file" },
				...scanDirectory(staticDir)
			]
		}
	];

	const dir = path.dirname(outputFile);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	fs.writeFileSync(outputFile, JSON.stringify(tree, null, 2));
	console.log("\x1b[32m%s\x1b[0m", `✅ Static files successfully indexed to ${outputFile}`);
}

generateStaticTree();