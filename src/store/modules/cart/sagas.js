import { call, select, put, all, takeLatest } from 'redux-saga/effects';
import { toast } from 'react-toastify';

import api from '../../../services/api';
import history from '../../../services/history';
import { formatPrice } from '../../../util/format';

import { addToCartSuccess, updateAmountSuccess } from './actions';

function* hasStock(productId, amount) {
  const stock = yield call(api.get, `/stock/${productId}`);

  const currentStockAmount = stock.data.amount;

  if (amount > currentStockAmount) {
    toast.error('Quantidade solicitada fora de estoque');
    return false;
  }

  return true;
}

function* addToCart({ id }) {
  const productExists = yield select(state =>
    state.cart.find(product => product.id === id)
  );

  const currentAmount = productExists ? productExists.amount : 0;
  const amount = currentAmount + 1;

  if (!(yield hasStock(id, amount))) {
    return;
  }

  if (productExists) {
    yield put(updateAmountSuccess(id, amount));

    return;
  }

  const response = yield call(api.get, `/products/${id}`);

  const data = {
    ...response.data,
    amount: 1,
    priceFormatted: formatPrice(response.data.price)
  };

  yield put(addToCartSuccess(data));
}

function* updateAmount({ id, amount }) {
  if (amount <= 0) return;

  if (!(yield hasStock(id, amount))) {
    return;
  }

  yield put(updateAmountSuccess(id, amount));
}

export default all([
  takeLatest('@cart/ADD_REQUEST', addToCart),
  takeLatest('@cart/UPDATE_AMOUNT_REQUEST', updateAmount)
]);
