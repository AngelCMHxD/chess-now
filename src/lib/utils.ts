import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatMiliseconds(ms: string | number): string {
	const totalSeconds = parseInt(ms.toString(), 10) / 1000;

	if (Number.isNaN(totalSeconds)) return "00:00:00";

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);

	return hours > 0
		? `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
		: minutes > 0
			? `${minutes}m ${String(seconds).padStart(2, "0")}s`
			: `${seconds}s`;
}
