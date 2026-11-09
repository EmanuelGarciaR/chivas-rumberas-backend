import { Customer } from "../models/Customer";

export interface UpsertCustomerInput {
  name: string;
  email: string;
  phone: string;
}

export interface ICustomerRepository {
  findByEmail(email: string): Promise<Customer | null>;
  findById(id: string): Promise<Customer | null>;
  upsertByEmail(data: UpsertCustomerInput): Promise<Customer>;
}
