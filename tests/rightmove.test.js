import { describe, it, expect } from 'vitest';
import { buildSearchUrl } from '../js/rightmove.js';

describe('buildSearchUrl', () => {
  it('builds URL with region id', () => {
    const url = buildSearchUrl('93929');
    expect(url).toContain('locationIdentifier=REGION%5E93929');
    expect(url).toContain('rightmove.co.uk/property-for-sale/find.html');
  });

  it('defaults to Greater London when regionId is null', () => {
    const url = buildSearchUrl(null);
    expect(url).toContain('REGION%5E87490');
  });

  it('includes maxPrice filter', () => {
    const url = buildSearchUrl('93929', { maxPrice: 350000 });
    expect(url).toContain('maxPrice=350000');
  });

  it('includes minBeds filter', () => {
    const url = buildSearchUrl('93929', { minBeds: '2' });
    expect(url).toContain('minBedrooms=2');
  });

  it('maps flat to flats', () => {
    const url = buildSearchUrl('93929', { propertyType: 'flat' });
    expect(url).toContain('propertyTypes=flats');
  });

  it('maps semi to semi-detached', () => {
    const url = buildSearchUrl('93929', { propertyType: 'semi' });
    expect(url).toContain('propertyTypes=semi-detached');
  });

  it('ignores unknown property type', () => {
    const url = buildSearchUrl('93929', { propertyType: 'castle' });
    expect(url).not.toContain('propertyTypes');
  });

  it('combines multiple opts', () => {
    const url = buildSearchUrl('93968', { maxPrice: 500000, minBeds: '1', propertyType: 'flat' });
    expect(url).toContain('maxPrice=500000');
    expect(url).toContain('minBedrooms=1');
    expect(url).toContain('propertyTypes=flats');
    expect(url).toContain('REGION%5E93968');
  });
});
