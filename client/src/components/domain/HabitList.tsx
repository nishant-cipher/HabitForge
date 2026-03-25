import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function HabitList() {
    // TODO: Fetch real data
    const habits = [
        {
            id: 1,
            title: "Morning Meditation",
            description: "10 minutes of mindfulness",
            completed: true,
            streak: 5,
        },
        {
            id: 2,
            title: "Read 30 Pages",
            description: "Current book: Atomic Habits",
            completed: false,
            streak: 12,
        },
        {
            id: 3,
            title: "Drink 3L Water",
            description: "Stay hydrated",
            completed: false,
            streak: 3,
        },
    ]

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Today's Habits</CardTitle>
                <CardDescription>
                    You have completed 1 out of 3 habits today.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {habits.map((habit) => (
                        <div
                            key={habit.id}
                            className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-muted/50"
                        >
                            <div className="space-y-1">
                                <p className={cn("font-medium leading-none", habit.completed && "text-muted-foreground line-through")}>
                                    {habit.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {habit.description} • {habit.streak} day streak
                                </p>
                            </div>
                            <Button
                                variant={habit.completed ? "secondary" : "default"}
                                size="icon"
                                className={cn(habit.completed && "opacity-50")}
                                disabled={habit.completed}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
