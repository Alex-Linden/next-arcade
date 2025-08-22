import Link from "next/link";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
    title: string;
    description: string;
    href?: string;
    emoji?: string;
    disabled?: boolean;
};

export function GameCard({
    title,
    description,
    href,
    emoji = "🎮",
    disabled,
}: Props) {
    return (
        <Card className={cn(
            "group transition-all duration-200",
            "hover:-translate-y-0.5 hover:shadow-lg",
            "border-primary/20 hover:border-primary/40"
        )}>
            <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl drop-shadow-sm">{emoji}</span>
                    {title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </CardHeader>
            <CardContent />
            <CardFooter>
                {href && !disabled ? (
                    <Button asChild className="transition group-hover:shadow">
                        <Link href={href}>Play</Link>
                    </Button>
                ) : (
                    <Button variant="secondary" disabled>Coming soon</Button>
                )}
            </CardFooter>
        </Card>
    );
}
