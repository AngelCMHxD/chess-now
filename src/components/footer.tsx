import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Footer() {
	return (
		<footer className="border-t py-6">
			<div className="mx-auto flex items-center justify-center gap-6 px-4">
				<Button
					variant="link"
					className="text-muted-foreground"
					asChild
				>
					<Link href="/legal/privacy">Privacy Policy</Link>
				</Button>
				<Button
					variant="link"
					className="text-muted-foreground"
					asChild
				>
					<Link href="/legal/terms">Terms of Service</Link>
				</Button>
			</div>
		</footer>
	);
}
