import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, User, Info, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types/task"

// Mapeo de estados a colores
export const statusColors: Record<TaskStatus, string> = {
  prioritized: "bg-blue-100 border-blue-200",
  critical: "bg-indigo-700 border-indigo-800 text-white",
  "priority-change": "bg-orange-400 border-orange-500 text-white",
  impacted: "bg-red-300 border-red-400",
  "external-dev": "bg-green-400 border-green-500 text-white",
  "in-development": "bg-indigo-700 border-indigo-800 text-white",
  planned: "bg-blue-100 border-blue-200",
  blocked: "bg-amber-300 border-amber-400",
  completed: "bg-gray-200 border-gray-300",
}

// Mapeo de estados a nombres en español
export const statusNames: Record<TaskStatus, string> = {
  prioritized: "Priorizada",
  critical: "Ruta Crítica",
  "priority-change": "Cambio de prioridad",
  impacted: "Impactada",
  "external-dev": "Desarrollo externo",
  "in-development": "En desarrollo",
  planned: "Lista",
  blocked: "Bloqueada",
  completed: "Completada",
}

interface TaskTooltipProps {
  task: Task
}

export default function TaskTooltip({ task }: TaskTooltipProps) {
  // Extraer solo las clases de color de fondo (bg-*) del string de clases
  const getBgColorClass = (colorClasses: string) => {
    const bgClass = colorClasses.split(" ").find((cls) => cls.startsWith("bg-"))
    return bgClass || "bg-gray-100"
  }

  // Extraer solo las clases de color de texto (text-*) del string de clases
  const getTextColorClass = (colorClasses: string) => {
    const textClass = colorClasses.split(" ").find((cls) => cls.startsWith("text-"))
    return textClass || ""
  }

  const statusColor = statusColors[task.status as TaskStatus] || "bg-gray-100"
  const statusName = statusNames[task.status as TaskStatus] || task.status

  return (
    <div className="absolute z-50 top-0 left-full ml-2 transform -translate-y-1/2 w-64">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">{task.name}</CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
            <span>
              {format(task.start_date, "d MMM yyyy", { locale: es })} -{" "}
              {format(task.end_date, "d MMM yyyy", { locale: es })}
            </span>
          </div>

          {task.responsible && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-gray-500" />
              <span>{task.responsible}</span>
            </div>
          )}

          {task.details && (
            <div className="flex gap-2">
              <Info className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="line-clamp-3">{task.details}</p>
            </div>
          )}

          <div className="pt-1 flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className={cn("text-[10px] font-normal", getBgColorClass(statusColor), getTextColorClass(statusColor))}
            >
              <Tag className="h-3 w-3 mr-1" />
              {statusName}
            </Badge>

            <Badge variant="outline" className="text-[10px] font-normal">
              {task.completed ? "Completada" : "En progreso"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

