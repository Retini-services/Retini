import { PUBLIC_DEV_MODE } from "$env/static/public";
import { toast } from "$lib/utils/toast";
import staticFilesData from "./static-files.json";

export interface FileNode {
	name: string;
	path: string;
	type: "file" | "folder";
	children?: FileNode[];
	expanded?: boolean;
}

const initialTree = Array.isArray(staticFilesData) && staticFilesData.length > 0
	? staticFilesData
	: [
		{
			name: "root (/)",
			path: "/",
			type: "folder",
			expanded: true,
			children: [{ name: "Overview Page", path: "/", type: "file" }]
		}
	];

class DevToolsState {
	isOpen = $state(false);
	activeTab = $state<"general" | "storage" | "static" | "inject">("general");

	isEnvDev = PUBLIC_DEV_MODE === "true";
	isDevMode = $state(
		typeof window !== "undefined"
			? (PUBLIC_DEV_MODE === "true" || localStorage.getItem("is_dev_mode") === "true")
			: true
	);

	customDuration = $state("180 days");
	localStorageItems = $state<{ key: string; value: string }[]>([]);
	scriptInput = $state("");

	isPreviewOpen = $state(false);
	previewUrl = $state("/");
	windowPos = $state({ x: 420, y: 100 });
	isDragging = $state(false);
	dragOffset = { x: 0, y: 0 };

	fileTree = $state<FileNode[]>(initialTree as FileNode[]);

	constructor() {
		if (typeof window !== "undefined") {
			const storedMode = localStorage.getItem("is_dev_mode");
			this.isDevMode = this.isEnvDev || storedMode === "true";
			this.customDuration = localStorage.getItem("remember_duration") || "180 days";
			this.refreshStorage();
		}
	}

	togglePanel = () => {
		this.isOpen = !this.isOpen;
		if (this.isOpen) this.refreshStorage();
	};

	openPreview = (url: string) => {
		this.previewUrl = url;
		this.isPreviewOpen = true;
	};

	closePreview = () => {
		this.isPreviewOpen = false;
	};

	toggleFolder = (node: FileNode) => {
		node.expanded = !node.expanded;
	};

	startDrag = (e: MouseEvent) => {
		e.preventDefault();
		this.isDragging = true;
		this.dragOffset = {
			x: e.clientX - this.windowPos.x,
			y: e.clientY - this.windowPos.y
		};
		window.addEventListener("mousemove", this.onDrag);
		window.addEventListener("mouseup", this.stopDrag);
	};

	onDrag = (e: MouseEvent) => {
		if (!this.isDragging) return;
		this.windowPos = {
			x: e.clientX - this.dragOffset.x,
			y: e.clientY - this.dragOffset.y
		};
	};

	stopDrag = () => {
		this.isDragging = false;
		window.removeEventListener("mousemove", this.onDrag);
		window.removeEventListener("mouseup", this.stopDrag);
	};

	toggleDevMode = () => {
		if (this.isEnvDev) {
			toast.info("Environment Locks Dev Mode", "Dev Mode is enabled in .env.local (run 'bun run toggle-dev' to disable server-wide).");
			return;
		}

		this.isDevMode = !this.isDevMode;
		localStorage.setItem("is_dev_mode", String(this.isDevMode));

		if (this.isDevMode) {
			localStorage.setItem("remember_duration_backup", localStorage.getItem("remember_duration") || "1 day");
			localStorage.setItem("remember_duration", this.customDuration);
			toast.info("Dev Mode Activated", "your in dev mode do whatever you want twin");
		} else {
			const backup = localStorage.getItem("remember_duration_backup") || "1 day";
			localStorage.setItem("remember_duration", backup);
			localStorage.removeItem("remember_duration_backup");
			toast.warning("Dev Mode Deactivated", `Remembrance restored to ${backup}.`);
		}
		this.refreshStorage();
	};

	toggleUnlimitedRemembrance = () => {
		if (this.customDuration === "Forever") {
			const backup = localStorage.getItem("remember_duration_backup") || "180 days";
			this.customDuration = backup;
			localStorage.setItem("remember_duration", backup);
			toast.info("Standard Remembrance", `Duration reset to ${backup}.`);
		} else {
			localStorage.setItem("remember_duration_backup", this.customDuration);
			this.customDuration = "Forever";
			localStorage.setItem("remember_duration", "Forever");
			toast.success("Unlimited Remembrance", "Remembrance set to never expire!");
		}
		this.refreshStorage();
	};

	removeRemembrance = () => {
		localStorage.removeItem("remember_duration");
		localStorage.removeItem("remember_duration_backup");
		this.customDuration = "";
		toast.warning("Remembrance Removed", "Duration setting cleared.");
		this.refreshStorage();
	};

	applyCustomRemembrance = () => {
		localStorage.setItem("remember_duration", this.customDuration);
		toast.success("Remembrance Updated", `Set duration to: ${this.customDuration}`);
		this.refreshStorage();
	};

	refreshStorage = () => {
		if (typeof window === "undefined") return;
		const items: { key: string; value: string }[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key) {
				items.push({ key, value: localStorage.getItem(key) || "" });
			}
		}
		this.localStorageItems = items;
	};

	updateStorageItem = (key: string, newValue: string) => {
		localStorage.setItem(key, newValue);
		toast.success("Storage Saved", `Updated key "${key}".`);
	};

	clearAllStorage = () => {
		localStorage.clear();
		sessionStorage.clear();
		this.refreshStorage();
		toast.warning("Storage Cleared", "Local & Session storage wiped.");
	};

	removeStorageItem = (key: string) => {
		localStorage.removeItem(key);
		this.refreshStorage();
		toast.info("Item Removed", `Key "${key}" deleted.`);
	};

	runScript = () => {
		if (!this.scriptInput.trim()) return;
		try {
			const result = eval(this.scriptInput);
			toast.success("Script Executed", result !== undefined ? String(result) : "Executed successfully.");
		} catch (err: any) {
			toast.error("Execution Error", err.message);
		}
	};
}

export const devTools = new DevToolsState();
export const isEnvDevPublic = devTools.isEnvDev;