"use client";

import { Button } from "@/components/ui/button";

export function BackButton() {
	return (
		<Button
			variant="default"
			size="lg"
			onClick={() => window.history.back()}
			className="w-full"
		>
			Go Back
		</Button>
	);
}
