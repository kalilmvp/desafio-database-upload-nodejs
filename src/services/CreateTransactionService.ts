import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface RequestDTO {
  title: string;
  value: string;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    const repository = getRepository(Transaction);

    const transaction = repository.create({
      title,
      value,
      type,
      category_id: 0,
    });
  }
}

export default CreateTransactionService;
