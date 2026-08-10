import { toast as sonnerToast } from "svelte-sonner";
import CustomToast from "$lib/components/ui/CustomToast.svelte";

const DEFAULT_DURATION = 3000;

export const toast = {
	success: (message: string, description?: string, duration = DEFAULT_DURATION) => {
		sonnerToast.custom(CustomToast, {
			componentProps: { type: "success", message, description, duration },
			duration
		});
	},
	error: (message: string, description?: string, duration = DEFAULT_DURATION) => {
		sonnerToast.custom(CustomToast, {
			componentProps: { type: "error", message, description, duration },
			duration
		});
	},
	info: (message: string, description?: string, duration = DEFAULT_DURATION) => {
		sonnerToast.custom(CustomToast, {
			componentProps: { type: "info", message, description, duration },
			duration
		});
	},
	warning: (message: string, description?: string, duration = DEFAULT_DURATION) => {
		sonnerToast.custom(CustomToast, {
			componentProps: { type: "warning", message, description, duration },
			duration
		});
	}
};