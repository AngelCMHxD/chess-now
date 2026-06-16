import { Font } from "react-email";

/**
 * Many webmail clients strip `@import`; the `<Font>` entries below register 400 / 500 / 600
 * static files as a fallback when the import does not run.
 */
export function EmailsFonts() {
	return (
		<>
			<Font
				fontFamily="Poppins"
				fallbackFontFamily={["Arial", "sans-serif"]}
				webFont={{
					url: "https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecg.woff2",
					format: "woff2",
				}}
				fontWeight={400}
				fontStyle="normal"
			/>
			<Font
				fontFamily="Poppins"
				fallbackFontFamily={["Arial", "sans-serif"]}
				webFont={{
					url: "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2",
					format: "woff2",
				}}
				fontWeight={500}
				fontStyle="normal"
			/>
			<Font
				fontFamily="Poppins"
				fallbackFontFamily={["Arial", "sans-serif"]}
				webFont={{
					url: "ttps://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2",
					format: "woff2",
				}}
				fontWeight={600}
				fontStyle="normal"
			/>
			<Font
				fontFamily="Poppins"
				fallbackFontFamily={["Arial", "sans-serif"]}
				webFont={{
					url: "https://fonts.gstatic.com/s/poppins/v24/pxiGyp8kv8JHgFVrJJLucHtA.woff2",
					format: "woff2",
				}}
				fontWeight={400}
				fontStyle="italic"
			/>
			<Font
				fontFamily="Poppins"
				fallbackFontFamily={["Arial", "sans-serif"]}
				webFont={{
					url: "https://fonts.gstatic.com/s/poppins/v24/pxiDyp8kv8JHgFVrJJLmg1hVF9eO.woff2",
					format: "woff2",
				}}
				fontWeight={500}
				fontStyle="italic"
			/>
			<Font
				fontFamily="Poppins"
				fallbackFontFamily={["Arial", "sans-serif"]}
				webFont={{
					url: "https://fonts.gstatic.com/s/poppins/v24/pxiDyp8kv8JHgFVrJJLmr19VF9eO.woff2",
					format: "woff2",
				}}
				fontWeight={600}
				fontStyle="italic"
			/>
		</>
	);
}
