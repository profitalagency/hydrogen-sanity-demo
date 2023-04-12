import {useFetcher, useMatches} from '@remix-run/react';
import type {
  Cart,
  CartCost,
  CartLine,
  CartLineUpdateInput,
} from '@shopify/hydrogen/storefront-api-types';
import {
  flattenConnection,
  Image,
  Money,
  ShopPayButton,
} from '@shopify/hydrogen-react';
import clsx from 'clsx';

import Button, {defaultButtonStyles} from '~/components/elements/Button';
import {CartAction} from '~/types/shopify';

import MinusCircleIcon from '../icons/MinusCircle';
import PlusCircleIcon from '../icons/PlusCircle';
import RemoveIcon from '../icons/Remove';
import {Link} from '../Link';

export function CartLineItems({
  linesObj,
}: {
  linesObj: Cart['lines'] | undefined;
}) {
  const lines = flattenConnection(linesObj);
  return (
    <div className="flex-grow px-8" role="table" aria-label="Shopping cart">
      <div role="row" className="sr-only">
        <div role="columnheader">Product image</div>
        <div role="columnheader">Product details</div>
        <div role="columnheader">Price</div>
      </div>
      {lines.map((line) => {
        return <LineItem key={line.id} lineItem={line} />;
      })}
    </div>
  );
}

function LineItem({lineItem}: {lineItem: CartLine}) {
  const {merchandise} = lineItem;

  const firstVariant = merchandise.selectedOptions[0];
  const hasDefaultVariantOnly =
    firstVariant.name === 'Title' && firstVariant.value === 'Default Title';

  return (
    <div
      role="row"
      className="flex items-center border-b border-lightGray py-3 last:border-b-0"
    >
      {/* Image */}
      <div role="cell" className="mr-3 aspect-square w-[66px] flex-shrink-0">
        {merchandise.image && (
          <Link to={`/products/${merchandise.product.handle}`}>
            <Image
              className="rounded"
              data={merchandise.image}
              width={110}
              height={110}
              alt={merchandise.title}
            />
          </Link>
        )}
      </div>

      {/* Title */}
      <div
        role="cell"
        className="flex-grow-1 mr-4 flex w-full flex-col items-start"
      >
        <Link
          to={`/products/${merchandise.product.handle}`}
          className="text-sm font-bold hover:underline"
        >
          {/* <CartLineProductTitle className="text-sm font-bold" /> */}
          {merchandise.product.title}
        </Link>

        {/* Options */}
        {!hasDefaultVariantOnly && (
          <ul className="mt-1 space-y-1 text-xs text-darkGray">
            {merchandise.selectedOptions.map(({name, value}) => (
              <li key={name}>
                {name}: {value}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quantity */}
      <CartItemQuantity line={lineItem} />

      {/* Price */}
      <div className="ml-4 mr-6 min-w-[4rem] text-right text-sm font-bold leading-none">
        <Money data={lineItem.cost.totalAmount} />
      </div>

      <div role="cell" className="flex flex-col items-end justify-between">
        <ItemRemoveButton lineIds={[lineItem.id]} />
      </div>
    </div>
  );
}

function CartItemQuantity({line}: {line: CartLine}) {
  const fetcher = useFetcher();

  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity} = line;

  // The below handles optimistic updates for the quantity
  const submissionQuantity = fetcher.submission?.formData.get('quantity');
  const lineQuantity = submissionQuantity
    ? Number(submissionQuantity)
    : quantity;

  const prevQuantity = Number(Math.max(0, lineQuantity - 1).toFixed(0));
  const nextQuantity = Number((lineQuantity + 1).toFixed(0));

  return (
    <div className="flex items-center gap-2">
      <fetcher.Form action="/cart" method="post">
        <UpdateCartButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <input type="hidden" name="quantity" value={prevQuantity} />
          <button
            name="decrease-quantity"
            aria-label="Decrease quantity"
            value={prevQuantity}
            disabled={quantity <= 1}
          >
            <MinusCircleIcon />
          </button>
        </UpdateCartButton>
      </fetcher.Form>

      <div className="min-w-[1rem] text-center text-sm font-bold leading-none text-black">
        {lineQuantity}
      </div>

      <fetcher.Form action="/cart" method="post">
        <UpdateCartButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <input type="hidden" name="quantity" value={nextQuantity} />
          <button
            name="increase-quantity"
            aria-label="Increase quantity"
            value={prevQuantity}
          >
            <PlusCircleIcon />
          </button>
        </UpdateCartButton>
      </fetcher.Form>
    </div>
  );
}

function UpdateCartButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <>
      <input type="hidden" name="cartAction" value={CartAction.UPDATE_CART} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      {children}
    </>
  );
}

function ItemRemoveButton({lineIds}: {lineIds: CartLine['id'][]}) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form action="/cart" method="post">
      <input type="hidden" name="cartAction" value="REMOVE_FROM_CART" />
      <input type="hidden" name="linesIds" value={JSON.stringify(lineIds)} />
      <button
        className="disabled:pointer-events-all disabled:cursor-wait"
        type="submit"
      >
        <RemoveIcon />
      </button>
    </fetcher.Form>
  );
}

export function CartSummary({cost}: {cost: CartCost}) {
  return (
    <>
      <div role="table" aria-label="Cost summary" className="text-sm">
        <div
          className="flex justify-between border-t border-gray p-4"
          role="row"
        >
          <span className="text-darkGray" role="rowheader">
            Subtotal
          </span>
          <span role="cell" className="text-right font-bold">
            {cost?.subtotalAmount?.amount ? (
              <Money data={cost?.subtotalAmount} />
            ) : (
              '-'
            )}
          </span>
        </div>

        <div
          role="row"
          className="flex justify-between border-t border-gray p-4"
        >
          <span className="text-darkGray" role="rowheader">
            Shipping
          </span>
          <span role="cell" className="font-bold uppercase">
            Calculated at checkout
          </span>
        </div>
      </div>
    </>
  );
}

export function CartActions({cart}: {cart: Cart}) {
  const [root] = useMatches();

  if (!cart || !cart.checkoutUrl) return null;

  const storeDomain = root?.data?.storeDomain;

  const shopPayLineItems = flattenConnection(cart.lines).map((line) => ({
    id: line.merchandise.id,
    quantity: line.quantity,
  }));

  return (
    <div className="flex w-full gap-3">
      <ShopPayButton
        className={clsx([defaultButtonStyles({tone: 'shopPay'}), 'w-1/2'])}
        variantIdsAndQuantities={shopPayLineItems}
        storeDomain={storeDomain}
      />
      <Button
        to={cart.checkoutUrl}
        className={clsx([defaultButtonStyles(), 'w-1/2'])}
      >
        Checkout
      </Button>
    </div>
  );
}