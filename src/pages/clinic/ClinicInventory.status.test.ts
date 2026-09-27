/**
 * Inventory status helpers — stock and expiry badge mapping.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

function stockStatus(stock: number, minStock: number): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (minStock > 0 && stock <= minStock) return 'LOW_STOCK';
  return 'IN_STOCK';
}

describe('inventory stock status', () => {
  it('flags low and out of stock', () => {
    assert.equal(stockStatus(8, 10), 'LOW_STOCK');
    assert.equal(stockStatus(0, 10), 'OUT_OF_STOCK');
    assert.equal(stockStatus(20, 10), 'IN_STOCK');
  });
});
