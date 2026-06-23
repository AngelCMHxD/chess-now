import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		globalNotFound: true,
	},
};

const withMDX = createMDX({
	outDir: ".fumadocs",
});

export default withMDX(nextConfig);
