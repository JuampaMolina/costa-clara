import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAVORITES_STORAGE_KEY, FavoritesStore } from './favorites';

describe('FavoritesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('starts empty', () => {
    const store = TestBed.inject(FavoritesStore);

    expect(store.count()).toBe(0);
    expect(store.isFavorite('es-trenc')).toBe(false);
  });

  it('toggles a favorite and persists it', () => {
    const store = TestBed.inject(FavoritesStore);

    store.toggle('es-trenc');

    expect(store.isFavorite('es-trenc')).toBe(true);
    expect(store.count()).toBe(1);
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]')).toEqual(['es-trenc']);

    store.toggle('es-trenc');

    expect(store.isFavorite('es-trenc')).toBe(false);
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]')).toEqual([]);
  });

  it('reads existing favorites and ignores invalid values', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['a', 'b', 42]));
    const store = TestBed.inject(FavoritesStore);
    expect(store.count()).toBe(2);
    expect(store.isFavorite('a')).toBe(true);

    TestBed.resetTestingModule();
    localStorage.setItem(FAVORITES_STORAGE_KEY, 'not-json');
    const invalid = TestBed.inject(FavoritesStore);
    expect(invalid.count()).toBe(0);
  });

  it('syncs across tabs through the storage event', () => {
    const store = TestBed.inject(FavoritesStore);

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(['cala-macarella']));
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: FAVORITES_STORAGE_KEY,
        newValue: JSON.stringify(['cala-macarella']),
      }),
    );

    expect(store.isFavorite('cala-macarella')).toBe(true);
  });
});
