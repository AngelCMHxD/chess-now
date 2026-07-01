import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const internalApiBaseUrl = process.env.INTERNAL_API_PORT
	? `http://localhost:${process.env.INTERNAL_API_PORT}`
	: "http://localhost:8080";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
	experimental: {
		globalNotFound: true,
	},
	async rewrites() {
		if (!isDevelopment) {
			return [];
		}

		return {
			afterFiles: [
				{
					source: "/api/:path*",
					destination: `${internalApiBaseUrl}/api/:path*`,
				},
			],
		};
	},
};

const withMDX = createMDX({
	outDir: ".fumadocs",
});

export default withMDX(nextConfig);
