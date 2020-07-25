import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IOrdersRepository from '../repositories/IOrdersRepository';

import Order from '../infra/typeorm/entities/Order';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists.');
    }

    const productsId = products.map(product => ({ id: product.id }));

    const findProductsId = await this.productsRepository.findAllById(
      productsId,
    );

    if (findProductsId.length !== products.length) {
      throw new AppError('One of the products does not exists.');
    }

    const [orderProducts] = products.map(product =>
      findProductsId.map(productId => {
        if (product.quantity >= 0 && product.quantity > productId.quantity) {
          throw new AppError('One of the products has an invalid quantity.');
        }

        return {
          product_id: product.id,
          price: productId.price,
          quantity: product.quantity,
        };
      }),
    );

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
