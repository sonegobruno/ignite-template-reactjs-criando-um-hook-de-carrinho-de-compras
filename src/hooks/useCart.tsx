import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  const [ stock, setStock ] = useState<Stock[]>([])

  useEffect(() => {
    api.get('stock').then(response => {
      setStock(response.data);
    })
  },[])

  const addProduct = async (productId: number) => {
    try {
      // 
      const findIndexProductInTheCart = cart.findIndex(cartMapped => cartMapped.id === productId);

      if(findIndexProductInTheCart >= 0) {
        const findedStock = stock.find(product => product.id === productId) || {amount: 0};
        
        if(!findedStock) {
          throw new Error('Estoque nao encontrado')
        }

        if(cart[findIndexProductInTheCart].amount >= findedStock.amount) {
          throw new Error('Quantidade solicitada fora de estoque');
        }

        cart[findIndexProductInTheCart] = {
          ...cart[findIndexProductInTheCart],
          amount: cart[findIndexProductInTheCart].amount + 1
        }

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        setCart([...cart]);
        return;
      } 

      const response = await api.get(`products?id=${productId}`);
      const productAdded = {
        ...response.data[0],
        amount: 1
      } 
      
      setCart([...cart, productAdded]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, productAdded]))
    } catch(err) {
      // TODO
      toast.error(err.message);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const findIndex = cart.findIndex(product => product.id === productId );

      if(findIndex === -1) {
        throw new Error();
      }
      const newProducts = cart.filter(product => product.id !== productId );
      console.log(newProducts)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts));
      setCart([...newProducts]);
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const findIndexCart = cart.findIndex(product => product.id === productId);
      const findedStock = stock.find(product => product.id === productId) || {amount: 0};

      if(cart[findIndexCart].amount >= findedStock?.amount) {
        throw new Error()
      }

      if(cart[findIndexCart].amount >= findedStock?.amount) {
        throw new Error('Quantidade solicitada fora de estoque')
      }

      cart[findIndexCart] = {
        ...cart[findIndexCart],
        amount
      }
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      setCart([...cart]);
    } catch(err) {
      // TODO
      toast.error(err.message);
      toast.error('Erro na alteração de quantidade do produto');
    }
  };
  console.log(cart)

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
