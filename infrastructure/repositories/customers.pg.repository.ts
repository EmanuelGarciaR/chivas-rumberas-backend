import {
  ICustomerRepository,
  UpsertCustomerInput,
} from "../../domain/repositories/ICustomerRepository";
import { Customer } from "../../domain/models/Customer";
import prisma from "../database/prismaClient";

export class CustomerRepository implements ICustomerRepository {
  async findByEmail(email: string): Promise<Customer | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const row = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<Customer | null> {
    const row = await prisma.customer.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async upsertByEmail(data: UpsertCustomerInput): Promise<Customer> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const name = data.name.trim();
    const phone = data.phone.trim();

    const row = await prisma.customer.upsert({
      where: { email: normalizedEmail },
      update: {
        name,
        phone,
      },
      create: {
        name,
        email: normalizedEmail,
        phone,
      },
    });

    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: Date;
  }): Customer {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      createdAt: row.createdAt,
    };
  }
}
