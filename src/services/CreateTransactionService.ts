import { getRepository, getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  value: number;
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
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Invalid type, it should be (income | outcome)');
    }

    const transRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);

    const { total } = await getCustomRepository(
      TransactionsRepository,
    ).getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError('Transaction without a valid balance');
    }

    let foundCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    // if it´s not found, the category should be created here
    if (!foundCategory) {
      const newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);

      foundCategory = newCategory;
    }

    const transaction = transRepository.create({
      title,
      value,
      type,
      category: foundCategory,
    });

    await transRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
