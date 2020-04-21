import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const repository = getRepository(Transaction);

    if (!repository.findOne(id)) {
      throw new AppError('Transaction does not exist!');
    }

    await getRepository(Transaction).delete(id);
  }
}

export default DeleteTransactionService;
