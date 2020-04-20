import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    await getRepository(Transaction).delete(id);
  }
}

export default DeleteTransactionService;
