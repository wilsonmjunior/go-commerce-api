import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findById(id: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne(id);

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsIds = products.map(product => product.id);

    const findProducts = await this.ormRepository.find({ id: In(productsIds) });

    return findProducts;
  }

  public async findAll(): Promise<Product[]> {
    const findProducts = await this.ormRepository.find();

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIds = products.map(product => ({ id: product.id }));
    const allProductsId = await this.findAllById(productsIds);

    const [updateProducts] = products.map(product =>
      allProductsId.map(productId => {
        return {
          id: product.id,
          quantity: productId.quantity - product.quantity,
        };
      }),
    );

    const saveProducts = await this.ormRepository.save(updateProducts);

    return saveProducts;
  }
}

export default ProductsRepository;
