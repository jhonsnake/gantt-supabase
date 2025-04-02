import GanttChart from "@/components/gantt-chart"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-purple-700">Diagrama de Gantt Interactivo</h1>
      <GanttChart />
      <Toaster />
    </main>
  )
}

