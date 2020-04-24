import { Router, Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import uploadConfig from '../config/uploadConfig';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request: Request, response: Response) => {
  const repository = getCustomRepository(TransactionsRepository);
  const transactions = await repository.find();
  const balance = await repository.getBalance();

  return response.json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (request: Request, response: Response) => {
  const { title, value, type, category } = request.body;
  const transaction = await new CreateTransactionService().execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete(
  '/:id',
  async (request: Request, response: Response) => {
    const { id } = request.params;
    await new DeleteTransactionService().execute(id);
    return response.status(204).send();
  },
);

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request: Request, response: Response) => {
    const transactions = await new ImportTransactionsService().execute({
      fileName: request.file.filename,
    });
    response.json(transactions);
  },
);

export default transactionsRouter;
