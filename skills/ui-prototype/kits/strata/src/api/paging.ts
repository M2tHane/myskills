/** 列表接口的分页参数和返回值：页面把页码、关键字、筛选、排序发给接口，接口返回当前页和总数。接真实接口时原样沿用。 */
export interface Sort { key: string; dir: 'asc' | 'desc' }
export interface ListParams<F = Record<string, unknown>> { page: number; pageSize: number; q?: string; filters?: F; sort?: Sort }
export interface Paged<T> { items: T[]; total: number }
