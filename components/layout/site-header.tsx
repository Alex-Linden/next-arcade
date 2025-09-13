"use client";

import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export default function SiteHeader() {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
                <Link
                    href="/"
                    className="font-semibold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_hsl(var(--arcade-primary)/0.35)]"
                >
                    Next Arcade
                </Link>


                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link href="/" className="px-3 py-2">Home</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link href="/games/tic-tac-toe" className="px-3 py-2">Tic-Tac-Toe</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link href="/games/2048" className="px-3 py-2">2048</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link href="/games/snake" className="px-3 py-2">Snake</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link href="/games/lightsOut" className="px-3 py-2">Lights Out</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm">About</Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>About Next Arcade</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 space-y-3 text-sm">
                            <p>Mini-games built with Next.js, shadcn/ui, and Tailwind.</p>
                            <Separator />
                            <p>Live: Tic-Tac-Toe, 2048, Snake, Lights Out. Planned: Minesweeper.</p>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
