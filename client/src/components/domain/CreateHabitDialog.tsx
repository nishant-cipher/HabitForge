import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { habitService } from "@/services/habitService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { type CreateHabitInput } from "@/types/habit"

interface CreateHabitDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateHabitDialog({ open, onOpenChange }: CreateHabitDialogProps) {
    const [name, setName] = useState("")
    const [category, setCategory] = useState("Productivity")
    const [frequency, setFrequency] = useState("Daily")

    const queryClient = useQueryClient()

    const createHabitMutation = useMutation({
        mutationFn: (newHabit: CreateHabitInput) => habitService.createHabit(newHabit),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] })
            onOpenChange(false)
            setName("")
            setCategory("Productivity")
            setFrequency("Daily")
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createHabitMutation.mutate({ name, category, frequency })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Habit</DialogTitle>
                    <DialogDescription>
                        Add a new habit to start tracking your progress.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Reading"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Category
                            </Label>
                            {/* Simplified select using basic HTML for now, can be Select component later */}
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="Health">Health</option>
                                <option value="Productivity">Productivity</option>
                                <option value="Learning">Learning</option>
                                <option value="Social">Social</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="frequency" className="text-right">
                                Frequency
                            </Label>
                            <select
                                id="frequency"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createHabitMutation.isPending}>
                            {createHabitMutation.isPending ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
