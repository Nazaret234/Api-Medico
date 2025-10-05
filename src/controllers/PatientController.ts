import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import db from "../services/database";

export class PatientController extends BaseController {
  /**
   * Obtener todos los pacientes
   */
  async getAllPatients(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10 } = req.query;

      const patients = await db.prisma.patient.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          user: true,
          appointments: {
            include: {
              appointment: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await db.prisma.patient.count();

      return this.sendSuccess(res, {
        patients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Pacientes obtenidos exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Obtener un paciente por ID
   */
  async getPatientById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.sendError(res, "ID de paciente requerido", 400);
      }

      const patient = await db.prisma.patient.findUnique({
        where: { id },
        include: {
          user: true,
          appointments: {
            include: {
              appointment: {
                include: {
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
              },
            },
          },
        },
      });

      if (!patient) {
        return this.sendError(res, "Paciente no encontrado", 404);
      }

      return this.sendSuccess(res, patient, "Paciente obtenido exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Crear un nuevo paciente
   */
  async createPatient(req: Request, res: Response): Promise<Response> {
    try {
      const { 
        userId, 
        dateOfBirth, 
        phone, 
        address, 
        medicalHistory 
      } = req.body;

      // Validar datos requeridos
      if (!userId || !dateOfBirth) {
        return this.sendError(res, "Usuario ID y fecha de nacimiento son requeridos", 400);
      }

      // Verificar si el usuario existe
      const user = await db.findUserById(userId);
      if (!user) {
        return this.sendError(res, "Usuario no encontrado", 404);
      }

      // Verificar si ya tiene un perfil de paciente
      const existingPatient = await db.findPatientByUserId(userId);
      if (existingPatient) {
        return this.sendError(res, "El usuario ya tiene un perfil de paciente", 400);
      }

      const patient = await db.createPatient({
        userId,
        dateOfBirth: new Date(dateOfBirth),
        phone,
        address,
        medicalHistory,
      });

      return this.sendSuccess(res, patient, "Paciente creado exitosamente", 201);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Actualizar un paciente
   */
  async updatePatient(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { dateOfBirth, phone, address, medicalHistory } = req.body;

      if (!id) {
        return this.sendError(res, "ID de paciente requerido", 400);
      }

      // Verificar si el paciente existe
      const existingPatient = await db.prisma.patient.findUnique({
        where: { id },
      });

      if (!existingPatient) {
        return this.sendError(res, "Paciente no encontrado", 404);
      }

      const updateData: any = {};
      if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory;

      const patient = await db.prisma.patient.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
        },
      });

      return this.sendSuccess(res, patient, "Paciente actualizado exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Eliminar un paciente
   */
  async deletePatient(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.sendError(res, "ID de paciente requerido", 400);
      }

      // Verificar si el paciente existe
      const existingPatient = await db.prisma.patient.findUnique({
        where: { id },
      });

      if (!existingPatient) {
        return this.sendError(res, "Paciente no encontrado", 404);
      }

      await db.prisma.patient.delete({
        where: { id },
      });

      return this.sendSuccess(res, null, "Paciente eliminado exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Obtener citas de un paciente
   */
  async getPatientAppointments(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status, page = 1, limit = 10 } = req.query;

      if (!id) {
        return this.sendError(res, "ID de paciente requerido", 400);
      }

      // Verificar si el paciente existe
      const patient = await db.prisma.patient.findUnique({
        where: { id },
      });

      if (!patient) {
        return this.sendError(res, "Paciente no encontrado", 404);
      }

      const where: any = { patientId: patient.userId };
      if (status) {
        where.status = status;
      }

      const appointments = await db.prisma.appointment.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
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
      }, "Citas del paciente obtenidas exitosamente");
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Buscar pacientes por nombre o email
   */
  async searchPatients(req: Request, res: Response): Promise<Response> {
    try {
      const { q, page = 1, limit = 10 } = req.query;

      if (!q) {
        return this.sendError(res, "Parámetro de búsqueda 'q' es requerido", 400);
      }

      const patients = await db.prisma.patient.findMany({
        where: {
          OR: [
            {
              user: {
                firstName: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              user: {
                lastName: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              user: {
                email: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await db.prisma.patient.count({
        where: {
          OR: [
            {
              user: {
                firstName: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              user: {
                lastName: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
            {
              user: {
                email: {
                  contains: q as string,
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
      });

      return this.sendSuccess(res, {
        patients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, "Búsqueda de pacientes completada");
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

export const patientController = new PatientController();
