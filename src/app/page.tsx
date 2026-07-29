import HeroSection from "@/components/blocks/hero/hero";
import Footer from "@/components/footer";
import Header from "@/components/header";

export default function Home() {
	return (
		<div className="relative flex min-h-screen flex-col justify-between">
			<Header />

			<main className="flex flex-col flex-1">
				<HeroSection />
			</main>

			<Footer />
		</div>
	);
}
