"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import type { TaskInput } from "@/types/task"
import { revalidatePath } from "next/cache"

// Obtener todas las tareas
export async function getTasks() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("tasks").select("*").order("start_date", { ascending: true })

    if (error) {
      console.error("Error al obtener tareas:", error)
      return { success: false, error: error.message }
    }

    // Convertir las fechas de string a Date
    const tasks = data.map((task) => ({
      ...task,
      start_date: new Date(task.start_date),
      end_date: new Date(task.end_date),
      created_at: task.created_at ? new Date(task.created_at) : undefined,
      updated_at: task.updated_at ? new Date(task.updated_at) : undefined,
    }))

    return { success: true, data: tasks }
  } catch (error) {
    console.error("Error al obtener tareas:", error)
    return { success: false, error: "Error al obtener tareas" }
  }
}

// Crear una nueva tarea
export async function createTask(data: TaskInput) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: task, error } = await supabase
      .from("tasks")
      .insert([
        {
          name: data.name,
          start_date: data.start_date.toISOString(),
          end_date: data.end_date.toISOString(),
          status: data.status,
          completed: data.completed || false,
          details: data.details || null,
          responsible: data.responsible || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error al crear tarea:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true, data: task }
  } catch (error) {
    console.error("Error al crear tarea:", error)
    return { success: false, error: "Error al crear tarea" }
  }
}

// Actualizar una tarea existente
export async function updateTask(id: string, data: Partial<TaskInput>) {
  try {
    const supabase = createServerSupabaseClient()

    // Preparar los datos para actualizar
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.start_date !== undefined) updateData.start_date = data.start_date.toISOString()
    if (data.end_date !== undefined) updateData.end_date = data.end_date.toISOString()
    if (data.status !== undefined) updateData.status = data.status
    if (data.completed !== undefined) updateData.completed = data.completed
    if (data.details !== undefined) updateData.details = data.details
    if (data.responsible !== undefined) updateData.responsible = data.responsible

    const { data: task, error } = await supabase.from("tasks").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error al actualizar tarea:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true, data: task }
  } catch (error) {
    console.error("Error al actualizar tarea:", error)
    return { success: false, error: "Error al actualizar tarea" }
  }
}

// Eliminar una tarea
export async function deleteTask(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar tarea:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar tarea:", error)
    return { success: false, error: "Error al eliminar tarea" }
  }
}

// Marcar una tarea como completada o no completada
export async function toggleTaskCompletion(id: string, completed: boolean) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: task, error } = await supabase.from("tasks").update({ completed }).eq("id", id).select().single()

    if (error) {
      console.error("Error al actualizar estado de tarea:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true, data: task }
  } catch (error) {
    console.error("Error al actualizar estado de tarea:", error)
    return { success: false, error: "Error al actualizar estado de tarea" }
  }
}

// Inicializar la base de datos con datos de ejemplo
export async function seedDatabase() {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar si ya hay datos
    const { count, error: countError } = await supabase.from("tasks").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error al verificar datos existentes:", countError)
      return { success: false, error: countError.message }
    }

    if (count && count > 0) {
      return { success: true, message: "La base de datos ya contiene datos" }
    }

    // Datos de ejemplo
    const currentYear = new Date().getFullYear()
    const sampleTasks = [
      {
        name: "ACH Xpress",
        start_date: new Date(currentYear, 0, 1).toISOString(),
        end_date: new Date(currentYear, 3, 15).toISOString(),
        status: "external-dev",
        completed: false,
        details: "Implementación del sistema de pagos ACH Xpress para transferencias bancarias rápidas",
        responsible: "Equipo de Pagos",
      },
      {
        name: "3DS Recargas",
        start_date: new Date(currentYear, 0, 15).toISOString(),
        end_date: new Date(currentYear, 2, 15).toISOString(),
        status: "external-dev",
        completed: true,
        details: "Integración del protocolo 3D Secure para recargas con mayor seguridad",
        responsible: "Equipo de Seguridad",
      },
      {
        name: "Correos con imagen de perfil transaccionales",
        start_date: new Date(currentYear, 0, 20).toISOString(),
        end_date: new Date(currentYear, 2, 10).toISOString(),
        status: "external-dev",
        completed: true,
        details:
          "Implementación de imágenes de perfil en correos transaccionales para mejorar la experiencia de usuario",
        responsible: "Equipo de UX",
      },
      {
        name: "Autenticación en 2 factores fase 1",
        start_date: new Date(currentYear, 1, 15).toISOString(),
        end_date: new Date(currentYear, 2, 25).toISOString(),
        status: "in-development",
        completed: false,
        details: "Primera fase de implementación de autenticación de dos factores vía correo y SMS",
        responsible: "Equipo de Seguridad",
      },
      {
        name: "Correos con imagen de perfil CX",
        start_date: new Date(currentYear, 2, 1).toISOString(),
        end_date: new Date(currentYear, 2, 30).toISOString(),
        status: "planned",
        completed: false,
        details: "Mejora de correos con imágenes de perfil para equipos de CX, Seguridad y Cumplimiento",
        responsible: "Equipo de UX",
      },
      {
        name: "Saldo inicio y fin en estado de cuenta",
        start_date: new Date(currentYear, 1, 25).toISOString(),
        end_date: new Date(currentYear, 3, 5).toISOString(),
        status: "impacted",
        completed: false,
        details: "Implementación de saldos iniciales y finales en los estados de cuenta mensuales",
        responsible: "Equipo de Finanzas",
      },
      {
        name: "Ambiente pre-productivo",
        start_date: new Date(currentYear, 2, 10).toISOString(),
        end_date: new Date(currentYear, 3, 10).toISOString(),
        status: "impacted",
        completed: false,
        details: "Configuración del ambiente pre-productivo para pruebas de integración",
        responsible: "Equipo de DevOps",
      },
      {
        name: "Notificaciones para billeteras",
        start_date: new Date(currentYear, 2, 15).toISOString(),
        end_date: new Date(currentYear, 3, 1).toISOString(),
        status: "in-development",
        completed: false,
        details: "Sistema de notificaciones para cobros de comisiones en billeteras digitales",
        responsible: "Equipo de Producto",
      },
      {
        name: "Recargas por AFT Sigma y MBSA",
        start_date: new Date(currentYear, 2, 20).toISOString(),
        end_date: new Date(currentYear, 3, 10).toISOString(),
        status: "in-development",
        completed: false,
        details: "Integración con proveedores AFT Sigma y MBSA para recargas",
        responsible: "Equipo de Integraciones",
      },
      {
        name: "Link de Recarga debido USA",
        start_date: new Date(currentYear, 1, 1).toISOString(),
        end_date: new Date(currentYear, 3, 1).toISOString(),
        status: "external-dev",
        completed: true,
        details: "Implementación de enlaces de recarga para usuarios en Estados Unidos",
        responsible: "Equipo Internacional",
      },
      {
        name: "Recargas ACH USA v1",
        start_date: new Date(currentYear, 0, 15).toISOString(),
        end_date: new Date(currentYear, 3, 15).toISOString(),
        status: "blocked",
        completed: false,
        details: "Primera versión del sistema de recargas ACH para Estados Unidos",
        responsible: "Equipo Internacional",
      },
      {
        name: "Orquestador de recargas tarjetas fase 2",
        start_date: new Date(currentYear, 3, 1).toISOString(),
        end_date: new Date(currentYear, 4, 15).toISOString(),
        status: "planned",
        completed: false,
        details: "Segunda fase del orquestador de recargas con tarjetas de crédito/débito",
        responsible: "Equipo de Pagos",
      },
      {
        name: "Ajuste de cédula Flujo upgrade",
        start_date: new Date(currentYear, 3, 5).toISOString(),
        end_date: new Date(currentYear, 4, 10).toISOString(),
        status: "planned",
        completed: false,
        details: "Mejoras en el flujo de verificación de cédula para upgrades de cuenta",
        responsible: "Equipo de Onboarding",
      },
      {
        name: "Listas de AML cambiar de Bloqueo a plan secado",
        start_date: new Date(currentYear, 3, 10).toISOString(),
        end_date: new Date(currentYear, 4, 20).toISOString(),
        status: "planned",
        completed: false,
        details: "Cambio en el manejo de listas AML de bloqueo inmediato a plan de secado gradual",
        responsible: "Equipo de Cumplimiento",
      },
      {
        name: "Emoji de seguridad",
        start_date: new Date(currentYear, 4, 1).toISOString(),
        end_date: new Date(currentYear, 4, 30).toISOString(),
        status: "priority-change",
        completed: false,
        details: "Implementación de emojis de seguridad para verificación de comunicaciones oficiales",
        responsible: "Equipo de Seguridad",
      },
    ]

    // Crear las tareas
    const { error: insertError } = await supabase.from("tasks").insert(sampleTasks)

    if (insertError) {
      console.error("Error al insertar datos de ejemplo:", insertError)
      return { success: false, error: insertError.message }
    }

    revalidatePath("/")
    return { success: true, message: "Base de datos inicializada con éxito" }
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
    return { success: false, error: "Error al inicializar la base de datos" }
  }
}

