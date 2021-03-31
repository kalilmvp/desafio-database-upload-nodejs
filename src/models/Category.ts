import {
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Column,
  OneToMany,
} from 'typeorm';
import Transaction from './Transaction';

@Entity('categories')
class Category {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string;

  @OneToMany(() => Transaction, transaction => transaction.category)
  transaction: Transaction;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Category;