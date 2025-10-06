// Mock data for tests
export const mockAppointment = {
  id: "1",
  patientId: "patient-1",
  doctorId: "doctor-1",
  dateTime: new Date("2025-10-15T10:00:00Z"),
  status: "SCHEDULED" as const,
  notes: "Consulta de rutina",
  createdAt: new Date("2025-10-01T00:00:00Z"),
  updatedAt: new Date("2025-10-01T00:00:00Z"),
  patient: {
    id: "patient-profile-1",
    patient: {
      id: "patient-1",
      user: {
        id: "user-1",
        email: "patient@test.com",
        firstName: "Juan",
        lastName: "Pérez",
      },
    },
  },
  doctor: {
    id: "doctor-profile-1",
    doctor: {
      id: "doctor-1",
      user: {
        id: "user-2",
        email: "doctor@test.com",
        firstName: "Dr. María",
        lastName: "González",
      },
    },
  },
};

export const mockAppointments = [
  mockAppointment,
  {
    ...mockAppointment,
    id: "2",
    dateTime: new Date("2025-10-16T14:00:00Z"),
    status: "COMPLETED" as const,
  },
];

export const mockPaginationResult = {
  appointments: mockAppointments,
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    pages: 1,
  },
};

export const mockRequest = {
  query: {
    page: "1",
    limit: "10",
  },
  params: {},
  body: {},
} as any;

export const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
} as any;

export const mockDatabase = {
  prisma: {
    appointment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
  findAppointmentById: jest.fn(),
  findPatientByUserId: jest.fn(),
  findDoctorByUserId: jest.fn(),
  createAppointment: jest.fn(),
  updateAppointment: jest.fn(),
  deleteAppointment: jest.fn(),
  findAppointmentsByPatientId: jest.fn(),
  findAppointmentsByDoctorId: jest.fn(),
};

// Mock data for authentication tests
export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  firstName: "Juan",
  lastName: "Pérez",
  role: "PATIENT",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
};

export const mockGooglePayload = {
  sub: "google-user-123",
  email: "test@example.com",
  given_name: "Juan",
  family_name: "Pérez",
  picture: "https://example.com/picture.jpg",
  aud: "mock-google-client-id",
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
};

export const mockJwtPayload = {
  userId: "user-123",
  email: "test@example.com",
  firstName: "Juan",
  lastName: "Pérez",
  picture: "https://example.com/picture.jpg",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 604800, // 7 days
};

export const mockGoogleTicket = {
  getPayload: jest.fn().mockReturnValue(mockGooglePayload),
};

export const mockOAuth2Client = {
  verifyIdToken: jest.fn().mockResolvedValue(mockGoogleTicket),
};
