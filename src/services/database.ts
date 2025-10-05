import { PrismaClient } from '@prisma/client';

// Singleton para el cliente de Prisma
class DatabaseService {
  private static instance: DatabaseService;
  public prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Método para conectar a la base de datos
  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('✅ Conectado a la base de datos Supabase con Prisma');
    } catch (error) {
      console.error('❌ Error al conectar a la base de datos:', error);
      throw error;
    }
  }

  // Método para desconectar de la base de datos
  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('✅ Desconectado de la base de datos');
    } catch (error) {
      console.error('❌ Error al desconectar de la base de datos:', error);
      throw error;
    }
  }

  // Método para verificar la conexión
  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Health check falló:', error);
      return false;
    }
  }

  // Métodos específicos para usuarios
  public async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role?: 'ADMIN' | 'DOCTOR' | 'PATIENT';
  }) {
    return await this.prisma.user.create({
      data: userData,
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  public async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  public async findUserById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        appointments: true,
      },
    });
  }

  public async updateUser(id: string, userData: Partial<{
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
  }>) {
    return await this.prisma.user.update({
      where: { id },
      data: userData,
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  public async deleteUser(id: string) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  // Métodos específicos para pacientes
  public async createPatient(patientData: {
    userId: string;
    dateOfBirth: Date;
    phone?: string;
    address?: string;
    medicalHistory?: string;
  }) {
    return await this.prisma.patient.create({
      data: patientData,
      include: {
        user: true,
      },
    });
  }

  public async findPatientByUserId(userId: string) {
    return await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        user: true,
        appointments: {
          include: {
            appointment: true,
          },
        },
      },
    });
  }

  // Métodos específicos para doctores
  public async createDoctor(doctorData: {
    userId: string;
    specialty: string;
    licenseNumber: string;
    phone?: string;
  }) {
    return await this.prisma.doctor.create({
      data: doctorData,
      include: {
        user: true,
      },
    });
  }

  public async findDoctorByUserId(userId: string) {
    return await this.prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: true,
        appointments: {
          include: {
            appointment: true,
          },
        },
      },
    });
  }

  public async findDoctorsBySpecialty(specialty: string) {
    return await this.prisma.doctor.findMany({
      where: { specialty },
      include: {
        user: true,
      },
    });
  }

  // Métodos específicos para citas
  public async createAppointment(appointmentData: {
    patientId: string;
    doctorId: string;
    dateTime: Date;
    status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
  }) {
    const appointment = await this.prisma.appointment.create({
      data: appointmentData,
    });

    // Crear relaciones many-to-many
    await this.prisma.patientAppointment.create({
      data: {
        patientId: appointmentData.patientId,
        appointmentId: appointment.id,
      },
    });

    await this.prisma.doctorAppointment.create({
      data: {
        doctorId: appointmentData.doctorId,
        appointmentId: appointment.id,
      },
    });

    return appointment;
  }

  public async findAppointmentById(id: string) {
    return await this.prisma.appointment.findUnique({
      where: { id },
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
    });
  }

  public async findAppointmentsByPatientId(patientId: string) {
    return await this.prisma.appointment.findMany({
      where: { patientId },
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
  }

  public async findAppointmentsByDoctorId(doctorId: string) {
    return await this.prisma.appointment.findMany({
      where: { doctorId },
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
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  public async updateAppointment(id: string, appointmentData: Partial<{
    dateTime: Date;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    notes: string;
  }>) {
    return await this.prisma.appointment.update({
      where: { id },
      data: appointmentData,
    });
  }

  public async deleteAppointment(id: string) {
    // Eliminar relaciones primero
    await this.prisma.patientAppointment.deleteMany({
      where: { appointmentId: id },
    });

    await this.prisma.doctorAppointment.deleteMany({
      where: { appointmentId: id },
    });

    // Eliminar la cita
    return await this.prisma.appointment.delete({
      where: { id },
    });
  }
}

// Exportar instancia singleton
export const db = DatabaseService.getInstance();
export default db;
