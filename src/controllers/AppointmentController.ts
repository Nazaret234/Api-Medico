import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import db from "../services/database";

export class AppointmentController extends BaseController {
  /**
   * Obtener todas las citas
   */
  async getAllAppointments(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, status, date } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (date) {
        const startOfDay = new Date(date as string);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        
        where.dateTime = {
          gte: startOfDay,
          lt: endOfDay,
        };
      }

      const appointments = await db.prisma.appointment.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          patient: {
            include: {
              patient: {
                include: {
                  user: true,
                },
              },
            },
          },
          doctor: {
            include: {
              doctor: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          dateTime: 'desc',
        },
      });

      const total = await db.prisma.appointment.count({ where });

      return this.sendSuccess(res, {
        appointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Citas obtenidas exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Obtener una cita por ID
   */
  async getAppointmentById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.sendError(res, "ID de cita requerido", 400);
      }

      const appointment = await db.findAppointmentById(id);
      if (!appointment) {
        return this.sendError(res, "Cita no encontrada", 404);
      }

      return this.sendSuccess(res, appointment, "Cita obtenida exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Crear una nueva cita
   */
  async createAppointment(req: Request, res: Response): Promise<Response> {
    try {
      const { 
        patientId, 
        doctorId, 
        dateTime, 
        notes 
      } = req.body;

      // Validar datos requeridos
      if (!patientId || !doctorId || !dateTime) {
        return this.sendError(res, "ID del paciente, ID del doctor y fecha/hora son requeridos", 400);
      }

      // Verificar que la fecha sea futura
      const appointmentDate = new Date(dateTime);
      if (appointmentDate <= new Date()) {
        return this.sendError(res, "La fecha de la cita debe ser futura", 400);
      }

      // Verificar que el paciente existe
      const patient = await db.findPatientByUserId(patientId);
      if (!patient) {
        return this.sendError(res, "Paciente no encontrado", 404);
      }

      // Verificar que el doctor existe
      const doctor = await db.findDoctorByUserId(doctorId);
      if (!doctor) {
        return this.sendError(res, "Doctor no encontrado", 404);
      }

      // Verificar disponibilidad del doctor en esa fecha/hora
      const conflictingAppointment = await db.prisma.appointment.findFirst({
        where: {
          doctorId,
          dateTime: appointmentDate,
          status: {
            in: ['SCHEDULED'],
          },
        },
      });

      if (conflictingAppointment) {
        return this.sendError(res, "El doctor ya tiene una cita en esa fecha y hora", 400);
      }

      const appointment = await db.createAppointment({
        patientId,
        doctorId,
        dateTime: appointmentDate,
        notes,
      });

      return this.sendSuccess(res, appointment, "Cita creada exitosamente", 201);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Actualizar una cita
   */
  async updateAppointment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { dateTime, status, notes } = req.body;

      if (!id) {
        return this.sendError(res, "ID de cita requerido", 400);
      }

      // Verificar si la cita existe
      const existingAppointment = await db.findAppointmentById(id);
      if (!existingAppointment) {
        return this.sendError(res, "Cita no encontrada", 404);
      }

      // Si se está cambiando la fecha, verificar que sea futura
      if (dateTime) {
        const appointmentDate = new Date(dateTime);
        if (appointmentDate <= new Date()) {
          return this.sendError(res, "La fecha de la cita debe ser futura", 400);
        }

        // Verificar disponibilidad si se cambia la fecha
        const conflictingAppointment = await db.prisma.appointment.findFirst({
          where: {
            doctorId: existingAppointment.doctorId,
            dateTime: appointmentDate,
            status: {
              in: ['SCHEDULED'],
            },
            NOT: {
              id: id,
            },
          },
        });

        if (conflictingAppointment) {
          return this.sendError(res, "El doctor ya tiene una cita en esa fecha y hora", 400);
        }
      }

      const updateData: any = {};
      if (dateTime) updateData.dateTime = new Date(dateTime);
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const appointment = await db.updateAppointment(id, updateData);

      return this.sendSuccess(res, appointment, "Cita actualizada exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Eliminar una cita
   */
  async deleteAppointment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.sendError(res, "ID de cita requerido", 400);
      }

      // Verificar si la cita existe
      const existingAppointment = await db.findAppointmentById(id);
      if (!existingAppointment) {
        return this.sendError(res, "Cita no encontrada", 404);
      }

      await db.deleteAppointment(id);

      return this.sendSuccess(res, null, "Cita eliminada exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Obtener citas de un paciente específico
   */
  async getPatientAppointments(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;

      if (!patientId) {
        return this.sendError(res, "ID de paciente requerido", 400);
      }

      const appointments = await db.findAppointmentsByPatientId(patientId);
      
      const filteredAppointments = status 
        ? appointments.filter(apt => apt.status === status)
        : appointments;

      const total = filteredAppointments.length;
      const paginatedAppointments = filteredAppointments.slice(
        (Number(page) - 1) * Number(limit),
        Number(page) * Number(limit)
      );

      return this.sendSuccess(res, {
        appointments: paginatedAppointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Citas del paciente obtenidas exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Obtener citas de un doctor específico
   */
  async getDoctorAppointments(req: Request, res: Response): Promise<Response> {
    try {
      const { doctorId } = req.params;
      const { status, date, page = 1, limit = 10 } = req.query;

      if (!doctorId) {
        return this.sendError(res, "ID de doctor requerido", 400);
      }

      const appointments = await db.findAppointmentsByDoctorId(doctorId);
      
      let filteredAppointments = appointments;
      
      if (status) {
        filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
      }
      
      if (date) {
        const targetDate = new Date(date as string);
        filteredAppointments = filteredAppointments.filter(apt => {
          const aptDate = new Date(apt.dateTime);
          return aptDate.toDateString() === targetDate.toDateString();
        });
      }

      const total = filteredAppointments.length;
      const paginatedAppointments = filteredAppointments.slice(
        (Number(page) - 1) * Number(limit),
        Number(page) * Number(limit)
      );

      return this.sendSuccess(res, {
        appointments: paginatedAppointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Citas del doctor obtenidas exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Cambiar estado de una cita
   */
  async updateAppointmentStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        return this.sendError(res, "ID de cita requerido", 400);
      }

      // Validar estado
      const validStatuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return this.sendError(res, "Estado inválido. Debe ser: SCHEDULED, COMPLETED o CANCELLED", 400);
      }

      // Verificar si la cita existe
      const existingAppointment = await db.findAppointmentById(id);
      if (!existingAppointment) {
        return this.sendError(res, "Cita no encontrada", 404);
      }

      const appointment = await db.updateAppointment(id, { status: status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' });

      return this.sendSuccess(res, appointment, "Estado de la cita actualizado exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Obtener estadísticas de citas
   */
  async getAppointmentStats(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate } = req.query;

      const where: any = {};
      if (startDate && endDate) {
        where.dateTime = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const [
        total,
        scheduled,
        completed,
        cancelled
      ] = await Promise.all([
        db.prisma.appointment.count({ where }),
        db.prisma.appointment.count({ 
          where: { ...where, status: 'SCHEDULED' } 
        }),
        db.prisma.appointment.count({ 
          where: { ...where, status: 'COMPLETED' } 
        }),
        db.prisma.appointment.count({ 
          where: { ...where, status: 'CANCELLED' } 
        }),
      ]);

      const stats = {
        total,
        scheduled,
        completed,
        cancelled,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      };

      return this.sendSuccess(res, stats, "Estadísticas de citas obtenidas exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

export const appointmentController = new AppointmentController();
