import { MenuIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export type NavigationSection = {
	title: string;
	href: string;
};

type HeaderProps = {
	className?: string;
};

const navigationData: NavigationSection[] = [
	{
		title: "Integrations",
		href: "/about/integrations",
	},
	{
		title: "Docs",
		href: "/docs",
	},
	{
		title: "Why this project?",
		href: "/about/why",
	},
];

const Header = ({ className }: HeaderProps) => {
	return (
		<header
			className={cn(
				"bg-background sticky top-0 z-50 h-16 border-b",
				className,
			)}
		>
			<div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
				<a className="flex items-center gap-2" href="/">
					<Image
						alt="Chess Now! Icon"
						width="8"
						height="8"
						src="/icon.svg"
						loading="eager"
						className="h-8 w-8"
					/>
					<span className="font-bold text-xl">Chess Now!</span>
				</a>

				{/* Navigation */}
				<NavigationMenu className="max-md:hidden">
					<NavigationMenuList className="flex-wrap justify-start gap-0">
						{navigationData.map((navItem) => (
							<NavigationMenuItem key={navItem.title}>
								<NavigationMenuLink
									href={navItem.href}
									className="text-muted-foreground hover:text-primary bg-transparent! px-3 py-1.5 text-base! font-medium"
								>
									{navItem.title}
								</NavigationMenuLink>
							</NavigationMenuItem>
						))}
					</NavigationMenuList>
				</NavigationMenu>

				{/* Login Button */}
				<div className="flex gap-2">
					<Button size="lg" className="max-md:hidden" asChild>
						<a href="/account/login">Login</a>
					</Button>
					<Button
						size="lg"
						variant="secondary"
						className="max-md:hidden"
						asChild
					>
						<a href="/account/signup">Sign Up</a>
					</Button>
				</div>

				{/* Navigation for small screens */}
				<div className="flex gap-4 md:hidden">
					<div className="flex gap-2">
						<Button size="lg" asChild>
							<a href="/account/login">Login</a>
						</Button>
						<Button size="lg" variant="secondary" asChild>
							<a href="/account/signup">Sign Up</a>
						</Button>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon-lg">
								<MenuIcon />
								<span className="sr-only">Menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56" align="end">
							{navigationData.map((item) => (
								<DropdownMenuItem key={item.title} asChild>
									<a href={item.href}>{item.title}</a>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
};

export default Header;
