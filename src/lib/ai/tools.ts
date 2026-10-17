import prisma from "@/lib/prisma";
import { emitRealtimeEvent } from "@/lib/events/bus";

export const aiToolDefinitions = [
  {
    type: "function",
    function: {
      name: "consultarServicios",
      description: "Consulta los servicios de mantenimiento y reparación mecánica que ofrece Talleres Digloff con precios desde y duración.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultarDisponibilidad",
      description: "Comprueba las franjas horarias libres y elevadores disponibles para una fecha específica (formato YYYY-MM-DD).",
      parameters: {
        type: "object",
        properties: {
          fecha: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD (ej: 2026-10-19)",
          },
        },
        required: ["fecha"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crearCita",
      description: "Agenda y confirma una cita en el taller mecánico para el cliente.",
      parameters: {
        type: "object",
        properties: {
          fechaHoraInicio: {
            type: "string",
            description: "Fecha y hora de inicio en formato ISO o YYYY-MM-DD HH:mm (ej: 2026-10-19 10:30)",
          },
          nombreServicio: {
            type: "string",
            description: "Nombre o descripción del servicio solicitado (ej: 'Cambio de aceite y filtros', 'Frenos', 'Revisión pre-ITV')",
          },
          matricula: {
            type: "string",
            description: "Matrícula del vehículo (ej: '1234 ABC')",
          },
          modeloVehiculo: {
            type: "string",
            description: "Marca y modelo del coche (ej: 'Seat León', 'Renault Mégane')",
          },
          notas: {
            type: "string",
            description: "Observaciones del cliente o síntoma que presenta el vehículo",
          },
        },
        required: ["fechaHoraInicio", "nombreServicio", "matricula"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cambiarOCancelarCita",
      description: "Modifica la fecha de una cita existente o la cancela en el calendario.",
      parameters: {
        type: "object",
        properties: {
          citaId: { type: "string", description: "ID de la cita si se conoce" },
          matricula: { type: "string", description: "Matrícula del coche asociado a la cita" },
          accion: { type: "string", enum: ["CAMBIAR", "CANCELAR"], description: "Acción a realizar" },
          nuevaFechaHora: { type: "string", description: "Nueva fecha y hora en formato YYYY-MM-DD HH:mm (solo si accion es CAMBIAR)" },
        },
        required: ["accion"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultarEstadoVehiculo",
      description: "Consulta el estado actual de una reparación o cita de un vehículo en el taller mediante su matrícula.",
      parameters: {
        type: "object",
        properties: {
          matricula: { type: "string", description: "Matrícula del vehículo" },
        },
        required: ["matricula"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "guardarDatosContacto",
      description: "Guarda o actualiza la información del contacto y su vehículo (nombre, matrícula, marca, modelo, km).",
      parameters: {
        type: "object",
        properties: {
          nombre: { type: "string", description: "Nombre completo del cliente" },
          matricula: { type: "string", description: "Matrícula del vehículo" },
          marca: { type: "string", description: "Marca del coche" },
          modelo: { type: "string", description: "Modelo del coche" },
          kilometros: { type: "number", description: "Kilometraje actual aproximado" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "derivarAPersona",
      description: "Transfiere la conversación a un recepcionista o mecánico humano, pausando la IA y alertando al equipo.",
      parameters: {
        type: "object",
        properties: {
          motivo: {
            type: "string",
            description: "Motivo de la derivación (ej: urgencia vial, avería compleja sin diagnosticar, petición explícita del cliente)",
          },
        },
        required: ["motivo"],
      },
    },
  },
];

export async function executeAiTool(
  toolName: string,
  args: any,
  context: { contactId: string; conversationId: string }
): Promise<string> {
  const startTime = Date.now();
  let resultOutput: any = null;
  let executionError: string | null = null;

  try {
    switch (toolName) {
      case "consultarServicios": {
        const services = await prisma.service.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            description: true,
            durationMinutes: true,
            priceFrom: true,
            requiresEstimate: true,
          },
        });
        resultOutput = {
          mensaje: "Servicios oficiales disponibles en Talleres Digloff",
          servicios: services.map((s) => ({
            id: s.id,
            nombre: s.name,
            descripcion: s.description,
            duracionMinutos: s.durationMinutes,
            precioDesde: s.priceFrom ? `${s.priceFrom} €` : "A consultar",
            requiereValoracionPrevia: s.requiresEstimate,
          })),
        };
        break;
      }

      case "consultarDisponibilidad": {
        const { fecha } = args;
        const targetDate = new Date(fecha);
        const dayOfWeek = targetDate.getDay();

        // 1. Horario del taller
        const business = await prisma.business.findFirst({
          include: { schedules: true, holidays: true },
        });

        const holiday = business?.holidays.find((h) => h.date === fecha);
        if (holiday) {
          resultOutput = {
            disponible: false,
            motivo: `El taller permanece cerrado en esta fecha por festivo: ${holiday.description}.`,
          };
          break;
        }

        const schedule = business?.schedules.find((s) => s.dayOfWeek === dayOfWeek);
        if (!schedule || !schedule.isOpen) {
          resultOutput = {
            disponible: false,
            motivo: "El taller permanece cerrado los domingos y festivos.",
          };
          break;
        }

        // Citas ya programadas ese día
        const dayStart = new Date(`${fecha}T00:00:00.000Z`);
        const dayEnd = new Date(`${fecha}T23:59:59.999Z`);
        const appointments = await prisma.appointment.findMany({
          where: {
            startTime: { gte: dayStart, lte: dayEnd },
            status: { not: "CANCELADA" },
          },
        });

        const capacity = business?.defaultCapacity || 2;
        // Generamos huecos libres de ejemplo en horario comercial
        const slots = [
          "09:00",
          "10:00",
          "11:30",
          "12:30",
          "15:30",
          "16:30",
          "17:30",
        ];

        const availableSlots = slots.filter((slot) => {
          const bookedInSlot = appointments.filter((a) => {
            const h = a.startTime.getHours().toString().padStart(2, "0");
            const m = a.startTime.getMinutes().toString().padStart(2, "0");
            return `${h}:${m}` === slot;
          }).length;
          return bookedInSlot < capacity;
        });

        resultOutput = {
          fecha,
          elevadoresTotales: capacity,
          huecosDisponibles: availableSlots,
          mensaje: availableSlots.length > 0
            ? `Tenemos disponibilidad para el día ${fecha} en las siguientes horas: ${availableSlots.join(", ")}.`
            : `El día ${fecha} tenemos el aforo completo en nuestros elevadores.`,
        };
        break;
      }

      case "crearCita": {
        const { fechaHoraInicio, nombreServicio, matricula, modeloVehiculo, notas } = args;
        const contactId = context.contactId;

        // Normalizar matrícula
        const cleanPlate = matricula.toUpperCase().trim();

        // 1. Buscar o crear vehículo
        let vehicle = await prisma.vehicle.findFirst({
          where: { plate: cleanPlate },
        });

        if (!vehicle) {
          vehicle = await prisma.vehicle.create({
            data: {
              contactId,
              plate: cleanPlate,
              brand: modeloVehiculo ? modeloVehiculo.split(" ")[0] : "Vehículo",
              model: modeloVehiculo ? modeloVehiculo.split(" ").slice(1).join(" ") : "Cliente",
              notes: notas || "Alta automática por asistente de WhatsApp",
            },
          });
        }

        // 2. Buscar servicio
        let service = await prisma.service.findFirst({
          where: { name: { contains: nombreServicio } },
        });

        if (!service) {
          service = await prisma.service.findFirst({
            where: { name: { contains: "Mecánica" } },
          });
        }

        const start = new Date(fechaHoraInicio);
        const duration = service?.durationMinutes || 60;
        const end = new Date(start.getTime() + duration * 60 * 1000);

        // Asignar primer empleado disponible
        const defaultEmployee = await prisma.user.findFirst({
          where: { role: "EMPLEADO", active: true },
        });

        const appointment = await prisma.appointment.create({
          data: {
            contactId,
            vehicleId: vehicle.id,
            serviceId: service?.id,
            startTime: start,
            endTime: end,
            status: "PENDIENTE",
            source: "IA",
            assignedToUserId: defaultEmployee?.id,
            notes: notas || `Cita creada por Asistente IA para ${service?.name || nombreServicio}`,
          },
          include: { service: true, vehicle: true, contact: true },
        });

        // Mover potencial a 'CITA_AGENDADA'
        await prisma.lead.updateMany({
          where: { contactId },
          data: { stage: "CITA_AGENDADA", lastActivityAt: new Date() },
        });

        emitRealtimeEvent({
          type: "appointment_updated",
          data: { appointmentId: appointment.id, action: "CREATED_BY_IA" },
        });

        resultOutput = {
          exito: true,
          citaId: appointment.id,
          mensaje: `Cita reservada con éxito para el ${appointment.startTime.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}. Vehículo: ${vehicle.plate}. Servicio: ${service?.name}.`,
        };
        break;
      }

      case "cambiarOCancelarCita": {
        const { accion, matricula, nuevaFechaHora } = args;
        const cleanPlate = matricula?.toUpperCase().trim();

        const appointment = await prisma.appointment.findFirst({
          where: {
            contactId: context.contactId,
            ...(cleanPlate ? { vehicle: { plate: cleanPlate } } : {}),
            status: { not: "CANCELADA" },
          },
          orderBy: { startTime: "desc" },
        });

        if (!appointment) {
          resultOutput = { exito: false, mensaje: "No se localizó ninguna cita activa para gestionar." };
          break;
        }

        if (accion === "CANCELAR") {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { status: "CANCELADA" },
          });
          resultOutput = { exito: true, mensaje: "La cita ha sido cancelada correctamente." };
        } else if (accion === "CAMBIAR" && nuevaFechaHora) {
          const newStart = new Date(nuevaFechaHora);
          const durationMs = appointment.endTime.getTime() - appointment.startTime.getTime();
          const newEnd = new Date(newStart.getTime() + durationMs);

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { startTime: newStart, endTime: newEnd, status: "PENDIENTE" },
          });
          resultOutput = { exito: true, mensaje: `La cita ha sido modificada para el ${newStart.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}.` };
        }
        break;
      }

      case "consultarEstadoVehiculo": {
        const { matricula } = args;
        const cleanPlate = matricula.toUpperCase().trim();

        const appointment = await prisma.appointment.findFirst({
          where: { vehicle: { plate: cleanPlate } },
          include: { vehicle: true, service: true },
          orderBy: { startTime: "desc" },
        });

        if (!appointment) {
          resultOutput = {
            mensaje: `No constan reparaciones en curso para la matrícula ${cleanPlate}.`,
          };
        } else {
          resultOutput = {
            matricula: cleanPlate,
            vehiculo: `${appointment.vehicle?.brand} ${appointment.vehicle?.model}`,
            servicio: appointment.service?.name,
            estadoActual: appointment.status,
            fechaCita: appointment.startTime.toLocaleString("es-ES", { timeZone: "Europe/Madrid" }),
            explicacionEstado:
              appointment.status === "LISTO_PARA_RECOGER"
                ? "El coche ya está terminado y listo para ser retirado en el taller."
                : appointment.status === "EN_TALLER"
                ? "El coche se encuentra en estos momentos en el elevador siendo revisado."
                : "La cita está programada.",
          };
        }
        break;
      }

      case "guardarDatosContacto": {
        const { nombre, matricula, marca, modelo, kilometros } = args;
        if (nombre) {
          await prisma.contact.update({
            where: { id: context.contactId },
            data: { name: nombre },
          });
        }
        if (matricula) {
          const cleanPlate = matricula.toUpperCase().trim();
          await prisma.vehicle.upsert({
            where: { id: "temp-search" }, // trigger fallback
            create: {
              contactId: context.contactId,
              plate: cleanPlate,
              brand: marca || "General",
              model: modelo || "Modelo",
              kilometers: kilometros || null,
            },
            update: {
              brand: marca,
              model,
              kilometers,
            },
          }).catch(async () => {
            const existing = await prisma.vehicle.findFirst({ where: { plate: cleanPlate } });
            if (existing) {
              await prisma.vehicle.update({
                where: { id: existing.id },
                data: { brand: marca || existing.brand, model: modelo || existing.model, kilometers: kilometros || existing.kilometers },
              });
            } else {
              await prisma.vehicle.create({
                data: {
                  contactId: context.contactId,
                  plate: cleanPlate,
                  brand: marca || "General",
                  model: modelo || "Modelo",
                  kilometers: kilometros || null,
                },
              });
            }
          });
        }
        resultOutput = { exito: true, mensaje: "Datos guardados en la ficha del cliente." };
        break;
      }

      case "derivarAPersona": {
        const { motivo } = args;
        // 1. Pausa IA y marca derivación
        await prisma.conversation.update({
          where: { id: context.conversationId },
          data: {
            aiActive: false,
            needsHumanAttention: true,
          },
        });

        // 2. Crea nota interna
        await prisma.message.create({
          data: {
            conversationId: context.conversationId,
            senderType: "IA",
            content: `[DERIVACIÓN AUTOMÁTICA A PERSONA]: ${motivo}`,
            isInternalNote: true,
            mediaType: "TEXTO",
          },
        });

        emitRealtimeEvent({
          type: "conversation_updated",
          data: {
            conversationId: context.conversationId,
            patch: { aiActive: false, needsHumanAttention: true },
          },
        });

        resultOutput = {
          derivado: true,
          mensaje: "La conversación se ha pausado y transferido al equipo humano del taller con una alerta prioritaria.",
        };
        break;
      }

      default:
        resultOutput = { error: `Herramienta ${toolName} no reconocida.` };
    }
  } catch (err: any) {
    executionError = err?.message || String(err);
    console.error(`Error en ejecución de tool ${toolName}:`, err);
    resultOutput = { error: `Fallo al ejecutar ${toolName}: ${executionError}` };
  } finally {
    // Registro de auditoría para el administrador
    await prisma.aiLog.create({
      data: {
        conversationId: context.conversationId,
        toolName,
        inputJson: JSON.stringify(args),
        outputJson: JSON.stringify(resultOutput),
        error: executionError,
        executionTimeMs: Date.now() - startTime,
      },
    }).catch(() => {});
  }

  return JSON.stringify(resultOutput);
}
