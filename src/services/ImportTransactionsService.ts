import parse from 'csv-parse';
import { getConnection, getRepository, In } from 'typeorm';
import path from 'path';
import fs from 'fs';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

import uploadConfig from '../config/uploadConfig';

interface RequestDTO {
  fileName: string;
  pathCSV: string;
}

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ fileName, pathCSV }: RequestDTO): Promise<Transaction[]> {
    const transRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);

    const parser = parse({
      delimiter: ',',
      from_line: 2,
      ltrim: true,
    });

    const csvPath = path.join(uploadConfig.directoryCSV, fileName);
    const csvReadStream = fs.createReadStream(csvPath);
    const parseCSV = csvReadStream.pipe(parser);

    const transactionsCSV: TransactionCSV[] = [];
    const categoriesCSV: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;
      transactionsCSV.push({
        title,
        type,
        value,
        category,
      });

      categoriesCSV.push(category);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categoriesCSV),
      },
    });

    const titlesCategories = existentCategories.map(cat => cat.title);

    const categories = categoriesCSV
      .filter(cat => !titlesCategories.includes(cat))
      .filter((elem, pos, self) => {
        return self.indexOf(elem) === pos;
      })
      .map(category => categoryRepository.create({ title: category }));

    /* await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Category)
      .values(categories)
      .execute(); */
    await categoryRepository.save(categories);

    const transactions = transactionsCSV.map(transaction => {
      const category_id = categories.find(
        category => category.title === transaction.category,
      )?.id;
      return transRepository.create({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category_id,
      });
    });

    /* await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Transaction)
      .values(transactions)
      .execute(); */
    await transRepository.save(transactions);

    await fs.promises.unlink(csvPath);

    return transactions;
  }
}

export default ImportTransactionsService;
