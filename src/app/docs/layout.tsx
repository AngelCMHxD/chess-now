import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import "../globals.css";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import Image from "next/image";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<RootProvider
			search={{
				options: {
					api: "/docs/search",
				},
			}}
		>
			<DocsLayout
				tree={source.getPageTree()}
				nav={{
					title: (
						<div className="flex h-12 p-2 items-center gap-2 font-semibold">
							<Image
								alt="Chess Now! Icon"
								width="32"
								height="32"
								src="/icon.svg"
								className="h-full w-auto aspect-square"
							/>
							<span>Chess Now</span>
						</div>
					),
				}}
				githubUrl={process.env.NEXT_PUBLIC_REPO_LINK}
			>
				{children}
			</DocsLayout>
		</RootProvider>
	);
}
