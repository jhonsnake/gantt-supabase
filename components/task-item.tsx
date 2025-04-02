"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Pencil, Trash2, Info } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"
import type { Task } from "@/types/task"
import { statusColors, statusNames } from "./task-tooltip"

interface TaskItemProps {
  task: Task
  onDelete: (id: string) => void
  onComplete: (id: string) => void
  onEdit: (task: Task) => void
}

export default function TaskItem({ task, onDelete, onComplete, onEdit }: TaskItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center">
          <div className={cn("w-2 self-stretch", statusColors[task.status])} aria-hidden="true" />
          <div className="flex-1 p-4">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{task.name}</h3>
                  {task.completed && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      <Check className="h-3 w-3 mr-1" /> Completada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-600"
                      aria-label={isOpen ? "Ocultar detalles" : "Ver detalles"}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onComplete(task.id)}
                          className={cn("h-8 w-8", task.completed ? "text-green-500" : "text-gray-400")}
                          aria-label={task.completed ? "Marcar como incompleta" : "Marcar como completada"}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{task.completed ? "Marcar como incompleta" : "Marcar como completada"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(task)}
                          className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          aria-label="Editar tarea"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar tarea</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(task.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          aria-label="Eliminar tarea"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Eliminar tarea</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="font-medium mr-1">Estado:</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs", statusColors[task.status])}>
                    {statusNames[task.status]}
                  </span>
                </div>
                <div>
                  <span className="font-medium mr-1">Periodo:</span>
                  <span>
                    {format(task.start_date, "d MMM", { locale: es })} -{" "}
                    {format(task.end_date, "d MMM", { locale: es })}
                  </span>
                </div>
                {task.responsible && (
                  <div>
                    <span className="font-medium mr-1">Responsable:</span>
                    <span>{task.responsible}</span>
                  </div>
                )}
              </div>

              <CollapsibleContent>
                <div className="mt-3 pt-3 border-t text-sm">
                  <h4 className="font-medium mb-1">Detalles:</h4>
                  <p className="text-gray-600">{task.details || "No hay detalles disponibles."}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

