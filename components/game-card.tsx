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
        <Card className={disabled ? "opacity-60" : ""}>
            <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{emoji}</span>
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent />
            <CardFooter>
                {href && !disabled ? (
                    <Button asChild>
                        <Link href={href}>Play</Link>
                    </Button>
                ) : (
                    <Button variant="secondary" disabled>
                        Coming soon
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
