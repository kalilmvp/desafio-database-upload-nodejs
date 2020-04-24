import parse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, In } from 'typeorm';
import uploadConfig from '../config/uploadConfig';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

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

    const finalCategories = [...categories, ...existentCategories];

    const transactions = transactionsCSV.map(transaction => {
      const categoryCreate = finalCategories.find(
        category => category.title === transaction.category,
      );
      return transRepository.create({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: categoryCreate,
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
