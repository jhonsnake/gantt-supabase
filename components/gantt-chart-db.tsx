"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarIcon,
  Plus,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Search,
  Loader2,
} from "lucide-react"
import TaskItem from "@/components/task-item"
import TaskTooltip from "@/components/task-tooltip"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  seedDatabase,
  type TaskStatus,
} from "@/app/actions/task-actions"
import { useToast } from "@/components/ui/use-toast"

// Mapeo de estados a colores
const statusColors: Record<TaskStatus, string> = {
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
const statusNames: Record<TaskStatus, string> = {
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

interface Task {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: TaskStatus
  completed?: boolean
  details?: string
  responsible?: string
}

export default function GanttChartDB() {
  const { toast } = useToast()
  const [title, setTitle] = useState(
    "En el Q1 2025, estaremos enfocados en la estabilidad de la plataforma integrando los elementos de seguridad",
  )
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 1)) // 1 de abril de 2025
  const [zoomLevel, setZoomLevel] = useState(1) // 1 = 100% (5 meses), 2 = 200% (10 meses), etc.
  const [visibleStartMonth, setVisibleStartMonth] = useState(0) // Mes inicial visible (0 = enero)
  const [visibleMonthsCount, setVisibleMonthsCount] = useState(5) // Cantidad de meses visibles
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: "",
    status: "planned",
    details: "",
    responsible: "",
  })
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)

  // Cargar tareas desde la base de datos
  useEffect(() => {
    async function loadTasks() {
      setLoading(true)
      try {
        const result = await getTasks()
        if (result.success && result.data) {
          // Convertir las fechas de string a Date
          const tasksWithDates = result.data.map((task) => ({
            ...task,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate),
            status: task.status as TaskStatus,
          }))
          setTasks(tasksWithDates)
        } else {
          toast({
            title: "Error",
            description: "No se pudieron cargar las tareas",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error al cargar tareas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las tareas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [toast])

  // Inicializar la base de datos con datos de ejemplo si está vacía
  const handleSeedDatabase = async () => {
    setLoading(true)
    try {
      const result = await seedDatabase()
      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || "Base de datos inicializada correctamente",
        })
        // Recargar las tareas
        const tasksResult = await getTasks()
        if (tasksResult.success && tasksResult.data) {
          const tasksWithDates = tasksResult.data.map((task) => ({
            ...task,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate),
            status: task.status as TaskStatus,
          }))
          setTasks(tasksWithDates)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al inicializar la base de datos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al inicializar la base de datos:", error)
      toast({
        title: "Error",
        description: "Error al inicializar la base de datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calcular los meses a mostrar
  const allMonths = [
    { month: 0, name: "Enero", quarter: "Q1" },
    { month: 1, name: "Febrero", quarter: "Q1" },
    { month: 2, name: "Marzo", quarter: "Q1" },
    { month: 3, name: "Abril", quarter: "Q2" },
    { month: 4, name: "Mayo", quarter: "Q2" },
    { month: 5, name: "Junio", quarter: "Q2" },
    { month: 6, name: "Julio", quarter: "Q3" },
    { month: 7, name: "Agosto", quarter: "Q3" },
    { month: 8, name: "Septiembre", quarter: "Q3" },
    { month: 9, name: "Octubre", quarter: "Q4" },
    { month: 10, name: "Noviembre", quarter: "Q4" },
    { month: 11, name: "Diciembre", quarter: "Q4" },
  ]

  const getVisibleMonths = () => {
    return allMonths.slice(visibleStartMonth, visibleStartMonth + visibleMonthsCount)
  }

  // Agregar una nueva tarea
  const handleAddTask = async () => {
    if (!newTask.name || !startDate || !endDate) return

    setLoading(true)
    try {
      const result = await createTask({
        name: newTask.name,
        startDate,
        endDate,
        status: newTask.status as TaskStatus,
        details: newTask.details,
        responsible: newTask.responsible,
      })

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Tarea creada correctamente",
        })

        // Actualizar la lista de tareas
        const tasksResult = await getTasks()
        if (tasksResult.success && tasksResult.data) {
          const tasksWithDates = tasksResult.data.map((task) => ({
            ...task,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate),
            status: task.status as TaskStatus,
          }))
          setTasks(tasksWithDates)
        }

        // Limpiar el formulario
        setNewTask({ name: "", status: "planned", details: "", responsible: "" })
        setStartDate(undefined)
        setEndDate(undefined)
        setShowAddTask(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear la tarea",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al crear tarea:", error)
      toast({
        title: "Error",
        description: "Error al crear la tarea",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Eliminar una tarea
  const handleDeleteTask = async (id: string) => {
    setLoading(true)
    try {
      const result = await deleteTask(id)
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Tarea eliminada correctamente",
        })

        // Actualizar la lista de tareas localmente
        setTasks(tasks.filter((task) => task.id !== id))
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar la tarea",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar tarea:", error)
      toast({
        title: "Error",
        description: "Error al eliminar la tarea",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Marcar tarea como completada
  const handleCompleteTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    setLoading(true)
    try {
      const result = await toggleTaskCompletion(id, !task.completed)
      if (result.success) {
        toast({
          title: "Éxito",
          description: `Tarea marcada como ${!task.completed ? "completada" : "no completada"}`,
        })

        // Actualizar la lista de tareas localmente
        setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar la tarea",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al actualizar tarea:", error)
      toast({
        title: "Error",
        description: "Error al actualizar la tarea",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Editar una tarea
  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setNewTask({
      name: task.name,
      status: task.status,
      details: task.details,
      responsible: task.responsible,
    })
    setStartDate(task.startDate)
    setEndDate(task.endDate)
    setShowAddTask(true)
  }

  // Guardar cambios de una tarea editada
  const handleSaveEdit = async () => {
    if (!newTask.name || !startDate || !endDate || !editingTaskId) return

    setLoading(true)
    try {
      const result = await updateTask(editingTaskId, {
        name: newTask.name,
        startDate,
        endDate,
        status: newTask.status as TaskStatus,
        details: newTask.details,
        responsible: newTask.responsible,
      })

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Tarea actualizada correctamente",
        })

        // Actualizar la lista de tareas
        const tasksResult = await getTasks()
        if (tasksResult.success && tasksResult.data) {
          const tasksWithDates = tasksResult.data.map((task) => ({
            ...task,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate),
            status: task.status as TaskStatus,
          }))
          setTasks(tasksWithDates)
        }

        // Limpiar el formulario
        setNewTask({ name: "", status: "planned", details: "", responsible: "" })
        setStartDate(undefined)
        setEndDate(undefined)
        setEditingTaskId(null)
        setShowAddTask(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar la tarea",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al actualizar tarea:", error)
      toast({
        title: "Error",
        description: "Error al actualizar la tarea",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para manejar el zoom
  const handleZoomChange = (newZoom: number) => {
    // Limitar el zoom entre 0.5 (más alejado) y 3 (más cercano)
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom))
    setZoomLevel(clampedZoom)

    // Ajustar la cantidad de meses visibles basado en el zoom
    const newVisibleMonths = Math.round(5 / clampedZoom)
    setVisibleMonthsCount(newVisibleMonths)
  }

  // Función para manejar el desplazamiento (pan)
  const handlePan = (direction: "left" | "right") => {
    if (direction === "left") {
      // No permitir desplazarse antes del primer mes
      setVisibleStartMonth(Math.max(0, visibleStartMonth - 1))
    } else {
      // No permitir desplazarse más allá del último mes disponible
      const maxStartMonth = 12 - visibleMonthsCount // Asumiendo un máximo de 12 meses
      setVisibleStartMonth(Math.min(maxStartMonth, visibleStartMonth + 1))
    }
  }

  // Función para iniciar el arrastre
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStartX(e.clientX)
  }

  // Función para manejar el movimiento durante el arrastre
  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStartX
    if (Math.abs(deltaX) > 50) {
      // Mover después de 50px de arrastre
      if (deltaX > 0) {
        handlePan("left")
      } else {
        handlePan("right")
      }
      setDragStartX(e.clientX)
    }
  }

  // Función para terminar el arrastre
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Función para saltar a un trimestre específico
  const jumpToQuarter = (quarter: number) => {
    // Q1 = meses 0-2, Q2 = meses 3-5, etc.
    setVisibleStartMonth((quarter - 1) * 3)
  }

  // Calcular la posición de la tarea en el diagrama
  const calculateTaskPosition = (task: Task) => {
    const startMonth = task.startDate.getMonth()
    const endMonth = task.endDate.getMonth()

    // Si la tarea está fuera del rango visible, ajustar su posición
    const visibleEndMonth = visibleStartMonth + visibleMonthsCount - 1

    // Si la tarea está completamente fuera del rango visible, no mostrarla
    if (endMonth < visibleStartMonth || startMonth > visibleEndMonth) {
      return {
        left: "0%",
        width: "0%",
        display: "none",
      }
    }

    // Calcular el ancho en porcentaje basado en la duración
    const startDay = task.startDate.getDate()
    const endDay = task.endDate.getDate()
    const daysInStartMonth = new Date(2025, startMonth + 1, 0).getDate()
    const daysInEndMonth = new Date(2025, endMonth + 1, 0).getDate()

    // Ajustar el mes de inicio y fin al rango visible
    const visibleStartMonthOffset = Math.max(0, visibleStartMonth - startMonth)
    const adjustedStartMonth = startMonth + visibleStartMonthOffset
    const adjustedStartDay = visibleStartMonthOffset > 0 ? 1 : startDay

    const visibleEndMonthOffset = Math.max(0, endMonth - visibleEndMonth)
    const adjustedEndMonth = endMonth - visibleEndMonthOffset
    const adjustedEndDay = visibleEndMonthOffset > 0 ? new Date(2025, adjustedEndMonth + 1, 0).getDate() : endDay

    let width = 0
    let left = 0

    // Calcular la posición izquierda relativa al rango visible
    left = ((adjustedStartMonth - visibleStartMonth) / visibleMonthsCount) * 100

    if (adjustedStartMonth === adjustedEndMonth) {
      // Si la tarea comienza y termina en el mismo mes
      width = ((adjustedEndDay - adjustedStartDay + 1) / daysInStartMonth) * (100 / visibleMonthsCount)
    } else {
      // Si la tarea abarca varios meses\
      * (100 / visibleMonthsCount)\
    }
    else
    {
      // Si la tarea abarca varios meses
      const monthsSpan = adjustedEndMonth - adjustedStartMonth + 1

      // Porcentaje del primer mes
      const firstMonthPercentage =
        ((daysInStartMonth - adjustedStartDay + 1) / daysInStartMonth) * (100 / visibleMonthsCount)

      // Porcentaje del último mes
      const lastMonthPercentage = (adjustedEndDay / daysInEndMonth) * (100 / visibleMonthsCount)

      // Porcentaje de los meses intermedios (si hay)
      const middleMonthsPercentage = monthsSpan > 2 ? (monthsSpan - 2) * (100 / visibleMonthsCount) : 0

      width = firstMonthPercentage + lastMonthPercentage + middleMonthsPercentage
    }

    return {
      left: `${left}%`,
      width: `${width}%`,
      display: "flex",
    }
  }

  // Filtrar tareas por término de búsqueda
  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      task.name.toLowerCase().includes(searchLower) ||
      (task.details && task.details.toLowerCase().includes(searchLower)) ||
      (task.responsible && task.responsible.toLowerCase().includes(searchLower)) ||
      statusNames[task.status].toLowerCase().includes(searchLower)
    )
  })

  // Manejar el hover sobre una tarea
  const handleTaskHover = (taskId: string | null) => {
    setActiveTaskId(taskId)
  }

  return (
    <div className="space-y-6">
      {/* Título editable */}
      <div className="mb-6">
        <Label htmlFor="title" className="text-sm font-medium mb-1">
          Título del Diagrama
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-purple-700 font-semibold"
          aria-label="Título del diagrama de Gantt"
        />
      </div>

      {/* Fecha actual */}
      <div className="mb-6">
        <Label htmlFor="current-date" className="text-sm font-medium mb-1">
          Fecha Actual ("Estás aquí")
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              id="current-date"
              aria-label="Seleccionar fecha actual"
            >
              <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              {currentDate ? format(currentDate, "PPP", { locale: es }) : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && setCurrentDate(date)}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Botón para inicializar la base de datos */}
      {tasks.length === 0 && !loading && (
        <Button onClick={handleSeedDatabase} className="mb-4">
          Inicializar con datos de ejemplo
        </Button>
      )}

      <Tabs defaultValue="chart">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chart">Diagrama</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
        </TabsList>

        {/* Vista del Diagrama */}
        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {/* Título del diagrama */}
              <h2 className="text-2xl font-bold text-purple-700 mb-4">{title}</h2>

              {/* Barra de búsqueda */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  type="search"
                  placeholder="Buscar tareas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Buscar tareas"
                />
              </div>

              {/* Controles de navegación y zoom */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePan("left")}
                          disabled={visibleStartMonth <= 0}
                          aria-label="Mes anterior"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only md:not-sr-only md:ml-2">Anterior</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver mes anterior</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePan("right")}
                          disabled={visibleStartMonth + visibleMonthsCount >= 12}
                          aria-label="Mes siguiente"
                        >
                          <span className="sr-only md:not-sr-only md:mr-2">Siguiente</span>
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver mes siguiente</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500" id="zoom-label">
                    Zoom:
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZoomChange(zoomLevel - 0.25)}
                          disabled={zoomLevel <= 0.5}
                          aria-label="Alejar"
                          aria-describedby="zoom-label"
                        >
                          <ZoomOut className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Alejar vista</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <span className="text-sm font-medium w-16 text-center" aria-live="polite">
                    {Math.round(zoomLevel * 100)}%
                  </span>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZoomChange(zoomLevel + 0.25)}
                          disabled={zoomLevel >= 3}
                          aria-label="Acercar"
                          aria-describedby="zoom-label"
                        >
                          <ZoomIn className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Acercar vista</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500" id="quarter-label">
                    Ir a:
                  </span>
                  <div className="flex" role="group" aria-labelledby="quarter-label">
                    <Button
                      variant="outline"
                      size="sm"
                      className={visibleStartMonth < 3 ? "bg-primary text-primary-foreground" : ""}
                      onClick={() => jumpToQuarter(1)}
                      aria-pressed={visibleStartMonth < 3}
                    >
                      Q1
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        visibleStartMonth >= 3 && visibleStartMonth < 6 ? "bg-primary text-primary-foreground" : ""
                      }
                      onClick={() => jumpToQuarter(2)}
                      aria-pressed={visibleStartMonth >= 3 && visibleStartMonth < 6}
                    >
                      Q2
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        visibleStartMonth >= 6 && visibleStartMonth < 9 ? "bg-primary text-primary-foreground" : ""
                      }
                      onClick={() => jumpToQuarter(3)}
                      aria-pressed={visibleStartMonth >= 6 && visibleStartMonth < 9}
                    >
                      Q3
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={visibleStartMonth >= 9 ? "bg-primary text-primary-foreground" : ""}
                      onClick={() => jumpToQuarter(4)}
                      aria-pressed={visibleStartMonth >= 9}
                    >
                      Q4
                    </Button>
                  </div>
                </div>
              </div>

              {/* Miniatura del diagrama completo */}
              <div className="relative h-10 mb-4 bg-gray-100 rounded-md overflow-hidden">
                <div className="absolute inset-0 flex">
                  {allMonths.map((month) => (
                    <div key={month.month} className="flex-1 border-r border-gray-200 flex items-center justify-center">
                      <span className="text-[10px] text-gray-500">{month.name.substring(0, 3)}</span>
                    </div>
                  ))}
                </div>

                {/* Indicador de área visible */}
                <div
                  className="absolute top-0 bottom-0 bg-primary/20 border-2 border-primary"
                  style={{
                    left: `${(visibleStartMonth / 12) * 100}%`,
                    width: `${(visibleMonthsCount / 12) * 100}%`,
                  }}
                  aria-label={`Área visible: ${getVisibleMonths()[0]?.name} a ${getVisibleMonths()[getVisibleMonths().length - 1]?.name}`}
                ></div>

                {/* Indicador de posición actual */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{
                    left: `${((currentDate.getMonth() + currentDate.getDate() / 30) / 12) * 100}%`,
                  }}
                  aria-label={`Posición actual: ${format(currentDate, "PPP", { locale: es })}`}
                ></div>
              </div>

              {/* Estado de carga */}
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Cargando...</span>
                </div>
              )}

              {/* Diagrama de Gantt */}
              {!loading && (
                <div
                  className="relative select-none"
                  onMouseDown={handleDragStart}
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  style={{ cursor: isDragging ? "grabbing" : "grab" }}
                  role="application"
                  aria-label="Diagrama de Gantt"
                >
                  {/* Encabezados de meses */}
                  <div className="grid mb-2" style={{ gridTemplateColumns: `repeat(${visibleMonthsCount}, 1fr)` }}>
                    {getVisibleMonths().map((month) => (
                      <div key={month.month} className="relative">
                        <div className="bg-gray-200 rounded-md p-2 m-1 flex">
                          <span className="bg-gray-300 rounded-md px-2 py-1 mr-2">{month.quarter}</span>
                          <span className="font-medium">{month.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Línea de tiempo actual */}
                  {currentDate.getMonth() >= visibleStartMonth &&
                    currentDate.getMonth() <= visibleStartMonth + visibleMonthsCount - 1 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{
                          left: `${((currentDate.getMonth() - visibleStartMonth + currentDate.getDate() / 30) / visibleMonthsCount) * 100}%`,
                          height: `${filteredTasks.length * 50 + 100}px`,
                        }}
                        aria-hidden="true"
                      >
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
                          <div className="relative">
                            <div className="bg-red-500 text-white px-3 py-1 rounded-md whitespace-nowrap">
                              Estás aquí
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-red-500"></div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Tareas */}
                  <div className="space-y-2 mt-4">
                    {filteredTasks.map((task) => {
                      const position = calculateTaskPosition(task)
                      if (position.display === "none") return null

                      return (
                        <div
                          key={task.id}
                          className="relative h-12"
                          onMouseEnter={() => handleTaskHover(task.id)}
                          onMouseLeave={() => handleTaskHover(null)}
                        >
                          <div
                            className={cn(
                              "absolute h-10 rounded-md border-2 px-3 py-1 flex items-center transition-all",
                              statusColors[task.status],
                              activeTaskId === task.id ? "ring-2 ring-offset-2 ring-primary" : "",
                            )}
                            style={{
                              ...position,
                              transition: "all 0.3s ease",
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Tarea: ${task.name}, Estado: ${statusNames[task.status]}, Periodo: ${format(task.startDate, "d MMM", { locale: es })} - ${format(task.endDate, "d MMM", { locale: es })}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleTaskHover(task.id)
                              }
                            }}
                          >
                            <span className="truncate text-sm">{task.name}</span>
                            {task.completed && (
                              <div
                                className="absolute -right-2 -top-2 bg-green-500 rounded-full p-1"
                                aria-label="Completada"
                              >
                                <Check className="h-3 w-3 text-white" aria-hidden="true" />
                              </div>
                            )}

                            {/* Tooltip al hacer hover */}
                            {activeTaskId === task.id && (
                              <TaskTooltip task={task} statusColors={statusColors} statusNames={statusNames} />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Mensaje cuando no hay tareas visibles */}
                  {filteredTasks.filter((task) => {
                    const position = calculateTaskPosition(task)
                    return position.display !== "none"
                  }).length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mt-4">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" aria-hidden="true" />
                      <p>No hay tareas visibles en este rango de tiempo.</p>
                      <p className="text-sm">Ajusta el zoom o navega a otro periodo.</p>
                    </div>
                  )}

                  {/* Leyenda */}
                  <div className="mt-8 flex flex-wrap gap-4" aria-label="Leyenda">
                    {Object.entries(statusNames).map(([key, name]) => (
                      <div key={key} className="flex items-center">
                        <div
                          className={cn("w-4 h-4 rounded-full mr-2", statusColors[key as TaskStatus])}
                          aria-hidden="true"
                        ></div>
                        <span className="text-sm">{name}</span>
                      </div>
                    ))}
                    <div className="flex items-center">
                      <div className="relative w-4 h-4 rounded-full border-2 border-gray-300 mr-2" aria-hidden="true">
                        <Check className="h-3 w-3 absolute -right-1 -top-1 text-green-500" />
                      </div>
                      <span className="text-sm">Completada</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista de Tareas */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {/* Barra de búsqueda */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  type="search"
                  placeholder="Buscar tareas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Buscar tareas"
                />
              </div>

              {/* Estado de carga */}
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Cargando...</span>
                </div>
              )}

              {/* Formulario para agregar/editar tareas */}
              {!loading && showAddTask && (
                <div className="mb-6 p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-4">{editingTaskId ? "Editar Tarea" : "Agregar Nueva Tarea"}</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="task-name">Nombre de la Tarea</Label>
                      <Input
                        id="task-name"
                        value={newTask.name}
                        onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                        placeholder="Nombre de la tarea"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date">Fecha de Inicio</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              id="start-date"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                              {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label htmlFor="end-date">Fecha de Fin</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              id="end-date"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                              {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="task-status">Estado</Label>
                      <Select
                        value={newTask.status}
                        onValueChange={(value) => setNewTask({ ...newTask, status: value as TaskStatus })}
                      >
                        <SelectTrigger id="task-status">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusNames).map(([key, name]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center">
                                <div className={cn("w-3 h-3 rounded-full mr-2", statusColors[key as TaskStatus])}></div>
                                <span>{name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="task-responsible">Responsable</Label>
                      <Input
                        id="task-responsible"
                        value={newTask.responsible || ""}
                        onChange={(e) => setNewTask({ ...newTask, responsible: e.target.value })}
                        placeholder="Equipo o persona responsable"
                      />
                    </div>

                    <div>
                      <Label htmlFor="task-details">Detalles</Label>
                      <Textarea
                        id="task-details"
                        value={newTask.details || ""}
                        onChange={(e) => setNewTask({ ...newTask, details: e.target.value })}
                        placeholder="Descripción detallada de la tarea"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddTask(false)
                          setEditingTaskId(null)
                          setNewTask({ name: "", status: "planned", details: "", responsible: "" })
                          setStartDate(undefined)
                          setEndDate(undefined)
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={editingTaskId ? handleSaveEdit : handleAddTask}
                        disabled={!newTask.name || !startDate || !endDate}
                      >
                        {editingTaskId ? "Guardar Cambios" : "Agregar Tarea"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón para mostrar formulario de agregar tarea */}
              {!loading && !showAddTask && (
                <Button className="mb-4" onClick={() => setShowAddTask(true)}>
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Agregar Tarea
                </Button>
              )}

              {/* Lista de tareas */}
              {!loading && (
                <div className="space-y-2">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" aria-hidden="true" />
                      <p>No hay tareas. Agrega una para comenzar.</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onDelete={handleDeleteTask}
                        onComplete={handleCompleteTask}
                        onEdit={handleEditTask}
                        statusColors={statusColors}
                        statusNames={statusNames}
                      />
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

