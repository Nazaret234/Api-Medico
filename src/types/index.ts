export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "doctor" | "patient";
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient extends User {
  role: "patient";
  dateOfBirth: Date;
  phone?: string;
  address?: string;
  medicalHistory?: string;
}

export interface Doctor extends User {
  role: "doctor";
  specialty: string;
  licenseNumber: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: Date;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
