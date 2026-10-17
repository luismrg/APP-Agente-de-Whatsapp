import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando semillado de Digloff (Taller Mecánico)...");

  // 1. Limpieza inicial controlada
  await prisma.aiLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.service.deleteMany();
  await prisma.businessSchedule.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();
  await prisma.aiSetting.deleteMany();

  // 2. Administrador y Empleados
  const adminEmail = process.env.ADMIN_EMAIL || "admin@digloff.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const employeePasswordHash = await bcrypt.hash("empleado1234", 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: "Luis Rodriguez (Jefe de Taller)",
      role: "ADMIN",
      active: true,
    },
  });

  const emp1 = await prisma.user.create({
    data: {
      email: "marcos@digloff.com",
      passwordHash: employeePasswordHash,
      name: "Marcos Serrano",
      role: "EMPLEADO",
      active: true,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      email: "elena@digloff.com",
      passwordHash: employeePasswordHash,
      name: "Elena Gómez",
      role: "EMPLEADO",
      active: true,
    },
  });

  console.log("Usuarios creados: 1 Administrador y 2 Empleados.");

  // 3. Negocio y Horarios
  const business = await prisma.business.create({
    data: {
      name: "Talleres Digloff - Mecánica y Diagnosis",
      phone: "+1 809 345 678",
      address: "Calle Jacintos de los Santos, 42, Mirador Este, Santo Domingo Este",
      defaultCapacity: 2, // 2 elevadores simultáneos
      slotDurationMinutes: 60,
      timezone: "Republica Dominicana/Santo Domingo",
      schedules: {
        create: [
          { dayOfWeek: 1, openTime: "08:30", closeTime: "19:00", lunchStart: "13:30", lunchEnd: "15:00", isOpen: true },
          { dayOfWeek: 2, openTime: "08:30", closeTime: "19:00", lunchStart: "13:30", lunchEnd: "15:00", isOpen: true },
          { dayOfWeek: 3, openTime: "08:30", closeTime: "19:00", lunchStart: "13:30", lunchEnd: "15:00", isOpen: true },
          { dayOfWeek: 4, openTime: "08:30", closeTime: "19:00", lunchStart: "13:30", lunchEnd: "15:00", isOpen: true },
          { dayOfWeek: 5, openTime: "08:30", closeTime: "18:30", lunchStart: "13:30", lunchEnd: "15:00", isOpen: true },
          { dayOfWeek: 6, openTime: "09:00", closeTime: "13:30", lunchStart: null, lunchEnd: null, isOpen: false }, // Sábados cerrado por ahora
          { dayOfWeek: 0, openTime: "00:00", closeTime: "00:00", lunchStart: null, lunchEnd: null, isOpen: false }, // Domingos cerrado
        ],
      },
      holidays: {
        create: [
          { date: "2026-11-01", description: "Día de Todos los Santos" },
          { date: "2026-12-06", description: "Día de la Constitución" },
          { date: "2026-12-08", description: "La Inmaculada Concepción" },
          { date: "2026-12-25", description: "Navidad" },
        ],
      },
    },
  });

  // 4. Los 8 Servicios Oficiales
  const srvAceite = await prisma.service.create({
    data: {
      name: "Cambio de aceite y filtros",
      description: "Sustitución de aceite sintético 5W30/0W20 homologado por fabricante y cambio de filtro de aceite y filtro de aire.",
      durationMinutes: 45,
      priceFrom: 89.0,
      requiresEstimate: false,
      active: true,
    },
  });

  const srvFrenos = await prisma.service.create({
    data: {
      name: "Frenos (pastillas y discos)",
      description: "Sustitución de pastillas de freno delanteras/traseras, medición de espesor de discos y comprobación de líquido de frenos.",
      durationMinutes: 60,
      priceFrom: 95.0,
      requiresEstimate: false,
      active: true,
    },
  });

  const srvNeumaticos = await prisma.service.create({
    data: {
      name: "Neumáticos (sustitución y equilibrado)",
      description: "Montaje, válvula nueva, equilibrado dinámico computarizado y ecotasa incluida por neumático.",
      durationMinutes: 45,
      priceFrom: 65.0,
      requiresEstimate: false,
      active: true,
    },
  });

  const srvPreITV = await prisma.service.create({
    data: {
      name: "Revisión pre-ITV exhaustiva",
      description: "Inspección de 45 puntos críticos: luces, frenómetro, holguras de dirección, suspensión, emisiones de gases y bajos.",
      durationMinutes: 60,
      priceFrom: 49.0,
      requiresEstimate: false,
      active: true,
    },
  });

  const srvDiagnosis = await prisma.service.create({
    data: {
      name: "Diagnosis electrónica de avería",
      description: "Conexión de máquina de diagnosis multimarca, escaneo de centralitas (ECU, ABS, Airbag), lectura y borrado de códigos DTC.",
      durationMinutes: 45,
      priceFrom: 45.0,
      requiresEstimate: false,
      active: true,
    },
  });

  const srvClima = await prisma.service.create({
    data: {
      name: "Aire acondicionado y climatización",
      description: "Vaciado del circuito, prueba de vacío para detección de fugas, recarga de gas refrigerante y tratamiento antibacterias.",
      durationMinutes: 60,
      priceFrom: 75.0,
      requiresEstimate: false,
      active: true,
    },
  });

  const srvDistribucion = await prisma.service.create({
    data: {
      name: "Embrague y distribución",
      description: "Kit de distribución con bomba de agua o kit de embrague con volante bimasa. Requiere presupuesto previo por modelo.",
      durationMinutes: 240,
      priceFrom: 450.0,
      requiresEstimate: true,
      active: true,
    },
  });

  const srvMecanica = await prisma.service.create({
    data: {
      name: "Mecánica general y averías complejas",
      description: "Reparación de turbos, inyectores, suspensión, dirección asistida o ruidos mecánicos anómalos tras prueba en carretera.",
      durationMinutes: 120,
      priceFrom: null,
      requiresEstimate: true,
      active: true,
    },
  });

  console.log("8 Servicios mecánicos registrados.");

  // 5. Configuración de IA Predeterminada
  await prisma.aiSetting.create({
    data: {
      enabled: true,
      model: "google/gemini-2.5-flash",
      temperature: 0.35,
      assistantName: "Digloff Asistente",
      tone: "Profesional, cercano, directo y eficiente",
      systemPrompt: `Eres el Asistente Virtual Inteligente de "Talleres Digloff", un taller mecánico de máxima confianza situado en San Fernando de Henares (Madrid).
Tu objetivo es dar una atención impecable por WhatsApp, resolver dudas sobre servicios y agendar citas en el taller de forma autónoma.
Trata al cliente con cordialidad (tuteo respetuoso o usted si el cliente es formal). Respuestas claras, concisas y naturales para WhatsApp.
Fecha y hora actual en Madrid: {{FECHA_HORA_MADRID}}.
Taller: {{DATOS_TALLER}}.
Servicios: {{SERVICIOS_TALLER}}.
Horario: {{HORARIO_TALLER}}.`,
      instructions: `REGLAS CRÍTICAS DE COMPORTAMIENTO:
1. En tu primer mensaje, preséntate brevemente como el asistente virtual de Talleres Digloff.
2. NUNCA inventes precios fijos para servicios que indiquen "requiere valoración previa" o averías desconocidas; explica que el importe exacto se confirma tras revisar el coche en elevador y ofrece una cita previa.
3. NUNCA des diagnósticos mecánicos como verdades absolutas. Habla de "posibles causas habituales" y aconseja revisarlo en persona con los mecánicos.
4. ANTE URGENCIAS viales (coche tirado en autovía, avería grave, accidente): deriva de inmediato al equipo humano y facilita el teléfono de grúa y urgencias del taller: +34 912 345 678.
5. Utiliza las herramientas de disponibilidad antes de confirmar citas. Si el cliente solicita una fecha, consulta disponibilidad y ofrece horas exactas.
6. Cuando tengas confirmación de cita (fecha, servicio, matrícula), llama a la herramienta 'crearCita'.
7. Si el cliente solicita hablar con una persona, muestra enfado o el caso se escapa de tus competencias, llama a 'derivarAPersona'.`,
      workshopKnowledge: `Preguntas frecuentes:
- ¿Tenéis coche de sustitución? Sí, disponemos de 2 vehículos de cortesía bajo reserva previa (sujeto a disponibilidad).
- ¿Aceptáis pago con tarjeta y Bizum? Sí, tarjeta, Bizum y efectivo.
- ¿Pasáis la ITV por mí? Sí, con el servicio de revisión pre-ITV podemos llevar tu coche a la estación de ITV por un suplemento de gestión más tasas.
- ¿Cuánto tiempo dais de garantía? Todas nuestras reparaciones cuentan con 1 año o 20.000 km de garantía en piezas y mano de obra.`,
      autoReplyDebounceSeconds: 8,
      readyNotificationEnabled: true,
      readyNotificationTemplate: "Hola {{nombre}}, te informamos desde Talleres Digloff de que tu vehículo {{vehiculo}} ({{matricula}}) ya está listo para ser recogido. ¡Te esperamos!",
      reminderEnabled: true,
      reminderTemplate: "Hola {{nombre}}, te recordamos tu cita de mañana a las {{hora}} en Talleres Digloff para {{servicio}} en tu {{vehiculo}}. Si necesitas cambiarla, dínoslo por aquí.",
    },
  });

  // 6. 15 Contactos con Vehículos Reales Españoles
  const rawContacts = [
    {
      name: "Javier Ruiz Martínez",
      phone: "34612345671",
      email: "javier.ruiz@gmail.com",
      stage: "CITA_AGENDADA",
      tags: "Particular, Cliente habitual",
      notes: "Cliente muy puntual. Siempre pide revisión completa antes de viajes largos.",
      vehicle: { plate: "4821 KBN", brand: "Seat", model: "León 1.6 TDI 115cv", year: 2018, km: 115400 },
    },
    {
      name: "Laura Fernández Soto",
      phone: "34612345672",
      email: "laura.fsoto@hotmail.com",
      stage: "EN_CONVERSACION",
      tags: "Particular",
      notes: "Pregunta por vibración en el volante al frenar a alta velocidad.",
      vehicle: { plate: "9302 JMP", brand: "Renault", model: "Mégane 1.5 dCi Business", year: 2016, km: 142100 },
    },
    {
      name: "Miguel Ángel Blanco",
      phone: "34612345673",
      email: "miki.blanco@yahoo.es",
      stage: "CITA_AGENDADA",
      tags: "VIP, Flota",
      notes: "Empresa de mensajería ligera. Prioridad en mantenimientos rápidos.",
      vehicle: { plate: "1289 LPT", brand: "Volkswagen", model: "Golf VII 2.0 TDI", year: 2020, km: 78500 },
    },
    {
      name: "Carmen Ortiz Romero",
      phone: "34612345674",
      email: "carmen.ortiz@gmail.com",
      stage: "PRESUPUESTO_ENVIADO",
      tags: "Particular",
      notes: "Se le ha enviado presupuesto para sustitución de correa de distribución y bomba.",
      vehicle: { plate: "5543 HZB", brand: "Ford", model: "Focus 1.0 EcoBoost Titanium", year: 2015, km: 125300 },
    },
    {
      name: "David Molina Gil",
      phone: "34612345675",
      email: "david.molina@outlook.com",
      stage: "GANADO",
      tags: "Particular, Híbrido",
      notes: "Vino para cambio de filtros y quedó muy satisfecho con la atención rápida.",
      vehicle: { plate: "7721 MBR", brand: "Toyota", model: "Corolla 125H Active Tech", year: 2022, km: 34200 },
    },
    {
      name: "Sofía Navarro Vega",
      phone: "34612345676",
      email: "sofia.navarro@gmail.com",
      stage: "CITA_AGENDADA",
      tags: "Particular",
      notes: "Necesita pasar la ITV en dos semanas. Ha pedido revisión pre-ITV.",
      vehicle: { plate: "3108 KGF", brand: "Peugeot", model: "308 1.2 PureTech Allure", year: 2017, km: 98400 },
    },
    {
      name: "Alejandro Morales",
      phone: "34612345677",
      email: "amorales@icloud.com",
      stage: "NUEVO",
      tags: "Nuevo contacto",
      notes: "Escribió por WhatsApp preguntando por recarga de aire acondicionado.",
      vehicle: { plate: "8812 LSK", brand: "Hyundai", model: "Tucson 1.6 CRDi 48V", year: 2021, km: 52100 },
    },
    {
      name: "Lucía Domínguez Sanz",
      phone: "34612345678",
      email: "lucia.dominguez@gmail.com",
      stage: "CITA_AGENDADA",
      tags: "Particular",
      notes: "Coche en taller para sustitución de pastillas de freno.",
      vehicle: { plate: "6401 JRD", brand: "Nissan", model: "Qashqai 1.2 DIG-T Acenta", year: 2016, km: 110500 },
    },
    {
      name: "Roberto Iglesias",
      phone: "34612345679",
      email: "roberto.iglesias@gmail.com",
      stage: "EN_CONVERSACION",
      tags: "Particular",
      notes: "Le salta testigo de emisiones esporádico en el cuadro.",
      vehicle: { plate: "2290 KHB", brand: "Audi", model: "A4 Avant 2.0 TDI S-Line", year: 2018, km: 160800 },
    },
    {
      name: "Patricia Herrera",
      phone: "34612345680",
      email: "patricia.herrera@gmail.com",
      stage: "NUEVO",
      tags: "Nuevo contacto",
      notes: "Primera toma de contacto para revisión del primer año tras compra de segunda mano.",
      vehicle: { plate: "4182 MBP", brand: "Kia", model: "Sportage 1.6 GDI Concept", year: 2023, km: 19400 },
    },
    {
      name: "Andrés Cano Lozano",
      phone: "34612345681",
      email: "andres.cano@hotmail.com",
      stage: "CITA_AGENDADA",
      tags: "Particular, Gama Alta",
      notes: "Mantenimiento periódico y cambio de líquido de frenos.",
      vehicle: { plate: "7034 LFD", brand: "BMW", model: "Serie 3 320d Touring", year: 2019, km: 95200 },
    },
    {
      name: "Beatriz Gallego",
      phone: "34612345682",
      email: "bgallego@gmail.com",
      stage: "PERDIDO",
      tags: "Particular",
      notes: "Prefirió acudir al concesionario oficial por estar el coche en extensión de garantía.",
      vehicle: { plate: "8923 KXT", brand: "Mercedes-Benz", model: "Clase A 180d AMG Line", year: 2018, km: 88700 },
    },
    {
      name: "Manuel Pardo Vidal",
      phone: "34612345683",
      email: "manuel.pardo@gmail.com",
      stage: "PRESUPUESTO_ENVIADO",
      tags: "Taxi / VTC",
      notes: "Requiere factura desglosada y plazo cerrado.",
      vehicle: { plate: "1567 HYZ", brand: "Citroën", model: "C4 Picasso 1.6 BlueHDi", year: 2015, km: 175600 },
    },
    {
      name: "Silvia Castro Méndez",
      phone: "34612345684",
      email: "silvia.castro@gmail.com",
      stage: "CITA_AGENDADA",
      tags: "Particular, Deportivo",
      notes: "Cita agendada automáticamente por la IA para cambio de neumáticos delanteros.",
      vehicle: { plate: "3904 MCD", brand: "Cupra", model: "Formentor 1.5 TSI 150cv", year: 2022, km: 28900 },
    },
    {
      name: "Jorge Benítez Prieto",
      phone: "34612345685",
      email: "jorge.benitez@gmail.com",
      stage: "GANADO",
      tags: "Particular, 4x4",
      notes: "Coche entregado con éxito tras sustitución de amortiguadores.",
      vehicle: { plate: "6619 KRT", brand: "Dacia", model: "Duster 1.5 dCi 4x4 Prestige", year: 2017, km: 130200 },
    },
  ];

  const createdContacts: Array<{ contact: any; vehicle: any }> = [];

  for (const c of rawContacts) {
    const contact = await prisma.contact.create({
      data: {
        phone: c.phone,
        jid: `${c.phone}@s.whatsapp.net`,
        lid: `${c.phone}01@lid`,
        name: c.name,
        email: c.email,
        notes: c.notes,
        tags: c.tags,
        stage: c.stage,
        vehicles: {
          create: [
            {
              plate: c.vehicle.plate,
              brand: c.vehicle.brand,
              model: c.vehicle.model,
              year: c.vehicle.year,
              kilometers: c.vehicle.km,
              notes: "Vehículo principal",
            },
          ],
        },
      },
      include: {
        vehicles: true,
      },
    });

    createdContacts.push({
      contact,
      vehicle: contact.vehicles[0],
    });
  }

  console.log("15 Contactos con sus vehículos y matrículas creados.");

  // 7. Potenciales (Leads en Kanban)
  const leadStages = [
    { title: "Recarga de aire e higienización", val: 85, stage: "NUEVO", srv: srvClima, contactIdx: 6, user: emp1 },
    { title: "Diagnosis por testigo motor", val: 45, stage: "EN_CONVERSACION", srv: srvDiagnosis, contactIdx: 8, user: emp2 },
    { title: "Kit distribución y bomba agua", val: 480, stage: "PRESUPUESTO_ENVIADO", srv: srvDistribucion, contactIdx: 3, user: admin },
    { title: "Revisión pre-ITV y luces", val: 49, stage: "CITA_AGENDADA", srv: srvPreITV, contactIdx: 5, user: emp1 },
    { title: "Cambio 2 neumáticos Goodyear", val: 190, stage: "CITA_AGENDADA", srv: srvNeumaticos, contactIdx: 13, user: emp2 },
    { title: "Mantenimiento 30.000 km Toyota", val: 120, stage: "GANADO", srv: srvAceite, contactIdx: 4, user: emp1 },
    { title: "Sustitución amortiguadores 4x4", val: 320, stage: "GANADO", srv: srvMecanica, contactIdx: 14, user: admin },
    { title: "Pastillas delanteras y líquido", val: 110, stage: "PERDIDO", srv: srvFrenos, contactIdx: 11, user: emp2 },
    { title: "Revisión general compra VO", val: 60, stage: "NUEVO", srv: srvMecanica, contactIdx: 9, user: null },
  ];

  for (const l of leadStages) {
    await prisma.lead.create({
      data: {
        contactId: createdContacts[l.contactIdx].contact.id,
        serviceId: l.srv.id,
        title: l.title,
        estimatedValue: l.val,
        stage: l.stage,
        assignedToUserId: l.user ? l.user.id : null,
        lastActivityAt: new Date(),
      },
    });
  }

  console.log("Leads para el tablero Kanban generados.");

  // 8. Citas repartidas en las 2 próximas semanas (con control de aforo y etiquetas IA/Manual)
  const now = new Date();
  
  // Función auxiliar para fijar hora en días relativos
  const makeDate = (daysOffset: number, hour: number, minute: number = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const sampleAppointments = [
    // Hoy
    {
      cIdx: 0,
      srv: srvAceite,
      start: makeDate(0, 9, 30),
      end: makeDate(0, 10, 15),
      status: "LISTO_PARA_RECOGER",
      source: "IA",
      user: emp1,
      notes: "Aceite 5W30 Castrol Magnatec. Filtro Purflux. Coche lavado exterior de cortesía.",
    },
    {
      cIdx: 7,
      srv: srvFrenos,
      start: makeDate(0, 11, 0),
      end: makeDate(0, 12, 0),
      status: "EN_TALLER",
      source: "MANUAL",
      user: emp2,
      notes: "Pastillas Brembo delanteras montadas. Comprobando discos.",
    },
    {
      cIdx: 2,
      srv: srvPreITV,
      start: makeDate(0, 15, 30),
      end: makeDate(0, 16, 30),
      status: "CONFIRMADA",
      source: "IA",
      user: emp1,
      notes: "Cita agendada por el asistente virtual. Revisar reglaje de faro izquierdo.",
    },
    // Mañana
    {
      cIdx: 5,
      srv: srvPreITV,
      start: makeDate(1, 10, 0),
      end: makeDate(1, 11, 0),
      status: "CONFIRMADA",
      source: "MANUAL",
      user: emp1,
      notes: "Cliente deja el coche a primera hora y lo recoge al salir del trabajo.",
    },
    {
      cIdx: 13,
      srv: srvNeumaticos,
      start: makeDate(1, 11, 30),
      end: makeDate(1, 12, 15),
      status: "CONFIRMADA",
      source: "IA",
      user: emp2,
      notes: "Cita IA. 2 Neumáticos Michelin Primacy 4 225/45 R18 95Y.",
    },
    // Días siguientes
    {
      cIdx: 10,
      srv: srvAceite,
      start: makeDate(3, 9, 0),
      end: makeDate(3, 9, 45),
      status: "PENDIENTE",
      source: "IA",
      user: emp1,
      notes: "Cambio de aceite y filtro habitual de mantenimiento.",
    },
    {
      cIdx: 1,
      srv: srvDiagnosis,
      start: makeDate(4, 16, 0),
      end: makeDate(4, 16, 45),
      status: "PENDIENTE",
      source: "MANUAL",
      user: emp2,
      notes: "Revisar vibración en frenada y comprobar equilibrado.",
    },
    {
      cIdx: 3,
      srv: srvDistribucion,
      start: makeDate(7, 9, 0),
      end: makeDate(7, 13, 0),
      status: "CONFIRMADA",
      source: "MANUAL",
      user: admin,
      notes: "Kit de distribución completo. Coche de cortesía reservado.",
    },
    {
      cIdx: 8,
      srv: srvDiagnosis,
      start: makeDate(9, 10, 30),
      end: makeDate(9, 11, 15),
      status: "PENDIENTE",
      source: "IA",
      user: emp2,
      notes: "Testigo motor amarillo intermitente en cuadro.",
    },
  ];

  for (const a of sampleAppointments) {
    await prisma.appointment.create({
      data: {
        contactId: createdContacts[a.cIdx].contact.id,
        vehicleId: createdContacts[a.cIdx].vehicle.id,
        serviceId: a.srv.id,
        startTime: a.start,
        endTime: a.end,
        status: a.status,
        source: a.source,
        assignedToUserId: a.user.id,
        notes: a.notes,
      },
    });
  }

  console.log("Citas de calendario repartidas en dos semanas creadas.");

  // 9. Conversaciones y Mensajes en Bandeja de Entrada (Estilo Chatwoot)
  // Conversación 1: Javier Ruiz (Atendida por IA, cita agendada con éxito)
  const conv1 = await prisma.conversation.create({
    data: {
      contactId: createdContacts[0].contact.id,
      status: "ABIERTA",
      aiActive: true,
      needsHumanAttention: false,
      assignedToUserId: emp1.id,
      unreadCount: 0,
      lastMessageAt: makeDate(0, -2, 0),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderType: "CLIENTE",
        content: "Hola buenas, necesitaría hacerle el cambio de aceite y filtros al Seat León antes de irme de viaje este fin de semana.",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        conversationId: conv1.id,
        senderType: "IA",
        content: "¡Hola Javier! Soy el asistente virtual de Talleres Digloff. Estaré encantado de ayudarte. El servicio de cambio de aceite y filtros para tu Seat León 1.6 TDI (4821 KBN) tiene un precio desde 89 € e incluye aceite sintético y filtros nuevos. ¿Te vendría bien hoy a las 09:30 o prefieres mañana a las 10:00?",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 3600000 * 4.9),
      },
      {
        conversationId: conv1.id,
        senderType: "CLIENTE",
        content: "Hoy a las 09:30 me va perfecto, os lo dejo allí antes de entrar al curro.",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 3600000 * 4.8),
      },
      {
        conversationId: conv1.id,
        senderType: "IA",
        content: "¡Listo! Te he reservado la cita para hoy a las 09:30 h con nuestro compañero Marcos. Durará unos 45 minutos. Te esperamos en Calle Jacintos de los Santos, 42, Mirador Este, Santo Domingo Este. ¡Muchas gracias!",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 3600000 * 4.7),
      },
      {
        conversationId: conv1.id,
        senderType: "EMPLEADO",
        senderUserId: emp1.id,
        content: "Revisión completada sin incidencias. Nivel de anticongelante rellenado de cortesía.",
        isInternalNote: true,
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
    ],
  });

  // Conversación 2: Laura Fernández (Necesita atención humana / Derivada)
  const conv2 = await prisma.conversation.create({
    data: {
      contactId: createdContacts[1].contact.id,
      status: "ABIERTA",
      aiActive: false, // IA pausada por derivación a humano
      needsHumanAttention: true, // Flag activo
      assignedToUserId: emp2.id,
      unreadCount: 1,
      lastMessageAt: new Date(Date.now() - 1800000),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        senderType: "CLIENTE",
        content: "Hola, os escribo porque noto que el coche vibra muchísimo cuando freno a más de 100 km/h en la autovía y hace un chirrido metálico. ¿Qué puede ser y cuánto me costaría arreglarlo?",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        conversationId: conv2.id,
        senderType: "IA",
        content: "Hola Laura, soy el asistente virtual de Talleres Digloff. Esa vibración al frenar suele estar asociada a discos de freno alabeados o un desgaste crítico de pastillas. Para tu seguridad, prefiero que un mecánico especialista lo valore directamente en elevador. Te paso de inmediato con el equipo del taller para que puedan darte presupuesto exacto.",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 3500000),
      },
      {
        conversationId: conv2.id,
        senderType: "IA",
        content: "[DERIVACIÓN A PERSONA]: El cliente describe vibración severa en frenada a alta velocidad y ruidos metálicos. Se desactiva la IA y se asigna al equipo de recepción.",
        isInternalNote: true,
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 3490000),
      },
      {
        conversationId: conv2.id,
        senderType: "CLIENTE",
        content: "Vale, espero que me digáis algo, gracias.",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  // Conversación 3: Silvia Castro (Cita IA confirmada para neumáticos)
  const conv3 = await prisma.conversation.create({
    data: {
      contactId: createdContacts[13].contact.id,
      status: "ABIERTA",
      aiActive: true,
      needsHumanAttention: false,
      assignedToUserId: emp2.id,
      unreadCount: 0,
      lastMessageAt: new Date(Date.now() - 7200000),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv3.id,
        senderType: "CLIENTE",
        content: "Buenas tardes, ¿tenéis cita mañana para cambiar los dos neumáticos delanteros de un Cupra Formentor 3904 MCD?",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 7500000),
      },
      {
        conversationId: conv3.id,
        senderType: "IA",
        content: "¡Hola Silvia! Soy el asistente virtual de Talleres Digloff. Sí, tenemos disponibilidad mañana a las 11:30 h en nuestro segundo elevador. La sustitución y equilibrado tiene un precio desde 65 € por neumático (más cubierta según marca elegida). ¿Te agendo la cita a las 11:30 h?",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 7400000),
      },
      {
        conversationId: conv3.id,
        senderType: "CLIENTE",
        content: "Sí por favor, agéndamela a las 11:30. Muchas gracias.",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 7300000),
      },
      {
        conversationId: conv3.id,
        senderType: "IA",
        content: "¡Confirmada tu cita para mañana a las 11:30 h en Talleres Digloff para el Cupra Formentor (3904 MCD)! Queda asignada a nuestra especialista Elena. ¡Hasta mañana!",
        mediaType: "TEXTO",
        createdAt: new Date(Date.now() - 7200000),
      },
    ],
  });

  console.log("Conversaciones de WhatsApp y notas internas de prueba creadas.");
  console.log("¡Semillado completado con éxito!");
  console.log("-----------------------------------------------------------------");
  console.log(`Credenciales Administrador: ${adminEmail} / ${adminPassword}`);
  console.log("Credenciales Empleado: marcos@digloff.com / empleado1234");
  console.log("Credenciales Empleado: elena@digloff.com / empleado1234");
  console.log("-----------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
