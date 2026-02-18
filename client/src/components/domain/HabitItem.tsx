import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Flame, MoreVertical, Edit, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Habit } from "@/types/habit"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HabitItemProps {
    habit: Habit
    onComplete: (id: string) => void
    onEdit: (habit: Habit) => void
    onDelete: (id: string) => void
}

export function HabitItem({ habit, onComplete, onEdit, onDelete }: HabitItemProps) {
    const isCompletedToday = habit.lastCompleted && new Date(habit.lastCompleted).toDateString() === new Date().toDateString()

    return (
        <Card>
            <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant={isCompletedToday ? "secondary" : "outline"}
                        size="icon"
                        className={cn(
                            "h-10 w-10 rounded-full transition-all",
                            isCompletedToday && "bg-green-100 dark:bg-green-900 border-green-200"
                        )}
                        onClick={() => !isCompletedToday && onComplete(habit._id)}
                        disabled={!!isCompletedToday}
                    >
                        <Check className={cn("h-5 w-5", isCompletedToday ? "text-green-600 dark:text-green-400" : "text-muted-foreground")} />
                    </Button>
                    <div className="space-y-1">
                        <h3 className={cn("font-medium leading-none", isCompletedToday && "text-muted-foreground line-through")}>
                            {habit.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Flame className="h-3 w-3 text-orange-500" />
                                {habit.streak} day streak
                            </span>
                            <span>•</span>
                            <span>{habit.frequency}</span>
                            <span>•</span>
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{habit.category}</span>
                        </div>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(habit)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(habit._id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardContent>
        </Card>
    )
}
